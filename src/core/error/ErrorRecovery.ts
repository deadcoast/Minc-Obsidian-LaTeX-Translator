import { ErrorCategory } from './ErrorHandler';

interface RecoveryRule {
    pattern: RegExp;
    suggestions: string[];
    recoverySteps: string[];
}

export class ErrorRecovery {
    private recoveryRules: Map<ErrorCategory, RecoveryRule[]>;

    constructor() {
        this.recoveryRules = this.initializeRecoveryRules();
    }

    private initializeRecoveryRules(): Map<ErrorCategory, RecoveryRule[]> {
        const rules = new Map<ErrorCategory, RecoveryRule[]>();

        // Syntax Error Rules
        rules.set(ErrorCategory.SYNTAX, [
            {
                pattern: /undefined command/i,
                suggestions: [
                    'Check if the LaTeX command is properly defined',
                    'Verify the command spelling',
                    'Ensure required packages are imported'
                ],
                recoverySteps: [
                    'Review the LaTeX documentation for correct command syntax',
                    'Add missing package imports if needed',
                    'Consider using an alternative command'
                ]
            },
            {
                pattern: /missing \{|\}/i,
                suggestions: [
                    'Add missing curly brace',
                    'Check for balanced braces',
                    'Verify nested command structure'
                ],
                recoverySteps: [
                    'Count opening and closing braces to ensure they match',
                    'Use an editor with bracket matching to find mismatches',
                    'Break down complex nested commands into simpler parts'
                ]
            }
        ]);

        // Parsing Error Rules
        rules.set(ErrorCategory.PARSING, [
            {
                pattern: /unexpected token/i,
                suggestions: [
                    'Check for invalid characters',
                    'Verify command arguments',
                    'Review markdown syntax'
                ],
                recoverySteps: [
                    'Remove or escape special characters',
                    'Ensure proper argument formatting',
                    'Split complex expressions into simpler ones'
                ]
            },
            {
                pattern: /invalid structure/i,
                suggestions: [
                    'Review document structure',
                    'Check for proper nesting',
                    'Verify environment boundaries'
                ],
                recoverySteps: [
                    'Ensure environments are properly closed',
                    'Validate document hierarchy',
                    'Use proper section organization'
                ]
            }
        ]);

        // Conversion Error Rules
        rules.set(ErrorCategory.CONVERSION, [
            {
                pattern: /unsupported element/i,
                suggestions: [
                    'Use supported LaTeX elements',
                    'Consider alternative notation',
                    'Simplify complex expressions'
                ],
                recoverySteps: [
                    'Replace unsupported elements with supported alternatives',
                    'Break down complex expressions',
                    'Consult documentation for supported features'
                ]
            },
            {
                pattern: /conversion failed/i,
                suggestions: [
                    'Check input format',
                    'Verify conversion settings',
                    'Review element compatibility'
                ],
                recoverySteps: [
                    'Validate input against supported formats',
                    'Adjust conversion parameters',
                    'Try converting smaller sections separately'
                ]
            }
        ]);

        // File System Error Rules
        rules.set(ErrorCategory.FILE_SYSTEM, [
            {
                pattern: /permission denied/i,
                suggestions: [
                    'Check file permissions',
                    'Verify file location',
                    'Ensure file is not locked'
                ],
                recoverySteps: [
                    'Adjust file permissions',
                    'Move file to accessible location',
                    'Close any programs using the file'
                ]
            },
            {
                pattern: /file not found/i,
                suggestions: [
                    'Verify file path',
                    'Check file existence',
                    'Review file name case sensitivity'
                ],
                recoverySteps: [
                    'Create missing file',
                    'Update file path',
                    'Restore from backup if available'
                ]
            }
        ]);

        // Configuration Error Rules
        rules.set(ErrorCategory.CONFIGURATION, [
            {
                pattern: /invalid setting/i,
                suggestions: [
                    'Review setting values',
                    'Check configuration format',
                    'Verify setting compatibility'
                ],
                recoverySteps: [
                    'Reset to default settings',
                    'Update configuration file',
                    'Remove invalid settings'
                ]
            },
            {
                pattern: /missing configuration/i,
                suggestions: [
                    'Create configuration file',
                    'Set required values',
                    'Import default configuration'
                ],
                recoverySteps: [
                    'Generate default configuration',
                    'Copy template configuration',
                    'Run setup wizard'
                ]
            }
        ]);

        return rules;
    }

    public getSuggestions(error: { message: string; category: ErrorCategory }): string[] {
        const categoryRules = this.recoveryRules.get(error.category) || [];
        const matchingRule = categoryRules.find(rule => rule.pattern.test(error.message));
        
        if (matchingRule) {
            return matchingRule.suggestions;
        }

        // Default suggestions based on category
        return this.getDefaultSuggestions(error.category);
    }

    public getRecoverySteps(category: ErrorCategory, message: string): string[] {
        const categoryRules = this.recoveryRules.get(category) || [];
        const matchingRule = categoryRules.find(rule => rule.pattern.test(message));
        
        if (matchingRule) {
            return matchingRule.recoverySteps;
        }

        // Default recovery steps based on category
        return this.getDefaultRecoverySteps(category);
    }

    private getDefaultSuggestions(category: ErrorCategory): string[] {
        switch (category) {
            case ErrorCategory.SYNTAX:
                return ['Review LaTeX syntax', 'Check command documentation'];
            case ErrorCategory.PARSING:
                return ['Validate document structure', 'Check for syntax errors'];
            case ErrorCategory.CONVERSION:
                return ['Verify input format', 'Review conversion settings'];
            case ErrorCategory.FILE_SYSTEM:
                return ['Check file permissions', 'Verify file path'];
            case ErrorCategory.CONFIGURATION:
                return ['Review settings', 'Check configuration file'];
            default:
                return ['Review error details', 'Check documentation'];
        }
    }

    private getDefaultRecoverySteps(category: ErrorCategory): string[] {
        switch (category) {
            case ErrorCategory.SYNTAX:
                return ['Consult LaTeX documentation', 'Use simpler syntax'];
            case ErrorCategory.PARSING:
                return ['Restructure document', 'Simplify content'];
            case ErrorCategory.CONVERSION:
                return ['Try alternative format', 'Update conversion settings'];
            case ErrorCategory.FILE_SYSTEM:
                return ['Check file access', 'Create backup'];
            case ErrorCategory.CONFIGURATION:
                return ['Reset to defaults', 'Reconfigure settings'];
            default:
                return ['Review documentation', 'Contact support'];
        }
    }
}
