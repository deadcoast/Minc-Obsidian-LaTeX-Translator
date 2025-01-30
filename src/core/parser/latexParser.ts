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
} from '../error/parserErrors';

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
 * MACRO EXPANSION
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
     * Validates that delimiters are properly paired in the text
     * @param text The text to validate
     * @param pattern The pattern to match delimiters
     * @param offset The current position in the text
     * @returns boolean indicating if delimiters are properly paired
     */
    private validateDelimiterPairs(text: string, pattern: RegExp, offset: number): boolean {
        const beforeText = text.slice(0, offset);
        const afterText = text.slice(offset + 1);
        
        // Count delimiters before and after the current position
        const delimitersBefore = (beforeText.match(pattern) || []).length;
        const delimitersAfter = (afterText.match(pattern) || []).length;
        
        // Delimiters should be paired (even count) in both directions
        return delimitersBefore % 2 === 0 && delimitersAfter % 2 === 0;
    }

    /**
     * Handle \DeclareMathOperator command
     */
    private handleDeclareMathOperator(command: string): string {
        const pattern = /\\DeclareMathOperator\{\\([^}]+)\}\{([^}]+)\}/;
        const match = command.match(pattern);

        if (!match) {
            console.error('Invalid \\DeclareMathOperator syntax:', command);
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
            console.error('Invalid \\newcommand syntax:', command);
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
        return text.replace(/\\text\{([^}]*)\}/g, (match, content) => {
            if (!content) {
                console.warn(`Empty \\text command found: ${match}`);
                return match;
            }
            // Replace multiple spaces with space commands
            const spacedContent = content.replace(/\s+/g, '\\ ');
            return `\\text{${spacedContent}}`;
        });
    }

    /**
     * Process \tag commands in equations
     */
    private processEquationTags(text: string): string {
        return text.replace(/\\tag\{([^}]+)\}/g, (match, tag) => {
            if (!tag) {
                console.warn(`Empty \\tag command found: ${match}`);
                return match;
            }
            return `\\tag{${tag}}`;
        });
    }

    /**
     * Handle \left. and \right. delimiters
     */
    private processDelimiters(text: string, _options: ParserOptions): string {
        // First validate that all delimiters are properly paired
        const leftPattern = /\\left(?:[.\(\[\{|]|\\[|{|}|\[|\]|\(|\)|])/g;
        const rightPattern = /\\right(?:[.\)\]\}|]|\\[|{|}|\[|\]|\(|\)|])/g;
        
        // Check positions of each \left and \right delimiter
        let match;
        while ((match = leftPattern.exec(text)) !== null) {
            if (!this.validateDelimiterPairs(text, leftPattern, match.index)) {
                console.warn('Unmatched \\left delimiter found');
            }
        }
        while ((match = rightPattern.exec(text)) !== null) {
            if (!this.validateDelimiterPairs(text, rightPattern, match.index)) {
                console.warn('Unmatched \\right delimiter found');
            }
        }

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
            text = text.replace(pattern, (match, sub, sup) => {
                // If no valid operator config, return the original matched text
                if (!config) {
                  return match;
                }
                
                const operator = (config as MathOperator).hasLimits ? `\\operatorname*{${name}}` : `\\operatorname{${name}}`;
                if (!sub && !sup) {
                    return operator;
                }
                if (sub && sup) {
                    return `${operator}_{${sub}}^{${sup}}`;
                }
                if (sub) {
                    return `${operator}_{${sub}}`;
                }
                if (sup) {
                    return `${operator}^{${sup}}`;
                }
                return match; // Return original if no transformation needed
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
    private processMathEnvironment(env: string, content: string, _options: ParserOptions): string {
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

/*******************************************************
* LABEL AND REFERENCE HANDLING
*******************************************************/
    private processLabelsAndRefs(text: string, options: ParserOptions): string {
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
                    processedText = processedText.replace(pattern, (match, label) => {
                        if (!label) {
                            console.warn(`Empty reference found: ${match}`);
                            return match;
                        }
                        return replacer(label);
                    });
                });
            } else if (options.handleRefs === 'placeholder') {
                processedText = processedText.replace(/\\(?:eq|page|name|auto|v)?ref\{([^}]+)\}/g, (match, label) => {
                    if (!label) {
                        console.warn(`Empty reference found: ${match}`);
                        return match;
                    }
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

    /**
     * Process special math commands and delimiters
     */
    private processSpecialCommands(text: string, options: ParserOptions): string {
        // Process \tag commands with proper numbering
        text = text.replace(/\\tag(?:\*?)\{([^}]+)\}/g, (match, tag) => {
            if (!tag) {
                console.warn(`Empty \\tag command found: ${match}`);
                return match;
            }
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
        text = text.replace(/\\text\{([^}]*)\}/g, (match, content) => {
            if (!content) {
                console.warn(`Empty \\text command found: ${match}`);
                return match;
            }
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
        const rows = content.trim().split('\\\\');
        const cols = colSpec.split('').filter((c): c is keyof typeof ARRAY_COLUMN_TYPES => c in ARRAY_COLUMN_TYPES);
        
        return rows.map(row => {
            // Split row into cells by & and process each cell
            const cells = row.trim().split('&').map((cell, i) => {
                const colType = cols[i] || 'c';  // Default to center alignment
                return this.formatArrayCell(cell.trim(), colType);
            });
            // Join cells back with alignment
            return cells.join(' & ');
        }).join(' \\\\ ');
    }

    /**
     * Format array cell according to column type
     */
    private formatArrayCell(content: string, colType: keyof typeof ARRAY_COLUMN_TYPES): string {
        const columnType = ARRAY_COLUMN_TYPES[colType];
        if (!columnType) {
          return content;
        }

        let result = content;
        if (columnType.border) {
            result = `|${result}`;
        }
        if (columnType.align) {
            switch (columnType.align) {
                case 'left':
                    result = `\\text{${result}}`;
                    break;
                case 'right':
                    result = `\\text{${result}}\\phantom{x}`;
                    break;
                case 'center':
                    result = `\\text{${result}}`;
                    break;
            }
        }
        return result;
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

    /**
     * Converts a LaTeX environment to its display format
     * @param env The environment name
     * @param content The environment content
     * @param options Parser options
     * @returns The converted environment content
     */
    private convertEnvironmentToDisplay(env: string, content: string, options: ParserOptions): string {
        // Handle math environments
        if (MATH_ENVIRONMENTS.includes(env)) {
            return this.processMathEnvironment(env, content, options);
        }

        // Handle special environments
        switch (env) {
            case 'multline':
                return this.processMultline(content);
            case 'gather':
                return this.processGather(content);
            case 'split':
                return this.processSplit(content);
            case 'CD':
                return this.processCommutativeDiagram(content);
            case 'array':
                // Default to 'c' alignment if no column spec is provided
                return this.processArray(content, 'c');
            default:
                // For unknown environments, return the content as is
                return content;
        }
    }

    public parseLatexToObsidian(text: string, options: ParserOptions = { direction: 'latex-to-obsidian' }): string {
        try {
            logger.info('Starting LaTeX to Obsidian conversion');
            
            // Reset counters and maps
            this.equationCounter = 0;
            this.labelRefs.clear();
            this.operators.clear();
            this.customCommands.clear();

            // Process special commands first
            text = this.processSpecialCommands(text, options);
            logger.info('Processed special commands');

            // Process math operators and spacing
            text = this.processMathOperators(text);
            text = this.processMathSpacing(text);
            logger.info('Processed math operators and spacing');

            // Process environments
            text = this.processEnvironments(text, options);
            logger.info('Processed environments');

            // Process labels and references
            text = this.processLabelsAndRefs(text, options);
            logger.info('Processed labels and references');

            // Reset states
            this.theoremParser.reset();
            this.operators.clear();
            this.customCommands.clear();

            // Process math-related commands first
            text = text.replace(
                /\\DeclareMathOperator\{\\[^}]+\}\{[^}]+\}/g,
                match => this.handleDeclareMathOperator(match)
            );
            logger.info('Processed math operators declarations');

            text = text.replace(
                /\\newcommand\{\\[^}]+\}(?:\[\d+\])?(?:\[([^]]+)\])?\{[^}]+\}/g,
                match => this.handleNewCommand(match)
            );
            logger.info('Processed new commands');

            // Process theorem environments
            text = this.handleNewTheorem(text);
            logger.info('Processed theorem environments');

            // Update section numbers
            const sectionPattern = /\\section\{([^}]+)\}/g;
            let sectionNum = 0;
            text = text.replace(sectionPattern, (match) => {
                sectionNum++;
                this.theoremParser.updateSection(sectionNum);
                logger.info(`Updated section number to ${sectionNum}`);
                return match;
            });

            logger.info('Completed LaTeX to Obsidian conversion');
            return text;
        } catch (error) {
            logger.error('Error in LaTeX parser:', error);
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
            text = this.processLabelsAndRefs(text, options);

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
            text = this.processDelimiters(text, options);
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
            processedText = this.processLabelsAndRefs(processedText, finalOptions);

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
            console.error('Error in LaTeX parser', error);
            return text;
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
     * Replace nested environments in the text according to a pattern and options
     * @param text The text to process
     * @param envPattern The pattern of environments to match
     * @param options Parser options
     * @returns The processed text with replaced environments
     */
    private replaceNestedEnvironments(text: string, envPattern: string, options: ParserOptions): string {
        try {
            const envStack: Array<string> = [];
            let result = text;
            let offset = 0;

            logger.info('Starting nested environment replacement');
            logger.info(`Environment pattern: ${envPattern}`);

            const envRegex = new RegExp(`\\\\(begin|end)\\{(${envPattern})\\}`, 'g');
            let match;

            while ((match = envRegex.exec(result)) !== null) {
                const [fullMatch, command, env] = match;
                const index = match.index + offset;

                if (command === 'begin') {
                    // Check nesting validity
                    if (envStack.length > 0) {
                        const outerEnv = envStack[envStack.length - 1];
                        if (isValidEnvironment(outerEnv) && isValidEnvironment(env) && !VALID_NESTING[outerEnv]?.includes(env)) {
                              logger.warning(ERROR_MESSAGES.NESTED_ERROR(outerEnv, env));
                        }
                    }
                    envStack.push(env);
                    logger.info(`Pushing environment: ${env}`);
                } else {
                    const envInfo = envStack.pop();
                    if (!envInfo || envInfo !== env) {
                        logger.error(ERROR_MESSAGES.UNMATCHED_ENVIRONMENT(env));
                        continue;
                    }
                    logger.info(`Popping environment: ${env}`);
                    
                    // Extract and convert the environment content
                    const content = result.slice(envStack.length === 0 ? index + fullMatch.length : envStack[envStack.length - 1].length, index);
                    const converted = this.convertEnvironmentToDisplay(env, content, options);
                    
                    // Replace the entire environment (including begin/end tags) with the converted content
                    const fullEnv = result.slice(envStack.length === 0 ? index - fullMatch.length : envStack[envStack.length - 1].length, index + fullMatch.length);
                    result = result.slice(0, envStack.length === 0 ? index - fullMatch.length : envStack[envStack.length - 1].length) + converted + result.slice(index + fullMatch.length);
                    
                    logger.info(`Converted environment ${env}`);
                    
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
            logger.error('Error in replaceNestedEnvironments:', error);
            return text;
        }
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
            if (isValidEnvironment(outerEnv) && isValidEnvironment(envName) && !VALID_NESTING[outerEnv]?.includes(envName)) {
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

    /**
     * Replace math delimiters between LaTeX and Obsidian formats
     * @param text The text to process
     * @returns The processed text with replaced delimiters, or [processed text, boolean] if a replacement was made
     */
    private replaceMathDelimiters(text: string): string | [string, boolean] {
        let replaced = false;
        let processedText = text;
        
        // Process display math delimiters
        for (const [pattern] of MATH_DELIMITERS.DISPLAY) {
            processedText = processedText.replace(pattern, (match, content) => {
                replaced = true;
                // Validate that we have a proper delimiter match
                if (!this.validateDelimiterPairs(match, pattern as RegExp, this.position)) {
                    console.warn(`Potentially mismatched delimiter: ${match}`);
                    return match; // Return original if validation fails
                }
                return this.obsidianConfig.displayMathDelimiter === 'dollars' 
                    ? `$$${content}$$` 
                    : `\\[${content}\\]`;
            });
        }

        // Process inline math delimiters
        for (const [pattern] of MATH_DELIMITERS.INLINE) {
            processedText = processedText.replace(pattern, (match, content) => {
                replaced = true;
                // Validate that we have a proper delimiter match
                if (!this.validateDelimiterPairs(match, pattern as RegExp, this.position)) {
                    console.warn(`Potentially mismatched delimiter: ${match}`);
                    return match; // Return original if validation fails
                }
                return this.obsidianConfig.inlineMathDelimiter === 'dollars'
                    ? `$${content}$`
                    : `\\(${content}\\)`;
            });
        }

        return replaced ? [processedText, replaced] : processedText;
    }

    /**
     * Expands custom LaTeX macros in the text using the defined customCommands
     * @param text The text containing macros to expand
     * @returns The text with all macros expanded
     */
    private expandMacros(text: string): string {
        try {
            let processedText = text;
            const customMacros = new Map<string, CustomMacroDefinition>();
            
            // First handle custom macro definitions
            processedText = processedText.replace(
                /\\(?:re)?newcommand\{\\([^}]+)\}(?:\[(\d+)\])?(?:\[([^]]+)\])?\{([^}]+)\}/g,
                (match, name, argsStr, optionalArg, replacement) => {
                    if (!/^[a-zA-Z]+$/.test(name)) {
                        logger.warning(ERROR_MESSAGES.INVALID_MACRO(name));
                        return match;
                    }
                    const args = argsStr ? parseInt(argsStr, 10) : 0;
                    customMacros.set(name, { 
                        name, 
                        numArgs: args, 
                        optionalArg: optionalArg !== undefined,
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
                processedText = processedText.replace(macroRegex, (...args) => {
                    const matches = args.slice(1, -2);
                    if (matches.length !== numArgs) {
                        logger.warning(
                            ERROR_MESSAGES.MACRO_ARG_MISMATCH(name, numArgs, matches.length)
                        );
                        return args[0]; // Return original if expansion fails
                    }
                    let result = replacement;
                    matches.forEach((arg: string, i: number) => {
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
                processedText = processedText.replace(macroRegex, (match, ...args) => {
                    // Extract arguments based on numArgs
                    const macroArgs = args.slice(0, definition.numArgs);
                    
                    // Handle macro expansion failure
                    if (macroArgs.length !== definition.numArgs) {
                        console.warn(`Macro expansion failed for ${match}: expected ${definition.numArgs} args, got ${macroArgs.length}`);
                        return match; // Return original if expansion fails
                    }
                    
                    // Process the macro based on its type
                    switch (definition.name) {
                        case 'newcommand':
                        case 'renewcommand':
                            return this.handleNewCommand(match);
                        case 'DeclareMathOperator':
                            return this.handleDeclareMathOperator(match);
                        default:
                            // For other macros, return the original if no specific handling
                            return match;
                    }
                });
            });

            return processedText;
        } catch (error) {
            logger.error('Error expanding macros', error);
            return text;
        }
    }

    /**
     * Converts citations to the appropriate format
     * @param text The text containing citations
     * @returns The text with converted citations
     */
    private convertCitations(text: string): string {
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
                return acc.replace(pattern, (match, keys: string) => {
                    const citations = keys.split(',').map((key: string) => {
                        const trimmedKey = key.trim();
                        if (!/^[a-zA-Z0-9_:-]+$/.test(trimmedKey)) {
                            logger.warning(ERROR_MESSAGES.CITATION_ERROR(trimmedKey));
                            return match;
                        }
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

    public parse(text: string, options: ParserOptions = { direction: 'latex-to-obsidian' }): string {
        try {
            logger.info('Starting parsing process');
            let processedText = text;

            // Expand macros if specified
            if (options.expandMacros) {
                processedText = this.expandMacros(processedText);
            }

            // Convert citations if specified
            if (options.convertCitations) {
                processedText = this.convertCitations(processedText);
            }

            // Handle labels and references
            if (options.handleRefs) {
                processedText = this.processLabelsAndRefs(processedText, options);
            }

            // Process environments
            processedText = this.processEnvironments(processedText, options);

            // Process special commands and delimiters
            processedText = this.processSpecialCommands(processedText, options);

            // Handle equation numbering if specified
            if (options.numberEquations) {
                processedText = this.processEquationNumbering(processedText);
            }

            return processedText;
        } catch (error) {
            logger.error('Error during parsing', error);
            return text;
        }
    }
}

export default LatexParser;
