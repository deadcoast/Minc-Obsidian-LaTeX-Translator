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
    UNMATCHED_ENVIRONMENT: (env: string) => 
        `Unmatched environment: \\begin{${env}} without corresponding \\end{${env}}`,
    UNMATCHED_BRACKETS: (type: string) => 
        `Unmatched ${type} brackets detected`,
    INVALID_MACRO: (name: string) => 
        `Invalid macro name: ${name}. Macro names must contain only letters`,
    MACRO_ARG_MISMATCH: (name: string, expected: number, got: number) => 
        `Macro ${name} expects ${expected} arguments but got ${got}`,
    NESTED_ERROR: (outer: string, inner: string) => 
        `Invalid nesting: ${inner} environment inside ${outer}`,
    CITATION_ERROR: (key: string) => 
        `Invalid citation key: ${key}`,
    LABEL_ERROR: (label: string) => 
        `Invalid label: ${label}`,
    UNKNOWN_ENVIRONMENT: (env: string) => 
        `Unknown environment: ${env}. Will be preserved as-is`
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

// Citation formats for different citation commands
export const CITATION_FORMATS = {
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

// Math mode delimiters and environments
export const MATH_DELIMITERS = {
    DISPLAY: [
        [/\\[\s\n]*\[([\s\S]*?)\\[\s\n]*\]/g, '$$$$1$$'],
        [/\\begin\{displaymath\}([\s\S]*?)\\end\{displaymath\}/g, '$$$$1$$'],
        [/\\begin\{equation\*\}([\s\S]*?)\\end\{equation\*\}/g, '$$$$1$$']
    ],
    INLINE: [
        [/\\[\s\n]*\(([\s\S]*?)\\[\s\n]*\)/g, '$$$1$$'],
        [/\\begin\{math\}([\s\S]*?)\\end\{math\}/g, '$$$1$$'],
        [/\$([^$]*?)\$/g, '$$$1$$'] // Preserve single $ delimiters
    ]
};

// Reference formats for different reference types
export const REFERENCE_FORMATS = {
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
    'align': ['matrix', 'pmatrix', 'bmatrix', 'cases', 'gathered'],
    'align*': ['matrix', 'pmatrix', 'bmatrix', 'cases', 'gathered'],
    'equation': ['matrix', 'pmatrix', 'bmatrix', 'cases', 'gathered'],
    'equation*': ['matrix', 'pmatrix', 'bmatrix', 'cases', 'gathered'],
    'gather': ['matrix', 'pmatrix', 'bmatrix', 'cases'],
    'gather*': ['matrix', 'pmatrix', 'bmatrix', 'cases']
};
