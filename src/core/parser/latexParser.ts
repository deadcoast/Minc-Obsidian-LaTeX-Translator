/*******************************************************
 * TYPES & INTERFACES
 ********************************************************/
import { ENVIRONMENT_MAPPINGS, ERROR_MESSAGES, MATH_DELIMITERS, REFERENCE_FORMATS, CITATION_FORMATS, VALID_NESTING, COMMON_MACROS } from './constants';
import { logger } from '../../utils/logger';

export interface ParserOptions {
	/** Convert \begin{env}...\end{env} to $$ blocks? */
	convertEnvironments?: boolean;

	/** Additional environment names you want to treat as display math.
	 *  By default, we handle: equation, align, align*, cases
	 */
	extraEnvironments?: string[];

	/** Also convert eqnarray to $$...$$? */
	convertEqnarray?: boolean;

	/** Remove \label{} entirely? */
	removeLabels?: boolean;

	/** How to handle \ref{} or \eqref{}?
	 * 'ignore'      = Leave them as-is
	 * 'placeholder' = Convert to (ref: label)
	 * 'autoNumber'  = Attempt to auto-number equations
	 */
	handleRefs?: 'ignore' | 'placeholder' | 'autoNumber';

	/** Expand custom macros from \newcommand or \renewcommand? */
	expandMacros?: boolean;

	/** Convert \cite{...} to [cite: ...]? */
	convertCitations?: boolean;

	/** Remove \left and \right commands, e.g. \left( -> ( */
	removeLeftRight?: boolean;

	/** Convert \text{xyz} into \mathrm{xyz}? */
	unifyTextToMathrm?: boolean;
}

/*******************************************************
 * ENVIRONMENT CONVERSION HELPERS
 *******************************************************/
function convertEnvironmentToDisplay(env: string, content: string, options: ParserOptions): string {
    try {
        const targetEnv = ENVIRONMENT_MAPPINGS[env] || env;
        if (!ENVIRONMENT_MAPPINGS[env]) {
            logger.warning(ERROR_MESSAGES.UNKNOWN_ENVIRONMENT(env));
        }

        let processedContent = content.trim();

        // Handle labels if present
        if (options.removeLabels) {
            processedContent = processedContent.replace(/\\label\{([^}]*)\}/g, (_, label) => {
                if (!/^[a-zA-Z0-9:_-]+$/.test(label)) {
                    logger.warning(ERROR_MESSAGES.LABEL_ERROR(label));
                }
                return '';
            });
        }

        // Convert to Obsidian display math format
        return `$$ \\begin{${targetEnv}}\n${processedContent}\n\\end{${targetEnv}} $$`;
    } catch (error) {
        logger.error('Error in environment conversion', error);
        return content; // Return original content on error
    }
}

/*******************************************************
 * BRACKET REPLACEMENT HELPERS
 *******************************************************/
function replaceMathDelimiters(text: string): string {
    try {
        let processedText = text;

        // Handle display math delimiters
        MATH_DELIMITERS.DISPLAY.forEach(([pattern, replacement]) => {
            processedText = processedText.replace(pattern, replacement as string);
        });

        // Handle inline math delimiters
        MATH_DELIMITERS.INLINE.forEach(([pattern, replacement]) => {
            processedText = processedText.replace(pattern, replacement as string);
        });

        return processedText;
    } catch (error) {
        logger.error('Error replacing math delimiters', error);
        return text;
    }
}

/*******************************************************
 * LABEL AND REFERENCE HANDLING
 *******************************************************/
function handleLabelsAndRefs(text: string, options: ParserOptions): string {
    try {
        let processedText = text;
        const labels = new Map<string, { number: number; type?: string; name?: string }>();
        let counters = {
            equation: 1,
            section: 1,
            figure: 1,
            table: 1
        };

        if (options.handleRefs === 'autoNumber') {
            // First pass: collect all labels and their context
            const labelRegex = /\\label\{([^}]*)\}/g;
            let match;
            while ((match = labelRegex.exec(text)) !== null) {
                const label = match[1];
                const context = text.slice(Math.max(0, match.index - 50), match.index);
                const type = context.match(/\\begin\{(equation|figure|table|section)\*?\}/)?.[1] || 'equation';
                const name = context.match(/\\(section|subsection|chapter)\{([^}]*)\}/)?.[2];
                
                labels.set(label, {
                    number: counters[type as keyof typeof counters]++,
                    type,
                    name
                });
            }

            // Second pass: replace references with appropriate format
            const refReplacements: [RegExp, (label: string) => string][] = [
                // Basic references
                [/\\ref\{([^}]*)\}/g, label => {
                    const info = labels.get(label);
                    return info ? REFERENCE_FORMATS.CUSTOM.ref.replace('$label', label) : '(?)';
                }],
                // Equation references
                [/\\eqref\{([^}]*)\}/g, label => {
                    const info = labels.get(label);
                    return info ? REFERENCE_FORMATS.CUSTOM.eqref.replace('$number', info.number.toString()) : '(?)';
                }],
                // Page references
                [/\\pageref\{([^}]*)\}/g, _ => {
                    return REFERENCE_FORMATS.CUSTOM.pageref.replace('$number', '?');
                }],
                // Name references
                [/\\nameref\{([^}]*)\}/g, label => {
                    const info = labels.get(label);
                    return info?.name ? REFERENCE_FORMATS.CUSTOM.nameref.replace('$name', info.name) : '(?)';
                }],
                // Auto references
                [/\\autoref\{([^}]*)\}/g, label => {
                    const info = labels.get(label);
                    const format = REFERENCE_FORMATS.CUSTOM?.autoref ?? REFERENCE_FORMATS.DEFAULT ?? '(?)';
                    return info ? format
                        .replace('$type', info.type ?? '')
                        .replace('$number', info.number.toString()) : '(?)';
                }],
                // Visual references
                [/\\vref\{([^}]*)\}/g, label => {
                    const info = labels.get(label);
                    const format = REFERENCE_FORMATS.CUSTOM?.vref ?? REFERENCE_FORMATS.DEFAULT ?? '(?)';
                    return info ? format
                        .replace('$type', info.type ?? '')
                        .replace('$number', info.number.toString())
                        .replace('$page', '?') : '(?)';
                }]
            ];

            refReplacements.forEach(([pattern, replacer]) => {
                processedText = processedText.replace(pattern, (_, label) => replacer(label));
            });
        } else if (options.handleRefs === 'placeholder') {
            processedText = processedText.replace(/\\(?:eq|page|name|auto|v)?ref\{([^}]*)\}/g, (match, label) => {
                const refType = match.startsWith('\\eqref') ? 'EQUATION' :
                              match.startsWith('\\pageref') ? 'PAGE' :
                              match.startsWith('\\nameref') ? 'NAME' :
                              'DEFAULT';
                return REFERENCE_FORMATS[refType].replace(/\$(?:label|number|name)/, label);
            });
        }

        // Remove labels if specified
        if (options.removeLabels) {
            processedText = processedText.replace(/\\label\{[^}]*\}/g, '');
        }

        return processedText;
    } catch (error) {
        logger.error('Error handling labels and references', error);
        return text;
    }
}

/*******************************************************
 * MACRO EXPANSION
 *******************************************************/
function expandMacros(text: string): string {
    try {
        let processedText = text;
        const customMacros = new Map<string, { replacement: string; args: number }>();
        
        // First handle custom macro definitions
        processedText = processedText.replace(
            /\\(?:re)?newcommand\{\\([^}]+)\}(?:\[(\d+)\])?\{([^}]+)\}/g,
            (_, name, argsStr, replacement) => {
                if (!/^[a-zA-Z]+$/.test(name)) {
                    logger.warning(ERROR_MESSAGES.INVALID_MACRO(name));
                    return _;
                }
                const args = argsStr ? parseInt(argsStr, 10) : 0;
                customMacros.set(name, { replacement, args });
                return '';
            }
        );

        // Apply custom macros
        customMacros.forEach(({ replacement, args }, name) => {
            const macroRegex = new RegExp(
                `\\\\${name}((?:\\{[^}]*\\}){0,${args}})`,
                'g'
            );
            processedText = processedText.replace(macroRegex, (_, argStr) => {
                const argMatches = argStr.match(/\{([^}]*)\}/g) || [];
                if (argMatches.length !== args) {
                    logger.warning(
                        ERROR_MESSAGES.MACRO_ARG_MISMATCH(name, args, argMatches.length)
                    );
                }
                let result = replacement;
                argMatches.forEach((arg: string, i: number) => {
                    const argContent = arg.slice(1, -1);
                    result = result.replace(
                        new RegExp(`#${i + 1}(?!\\d)`, 'g'),
                        argContent
                    );
                });
                return result;
            });
        });

        // Apply common predefined macros
        Object.entries(COMMON_MACROS).forEach(([macro, replacement]) => {
            const macroRegex = new RegExp(macro.replace(/\\/g, '\\\\') + '(?![a-zA-Z])', 'g');
            processedText = processedText.replace(macroRegex, replacement);
        });

        return processedText;
    } catch (error) {
        logger.error('Error expanding macros', error);
        return text; // Return original text on error
    }
}

/*******************************************************
 * CITATION HANDLING
 *******************************************************/
function convertCitations(text: string): string {
    try {
        const citationReplacements: [RegExp, string][] = [
            // Standard citations
            [/\\cite\{([^}]+)\}/g, CITATION_FORMATS.CUSTOM.cite],
            [/\\citep\{([^}]+)\}/g, CITATION_FORMATS.CUSTOM.citep],
            [/\\citet\{([^}]+)\}/g, CITATION_FORMATS.CUSTOM.citet],
            // Author-specific citations
            [/\\citeauthor\{([^}]+)\}/g, CITATION_FORMATS.CUSTOM.citeauthor],
            [/\\citeyear\{([^}]+)\}/g, CITATION_FORMATS.CUSTOM.citeyear],
            [/\\citetitle\{([^}]+)\}/g, CITATION_FORMATS.CUSTOM.citetitle],
            // Full citations
            [/\\fullcite\{([^}]+)\}/g, CITATION_FORMATS.CUSTOM.fullcite]
        ];

        return citationReplacements.reduce((acc, [pattern, format]) => {
            return acc.replace(pattern, (_, keys: string) => {
                const citations = keys.split(',').map((key: string) => {
                    const trimmedKey = key.trim();
                    if (!/^[a-zA-Z0-9_:-]+$/.test(trimmedKey)) {
                        logger.warning(ERROR_MESSAGES.CITATION_ERROR(trimmedKey));
                    }
                    // Replace placeholders with actual values (in a real implementation,
                    // these would come from a bibliography database)
                    return format
                        .replace('$key', trimmedKey)
                        .replace('$author', 'Author')
                        .replace('$year', '20XX')
                        .replace('$title', 'Title');
                });
                return citations.join(', ');
            });
        }, text);
    } catch (error) {
        logger.error('Error converting citations', error);
        return text;
    }
}

/*******************************************************
 * NESTED ENVIRONMENTS PARSER HELPERS
 *******************************************************/
function replaceNestedEnvironments(text: string, envPattern: string, options: ParserOptions): string {
    try {
        const envStack: Array<{ env: string; startIndex: number }> = [];
        let result = text;
        let offset = 0;

        const matches = Array.from(result.matchAll(new RegExp(`\\\\(begin|end)\\{(${envPattern})\\}`, 'g')));
        
        for (const match of matches) {
            const [fullMatch, command, env] = match;
            const index = match.index! + offset;
            
            if (command === 'begin') {
                // Check nesting validity
                if (envStack.length > 0) {
                    const outerEnv = envStack[envStack.length - 1].env;
                    if (VALID_NESTING[outerEnv] && !VALID_NESTING[outerEnv].includes(env)) {
                        logger.warning(ERROR_MESSAGES.NESTED_ERROR(outerEnv, env));
                    }
                }
                envStack.push({ env, startIndex: index + fullMatch.length });
            } else {
                const envInfo = envStack.pop();
                if (!envInfo || envInfo.env !== env) {
                    logger.error(ERROR_MESSAGES.UNMATCHED_ENVIRONMENT(env));
                    continue;
                }
                
                // Extract and convert the environment content
                const content = result.slice(envInfo.startIndex, index);
                const converted = convertEnvironmentToDisplay(env, content, options);
                
                // Replace the entire environment (including begin/end tags) with the converted content
                const fullEnv = result.slice(envInfo.startIndex - fullMatch.length, index + fullMatch.length);
                result = result.slice(0, envInfo.startIndex - fullMatch.length) + converted + result.slice(index + fullMatch.length);
                
                // Update offset for subsequent replacements
                offset += converted.length - fullEnv.length;
            }
        }

        // Check for unclosed environments
        if (envStack.length > 0) {
            envStack.forEach(info => {
                logger.error(ERROR_MESSAGES.UNMATCHED_ENVIRONMENT(info.env));
            });
        }

        return result;
    } catch (error) {
        logger.error('Error processing nested environments', error);
        return text; // Return original text on error
    }
}

/*******************************************************
 * MAIN PARSER FUNCTION
 *******************************************************/
export function parseLatexToObsidian(text: string, options: ParserOptions = {}): string {
    try {
        // Set default options
        const defaultOptions: Required<ParserOptions> = {
            convertEnvironments: true,
            extraEnvironments: [],
            convertEqnarray: true,
            removeLabels: false,
            handleRefs: 'placeholder',
            expandMacros: true,
            convertCitations: true,
            removeLeftRight: true,
            unifyTextToMathrm: true
        };

        const finalOptions = { ...defaultOptions, ...options };
        let processedText = text;

        // Step 1: Expand macros if enabled
        if (finalOptions.expandMacros) {
            processedText = expandMacros(processedText);
        }

        // Step 2: Handle environments
        if (finalOptions.convertEnvironments) {
            const envPattern = Object.keys(ENVIRONMENT_MAPPINGS)
                .concat(finalOptions.extraEnvironments)
                .join('|');
            
            processedText = replaceNestedEnvironments(processedText, envPattern, finalOptions);
        }

        // Step 3: Handle labels and references
        processedText = handleLabelsAndRefs(processedText, finalOptions);

        // Step 4: Convert citations if enabled
        if (finalOptions.convertCitations) {
            processedText = convertCitations(processedText);
        }

        // Step 5: Replace math delimiters
        processedText = replaceMathDelimiters(processedText);

        // Step 6: Clean up \left and \right if enabled
        if (finalOptions.removeLeftRight) {
            processedText = processedText.replace(/\\left\s*([({[])/g, '$1')
                .replace(/\\right\s*([)}\]])/g, '$1');
        }

        // Step 7: Convert \text to \mathrm if enabled
        if (finalOptions.unifyTextToMathrm) {
            processedText = processedText.replace(/\\text\{([^}]*)\}/g, '\\mathrm{$1}');
        }

        return processedText;
    } catch (error) {
        logger.error('Error in LaTeX parser', error);
        return text; // Return original text on critical error
    }
}

export default parseLatexToObsidian;
