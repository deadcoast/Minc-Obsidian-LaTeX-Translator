/*******************************************************
 * TYPES & INTERFACES
 ********************************************************/
import {
    MATH_DELIMITERS,
    MATH_OPERATORS,
    MATH_SPACING,
    MATH_ENVIRONMENTS,
    VALID_NESTING,
    ARRAY_COLUMN_TYPES,
    COMMON_MACROS,
    CITATION_FORMATS,
    REFERENCE_FORMATS,
    DEFAULT_OBSIDIAN_CONFIG,
    ObsidianMathConfig,
    MathOperator,
    SpacingCommand,
    ERROR_MESSAGES,
    CustomMacroDefinition,
    isValidEnvironment
} from './constants';
import { ENVIRONMENT_MAPPINGS, THEOREM_MAPPINGS } from '../config/environments';
import { logger } from '../../utils/logger';

import { 
    DelimiterMismatchError, 
    EnvironmentMismatchError, 
    InvalidNestingError, 
    UnknownEnvironmentError,
    ErrorRecovery 
} from '../errors/parserErrors';

import { TheoremParser } from './theoremParser';

export interface ParserOptions {
    direction: 'latex-to-obsidian' | 'obsidian-to-latex';
    convertEnvironments?: boolean;
    extraEnvironments?: string[];
    convertEqnarray?: boolean;
    removeLabels?: boolean;
    preserveLabels?: boolean;
    handleRefs?: 'placeholder' | 'resolve';
    expandMacros?: boolean;
    convertCitations?: boolean;
    removeLeftRight?: boolean;
    unifyTextToMathrm?: boolean;
    numberEquations?: boolean;
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

        // Handle theorem-like environments
        if (THEOREM_MAPPINGS[env]) {
            const theoremParser = new TheoremParser();
            return theoremParser.processTheorem(env, content);
        }

        // Handle alignat environments
        if (env === 'alignat' || env === 'alignat*') {
            const theoremParser = new TheoremParser();
            return theoremParser.processAlignat(content, env === 'alignat*');
        }

        // Handle subequations
        if (env === 'subequations') {
            const theoremParser = new TheoremParser();
            return theoremParser.processSubequations(content);
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

function validateDelimiterPairs(text: string, pattern: RegExp, offset: number): boolean {
    const beforeText = text.slice(0, offset);
    const afterText = text.slice(offset + 1);
    
    // Count delimiters before and after the current position
    const delimitersBefore = (beforeText.match(pattern) || []).length;
    const delimitersAfter = (afterText.match(pattern) || []).length;
    
    // Delimiters should be paired (even count) in both directions
    return delimitersBefore % 2 === 0 && delimitersAfter % 2 === 0;
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

        if (options.handleRefs === 'resolve') {
            // First pass: collect all labels and their context
            const labelRegex = /\\label\{([^}]+)\}/g;
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
                [/\\ref\{([^}]+)\}/g, label => {
                    const info = labels.get(label);
                    return info ? REFERENCE_FORMATS.CUSTOM.ref.replace('$label', label) : '(?)';
                }],
                // Equation references
                [/\\eqref\{([^}]+)\}/g, label => {
                    const info = labels.get(label);
                    return info ? REFERENCE_FORMATS.CUSTOM.eqref.replace('$number', info.number.toString()) : '(?)';
                }],
                // Page references
                [/\\pageref\{([^}]+)\}/g, _ => {
                    return REFERENCE_FORMATS.CUSTOM.pageref.replace('$number', '?');
                }],
                // Name references
                [/\\nameref\{([^}]+)\}/g, label => {
                    const info = labels.get(label);
                    return info?.name ? REFERENCE_FORMATS.CUSTOM.nameref.replace('$name', info.name) : '(?)';
                }],
                // Auto references
                [/\\autoref\{([^}]+)\}/g, label => {
                    const info = labels.get(label);
                    const format = REFERENCE_FORMATS.CUSTOM?.autoref ?? REFERENCE_FORMATS.DEFAULT ?? '(?)';
                    return info ? format
                        .replace('$type', info.type ?? '')
                        .replace('$number', info.number.toString()) : '(?)';
                }],
                // Visual references
                [/\\vref\{([^}]+)\}/g, label => {
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
            processedText = processedText.replace(/\\(?:eq|page|name|auto|v)?ref\{([^}]+)\}/g, (match, label) => {
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
        const customMacros = new Map<string, CustomMacroDefinition>();
        
        // First handle custom macro definitions
        processedText = processedText.replace(
            /\\(?:re)?newcommand\{\\([^}]+)\}(?:\[(\d+)\])?\{([^}]+)\}/g,
            (_, name, argsStr, replacement) => {
                if (!/^[a-zA-Z]+$/.test(name)) {
                    logger.warning(ERROR_MESSAGES.INVALID_MACRO(name));
                    return _;
                }
                const args = argsStr ? parseInt(argsStr, 10) : 0;
                customMacros.set(name, { 
                    name, 
                    numArgs: args, 
                    optionalArg: false,
                    replacement 
                });
                return '';
            }
        );

        // Apply custom macros
        customMacros.forEach(({ replacement, numArgs }, name) => {
            const macroRegex = new RegExp(
                `\\\\${name}((?:\\{[^}]*\\}){0,${numArgs}})`,
                'g'
            );
            processedText = processedText.replace(macroRegex, (_match, argStr) => {
                const argMatches = argStr.match(/\{([^}]*)\}/g) || [];
                if (argMatches.length !== numArgs) {
                    logger.warning(
                        ERROR_MESSAGES.MACRO_ARG_MISMATCH(name, numArgs, argMatches.length)
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
        Object.entries(COMMON_MACROS).forEach(([macro, definition]) => {
            const macroRegex = new RegExp(macro.replace(/\\/g, '\\\\') + '(?![a-zA-Z])', 'g');
            processedText = processedText.replace(macroRegex, (_, ...args) => {
                // Extract arguments based on numArgs
                const macroArgs = args.slice(0, definition.numArgs);
                // If the macro has an optional argument and it's provided
                if (definition.optionalArg && args[0]?.startsWith('[')) {
                    const optionalArg = args[0].slice(1, -1); // Remove [ ]
                    return `\\${definition.name}{${macroArgs.join('}{')}}[${optionalArg}]`;
                }
                // Regular macro without optional argument
                return `\\${definition.name}{${macroArgs.join('}{')}}`;
            });
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
        const envStack: Array<string> = [];
        let result = text;
        let offset = 0;

        const matches = Array.from(result.matchAll(new RegExp(`\\\\(begin|end)\\{(${envPattern})\\}`, 'g')));
        
        for (const match of matches) {
            const [fullMatch, command, env] = match;
            const index = match.index! + offset;
            
            if (command === 'begin') {
                // Check nesting validity
                if (envStack.length > 0) {
                    const outerEnv = envStack[envStack.length - 1];
                    const validOuterEnv = isValidEnvironment(outerEnv);
                    const validInnerEnv = isValidEnvironment(env);
                    
                    if (validOuterEnv && validInnerEnv && 
                        VALID_NESTING[outerEnv] && !VALID_NESTING[outerEnv].includes(env)) {
                        logger.warning(ERROR_MESSAGES.NESTED_ERROR(outerEnv, env));
                    }
                }
                envStack.push(env);
            } else {
                const envInfo = envStack.pop();
                if (!envInfo || envInfo !== env) {
                    logger.error(ERROR_MESSAGES.UNMATCHED_ENVIRONMENT(env));
                    continue;
                }
                
                // Extract and convert the environment content
                const content = result.slice(envStack.length === 0 ? index + fullMatch.length : envStack[envStack.length - 1].length, index);
                const converted = convertEnvironmentToDisplay(env, content, options);
                
                // Replace the entire environment (including begin/end tags) with the converted content
                const fullEnv = result.slice(envStack.length === 0 ? index - fullMatch.length : envStack[envStack.length - 1].length, index + fullMatch.length);
                result = result.slice(0, envStack.length === 0 ? index - fullMatch.length : envStack[envStack.length - 1].length) + converted + result.slice(index + fullMatch.length);
                
                // Update offset for subsequent replacements
                offset += converted.length - fullEnv.length;
            }
        }

        // Check for unclosed environments
        if (envStack.length > 0) {
            envStack.forEach(info => {
                logger.error(ERROR_MESSAGES.UNMATCHED_ENVIRONMENT(info));
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
export class LatexParser {
    private theoremParser: TheoremParser;
    private operators: Map<string, { name: string; definition: string }>;
    private customCommands: Map<string, { name: string; numArgs: number; optionalArg?: string; definition: string }>;
    private equationCounter: number;
    private labelRefs: Map<string, string>;
    private environmentStack: string[] = [];
    private position: number = 0;
    private obsidianConfig: ObsidianMathConfig;

    constructor() {
        this.theoremParser = new TheoremParser();
        this.operators = new Map();
        this.customCommands = new Map();
        this.equationCounter = 0;
        this.labelRefs = new Map();
        this.obsidianConfig = DEFAULT_OBSIDIAN_CONFIG;
    }

    /**
     * Handle \DeclareMathOperator command
     */
    private handleDeclareMathOperator(command: string): string {
        const pattern = /\\DeclareMathOperator\{\\([^}]+)\}\{([^}]+)\}/;
        const match = command.match(pattern);

        if (!match) {
            logger.error('Invalid \\DeclareMathOperator syntax:', command);
            return command;
        }

        const [, name, definition] = match;
        this.operators.set(name, { name, definition });
        return '';
    }

    /**
     * Handle \newcommand with optional arguments
     */
    private handleNewCommand(command: string): string {
        const pattern = /\\newcommand\{\\([^}]+)\}(?:\[\d+\])?(?:\[([^]]+)\])?\{([^}]+)\}/;
        const match = command.match(pattern);

        if (!match) {
            logger.error('Invalid \\newcommand syntax:', command);
            return command;
        }

        const [, name, numArgsStr, optionalArg, definition] = match;
        const numArgs = numArgsStr ? parseInt(numArgsStr) : 0;

        this.customCommands.set(name, {
            name,
            numArgs,
            optionalArg,
            definition
        });

        return '';
    }

    private handleNewTheorem(text: string): string {
        const newTheoremPattern = /\\newtheorem\{[^}]+\}(?:\[[^]]+\])?\{[^}]+\}(?:\[[^]]+\])?/g;
        return text.replace(newTheoremPattern, (match) => this.theoremParser.handleNewTheorem(match));
    }

    /**
     * Process text commands within math mode
     */
    private processTextInMath(text: string): string {
        return text.replace(/\\text\{([^}]*)\}/g, (_, content) => {
            // Replace multiple spaces with space commands
            const spacedContent = content.replace(/\s+/g, '\\ ');
            return `\\text{${spacedContent}}`;
        });
    }

    /**
     * Process \tag commands in equations
     */
    private processEquationTags(text: string): string {
        return text.replace(/\\tag\{([^}]+)\}/g, (_, tag) => {
            return `\\tag{${tag}}`;
        });
    }

    /**
     * Handle \left. and \right. delimiters
     */
    private processDelimiters(text: string): string {
        // Handle cases where \left. or \right. is used for alignment
        text = text.replace(/\\left\.\s*([^\\]+)\\right([^.\s])/g, '$1\\right$2');
        text = text.replace(/\\left([^.])\s*([^\\]+)\\right\./g, '\\left$1$2');
        
        // Handle cases where both \left. and \right. are used
        text = text.replace(/\\left\.\s*([^\\]+)\\right\./g, '$1');

        return text;
    }

    /**
     * Process custom math operators and handle their limits and spacing
     * Supports both predefined operators from MATH_OPERATORS and custom operators
     * defined through \DeclareMathOperator
     */
    private processMathOperators(text: string): string {
        for (const [name, config] of Object.entries(MATH_OPERATORS)) {
            const pattern = new RegExp(`\\\\${name}\\s*(?:_(\\{[^}]+\\}|[^{\\s]+))?(?:\\^(\\{[^}]+\\}|[^{\\s]+))?`, 'g');
            text = text.replace(pattern, (_, sub, sup) => {
                const operator = (config as MathOperator).hasLimits ? `\\operatorname*{${name}}` : `\\operatorname{${name}}`;
                if (sub && sup) {
                    return `${operator}_{${sub}}^{${sup}}`;
                }
                if (sub) {
                    return `${operator}_{${sub}}`;
                }
                if (sup) {
                    return `${operator}^{${sup}}`;
                }
                return operator;
            });
        }

        for (const [name, operator] of this.operators) {
            const pattern = new RegExp(`\\\\${name}`, 'g');
            text = text.replace(pattern, `\\operatorname{${operator.definition}}`);
        }

        return text;
    }

    /**
     * Process custom commands with optional arguments
     */
    private processCustomCommands(text: string): string {
        for (const [name, command] of this.customCommands) {
            const pattern = new RegExp(
                `\\\\${name}` +
                (command.numArgs > 0 ? `(?:\\{[^}]*\\}){0,${command.numArgs}})`: ''),
                'g'
            );

            text = text.replace(pattern, (...args) => {
                const matches = args.slice(1, -2);
                let result = command.definition;

                if (command.optionalArg) {
                    const optionalValue = matches[0] || command.optionalArg;
                    result = result.replace('#1', optionalValue);
                    matches.shift();
                }

                for (let i = 0; i < command.numArgs; i++) {
                    result = result.replace(
                        new RegExp(`#${i + 1}`, 'g'),
                        matches[i] || ''
                    );
                }

                return result;
            });
        }
        return text;
    }

    /**
     * Process math environments with proper Obsidian MathJax formatting
     */
    private processMathEnvironment(env: string, content: string, options: ParserOptions): string {
        // Extract potential array column specification
        const arrayMatch = env.match(/array\{([^}]+)\}/);
        if (arrayMatch) {
            return this.processArray(content, '{' + arrayMatch[1] + '}');
        }

        switch (env) {
            case 'multline':
            case 'multline*':
                return this.processMultline(content);
            case 'gather':
            case 'gather*':
                return this.processGather(content);
            case 'split':
                return this.processSplit(content);
            case 'CD':
                return this.processCommutativeDiagram(content);
            // Add array environment support
            case 'array':
                // If no column spec provided, default to centered alignment
                return this.processArray(content, '{c}');
            default:
                return content;
        }
    }

    /**
     * Process multline environment
     */
    private processMultline(content: string): string {
        return content.split('\\\\')
            .map((line, i, arr) => {
                line = line.trim();
                if (i === 0) {
                  return line + '\\\\';
                }
                if (i === arr.length - 1) {
                  return '\\quad'.repeat(2) + line;
                }
                return '\\quad' + line + '\\\\';
            })
            .join('\n');
    }

    /**
     * Process gather environment
     */
    private processGather(content: string): string {
        return '\\begin{gathered}\n' +
            content.split('\\\\')
                .map(line => line.trim())
                .join('\\\\\n') +
            '\n\\end{gathered}';
    }

    /**
     * Process split environment
     */
    private processSplit(content: string): string {
        return '\\begin{split}\n' +
            content.split('\\\\')
                .map(line => line.trim())
                .join('\\\\\n') +
            '\n\\end{split}';
    }

    /**
     * Process commutative diagrams
     */
    private processCommutativeDiagram(content: string): string {
        return '\\begin{CD}\n' + content + '\n\\end{CD}';
    }

    /**
     * Process math spacing commands
     */
    private processMathSpacing(text: string): string {
        for (const [command, config] of Object.entries(MATH_SPACING)) {
            const pattern = new RegExp(command.replace(/\\/g, '\\\\'), 'g');
            text = text.replace(pattern, (config as SpacingCommand).obsidianCommand);
        }
        return text;
    }

    /**
     * Process labels and references in math mode
     */
    private processLabelsAndRefs(text: string): string {
        // Process \label commands
        text = text.replace(/\\label\{([^}]+)\}/g, (_, label) => {
            this.labelRefs.set(label, `${this.equationCounter}`);
            return '';
        });

        // Process \ref and \eqref commands
        text = text.replace(/\\(?:eq)?ref\{([^}]+)\}/g, (match, label) => {
            const refNum = this.labelRefs.get(label);
            if (refNum === undefined) {
                console.warn(`Reference to undefined label: ${label}`);
                return match;
            }
            return `\\text{(${refNum})}`;
        });

        return text;
    }

    /**
     * Process special math commands and delimiters
     */
    private processSpecialCommands(text: string, options: ParserOptions): string {
        // Process \tag commands with proper numbering
        text = text.replace(/\\tag(?:\*?)\{([^}]+)\}/g, (_, tag) => {
            if (options.direction === 'latex-to-obsidian') {
                return `\\tag{${tag}}`;
            } else {
                return `\\tag{${tag}}`;
            }
        });

        // Process \DeclareMathOperator with proper operator handling
        text = text.replace(/\\DeclareMathOperator\*?\{\\([^}]+)\}\{([^}]+)\}/g, (match, name, definition) => {
            if (options.direction === 'latex-to-obsidian') {
                this.operators.set(name, { name, definition });
                return '';
            } else {
                return match; // Preserve in LaTeX
            }
        });

        // Process \newcommand with optional arguments
        text = text.replace(/\\newcommand\{\\([^}]+)\}(?:\[\d+\])?(?:\[([^]]+)\])?\{([^}]+)\}/g, 
            (match, name, numArgsStr, optionalArg, definition) => {
                if (options.direction === 'latex-to-obsidian') {
                    const numArgs = numArgsStr ? parseInt(numArgsStr) : 0;
                    this.customCommands.set(name, {
                        name,
                        numArgs,
                        optionalArg,
                        definition
                    });
                    return '';
                } else {
                    return match; // Preserve in LaTeX
                }
            }
        );

        // Process \text command within math mode
        text = text.replace(/\\text\{([^}]*)\}/g, (_, content) => {
            const spacedContent = content.replace(/\s+/g, '\\ ');
            if (options.direction === 'latex-to-obsidian') {
                return `\\text{${spacedContent}}`;
            } else {
                return `\\text{${content}}`; // Preserve original spacing in LaTeX
            }
        });

        // Handle \left. and \right. delimiters with improved matching
        const leftRightPatterns = [
            { pattern: /\\left\.\s*([^\\]+?)\\right([^.\s])/g, replace: '$1\\right$2' },
            { pattern: /\\left([^.\s])\s*([^\\]+?)\\right\./g, replace: '\\left$1$2' },
            { pattern: /\\left\.\s*([^\\]+?)\\right\./g, replace: '$1' },
            // Handle nested delimiters
            { pattern: /\\left\.\s*(\{[^}]+\})\\right\./g, replace: '$1' },
            // Handle matrix delimiters
            { pattern: /\\left\.\s*(\\begin\{[^}]+\}.*?\\end\{[^}]+\})\\right\./g, replace: '$1' }
        ];

        for (const { pattern, replace } of leftRightPatterns) {
            text = text.replace(pattern, replace);
        }

        return text;
    }

    /**
     * Process array environment with column alignment
     */
    private processArray(content: string, colSpec: string): string {
        // Split the content into rows
        const rows = content.split('\\\\').map(row => row.trim());
        
        // Get column types from colSpec (e.g., '{lcr}' -> ['l', 'c', 'r'])
        const colTypes = colSpec.replace(/[{}]/g, '').split('');
        
        // Process each row
        const processedRows = rows.map(row => {
            // Split row into cells by & and process each cell
            const cells = row.split('&').map((cell, index) => {
                const colType = colTypes[index] || 'c'; // Default to center if no alignment specified
                return this.formatArrayCell(cell.trim(), colType);
            });
            
            // Join cells back with alignment
            return cells.join(' & ');
        });
        
        // Join rows and wrap in array environment
        return '\\begin{array}' + colSpec + '\n' + 
               processedRows.join(' \\\\\n') + 
               '\n\\end{array}';
    }

    /**
     * Format array cell according to column type
     */
    private formatArrayCell(content: string, colType: string): string {
        switch (colType) {
            case 'l':
                return `\\text{${content}}`;
            case 'r':
                return `\\text{${content}}`;
            case '|':
                return '|';
            default: // 'c' or other
                return content;
        }
    }

    /**
     * Process all math environments in the text
     */
    private processEnvironments(text: string, options: ParserOptions = { direction: 'latex-to-obsidian' }): string {
        let result = text;
        let currentIndex = 0;

        while (currentIndex < text.length) {
            try {
                const [processedContent, nextIndex] = this.parseEnvironment(text, currentIndex);
                if (processedContent) {
                    const envMatch = processedContent.match(/\\begin\{([^}]+)\}([\s\S]*?)\\end\{\1\}/);
                    if (envMatch) {
                        const [fullMatch, env, content] = envMatch;
                        const processedMathContent = this.processMathEnvironment(env, content, options);
                        result = result.replace(fullMatch, processedMathContent);
                    }
                }
                currentIndex = nextIndex;
            } catch (error) {
                // If there's an error parsing the environment, move to the next character
                currentIndex++;
            }
        }

        return result;
    }

    /**
     * Process equation numbering for displayed equations
     * @param text The text to process
     * @returns The processed text with equation numbers
     */
    private processEquationNumbering(text: string): string {
        // Reset equation counter if needed
        if (this.equationCounter === 0) {
            this.equationCounter = 1;
        }

        // Add equation numbers to displayed equations that don't have a \notag or \nonumber command
        return text.replace(/\\begin\{(equation|align|gather|eqnarray)\*?\}([\s\S]*?)\\end\{\1\*?\}/g, 
            (match, environment, content) => {
                // Skip numbering for starred environments
                if (match.includes('*')) {
                    return match;
                }

                // Skip if \notag or \nonumber is present
                if (content.includes('\\notag') || content.includes('\\nonumber')) {
                    return match;
                }

                // Add equation number
                const eqNum = `\\tag{${this.equationCounter++}}`;
                const lastNewline = content.lastIndexOf('\n');
                
                if (lastNewline === -1) {
                    // Single line equation
                    return `\\begin{${environment}}${content} ${eqNum}\\end{${environment}}`;
                } else {
                    // Multi-line equation - add number to last line
                    const beforeLastLine = content.slice(0, lastNewline);
                    const lastLine = content.slice(lastNewline);
                    return `\\begin{${environment}}${beforeLastLine}${lastLine} ${eqNum}\\end{${environment}}`;
                }
            }
        );
    }

    public parseLatexToObsidian(text: string, options: ParserOptions = { direction: 'latex-to-obsidian' }): string {
        try {
            // Reset counters and maps
            this.equationCounter = 0;
            this.labelRefs.clear();
            this.operators.clear();
            this.customCommands.clear();

            // Process special commands first
            text = this.processSpecialCommands(text, options);

            // Process math operators and spacing
            text = this.processMathOperators(text);
            text = this.processMathSpacing(text);

            // Process environments
            text = this.processEnvironments(text, options);

            // Process labels and references
            text = this.processLabelsAndRefs(text);

            // Reset states
            this.theoremParser.reset();
            this.operators.clear();
            this.customCommands.clear();

            // Process math-related commands first
            text = text.replace(
                /\\DeclareMathOperator\{\\[^}]+\}\{[^}]+\}/g,
                match => this.handleDeclareMathOperator(match)
            );

            text = text.replace(
                /\\newcommand\{\\[^}]+\}(?:\[\d+\])?(?:\[([^]]+)\])?\{[^}]+\}/g,
                match => this.handleNewCommand(match)
            );

            // Process theorem environments
            text = this.handleNewTheorem(text);

            // Update section numbers
            const sectionPattern = /\\section\{([^}]+)\}/g;
            let sectionNum = 0;
            text = text.replace(sectionPattern, (match) => {
                sectionNum++;
                this.theoremParser.updateSection(sectionNum);
                return match;
            });

            // Process math content
            text = this.processDelimiters(text);
            text = this.processTextInMath(text);
            text = this.processEquationTags(text);
            text = this.processMathOperators(text);
            text = this.processCustomCommands(text);

            // Set default options
            const defaultOptions: Required<ParserOptions> = {
                direction: 'latex-to-obsidian',
                convertEnvironments: true,
                extraEnvironments: [],
                convertEqnarray: true,
                removeLabels: false,
                preserveLabels: false,
                handleRefs: 'placeholder',
                expandMacros: true,
                convertCitations: true,
                removeLeftRight: true,
                unifyTextToMathrm: true,
                numberEquations: this.obsidianConfig.previewMode // Use Obsidian config to determine if equations should be numbered
            };

            const finalOptions = { ...defaultOptions, ...options };
            let processedText = text;

            // Apply Obsidian-specific processing based on config
            if (this.obsidianConfig.useCallouts) {
                // Convert theorem environments to callouts if enabled
                processedText = this.theoremParser.processTheorems(processedText);
            }

            // Step 1: Expand macros if enabled
            if (finalOptions.expandMacros) {
                processedText = this.expandMacros(processedText);
            }

            // Step 2: Handle environments
            if (finalOptions.convertEnvironments) {
                const envPattern = Object.keys(ENVIRONMENT_MAPPINGS)
                    .concat(finalOptions.extraEnvironments)
                    .join('|');
                
                processedText = this.replaceNestedEnvironments(processedText, envPattern, finalOptions);
            }

            // Step 3: Handle labels and references
            processedText = this.handleLabelsAndRefs(processedText, finalOptions);

            // Step 4: Convert citations if enabled
            if (finalOptions.convertCitations) {
                processedText = this.convertCitations(processedText);
            }

            // Step 5: Replace math delimiters
            const mathDelimiterResult = this.replaceMathDelimiters(processedText);
            processedText = Array.isArray(mathDelimiterResult) ? mathDelimiterResult[0] : mathDelimiterResult;

            // Step 6: Clean up \left and \right if enabled
            if (finalOptions.removeLeftRight) {
                processedText = processedText.replace(/\\left\s*([({[])/g, '$1')
                    .replace(/\\right\s*([)}\]])/g, '$1');
            }

            // Step 7: Convert \text to \mathrm if enabled
            if (finalOptions.unifyTextToMathrm) {
                processedText = processedText.replace(/\\text\{([^}]*)\}/g, '\\mathrm{$1}');
            }

            // Step 8: Process equation numbering based on Obsidian config
            if (finalOptions.numberEquations && this.obsidianConfig.previewMode) {
                processedText = this.processEquationNumbering(processedText);
            }

            return processedText;
        } catch (error) {
            logger.error('Error in LaTeX parser', error);
            return text;
        }
    }

    public parseObsidianToLatex(text: string, options: ParserOptions = { direction: 'obsidian-to-latex' }): string {
        try {
            // Reset counters and maps
            this.equationCounter = 0;
            this.labelRefs.clear();
            this.operators.clear();
            this.customCommands.clear();

            // Process special commands first
            text = this.processSpecialCommands(text, options);

            // Process math operators and spacing
            text = this.processMathOperators(text);
            text = this.processMathSpacing(text);

            // Process environments
            text = this.processEnvironments(text);

            // Process labels and references
            text = this.processLabelsAndRefs(text);

            // Reset states
            this.theoremParser.reset();
            this.operators.clear();
            this.customCommands.clear();

            // Process math-related commands first
            text = text.replace(
                /\\DeclareMathOperator\{\\[^}]+\}\{[^}]+\}/g,
                match => this.handleDeclareMathOperator(match)
            );

            text = text.replace(
                /\\newcommand\{\\[^}]+\}(?:\[\d+\])?(?:\[([^]]+)\])?\{[^}]+\}/g,
                match => this.handleNewCommand(match)
            );

            // Process theorem environments
            text = this.handleNewTheorem(text);

            // Update section numbers
            const sectionPattern = /\\section\{([^}]+)\}/g;
            let sectionNum = 0;
            text = text.replace(sectionPattern, (match) => {
                sectionNum++;
                this.theoremParser.updateSection(sectionNum);
                return match;
            });

            // Process math content
            text = this.processDelimiters(text);
            text = this.processTextInMath(text);
            text = this.processEquationTags(text);
            text = this.processMathOperators(text);
            text = this.processCustomCommands(text);

            // Set default options
            const defaultOptions: Required<ParserOptions> = {
                direction: 'obsidian-to-latex',
                convertEnvironments: true,
                extraEnvironments: [],
                convertEqnarray: true,
                removeLabels: false,
                preserveLabels: false,
                handleRefs: 'placeholder',
                expandMacros: true,
                convertCitations: true,
                removeLeftRight: true,
                unifyTextToMathrm: true,
                numberEquations: false
            };

            const finalOptions = { ...defaultOptions, ...options };
            let processedText = text;

            // Step 1: Expand macros if enabled
            if (finalOptions.expandMacros) {
                processedText = this.expandMacros(processedText);
            }

            // Step 2: Handle environments
            if (finalOptions.convertEnvironments) {
                const envPattern = Object.keys(ENVIRONMENT_MAPPINGS)
                    .concat(finalOptions.extraEnvironments)
                    .join('|');
                
                processedText = this.replaceNestedEnvironments(processedText, envPattern, finalOptions);
            }

            // Step 3: Handle labels and references
            processedText = this.handleLabelsAndRefs(processedText, finalOptions);

            // Step 4: Convert citations if enabled
            if (finalOptions.convertCitations) {
                processedText = this.convertCitations(processedText);
            }

            // Step 5: Replace math delimiters
            const mathDelimiterResult = this.replaceMathDelimiters(processedText);
            processedText = Array.isArray(mathDelimiterResult) ? mathDelimiterResult[0] : mathDelimiterResult;

            // Step 6: Clean up \left and \right if enabled
            if (finalOptions.removeLeftRight) {
                processedText = processedText.replace(/\\left\s*([({[])/g, '$1')
                    .replace(/\\right\s*([)}\]])/g, '$1');
            }

            // Step 7: Convert \text to \mathrm if enabled
            if (finalOptions.unifyTextToMathrm) {
                processedText = processedText.replace(/\\text\{([^}]*)\}/g, '\\mathrm{$1}');
            }

            // Step 8: Process equation numbering
            if (finalOptions.numberEquations) {
                processedText = this.processEquationNumbering(processedText);
            }

            return processedText;
        } catch (error) {
            logger.error('Error in LaTeX parser', error);
            return text;
        }
    }

    public parse(text: string, options: ParserOptions = { direction: 'latex-to-obsidian' }): string {
        if (options.direction === 'latex-to-obsidian') {
            return this.parseLatexToObsidian(text, options);
        } else {
            return this.parseObsidianToLatex(text, options);
        }
    }

    /**
     * Parse LaTeX content with error handling and recovery
     */
    public parseWithRecovery(content: string): string {
        try {
            // Attempt to fix common syntax errors before parsing
            const preprocessed = ErrorRecovery.fixCommonSyntaxErrors(content);
            return this.parse(preprocessed);
        } catch (error) {
            if (error instanceof DelimiterMismatchError) {
                // Attempt to recover from delimiter mismatches
                console.warn(`Attempting to recover from delimiter mismatch: ${error.message}`);
                return ErrorRecovery.handleDelimiterMismatch(content, this.position, error.message);
            } else if (error instanceof EnvironmentMismatchError) {
                // Attempt to recover from environment mismatches
                console.warn(`Attempting to recover from environment mismatch: ${error.message}`);
                return ErrorRecovery.handleEnvironmentMismatch(content, this.position, error.message);
            } else {
                throw error;
            }
        }
    }

    /**
     * Process math content and apply appropriate delimiters
     * @param content The math content to process
     * @param isDisplay Whether this is display math (true) or inline math (false)
     * @returns The processed math content with appropriate delimiters
     */
    private processMathContent(content: string, isDisplay: boolean = false): string {
        // Apply any necessary math content processing
        let processedContent = content;
        
        // Process special commands if any
        processedContent = this.processSpecialCommands(processedContent, { direction: 'latex-to-obsidian' });
        
        // Process math operators
        processedContent = this.processMathOperators(processedContent);
        
        // Process custom commands
        processedContent = this.processCustomCommands(processedContent);
        
        return processedContent;
    }

    /**
     * Parse an environment with validation
     */
    private parseEnvironment(content: string, startIndex: number): [string, number] {
        const envMatch = content.slice(startIndex).match(/\\begin\{([^}]+)\}/);
        if (!envMatch) {
            throw new DelimiterMismatchError('\\begin{...}', null, startIndex);
        }

        const envName = envMatch[1];
        
        // Validate environment exists
        if (!this.isValidEnvironment(envName)) {
            throw new UnknownEnvironmentError(envName);
        }

        // Validate nesting
        if (this.environmentStack.length > 0) {
            const outerEnv = this.environmentStack[this.environmentStack.length - 1];
            if (!ErrorRecovery.canNest(outerEnv, envName)) {
                throw new InvalidNestingError(outerEnv, envName, startIndex);
            }
        }

        this.environmentStack.push(envName);
        
        // Find matching end
        const endPattern = `\\end{${envName}}`;
        const endIndex = content.indexOf(endPattern, startIndex);
        if (endIndex === -1) {
            throw new EnvironmentMismatchError(envName, null, startIndex);
        }

        // Process environment content
        const envContent = content.slice(startIndex + envMatch[0].length, endIndex);
        const processedContent = this.processEnvironmentContent(envName, envContent);

        this.environmentStack.pop();
        return [processedContent, endIndex + endPattern.length];
    }

    /**
     * Validate if an environment is defined
     */
    private isValidEnvironment(envName: string): boolean {
        return envName in ENVIRONMENT_MAPPINGS || 
               envName in MATH_ENVIRONMENTS || 
               envName in THEOREM_MAPPINGS;
    }

    /**
     * Process content of a single environment
     */
    private processEnvironmentContent(envName: string, content: string): string {
        // Process the environment content based on its type
        switch (envName.toLowerCase()) {
            case 'equation':
            case 'equation*':
                return this.processMathEnvironment(envName, content, { direction: 'latex-to-obsidian' });
            case 'align':
            case 'align*':
                return this.processMathEnvironment(envName, content, { direction: 'latex-to-obsidian' });
            case 'gather':
            case 'gather*':
                return this.processGather(content);
            case 'multline':
            case 'multline*':
                return this.processMultline(content);
            case 'split':
                return this.processSplit(content);
            case 'CD':
                return this.processCommutativeDiagram(content);
            default:
                // For unknown environments, return the content as is
                return content;
        }
    }
}

export default LatexParser;