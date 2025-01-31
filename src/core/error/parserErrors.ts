/**
 * Custom error classes for LaTeX parsing
 */

export class LaTeXParserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LaTeXParserError';
    }
}

export class DelimiterMismatchError extends LaTeXParserError {
    constructor(expected: string, found: string | null, position: number) {
        super(`Expected delimiter "${expected}" but found "${found || 'EOF'}" at position ${position}`);
        this.name = 'DelimiterMismatchError';
    }
}

export class EnvironmentMismatchError extends LaTeXParserError {
    constructor(expected: string, found: string | null, position: number) {
        super(`Expected environment "${expected}" but found "${found || 'EOF'}" at position ${position}`);
        this.name = 'EnvironmentMismatchError';
    }
}

export class InvalidNestingError extends LaTeXParserError {
    constructor(outer: string, inner: string, position: number) {
        super(`Invalid nesting: "${inner}" cannot be nested inside "${outer}" at position ${position}`);
        this.name = 'InvalidNestingError';
    }
}

export class UnknownEnvironmentError extends LaTeXParserError {
    constructor(environment: string) {
        super(`Unknown environment: "${environment}"`);
        this.name = 'UnknownEnvironmentError';
    }
}

export class MacroError extends LaTeXParserError {
    constructor(message: string) {
        super(message);
        this.name = 'MacroError';
    }
}

export class RecoveryAttemptError extends LaTeXParserError {
    constructor(message: string, originalError: Error) {
        super(`Recovery attempt failed: ${message}. Original error: ${originalError.message}`);
        this.name = 'RecoveryAttemptError';
    }
}

/**
 * Utility class for error recovery strategies
 */
export class ErrorRecovery {
    /**
     * Attempt to recover from a delimiter mismatch
     */
    static handleDelimiterMismatch(text: string, position: number, expected: string): string {
        // Try to find the next occurrence of the expected delimiter
        const nextDelimiter = text.indexOf(expected, position);
        if (nextDelimiter !== -1) {
            // Return the text up to and including the next delimiter
            return text.substring(0, nextDelimiter + expected.length);
        }
        // If no matching delimiter found, add it at the end
        return text + expected;
    }

    /**
     * Attempt to recover from an environment mismatch
     */
    static handleEnvironmentMismatch(text: string, position: number, environment: string): string {
        const endEnv = `\\end{${environment}}`;
        // Try to find the correct end environment
        const nextEnd = text.indexOf(endEnv, position);
        if (nextEnd !== -1) {
            // Return the text up to and including the end environment
            return text.substring(0, nextEnd + endEnv.length);
        }
        // If no matching end found, add it at the end
        return text + endEnv;
    }

    /**
     * Validate environment nesting
     */
    static validateNesting(environments: string[]): boolean {
        const stack: string[] = [];
        for (const env of environments) {
            if (env.startsWith('\\begin{')) {
                stack.push(env.slice(7, -1));
            } else if (env.startsWith('\\end{')) {
                const current = env.slice(5, -1);
                if (stack.pop() !== current) {
                    return false;
                }
            }
        }
        return stack.length === 0;
    }

    /**
     * Check if an environment can be nested inside another
     */
    static canNest(outer: string, inner: string): boolean {
        // Define the type for valid nesting rules
        type ValidNestingRules = {
            align: string[];
            equation: string[];
            gather: string[];
            multline: string[];
        };

        // Get valid nesting rules from the environment configuration
        const validNesting: ValidNestingRules = {
            'align': ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix'],
            'equation': ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix'],
            'gather': ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix'],
            'multline': ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix']
        };

        return (outer in validNesting) ? validNesting[outer as keyof ValidNestingRules].includes(inner) : false;
    }

    /**
     * Attempt to fix common LaTeX syntax errors
     */
    static fixCommonSyntaxErrors(text: string): string {
        // Fix unescaped special characters
        const specialChars = ['_', '^', '%', '&', '$', '#', '{', '}'];
        let fixed = text;
        for (const char of specialChars) {
            const regex = new RegExp(`(?<!\\\\)${char}`, 'g');
            fixed = fixed.replace(regex, `\\${char}`);
        }

        // Fix missing braces in subscripts/superscripts
        fixed = fixed.replace(/([_^])([a-zA-Z0-9])(?![{}])/g, '$1{$2}');

        // Fix missing spaces after commands
        fixed = fixed.replace(/\\[a-zA-Z]+([a-zA-Z])/g, (match, p1) => `${match.slice(0, -1)} ${p1}`);

        return fixed;
    }
}
