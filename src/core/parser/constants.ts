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
    
    // Theorem-like environments (convert to callouts)
    'theorem': 'callout-theorem',
    'lemma': 'callout-lemma',
    'proof': 'callout-proof',
    'definition': 'callout-definition',
    'example': 'callout-example',
    'remark': 'callout-remark'
};

// Error messages for better error handling
export const ERROR_MESSAGES = {
    UNMATCHED_ENVIRONMENT: (env: string) => `Unmatched environment: ${env}`,
    UNMATCHED_BRACKETS: (type: string) => `Unmatched ${type} brackets`,
    INVALID_MACRO: (name: string) => `Invalid macro: ${name}`,
    MACRO_ARG_MISMATCH: (name: string, expected: number, got: number) => 
        `Macro ${name} expects ${expected} arguments but got ${got}`,
    NESTED_ERROR: (outer: string, inner: string) => 
        `Invalid nesting: ${inner} inside ${outer}`,
    CITATION_ERROR: (key: string) => `Invalid citation key: ${key}`,
    LABEL_ERROR: (label: string) => `Invalid label: ${label}`,
    UNKNOWN_ENVIRONMENT: (env: string) => `Unknown environment: ${env}`
};

// Common LaTeX macros for expansion
export const COMMON_MACROS: Record<string, string> = {
    '\\R': '\\mathbb{R}',
    '\\N': '\\mathbb{N}',
    '\\Z': '\\mathbb{Z}',
    '\\Q': '\\mathbb{Q}',
    '\\C': '\\mathbb{C}',
    '\\vec': '\\mathbf',
    '\\mat': '\\mathbf',
};

// Citation formats for different citation types
interface CitationFormats {
    CUSTOM: {
        cite: string;
        citep: string;
        citet: string;
        citeauthor: string;
        citeyear: string;
        citetitle: string;
        fullcite: string;
    }
}

export const CITATION_FORMATS: CitationFormats = {
    CUSTOM: {
        cite: '[@$1]',
        citep: '[@$1]',
        citet: '@$1',
        citeauthor: '$1',
        citeyear: '($1)',
        citetitle: '*$1*',
        fullcite: '[@$1]'
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
export const MATH_DELIMITERS = {
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
interface ReferenceFormats {
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
    DEFAULT: '(ref: $label)',
    EQUATION: '(eq. $number)',
    SECTION: '(sec. $number)',
    FIGURE: '(fig. $number)',
    PAGE: '(p. $number)',
    NAME: '[$name]',
    CUSTOM: {
        ref: '(ref: $label)',
        eqref: '(eq. $number)',
        pageref: '(p. $number)',
        nameref: '[$name]',
        autoref: '($type $number)',
        vref: '($type $number on p. $page)'
    }
};

// Valid nesting rules for environments
export const VALID_NESTING: Record<string, string[]> = {
    'align': ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix'],
    'align*': ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix'],
    'equation': ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix'],
    'equation*': ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix'],
    'gather': ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix'],
    'gather*': ['matrix', 'pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix']
};
