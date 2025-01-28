import { logger } from './logger';

export class ParserError extends Error {
    constructor(message: string, public details?: unknown) {
        super(message);
        this.name = 'ParserError';
    }
}

export function validateLatexStructure(text: string): void {
    const bracketPairs = {
        '{': '}',
        '[': ']',
        '(': ')'
    };
    
    const stack: string[] = [];
    let inMathMode = false;
    let mathDelimiter = '';

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        // Handle math mode
        if (char === '$') {
            if (text[i + 1] === '$') {
                if (!inMathMode) {
                    inMathMode = true;
                    mathDelimiter = '$$';
                    i++; // Skip next $
                } else if (mathDelimiter === '$$') {
                    inMathMode = false;
                    mathDelimiter = '';
                    i++; // Skip next $
                }
            } else {
                if (!inMathMode) {
                    inMathMode = true;
                    mathDelimiter = '$';
                } else if (mathDelimiter === '$') {
                    inMathMode = false;
                    mathDelimiter = '';
                }
            }
            continue;
        }

        // Check brackets
        if (Object.keys(bracketPairs).includes(char)) {
            stack.push(char);
        } else if (Object.values(bracketPairs).includes(char)) {
            const lastOpen = stack.pop();
            const expectedOpen = Object.entries(bracketPairs)
                .find(([_, close]) => close === char)?.[0];

            if (!lastOpen || lastOpen !== expectedOpen) {
                const position = text.substring(0, i).split('\n').length;
                throw new ParserError(
                    `Mismatched brackets: found '${char}' without matching '${expectedOpen}'`,
                    { position, context: text.substring(Math.max(0, i - 20), i + 20) }
                );
            }
        }
    }

    // Check for unclosed brackets
    if (stack.length > 0) {
        throw new ParserError(
            `Unclosed brackets: ${stack.join(', ')} not closed`,
            { unclosedBrackets: stack }
        );
    }

    // Check for unclosed math mode
    if (inMathMode) {
        throw new ParserError(
            `Unclosed math mode: missing closing ${mathDelimiter}`,
            { delimiter: mathDelimiter }
        );
    }
}

export function validateEnvironments(text: string): void {
    const envStack: string[] = [];
    const envRegex = /\\(begin|end)\{([^}]+)}/g;
    
    let match;
    while ((match = envRegex.exec(text)) !== null) {
        const [_, type, name] = match;
        
        if (type === 'begin') {
            envStack.push(name);
        } else { // type === 'end'
            const lastEnv = envStack.pop();
            if (!lastEnv) {
                throw new ParserError(
                    `Unexpected \\end{${name}} without matching \\begin`,
                    { position: match.index }
                );
            }
            if (lastEnv !== name) {
                throw new ParserError(
                    `Environment mismatch: \\begin{${lastEnv}} closed with \\end{${name}}`,
                    { expected: lastEnv, found: name, position: match.index }
                );
            }
        }
    }

    if (envStack.length > 0) {
        throw new ParserError(
            `Unclosed environments: ${envStack.join(', ')}`,
            { unclosedEnvironments: envStack }
        );
    }
}

export function validateMacros(text: string): void {
    const newCommandRegex = /\\(?:new|renew)command\{([^}]+)}/g;
    const definedMacros = new Set<string>();
    
    let match;
    while ((match = newCommandRegex.exec(text)) !== null) {
        const macroName = match[1];
        if (definedMacros.has(macroName)) {
            logger.warning(`Duplicate macro definition: ${macroName}`);
        }
        definedMacros.add(macroName);
    }
}