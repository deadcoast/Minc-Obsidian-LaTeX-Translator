/**
 * Core constants for LaTeX parsing and Obsidian integration
 */

// Default configuration for Obsidian integration
export const DEFAULT_OBSIDIAN_CONFIG: ObsidianMathConfig = {
    previewMode: true,
    renderImmediately: true,
    useCallouts: true,
    displayMathDelimiter: 'dollars',
    inlineMathDelimiter: 'dollars'
};

// Math operators and functions
export const MATH_OPERATORS: Record<string, MathOperator> = {
    'sin': {
        name: 'sin',
        hasLimits: false,
        latexCommand: '\\sin',
        obsidianCommand: '\\sin'
    },
    'cos': {
        name: 'cos',
        hasLimits: false,
        latexCommand: '\\cos',
        obsidianCommand: '\\cos'
    },
    'tan': {
        name: 'tan',
        hasLimits: false,
        latexCommand: '\\tan',
        obsidianCommand: '\\tan'
    },
    'cot': {
        name: 'cot',
        hasLimits: false,
        latexCommand: '\\cot',
        obsidianCommand: '\\cot'
    },
    'sec': {
        name: 'sec',
        hasLimits: false,
        latexCommand: '\\sec',
        obsidianCommand: '\\sec'
    },
    'csc': {
        name: 'csc',
        hasLimits: false,
        latexCommand: '\\csc',
        obsidianCommand: '\\csc'
    },
    'arcsin': {
        name: 'arcsin',
        hasLimits: false,
        latexCommand: '\\arcsin',
        obsidianCommand: '\\arcsin'
    },
    'arccos': {
        name: 'arccos',
        hasLimits: false,
        latexCommand: '\\arccos',
        obsidianCommand: '\\arccos'
    },
    'arctan': {
        name: 'arctan',
        hasLimits: false,
        latexCommand: '\\arctan',
        obsidianCommand: '\\arctan'
    },
    'sinh': {
        name: 'sinh',
        hasLimits: false,
        latexCommand: '\\sinh',
        obsidianCommand: '\\sinh'
    },
    'cosh': {
        name: 'cosh',
        hasLimits: false,
        latexCommand: '\\cosh',
        obsidianCommand: '\\cosh'
    },
    'tanh': {
        name: 'tanh',
        hasLimits: false,
        latexCommand: '\\tanh',
        obsidianCommand: '\\tanh'
    },
    'exp': {
        name: 'exp',
        hasLimits: false,
        latexCommand: '\\exp',
        obsidianCommand: '\\exp'
    },
    'log': {
        name: 'log',
        hasLimits: false,
        latexCommand: '\\log',
        obsidianCommand: '\\log'
    },
    'ln': {
        name: 'ln',
        hasLimits: false,
        latexCommand: '\\ln',
        obsidianCommand: '\\ln'
    },
    'lim': {
        name: 'lim',
        hasLimits: true,
        latexCommand: '\\lim',
        obsidianCommand: '\\operatorname*{lim}'
    },
    'inf': {
        name: 'inf',
        hasLimits: false,
        latexCommand: '\\inf',
        obsidianCommand: '\\inf'
    },
    'sup': {
        name: 'sup',
        hasLimits: true,
        latexCommand: '\\sup',
        obsidianCommand: '\\operatorname*{sup}'
    },
    'max': {
        name: 'max',
        hasLimits: true,
        latexCommand: '\\max',
        obsidianCommand: '\\operatorname*{max}'
    },
    'min': {
        name: 'min',
        hasLimits: true,
        latexCommand: '\\min',
        obsidianCommand: '\\operatorname*{min}'
    },
    'det': {
        name: 'det',
        hasLimits: false,
        latexCommand: '\\det',
        obsidianCommand: '\\det'
    },
    'dim': {
        name: 'dim',
        hasLimits: false,
        latexCommand: '\\dim',
        obsidianCommand: '\\dim'
    },
    'ker': {
        name: 'ker',
        hasLimits: false,
        latexCommand: '\\ker',
        obsidianCommand: '\\ker'
    },
    'deg': {
        name: 'deg',
        hasLimits: false,
        latexCommand: '\\deg',
        obsidianCommand: '\\deg'
    },
    'gcd': {
        name: 'gcd',
        hasLimits: false,
        latexCommand: '\\gcd',
        obsidianCommand: '\\gcd'
    },
    'lcm': {
        name: 'lcm',
        hasLimits: false,
        latexCommand: '\\lcm',
        obsidianCommand: '\\lcm'
    },
    'bmod': {
        name: 'bmod',
        hasLimits: false,
        latexCommand: '\\bmod',
        obsidianCommand: '\\bmod'
    },
    'pmod': {
        name: 'pmod',
        hasLimits: false,
        latexCommand: '\\pmod',
        obsidianCommand: '\\pmod'
    },
    'sqrt': {
        name: 'sqrt',
        hasLimits: false,
        latexCommand: '\\sqrt',
        obsidianCommand: '\\sqrt'
    }
};

// Math spacing commands
export const MATH_SPACING: Record<string, SpacingCommand> = {
    '\\,': {
        latexCommand: '\\,',
        obsidianCommand: '\\,',
        width: '3mu' // 1/6 quad
    },
    '\\:': {
        latexCommand: '\\:',
        obsidianCommand: '\\:',
        width: '4mu' // 2/9 quad
    },
    '\\;': {
        latexCommand: '\\;',
        obsidianCommand: '\\;',
        width: '5mu' // 5/18 quad
    },
    '\\!': {
        latexCommand: '\\!',
        obsidianCommand: '\\!',
        width: '-3mu' // negative thin space
    },
    '\\quad': {
        latexCommand: '\\quad',
        obsidianCommand: '\\quad',
        width: '18mu' // 1 quad
    },
    '\\qquad': {
        latexCommand: '\\qquad',
        obsidianCommand: '\\qquad',
        width: '36mu' // 2 quads
    }
};

// Math delimiters for LaTeX to Obsidian conversion
export type DelimiterPair = [RegExp | string, string];

export const MATH_DELIMITERS = {
    DISPLAY: [
        [/\\\[/g, '$$'],
        [/\\\]/g, '$$'],
        [/\\begin\{equation\}/g, '$$'],
        [/\\end\{equation\}/g, '$$'],
        [/\\begin\{equation\*\}/g, '$$'],
        [/\\end\{equation\*\}/g, '$$'],
        [/\\begin\{align\}/g, '$$'],
        [/\\end\{align\}/g, '$$'],
        [/\\begin\{align\*\}/g, '$$'],
        [/\\end\{align\*\}/g, '$$']
    ] as DelimiterPair[],
    INLINE: [
        [/\\\(/g, '$'],
        [/\\\)/g, '$'],
        [/\\begin\{math\}/g, '$'],
        [/\\end\{math\}/g, '$']
    ] as DelimiterPair[]
};

// Special characters that need escaping
export const SPECIAL_CHARS = [
    '\\', '{', '}', '[', ']', '_', '^', '#', '$', '%', '&', '~'
];

// Common LaTeX commands
export const COMMON_COMMANDS = {
    text: '\\text',
    textbf: '\\textbf',
    textit: '\\textit',
    emph: '\\emph',
    cite: '\\cite',
    ref: '\\ref',
    label: '\\label',
    tag: '\\tag',
    newcommand: '\\newcommand',
    renewcommand: '\\renewcommand',
    DeclareMathOperator: '\\DeclareMathOperator'
};

// Obsidian-specific markers
export const OBSIDIAN_MARKERS = {
    inlineMath: ['$', '$'],
    displayMath: ['$$', '$$'],
    calloutStart: '> [!',
    calloutEnd: ']'
};

// Parser configuration defaults
export const PARSER_DEFAULTS = {
    direction: 'latexToObsidian',
    preserveLabels: true,
    numberEquations: true,
    expandMacros: true
};

// Error messages
export const ERROR_MESSAGES = {
    UNKNOWN_ENVIRONMENT: (env: string) => `Unknown environment: ${env}`,
    INVALID_NESTING: (outer: string, inner: string) => `Invalid nesting: ${inner} inside ${outer}`,
    MISSING_END: (env: string) => `Missing \\end{${env}}`,
    UNMATCHED_DELIMITER: (delim: string) => `Unmatched delimiter: ${delim}`,
    INVALID_REFERENCE: (ref: string) => `Invalid reference: ${ref}`,
    LABEL_ERROR: (label: string) => `Error processing label: ${label}`,
    INVALID_MACRO: (name: string) => `Invalid macro: ${name}`,
    MACRO_ARG_MISMATCH: (name: string, expected: number, got: number) =>
        `Macro ${name} expects ${expected} arguments, got ${got}`,
    CITATION_ERROR: (key: string) => `Error processing citation: ${key}`,
    NESTED_ERROR: (outer: string, inner: string) =>
        `Invalid nesting: ${inner} cannot be nested inside ${outer}`,
    UNMATCHED_ENVIRONMENT: (env: string) => `Unmatched environment: ${env}`
};

// Base interface for all macros
export interface BaseMacroDefinition {
    name: string;
    numArgs: number;
    optionalArg: boolean;
}

// Interface for built-in macros
export interface BuiltInMacroDefinition extends BaseMacroDefinition {}

// Interface for custom macros
export interface CustomMacroDefinition extends BaseMacroDefinition {
    replacement: string;
}

// Common LaTeX macros for expansion
export const COMMON_MACROS: Record<string, BuiltInMacroDefinition> = {
    '\\newcommand': { name: 'newcommand', numArgs: 2, optionalArg: false },
    '\\renewcommand': { name: 'renewcommand', numArgs: 2, optionalArg: false },
    '\\providecommand': { name: 'providecommand', numArgs: 2, optionalArg: false }
};

// Citation formats for different citation types
export interface CitationFormats {
    DEFAULT: string;
    CUSTOM: {
        cite: string;
        citep: string;
        citet: string;
        citeauthor: string;
        citeyear: string;
        citetitle: string;
        fullcite: string;
    };
}

export const CITATION_FORMATS: CitationFormats = {
    DEFAULT: '[cite:$key]',
    CUSTOM: {
        cite: '[cite:$key]',
        citep: '[citep:$key]',
        citet: '[citet:$key]',
        citeauthor: '[author:$key]',
        citeyear: '[year:$key]',
        citetitle: '[title:$key]',
        fullcite: '[fullcite:$key]'
    }
};

// Citation formats for different citation commands
export const CITATION_FORMATS_COMMANDS = {
    DEFAULT: '[cite: $key]',
    PAREN: '[cite: $key]',
    TEXT: '$author ($year)',
    AUTHOR: '$author',
    YEAR: '$year',
    TITLE: '*$title*',
    FULL: '$author, *$title* ($year)',
    CUSTOM: {
        cite: '[cite: $key]',
        citep: '[cite: $key]',
        citet: '$author ($year)',
        citeauthor: '$author',
        citeyear: '$year',
        citetitle: '*$title*',
        fullcite: '$author, *$title* ($year)'
    }
};

// Math delimiter patterns
export const MATH_DELIMITER_PATTERNS = {
    DISPLAY: [
        [/\$\$([\s\S]*?)\$\$/g, '$$\n$1\n$$'], // $$...$$
        [/\\begin{displaymath}([\s\S]*?)\\end{displaymath}/g, '$$\n$1\n$$'],
        [/\\begin{equation\*?}([\s\S]*?)\\end{equation\*?}/g, '$$\n$1\n$$'],
        [/\\[\[\]]([\s\S]*?)\\[\[\]]/g, '$$\n$1\n$$'], // \[...\]
    ],
    INLINE: [
        [/\$((?:[^$]|\\\$)*?[^\\])\$/g, '$\n$1\n$'], // $...$
        [/\\begin{math}([\s\S]*?)\\end{math}/g, '$\n$1\n$'],
        [/\\(\(|\))([\s\S]*?)\\(\(|\))/g, '$\n$2\n$'], // \(...\)
    ]
} as const;

// Reference formats for different reference types
export interface ReferenceFormats {
    DEFAULT: string;
    EQUATION: string;
    SECTION: string;
    FIGURE: string;
    PAGE: string;
    NAME: string;
    CUSTOM: {
        ref: string;
        eqref: string;
        pageref: string;
        nameref: string;
        autoref: string;
        vref: string;
    };
}

export const REFERENCE_FORMATS: ReferenceFormats = {
    DEFAULT: '($type $number)',
    EQUATION: '(Equation $number)',
    SECTION: 'Section $number',
    FIGURE: 'Figure $number',
    PAGE: 'page $number',
    NAME: '$name',
    CUSTOM: {
        ref: '\\text{($label)}',
        eqref: '\\text{($number)}',
        pageref: 'page $number',
        nameref: '$name',
        autoref: '$type $number',
        vref: '$type $number on page $page'
    }
};

// Valid environments and nesting rules
export type ValidEnvironments = 'equation' | 'align' | 'gather' | 'multline';

export function isValidEnvironment(env: string): env is ValidEnvironments {
    return ['equation', 'align', 'gather', 'multline'].includes(env);
}

export const VALID_NESTING: Record<ValidEnvironments, ValidEnvironments[]> = {
    equation: ['align', 'gather', 'multline'],
    align: ['equation', 'gather', 'multline'],
    gather: ['equation', 'align', 'multline'],
    multline: ['equation', 'align', 'gather']
};

// Valid math environments
export const MATH_ENVIRONMENTS = [
    'equation',
    'equation*',
    'align',
    'align*',
    'gather',
    'gather*',
    'multline',
    'multline*',
    'split',
    'array',
    'matrix',
    'pmatrix',
    'bmatrix',
    'vmatrix',
    'Vmatrix',
    'cases'
];

// Array column types
type ArrayColumnType = {
    align: string | null;
    border: boolean;
};

type ArrayColumnTypes = {
    'l': ArrayColumnType;
    'c': ArrayColumnType;
    'r': ArrayColumnType;
    '|': ArrayColumnType;
};

export const ARRAY_COLUMN_TYPES: ArrayColumnTypes = {
    'l': { align: 'left', border: false },
    'c': { align: 'center', border: false },
    'r': { align: 'right', border: false },
    '|': { align: null, border: true }
};

// Obsidian theorem callout mappings
export const OBSIDIAN_THEOREM_CALLOUTS = {
    theorem: 'info',
    lemma: 'info',
    proposition: 'info',
    corollary: 'success',
    definition: 'note',
    example: 'example',
    remark: 'quote',
    proof: 'warning'
} as const;

// Cross-reference formats
export const CROSS_REF_FORMATS = {
    'ref': { format: '\\text{($label)}' },
    'eqref': { format: '\\text{($number)}' },
    'pageref': { format: 'page $number' }
};

// Config for theorem environments
export interface TheoremConfig {
    name: string;
    counter: number;
    prefix: string;
    parent?: string;
    shared_counter?: boolean;
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
    width: string; // For reference, not used in conversion
}

export interface ObsidianMathConfig {
    previewMode: boolean;
    renderImmediately: boolean;
    useCallouts: boolean;
    displayMathDelimiter: 'dollars' | 'brackets';  // '$$' vs '\[ \]'
    inlineMathDelimiter: 'dollars' | 'parentheses';  // '$' vs '\( \)'
}