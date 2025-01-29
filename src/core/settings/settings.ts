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
        previewTheme: 'auto' | 'light' | 'dark';
        previewFontSize: number;
        previewLineNumbers: boolean;
        previewSyncScroll: boolean;
        previewShowDiff: boolean;

        // Error and warning display
        showErrorNotifications: boolean;
        showWarningNotifications: boolean;
        inlineErrorHighlighting: boolean;
        errorHighlightStyle: 'underline' | 'background' | 'gutter' | 'squiggly' | 'border' | 'side-border';
        errorHighlightColor: 'red' | 'orange' | 'yellow';
        errorNotificationDuration: number;
        errorGrouping: 'none' | 'type' | 'location';
        errorMinSeverity: 'info' | 'warning' | 'error';

        // Conversion logs
        showConversionLogs: boolean;
        logDetailLevel: 'basic' | 'detailed' | 'debug' | 'trace' | 'diagnostic';
        maxLogEntries: number;
        autoExpandLogEntries: boolean;
        logRetentionDays: number;
        logExportFormat: 'text' | 'json' | 'csv';
        logSearchEnabled: boolean;
        logFilterPresets: {
            name: string;
            filter: {
                types?: string[];
                severity?: string[];
                dateRange?: [number, number];
                search?: string;
            };
        }[];

        // Progress indicators
        showProgressBar: boolean;
        showStatusBarInfo: boolean;
        showCommandCount: boolean;
        minimumBatchSize: number;
        progressBarStyle: 'minimal' | 'detailed' | 'circular';
        progressBarPosition: 'notice' | 'status' | 'floating';
        progressBarTheme: 'default' | 'colorful' | 'monochrome';
        showEstimatedTime: boolean;
        showOperationDetails: boolean;
        batchProgressStrategy: 'count' | 'size' | 'complexity';

        // Progress Bar Animations
        enableProgressAnimations: boolean;
        progressAnimationStyle: 'none' | 'pulse' | 'bounce' | 'slide' | 'fade' | 'rainbow';
        progressAnimationSpeed: 'slow' | 'normal' | 'fast';
        enableProgressGlow: boolean;
        showProgressSpinner: boolean;
        useProgressGradients: boolean;
        progressCompletionEffect: 'none' | 'confetti' | 'fade' | 'zoom';

        // Error Highlighting Patterns
        enableCustomErrorPatterns: boolean;
        errorPatternStyle: 'none' | 'dotted' | 'dashed' | 'double' | 'zigzag' | 'striped';
        errorBackgroundOpacity: number;
        showErrorIcons: boolean;
        errorIconPosition: 'left' | 'right' | 'both';
        errorLineHighlight: boolean;
        errorMarginMarkers: boolean;
        customErrorColors: {
            syntax: string;
            semantic: string;
            style: string;
            warning: string;
            info: string;
        };

        // Preview Panel Features
        enablePreviewFeatures: boolean;
        previewSplitView: boolean;
        previewSyncHighlight: boolean;
        previewAutoScroll: boolean;
        previewSearchHighlight: boolean;
        previewCodeFolding: boolean;
        previewMinimap: boolean;
        previewWordWrap: boolean;
        previewLineHeight: number;
        previewFontFamily: string;
        customPreviewStyles: {
            enabled: boolean;
            css: string;
        };

        // Log Enhancement
        enableAdvancedLogging: boolean;
        logCategories: {
            system: boolean;
            conversion: boolean;
            error: boolean;
            warning: boolean;
            info: boolean;
            debug: boolean;
        };
        logTimestampFormat: 'none' | 'simple' | 'detailed' | 'relative';
        logColorCoding: boolean;
        logCollapsibleGroups: boolean;
        logSearchHistory: boolean;
        logFilterRules: {
            enabled: boolean;
            rules: Array<{
                field: string;
                operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex';
                value: string;
                active: boolean;
            }>;
        };
        logExportOptions: {
            includeMetadata: boolean;
            formatOutput: boolean;
            includeTimestamps: boolean;
            includeStackTraces: boolean;
        };

        // Progress Bar Advanced Effects
        enableAdvancedProgressEffects: boolean;
        progressCompletionEffects: {
            confetti: boolean;
            sound: boolean;
            vibration: boolean;
            notification: boolean;
            fireworks: boolean;
            sparkles: boolean;
            checkmark: boolean;
        };
        progressEffectStyle: 'minimal' | 'moderate' | 'elaborate';
        progressSoundEffect: 'none' | 'ding' | 'chime' | 'success' | 'custom';
        customProgressSound: string;
        progressVibrationPattern: number[];
        progressNotificationDuration: number;
        progressAnimationSequence: ('fade' | 'scale' | 'slide' | 'spin')[];
        progressParticleEffects: {
            enabled: boolean;
            density: number;
            speed: number;
            colors: string[];
        };

        // Advanced Error Visualization
        enableAdvancedErrorVisualization: boolean;
        errorVisualizationStyles: {
            pulsingBackground: boolean;
            gradientUnderline: boolean;
            errorBadges: boolean;
            inlinePreview: boolean;
            miniDiagnostics: boolean;
            contextualHints: boolean;
            smartGrouping: boolean;
            errorDensityMap: boolean;
        };
        errorBadgePosition: 'inline' | 'margin' | 'floating';
        errorPreviewTrigger: 'hover' | 'click' | 'auto';
        errorDiagnosticsDisplay: 'tooltip' | 'panel' | 'inline';
        errorGroupingStrategy: 'type' | 'severity' | 'location' | 'custom';
        customErrorStyles: {
            enabled: boolean;
            css: string;
        };
        errorAnimationEffects: {
            enabled: boolean;
            duration: number;
            style: 'flash' | 'bounce' | 'shake' | 'custom';
        };

        // Enhanced Preview Features
        enableEnhancedPreview: boolean;
        previewEnhancements: {
            sideBySideDiff: boolean;
            inlineComments: boolean;
            syntaxHighlighting: boolean;
            imagePreview: boolean;
            mathPreview: boolean;
            tableFormatter: boolean;
            codeBlocks: boolean;
            documentOutline: boolean;
        };
        previewInteractivity: {
            enabled: boolean;
            clickableLinks: boolean;
            editableBlocks: boolean;
            dragAndDrop: boolean;
            contextMenu: boolean;
        };
        previewAutoFormatting: {
            enabled: boolean;
            indentation: boolean;
            alignment: boolean;
            spacing: boolean;
            lists: boolean;
        };
        previewCustomizations: {
            enabled: boolean;
            theme: string;
            fontSize: number;
            lineHeight: number;
            fontFamily: string;
            customCSS: string;
        };

        // Advanced Logging System
        enableAdvancedLoggingSystem: boolean;
        loggingFeatures: {
            realTimeFiltering: boolean;
            searchSuggestions: boolean;
            logAnalytics: boolean;
            logVisualization: boolean;
            customViews: boolean;
            automatedReports: boolean;
            logAggregation: boolean;
            smartAlerts: boolean;
        };
        logAnalyticsOptions: {
            enabled: boolean;
            errorTrends: boolean;
            performanceMetrics: boolean;
            userActions: boolean;
            systemEvents: boolean;
        };
        logVisualizationTypes: {
            enabled: boolean;
            timeline: boolean;
            heatmap: boolean;
            errorDistribution: boolean;
            performanceGraphs: boolean;
        };
        logAlertRules: {
            enabled: boolean;
            rules: Array<{
                condition: string;
                threshold: number;
                action: 'notify' | 'highlight' | 'group' | 'custom';
                priority: 'low' | 'medium' | 'high';
                active: boolean;
            }>;
        };
        logRetentionPolicy: {
            enabled: boolean;
            maxEntries: number;
            maxAge: number;
            compressionEnabled: boolean;
            backupEnabled: boolean;
        };
    };

    batchOperations: {
        defaultRecursive: boolean;
        defaultSkipExisting: boolean;
        defaultCreateBackups: boolean;
        defaultNotifyOnCompletion: boolean;
        defaultErrorThreshold: number;
        autoSaveErrorReports: boolean;
        errorReportLocation: string;
        maxConcurrentFiles: number;
        processDelay: number; // Delay between files in ms
        hotkeys: {
            openBatchModal: string;
            quickBatchCurrentFolder: string;
            quickBatchVault: string;
        };
    };
}

export interface BatchOperationSettings {
    defaultRecursive: boolean;
    defaultSkipExisting: boolean;
    defaultCreateBackups: boolean;
    defaultNotifyOnCompletion: boolean;
    defaultErrorThreshold: number;
    autoSaveErrorReports: boolean;
    errorReportLocation: string;
    maxConcurrentFiles: number;
    processDelay: number; // Delay between files in ms
    hotkeys: {
        openBatchModal: string;
        quickBatchCurrentFolder: string;
        quickBatchVault: string;
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
        previewTheme: 'auto',
        previewFontSize: 14,
        previewLineNumbers: true,
        previewSyncScroll: true,
        previewShowDiff: false,

        // Error and warning display
        showErrorNotifications: true,
        showWarningNotifications: true,
        inlineErrorHighlighting: true,
        errorHighlightStyle: 'underline',
        errorHighlightColor: 'red',
        errorNotificationDuration: 5000,
        errorGrouping: 'type',
        errorMinSeverity: 'warning',

        // Conversion logs
        showConversionLogs: true,
        logDetailLevel: 'basic',
        maxLogEntries: 100,
        autoExpandLogEntries: false,
        logRetentionDays: 7,
        logExportFormat: 'text',
        logSearchEnabled: true,
        logFilterPresets: [],

        // Progress indicators
        showProgressBar: true,
        showStatusBarInfo: true,
        showCommandCount: true,
        minimumBatchSize: 10,
        progressBarStyle: 'detailed',
        progressBarPosition: 'notice',
        progressBarTheme: 'default',
        showEstimatedTime: true,
        showOperationDetails: true,
        batchProgressStrategy: 'count',

        // Progress Bar Animations
        enableProgressAnimations: true,
        progressAnimationStyle: 'pulse',
        progressAnimationSpeed: 'normal',
        enableProgressGlow: true,
        showProgressSpinner: true,
        useProgressGradients: true,
        progressCompletionEffect: 'fade',

        // Error Highlighting Patterns
        enableCustomErrorPatterns: true,
        errorPatternStyle: 'dotted',
        errorBackgroundOpacity: 0.15,
        showErrorIcons: true,
        errorIconPosition: 'left',
        errorLineHighlight: true,
        errorMarginMarkers: true,
        customErrorColors: {
            syntax: '#ff5555',
            semantic: '#ffb86c',
            style: '#bd93f9',
            warning: '#f1fa8c',
            info: '#8be9fd'
        },

        // Preview Panel Features
        enablePreviewFeatures: true,
        previewSplitView: false,
        previewSyncHighlight: true,
        previewAutoScroll: true,
        previewSearchHighlight: true,
        previewCodeFolding: true,
        previewMinimap: false,
        previewWordWrap: true,
        previewLineHeight: 1.5,
        previewFontFamily: 'monospace',
        customPreviewStyles: {
            enabled: false,
            css: ''
        },

        // Log Enhancement
        enableAdvancedLogging: true,
        logCategories: {
            system: true,
            conversion: true,
            error: true,
            warning: true,
            info: true,
            debug: false
        },
        logTimestampFormat: 'simple',
        logColorCoding: true,
        logCollapsibleGroups: true,
        logSearchHistory: true,
        logFilterRules: {
            enabled: true,
            rules: []
        },
        logExportOptions: {
            includeMetadata: true,
            formatOutput: true,
            includeTimestamps: true,
            includeStackTraces: false
        },

        // Progress Bar Advanced Effects
        enableAdvancedProgressEffects: true,
        progressCompletionEffects: {
            confetti: true,
            sound: true,
            vibration: false,
            notification: true,
            fireworks: true,
            sparkles: true,
            checkmark: true
        },
        progressEffectStyle: 'moderate',
        progressSoundEffect: 'success',
        customProgressSound: '',
        progressVibrationPattern: [100, 50, 100],
        progressNotificationDuration: 3000,
        progressAnimationSequence: ['fade', 'scale'],
        progressParticleEffects: {
            enabled: true,
            density: 50,
            speed: 1,
            colors: []
        },

        // Advanced Error Visualization
        enableAdvancedErrorVisualization: true,
        errorVisualizationStyles: {
            pulsingBackground: true,
            gradientUnderline: true,
            errorBadges: true,
            inlinePreview: true,
            miniDiagnostics: true,
            contextualHints: true,
            smartGrouping: true,
            errorDensityMap: false
        },
        errorBadgePosition: 'margin',
        errorPreviewTrigger: 'hover',
        errorDiagnosticsDisplay: 'tooltip',
        errorGroupingStrategy: 'type',
        customErrorStyles: {
            enabled: false,
            css: ''
        },
        errorAnimationEffects: {
            enabled: true,
            duration: 500,
            style: 'flash'
        },

        // Enhanced Preview Features
        enableEnhancedPreview: true,
        previewEnhancements: {
            sideBySideDiff: true,
            inlineComments: true,
            syntaxHighlighting: true,
            imagePreview: true,
            mathPreview: true,
            tableFormatter: true,
            codeBlocks: true,
            documentOutline: true
        },
        previewInteractivity: {
            enabled: true,
            clickableLinks: true,
            editableBlocks: false,
            dragAndDrop: true,
            contextMenu: true
        },
        previewAutoFormatting: {
            enabled: true,
            indentation: true,
            alignment: true,
            spacing: true,
            lists: true
        },
        previewCustomizations: {
            enabled: true,
            theme: 'default',
            fontSize: 14,
            lineHeight: 1.6,
            fontFamily: '',
            customCSS: ''
        },

        // Advanced Logging System
        enableAdvancedLoggingSystem: true,
        loggingFeatures: {
            realTimeFiltering: true,
            searchSuggestions: true,
            logAnalytics: true,
            logVisualization: true,
            customViews: true,
            automatedReports: false,
            logAggregation: true,
            smartAlerts: true
        },
        logAnalyticsOptions: {
            enabled: true,
            errorTrends: true,
            performanceMetrics: true,
            userActions: true,
            systemEvents: true
        },
        logVisualizationTypes: {
            enabled: true,
            timeline: true,
            heatmap: true,
            errorDistribution: true,
            performanceGraphs: true
        },
        logAlertRules: {
            enabled: true,
            rules: []
        },
        logRetentionPolicy: {
            enabled: true,
            maxEntries: 10000,
            maxAge: 30,
            compressionEnabled: true,
            backupEnabled: true
        },
    },

    batchOperations: {
        defaultRecursive: true,
        defaultSkipExisting: true,
        defaultCreateBackups: true,
        defaultNotifyOnCompletion: true,
        defaultErrorThreshold: 0.2,
        autoSaveErrorReports: true,
        errorReportLocation: 'latex-translator/error-reports',
        maxConcurrentFiles: 5,
        processDelay: 100,
        hotkeys: {
            openBatchModal: 'mod+shift+b',
            quickBatchCurrentFolder: 'mod+shift+f',
            quickBatchVault: 'mod+shift+v'
        }
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
