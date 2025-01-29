import { TheoremEnvironment, THEOREM_MAPPINGS } from './environments';
import { logger } from '../../utils/logger';

interface TheoremState {
    environments: Map<string, TheoremEnvironment>;
    currentSection: number;
}

export class TheoremParser {
    private state: TheoremState;

    constructor() {
        this.state = {
            environments: new Map(),
            currentSection: 0
        };
    }

    /**
     * Handle \newtheorem command
     * @param command The full newtheorem command
     * @returns Processed command result or empty string
     */
    handleNewTheorem(command: string): string {
        // Match pattern: \newtheorem{name}[numberlike]{prefix} or \newtheorem{name}{prefix}[section]
        const pattern = /\\newtheorem\{([^}]+)\}(?:\[([^]]+)\])?\{([^}]+)\}(?:\[([^]]+)\])?/;
        const match = command.match(pattern);

        if (!match) {
            logger.error('Invalid \\newtheorem command syntax:', command);
            return command;
        }

        const [, name, numberlike, prefix, section] = match;
        
        const env: TheoremEnvironment = {
            name,
            counter: 0,
            prefix,
            parent: numberlike,
            shared_counter: !!numberlike
        };

        if (section === 'section') {
            env.parent = 'section';
        }

        this.state.environments.set(name, env);
        return ''; // Remove the \newtheorem command from the output
    }

    /**
     * Process theorem-like environment
     * @param envName Environment name
     * @param content Environment content
     * @returns Processed content in Obsidian format
     */
    processTheorem(envName: string, content: string): string {
        const env = this.state.environments.get(envName);
        const calloutType = THEOREM_MAPPINGS[envName] || '> [!note]';
        
        if (!env) {
            // Handle default theorem environments
            return `${calloutType}\n${content}\n\n`;
        }

        // Increment counter
        env.counter++;
        let number = env.counter;

        // Handle section-based numbering
        if (env.parent === 'section') {
            number = `${this.state.currentSection}.${env.counter}`;
        }

        // Handle shared counters
        if (env.shared_counter && env.parent && env.parent !== 'section') {
            const parentEnv = this.state.environments.get(env.parent);
            if (parentEnv) {
                number = parentEnv.counter;
            }
        }

        return `${calloutType}\n${env.prefix} ${number}. ${content}\n\n`;
    }

    /**
     * Process alignat environment
     * @param content Environment content
     * @param starred Whether it's alignat* or not
     * @returns Processed content in MathJax format
     */
    processAlignat(content: string, starred: boolean = false): string {
        // Remove the optional argument if present (number of columns)
        const cleanContent = content.replace(/^\[?\d*\]?/, '');
        
        // Convert alignat to aligned environment
        const processed = cleanContent
            .split('\\\\')
            .map(line => line.trim())
            .join('\\\\\n');

        return starred ? 
            `\\begin{aligned}\n${processed}\n\\end{aligned}` :
            `\\begin{aligned}\n${processed}\n\\end{aligned}`;
    }

    /**
     * Process subequations environment
     * @param content Environment content
     * @returns Processed content in MathJax format
     */
    processSubequations(content: string): string {
        // In Obsidian/MathJax, we'll just treat this as regular equations
        // but we'll add a comment to maintain the grouping information
        return `% Start of subequations\n${content}\n% End of subequations`;
    }

    /**
     * Update current section number
     * @param sectionNum New section number
     */
    updateSection(sectionNum: number): void {
        this.state.currentSection = sectionNum;
        // Reset section-dependent counters
        for (const env of this.state.environments.values()) {
            if (env.parent === 'section') {
                env.counter = 0;
            }
        }
    }

    /**
     * Reset all counters
     */
    reset(): void {
        this.state.environments.clear();
        this.state.currentSection = 0;
    }
}
