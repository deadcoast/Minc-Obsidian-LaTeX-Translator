import { ParserOptions } from '../parser/latexParser';

export interface LatexTranslatorSettings {
    // Environment conversion settings
    environmentConversion: {
        enabled: boolean;
        customMappings: Record<string, string>;
        preserveOriginalOnUnknown: boolean;
    };

    // Bracket replacement settings
    bracketReplacement: {
        convertDisplayMath: boolean;
        convertInlineMath: boolean;
        preserveSingleDollar: boolean;
        useDoubleBackslash: boolean; // For newlines in math mode
    };

    // Label and reference settings
    labelAndReference: {
        removeLabels: boolean;
        referenceHandling: 'ignore' | 'placeholder' | 'autoNumber';
        customReferenceFormats: Record<string, string>;
        autoNumbering: {
            startEquation: number;
            startFigure: number;
            startTable: number;
            startSection: number;
        };
    };

    // Citation settings
    citation: {
        enabled: boolean;
        defaultFormat: string;
        customFormats: Record<string, string>;
    };

    // Advanced settings
    advanced: {
        expandMacros: boolean;
        removeLeftRight: boolean;
        unifyTextToMathrm: boolean;
        debugLogging: boolean;
    };

    // UI settings
    uiSettings: {
        // Real-time preview
        enablePreviewPanel: boolean;
        previewPanelPosition: 'right' | 'bottom';
        autoUpdatePreview: boolean;
        previewDelay: number;

        // Error and warning display
        showErrorNotifications: boolean;
        showWarningNotifications: boolean;
        inlineErrorHighlighting: boolean;
        errorHighlightStyle: 'underline' | 'background' | 'gutter';

        // Conversion logs
        showConversionLogs: boolean;
        logDetailLevel: 'basic' | 'detailed' | 'debug';
        maxLogEntries: number;
        autoExpandLogEntries: boolean;

        // Progress indicators
        showProgressBar: boolean;
        showStatusBarInfo: boolean;
        showCommandCount: boolean;
        minimumBatchSize: number;
    };
}

export const DEFAULT_SETTINGS: LatexTranslatorSettings = {
    environmentConversion: {
        enabled: true,
        customMappings: {},
        preserveOriginalOnUnknown: true
    },
    bracketReplacement: {
        convertDisplayMath: true,
        convertInlineMath: true,
        preserveSingleDollar: true,
        useDoubleBackslash: true
    },
    labelAndReference: {
        removeLabels: false,
        referenceHandling: 'placeholder',
        customReferenceFormats: {},
        autoNumbering: {
            startEquation: 1,
            startFigure: 1,
            startTable: 1,
            startSection: 1
        }
    },
    citation: {
        enabled: true,
        defaultFormat: '[cite: $key]',
        customFormats: {}
    },
    advanced: {
        expandMacros: true,
        removeLeftRight: true,
        unifyTextToMathrm: true,
        debugLogging: false
    },
    uiSettings: {
        // Real-time preview
        enablePreviewPanel: true,
        previewPanelPosition: 'right',
        autoUpdatePreview: true,
        previewDelay: 500,

        // Error and warning display
        showErrorNotifications: true,
        showWarningNotifications: true,
        inlineErrorHighlighting: true,
        errorHighlightStyle: 'underline',

        // Conversion logs
        showConversionLogs: true,
        logDetailLevel: 'basic',
        maxLogEntries: 100,
        autoExpandLogEntries: false,

        // Progress indicators
        showProgressBar: true,
        showStatusBarInfo: true,
        showCommandCount: true,
        minimumBatchSize: 10
    }
};

export function settingsToParserOptions(settings: LatexTranslatorSettings): ParserOptions {
    return {
        convertEnvironments: settings.environmentConversion.enabled,
        extraEnvironments: Object.keys(settings.environmentConversion.customMappings),
        convertEqnarray: settings.environmentConversion.enabled,
        removeLabels: settings.labelAndReference.removeLabels,
        handleRefs: settings.labelAndReference.referenceHandling,
        expandMacros: settings.advanced.expandMacros,
        convertCitations: settings.citation.enabled,
        removeLeftRight: settings.advanced.removeLeftRight,
        unifyTextToMathrm: settings.advanced.unifyTextToMathrm
    };
}
