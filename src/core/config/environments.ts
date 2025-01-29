/**
 * Configuration file for LaTeX environment mappings
 */

// Base interfaces
export interface EnvironmentConfig {
    latexToObsidian: string;
    obsidianToLatex: string;
    numbered: boolean;
    supportsLabel: boolean;
    description?: string;
}

export interface TheoremEnvironmentConfig extends EnvironmentConfig {
    calloutType: string;
    icon: string;
    color: string;
}

export interface MathOperator {
    name: string;
    hasLimits: boolean;
    latexCommand: string;
    obsidianCommand: string;
}

export interface SpacingCommand {
    latexCommand: string;
    obsidianCommand: string;
    width: string;
}

export interface ArraySpec {
    alignment: string;
    border: boolean;
    latexSpec: string;
    obsidianSpec: string;
}

export interface CrossRefFormat {
    latexCommand: string;
    obsidianFormat: string;
    prefix?: string;
}

export interface ObsidianCallout {
    type: string;
    icon: string;
    color: string;
}

export interface ObsidianMathConfig {
    previewMode: boolean;
    renderImmediately: boolean;
    useCallouts: boolean;
}

// Math environments configuration
export const MATH_ENVIRONMENTS: Record<string, EnvironmentConfig> = {
    'equation': {
        latexToObsidian: '$$',
        obsidianToLatex: '\\begin{equation}',
        numbered: true,
        supportsLabel: true,
        description: 'Standard equation environment'
    },
    'equation*': {
        latexToObsidian: '$$',
        obsidianToLatex: '\\begin{equation*}',
        numbered: false,
        supportsLabel: false,
        description: 'Unnumbered equation environment'
    },
    'align': {
        latexToObsidian: '$$\\begin{aligned}',
        obsidianToLatex: '\\begin{align}',
        numbered: true,
        supportsLabel: true,
        description: 'Aligned equations environment'
    },
    'align*': {
        latexToObsidian: '$$\\begin{aligned}',
        obsidianToLatex: '\\begin{align*}',
        numbered: false,
        supportsLabel: false,
        description: 'Unnumbered aligned equations'
    },
    'gather': {
        latexToObsidian: '$$\\begin{gathered}',
        obsidianToLatex: '\\begin{gather}',
        numbered: true,
        supportsLabel: true,
        description: 'Gathered equations environment'
    },
    'gather*': {
        latexToObsidian: '$$\\begin{gathered}',
        obsidianToLatex: '\\begin{gather*}',
        numbered: false,
        supportsLabel: false,
        description: 'Unnumbered gathered equations'
    },
    'multline': {
        latexToObsidian: '$$\\begin{multline}',
        obsidianToLatex: '\\begin{multline}',
        numbered: true,
        supportsLabel: true,
        description: 'Multi-line equation environment'
    },
    'multline*': {
        latexToObsidian: '$$\\begin{multline*}',
        obsidianToLatex: '\\begin{multline*}',
        numbered: false,
        supportsLabel: false,
        description: 'Unnumbered multi-line equation'
    },
    'split': {
        latexToObsidian: '$$\\begin{split}',
        obsidianToLatex: '\\begin{split}',
        numbered: false,
        supportsLabel: true,
        description: 'Split equation environment'
    }
};

// Theorem environments configuration
export const THEOREM_ENVIRONMENTS: Record<string, TheoremEnvironmentConfig> = {
    'theorem': {
        latexToObsidian: '> [!theorem]',
        obsidianToLatex: '\\begin{theorem}',
        numbered: true,
        supportsLabel: true,
        calloutType: 'theorem',
        icon: '🔍',
        color: 'blue',
        description: 'Theorem environment'
    },
    'lemma': {
        latexToObsidian: '> [!lemma]',
        obsidianToLatex: '\\begin{lemma}',
        numbered: true,
        supportsLabel: true,
        calloutType: 'lemma',
        icon: '📝',
        color: 'blue',
        description: 'Lemma environment'
    },
    'proposition': {
        latexToObsidian: '> [!proposition]',
        obsidianToLatex: '\\begin{proposition}',
        numbered: true,
        supportsLabel: true,
        calloutType: 'proposition',
        icon: '💡',
        color: 'blue',
        description: 'Proposition environment'
    },
    'corollary': {
        latexToObsidian: '> [!corollary]',
        obsidianToLatex: '\\begin{corollary}',
        numbered: true,
        supportsLabel: true,
        calloutType: 'corollary',
        icon: '✨',
        color: 'blue',
        description: 'Corollary environment'
    },
    'definition': {
        latexToObsidian: '> [!definition]',
        obsidianToLatex: '\\begin{definition}',
        numbered: true,
        supportsLabel: true,
        calloutType: 'definition',
        icon: '📚',
        color: 'green',
        description: 'Definition environment'
    },
    'example': {
        latexToObsidian: '> [!example]',
        obsidianToLatex: '\\begin{example}',
        numbered: true,
        supportsLabel: true,
        calloutType: 'example',
        icon: '🔎',
        color: 'yellow',
        description: 'Example environment'
    },
    'proof': {
        latexToObsidian: '> [!proof]',
        obsidianToLatex: '\\begin{proof}',
        numbered: false,
        supportsLabel: false,
        calloutType: 'proof',
        icon: '✏️',
        color: 'purple',
        description: 'Proof environment'
    }
};

// Theorem environment mappings
export const THEOREM_MAPPINGS: Record<string, TheoremEnvironmentConfig> = {
    'theorem': {
        latexToObsidian: '> [!theorem]',
        obsidianToLatex: '\\begin{theorem}',
        numbered: true,
        supportsLabel: true,
        calloutType: 'theorem',
        icon: '📝',
        color: 'blue',
        description: 'Theorem environment'
    },
    'lemma': {
        latexToObsidian: '> [!lemma]',
        obsidianToLatex: '\\begin{lemma}',
        numbered: true,
        supportsLabel: true,
        calloutType: 'lemma',
        icon: '📌',
        color: 'green',
        description: 'Lemma environment'
    },
    'corollary': {
        latexToObsidian: '> [!corollary]',
        obsidianToLatex: '\\begin{corollary}',
        numbered: true,
        supportsLabel: true,
        calloutType: 'corollary',
        icon: '🔍',
        color: 'purple',
        description: 'Corollary environment'
    },
    'definition': {
        latexToObsidian: '> [!definition]',
        obsidianToLatex: '\\begin{definition}',
        numbered: true,
        supportsLabel: true,
        calloutType: 'definition',
        icon: '📖',
        color: 'cyan',
        description: 'Definition environment'
    },
    'remark': {
        latexToObsidian: '> [!remark]',
        obsidianToLatex: '\\begin{remark}',
        numbered: false,
        supportsLabel: true,
        calloutType: 'remark',
        icon: '💡',
        color: 'yellow',
        description: 'Remark environment'
    }
};

// Environment mappings for conversion
export const ENVIRONMENT_MAPPINGS: Record<string, string> = {
    // Basic equation environments
    'align': 'aligned',
    'align*': 'aligned',
    'equation': 'equation',
    'equation*': 'equation',
    'gather': 'gathered',
    'gather*': 'gathered',
    'multline': 'aligned',
    'multline*': 'aligned',
    'eqnarray': 'aligned',
    'eqnarray*': 'aligned',
    'flalign': 'aligned',
    'flalign*': 'aligned',
    'alignat': 'aligned',
    'alignat*': 'aligned',
    'subequations': 'aligned',

    // Matrix environments
    'matrix': 'matrix',
    'pmatrix': 'pmatrix',
    'bmatrix': 'bmatrix',
    'Bmatrix': 'Bmatrix',
    'vmatrix': 'vmatrix',
    'Vmatrix': 'Vmatrix',
    'smallmatrix': 'smallmatrix',

    // Special math environments
    'cases': 'cases',
    'split': 'split',
    'array': 'array',
    'subarray': 'subarray',
    'gathered': 'gathered',

    // Array environments
    'tabular': 'array',
    'CD': 'CD'
};

// Math operators configuration
export const MATH_OPERATORS: Record<string, MathOperator> = {
    'sin': { name: 'sin', hasLimits: false, latexCommand: '\\sin', obsidianCommand: '\\sin' },
    'cos': { name: 'cos', hasLimits: false, latexCommand: '\\cos', obsidianCommand: '\\cos' },
    'tan': { name: 'tan', hasLimits: false, latexCommand: '\\tan', obsidianCommand: '\\tan' },
    'lim': { name: 'lim', hasLimits: true, latexCommand: '\\lim', obsidianCommand: '\\operatorname*{lim}' },
    'sup': { name: 'sup', hasLimits: true, latexCommand: '\\sup', obsidianCommand: '\\operatorname*{sup}' },
    'max': { name: 'max', hasLimits: true, latexCommand: '\\max', obsidianCommand: '\\operatorname*{max}' }
};

// Math spacing configuration
export const MATH_SPACING: Record<string, SpacingCommand> = {
    '\\,': { latexCommand: '\\,', obsidianCommand: '\\,', width: '3mu' },
    '\\:': { latexCommand: '\\:', obsidianCommand: '\\:', width: '4mu' },
    '\\;': { latexCommand: '\\;', obsidianCommand: '\\;', width: '5mu' },
    '\\!': { latexCommand: '\\!', obsidianCommand: '\\!', width: '-3mu' },
    '\\ ': { latexCommand: '\\ ', obsidianCommand: '\\ ', width: '6mu' }
};

// Array specifications
export const ARRAY_SPECS: Record<string, ArraySpec> = {
    'l': { alignment: 'left', border: false, latexSpec: 'l', obsidianSpec: 'l' },
    'c': { alignment: 'center', border: false, latexSpec: 'c', obsidianSpec: 'c' },
    'r': { alignment: 'right', border: false, latexSpec: 'r', obsidianSpec: 'r' },
    '|': { alignment: '', border: true, latexSpec: '|', obsidianSpec: '|' }
};

// Cross-reference formats
export const CROSS_REF_FORMATS: Record<string, CrossRefFormat> = {
    'ref': { latexCommand: '\\ref', obsidianFormat: '\\text{(#)}' },
    'eqref': { latexCommand: '\\eqref', obsidianFormat: '\\text{(#)}' },
    'label': { latexCommand: '\\label', obsidianFormat: '', prefix: 'eq:' }
};

// Obsidian-specific configurations
export const DEFAULT_OBSIDIAN_CONFIG: ObsidianMathConfig = {
    previewMode: true,
    renderImmediately: true,
    useCallouts: true
};

export const OBSIDIAN_MATH_DELIMITERS = {
    inline: { start: '$', end: '$' },
    display: { start: '$$', end: '$$' }
};