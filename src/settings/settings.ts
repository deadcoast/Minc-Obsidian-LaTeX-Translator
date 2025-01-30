import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import LatexTranslatorPlugin from '../../main';
import { ParserOptions } from '../core/parser/latexParser';

export interface LatexTranslatorSettings {
  direction: 'latex-to-obsidian' | 'obsidian-to-latex';

  environmentConversion: {
    enabled: boolean;
    customMappings: Record<string, string>;
    preserveOriginalOnUnknown: boolean;
  };

  showNotifications: boolean;
  useCallouts: boolean;
  renderImmediately: boolean;

  bracketReplacement: {
    convertDisplayMath: boolean;
    convertInlineMath: boolean;
    preserveSingleDollar: boolean;
    useDoubleBackslash: boolean;
  };

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

  citation: {
    enabled: boolean;
    defaultFormat: string;
    customFormats: Record<string, string>;
  };

  advanced: {
    expandMacros: boolean;
    removeLeftRight: boolean;
    unifyTextToMathrm: boolean;
    debugLogging: boolean;
  };

  uiSettings: {
    enablePreviewPanel: boolean;
    previewPanelPosition: 'right' | 'bottom';
    autoUpdatePreview: boolean;
    previewDelay: number;
    previewTheme: 'auto' | 'light' | 'dark';
    previewFontSize: number;
    previewLineNumbers: boolean;
    previewSyncScroll: boolean;
    previewShowDiff: boolean;

    showErrorNotifications: boolean;
    showWarningNotifications: boolean;
    inlineErrorHighlighting: boolean;
    errorHighlightStyle: 'underline' | 'background' | 'gutter' | 'squiggly' | 'border' | 'side-border';
    errorHighlightColor: 'red' | 'orange' | 'yellow';
    errorNotificationDuration: number;
    errorGrouping: 'none' | 'type' | 'location';
    errorMinSeverity: 'info' | 'warning' | 'error';

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

    enableProgressAnimations: boolean;
    progressAnimationStyle: 'none' | 'pulse' | 'bounce' | 'slide' | 'fade' | 'rainbow';
    progressAnimationSpeed: 'slow' | 'normal' | 'fast';
    enableProgressGlow: boolean;
    showProgressSpinner: boolean;
    useProgressGradients: boolean;
    progressCompletionEffect: 'none' | 'confetti' | 'fade' | 'zoom';

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
      type?: string;
      spread?: number;
      particleCount?: number;
      particleSize?: number;
      particleSpeed?: number;
      particleGravity?: number;
      particleFriction?: number;
      particleRotation?: boolean;
      particleTorque?: number;
      particleLifetime?: number;
      particleBlending?: boolean;
      particleShape?: string;
      particleOpacity?: number;
      particleGlow?: boolean;
      particleTrail?: boolean;
      particleTrailLength?: number;
      particleTrailWidth?: number;
      particleTrailColor?: string;
      particleTrailOpacity?: number;
    };

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
  direction: 'latex-to-obsidian',

  environmentConversion: {
    enabled: true,
    customMappings: {
      'equation': '$$',
      'align': '$$',
      'gather': '$$',
      'matrix': '$$',
      'bmatrix': '$$',
      'pmatrix': '$$',
      'cases': '$$'
      // Additional custom mappings can be added here
    },
    preserveOriginalOnUnknown: true
  },

  showNotifications: true,
  useCallouts: true,
  renderImmediately: true,

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
    enablePreviewPanel: true,
    previewPanelPosition: 'right',
    autoUpdatePreview: true,
    previewDelay: 500,
    previewTheme: 'auto',
    previewFontSize: 14,
    previewLineNumbers: true,
    previewSyncScroll: true,
    previewShowDiff: true,

    showErrorNotifications: true,
    showWarningNotifications: true,
    inlineErrorHighlighting: true,
    errorHighlightStyle: 'underline',
    errorHighlightColor: 'red',
    errorNotificationDuration: 5000,
    errorGrouping: 'type',
    errorMinSeverity: 'warning',

    showConversionLogs: true,
    logDetailLevel: 'basic',
    maxLogEntries: 1000,
    autoExpandLogEntries: true,
    logRetentionDays: 30,
    logExportFormat: 'text',
    logSearchEnabled: true,
    logFilterPresets: [],

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

    enableProgressAnimations: true,
    progressAnimationStyle: 'pulse',
    progressAnimationSpeed: 'normal',
    enableProgressGlow: true,
    showProgressSpinner: true,
    useProgressGradients: true,
    progressCompletionEffect: 'fade',

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

    enablePreviewFeatures: true,
    previewSplitView: false,
    previewSyncHighlight: true,
    previewAutoScroll: true,
    previewSearchHighlight: true,
    previewCodeFolding: true,
    previewMinimap: false,
    previewWordWrap: true,
    previewLineHeight: 1.6,
    previewFontFamily: 'monospace',
    customPreviewStyles: {
      enabled: true,
      css: ''
    },

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
      colors: ['#ff0000', '#00ff00', '#0000ff']
      // Additional properties can be added if needed
    },

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
    }
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
    direction: settings.direction,
    convertEnvironments: settings.environmentConversion.enabled,
    extraEnvironments: Object.keys(settings.environmentConversion.customMappings),
    convertEqnarray: settings.environmentConversion.enabled,
    removeLabels: settings.labelAndReference.removeLabels,
    handleRefs: settings.labelAndReference.referenceHandling === 'autoNumber' ? 'resolve' : 'placeholder',
    expandMacros: settings.advanced.expandMacros,
    convertCitations: settings.citation.enabled,
    removeLeftRight: settings.advanced.removeLeftRight,
    unifyTextToMathrm: settings.advanced.unifyTextToMathrm
  };
}

export class LatexTranslatorSettingTab extends PluginSettingTab {
  plugin: LatexTranslatorPlugin;

  constructor(app: App, plugin: LatexTranslatorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'M|inc LaTeX Translator Settings' });
    containerEl.createEl('p', { 
      text: 'Configure how LaTeX is converted to Obsidian-compatible format.',
      cls: 'setting-item-description'
    });

    // General Settings
    this.addGeneralSettings(containerEl);

    // Environment Conversion Settings
    this.addEnvironmentSettings(containerEl);

    // Labels & References Settings
    this.addLabelReferenceSettings(containerEl);

    // Citations Settings
    this.addCitationSettings(containerEl);

    // Advanced Settings
    this.addAdvancedSettings(containerEl);

    // UI Settings
    this.addUISettings(containerEl);

    // Batch Operation Settings
    this.addBatchOperationSettings(containerEl);
  }

  private addGeneralSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'General Settings' });

    // Conversion Direction
    new Setting(containerEl)
      .setName('Conversion Direction')
      .setDesc('Choose the direction of conversion')
      .addDropdown(dropdown => dropdown
          .addOptions({
              'latex-to-obsidian': 'LaTeX to Obsidian',
              'obsidian-to-latex': 'Obsidian to LaTeX'
          })
          .setValue(this.plugin.settings.direction || 'latex-to-obsidian')
          .onChange(async (value) => {
              this.plugin.settings.direction = value as 'latex-to-obsidian' | 'obsidian-to-latex';
              await this.plugin.saveSettings();
          }));

    // Auto Replace
    new Setting(containerEl)
      .setName('Auto Replace')
      .setDesc('Automatically convert LaTeX when pasting into the editor')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.renderImmediately)
          .onChange(async (value) => {
              this.plugin.settings.renderImmediately = value;
              await this.plugin.saveSettings();
          }));

    // Show Notifications
    new Setting(containerEl)
      .setName('Show Notifications')
      .setDesc('Show conversion success/error notifications')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.showNotifications)
          .onChange(async (value) => {
              this.plugin.settings.showNotifications = value;
              await this.plugin.saveSettings();
          }));
  }

  private addEnvironmentSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'Environment Conversion' });

    // Enable Environment Conversion
    new Setting(containerEl)
      .setName('Enable Environment Conversion')
      .setDesc('Convert LaTeX environments to Obsidian-compatible format')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.environmentConversion.enabled)
          .onChange(async (value) => {
              this.plugin.settings.environmentConversion.enabled = value;
              await this.plugin.saveSettings();
          }));

    // Preserve Original on Unknown
    new Setting(containerEl)
      .setName('Preserve Original on Unknown')
      .setDesc('Keep original LaTeX when encountering unknown environments')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.environmentConversion.preserveOriginalOnUnknown)
          .onChange(async (value) => {
              this.plugin.settings.environmentConversion.preserveOriginalOnUnknown = value;
              await this.plugin.saveSettings();
          }));

    // Convert Environments
    new Setting(containerEl)
      .setName('Convert Environments')
      .setDesc('Convert LaTeX environments to $$ blocks')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.environmentConversion.enabled)
          .onChange(async (value) => {
              this.plugin.settings.environmentConversion.enabled = value;
              await this.plugin.saveSettings();
          }));

    // Extra Environments
    new Setting(containerEl)
      .setName('Extra Environments')
      .setDesc('Additional environment names to treat as display math (comma-separated)')
      .addText(text => text
          .setPlaceholder('matrix, bmatrix, pmatrix')
          .setValue(Object.keys(this.plugin.settings.environmentConversion.customMappings).join(', '))
          .onChange(async (value) => {
              const environments = value.split(',').map(env => env.trim()).filter(env => env);
              const customMappings: Record<string, string> = {};
              environments.forEach(env => {
                  customMappings[env] = '$$';
              });
              this.plugin.settings.environmentConversion.customMappings = customMappings;
              await this.plugin.saveSettings();
          }));
  }

  private addLabelReferenceSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'Labels & References' });

    // Reference Handling
    new Setting(containerEl)
      .setName('Reference Handling')
      .setDesc('How to handle LaTeX references')
      .addDropdown(dropdown => dropdown
          .addOptions({
              'ignore': 'Ignore References',
              'placeholder': 'Use Placeholders',
              'autoNumber': 'Auto-numbering'
          })
          .setValue(this.plugin.settings.labelAndReference.referenceHandling)
          .onChange(async (value) => {
              this.plugin.settings.labelAndReference.referenceHandling = value as 'ignore' | 'placeholder' | 'autoNumber';
              await this.plugin.saveSettings();
          }));

    // Remove Labels
    new Setting(containerEl)
      .setName('Remove Labels')
      .setDesc('Remove LaTeX labels during conversion')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.labelAndReference.removeLabels)
          .onChange(async (value) => {
              this.plugin.settings.labelAndReference.removeLabels = value;
              await this.plugin.saveSettings();
          }));
  }

  private addCitationSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'Citations' });

    // Enable Citations
    new Setting(containerEl)
      .setName('Enable Citations')
      .setDesc('Enable citation processing')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.citation.enabled)
          .onChange(async (value) => {
              this.plugin.settings.citation.enabled = value;
              await this.plugin.saveSettings();
          }));

    // Default Citation Format
    new Setting(containerEl)
      .setName('Default Citation Format')
      .setDesc('Format string for citations')
      .addText(text => text
          .setValue(this.plugin.settings.citation.defaultFormat)
          .onChange(async (value) => {
              this.plugin.settings.citation.defaultFormat = value;
              await this.plugin.saveSettings();
          }));

    // Convert Citations
    new Setting(containerEl)
      .setName('Convert Citations')
      .setDesc('Convert \\cite commands to Obsidian citations')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.citation.enabled)
          .onChange(async (value) => {
              this.plugin.settings.citation.enabled = value;
              await this.plugin.saveSettings();
          }));
  }

  private addAdvancedSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'Advanced Settings' });

    // Expand Macros
    new Setting(containerEl)
      .setName('Expand Macros')
      .setDesc('Expand LaTeX macros during conversion')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.advanced.expandMacros)
          .onChange(async (value) => {
              this.plugin.settings.advanced.expandMacros = value;
              await this.plugin.saveSettings();
          }));

    // Remove \left and \right
    new Setting(containerEl)
      .setName('Remove \\left and \\right')
      .setDesc('Remove \\left and \\right commands from math expressions')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.advanced.removeLeftRight)
          .onChange(async (value) => {
              this.plugin.settings.advanced.removeLeftRight = value;
              await this.plugin.saveSettings();
          }));

    // Unify \text to \mathrm
    new Setting(containerEl)
      .setName('Unify \\text to \\mathrm')
      .setDesc('Convert \\text commands to \\mathrm in math environments')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.advanced.unifyTextToMathrm)
          .onChange(async (value) => {
              this.plugin.settings.advanced.unifyTextToMathrm = value;
              await this.plugin.saveSettings();
          }));

    // Debug Logging
    new Setting(containerEl)
      .setName('Debug Logging')
      .setDesc('Enable debug logging for advanced troubleshooting')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.advanced.debugLogging)
          .onChange(async (value) => {
              this.plugin.settings.advanced.debugLogging = value;
              await this.plugin.saveSettings();
          }));
  }

  private addUISettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'User Interface' });

    // Enable Preview Panel
    new Setting(containerEl)
      .setName('Enable Preview Panel')
      .setDesc('Show preview panel during conversion')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.uiSettings.enablePreviewPanel)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.enablePreviewPanel = value;
              await this.plugin.saveSettings();
          }));

    // Preview Panel Position
    new Setting(containerEl)
      .setName('Preview Panel Position')
      .setDesc('Position of the preview panel')
      .addDropdown(dropdown => dropdown
          .addOptions({
              'right': 'Right',
              'bottom': 'Bottom'
          })
          .setValue(this.plugin.settings.uiSettings.previewPanelPosition)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.previewPanelPosition = value as 'right' | 'bottom';
              await this.plugin.saveSettings();
          }));

    // Auto Update Preview
    new Setting(containerEl)
      .setName('Auto Update Preview')
      .setDesc('Automatically update the preview panel when changes occur')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.uiSettings.autoUpdatePreview)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.autoUpdatePreview = value;
              await this.plugin.saveSettings();
          }));

    // Preview Delay
    new Setting(containerEl)
      .setName('Preview Delay (ms)')
      .setDesc('Delay before updating the preview panel (in milliseconds)')
      .addText(text => text
          .setPlaceholder('500')
          .setValue(String(this.plugin.settings.uiSettings.previewDelay))
          .onChange(async (value) => {
              const num = parseInt(value);
              if (!isNaN(num)) {
                  this.plugin.settings.uiSettings.previewDelay = num;
                  await this.plugin.saveSettings();
              }
          }));

    // Preview Theme
    new Setting(containerEl)
      .setName('Preview Theme')
      .setDesc('Theme for the preview panel')
      .addDropdown(dropdown => dropdown
          .addOptions({
              'auto': 'Auto',
              'light': 'Light',
              'dark': 'Dark'
          })
          .setValue(this.plugin.settings.uiSettings.previewTheme)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.previewTheme = value as 'auto' | 'light' | 'dark';
              await this.plugin.saveSettings();
          }));

    // Preview Font Size
    new Setting(containerEl)
      .setName('Preview Font Size')
      .setDesc('Font size for the preview panel')
      .addSlider(slider => slider
          .setLimits(10, 24, 1)
          .setValue(this.plugin.settings.uiSettings.previewFontSize)
          .setDynamicTooltip()
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.previewFontSize = value;
              await this.plugin.saveSettings();
          }));

    // Preview Line Numbers
    new Setting(containerEl)
      .setName('Show Line Numbers in Preview')
      .setDesc('Display line numbers in the preview panel')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.uiSettings.previewLineNumbers)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.previewLineNumbers = value;
              await this.plugin.saveSettings();
          }));

    // Preview Sync Scroll
    new Setting(containerEl)
      .setName('Sync Scroll with Editor')
      .setDesc('Synchronize scrolling between editor and preview panel')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.uiSettings.previewSyncScroll)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.previewSyncScroll = value;
              await this.plugin.saveSettings();
          }));

    // Preview Show Diff
    new Setting(containerEl)
      .setName('Show Differences in Preview')
      .setDesc('Highlight differences between editor and preview content')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.uiSettings.previewShowDiff)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.previewShowDiff = value;
              await this.plugin.saveSettings();
          }));

    // Error Notifications (UI Settings)
    new Setting(containerEl)
      .setName('Show Error Notifications')
      .setDesc('Display error notifications in the UI')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.uiSettings.showErrorNotifications)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.showErrorNotifications = value;
              await this.plugin.saveSettings();
          }));

    // Warning Notifications (UI Settings)
    new Setting(containerEl)
      .setName('Show Warning Notifications')
      .setDesc('Display warning notifications in the UI')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.uiSettings.showWarningNotifications)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.showWarningNotifications = value;
              await this.plugin.saveSettings();
          }));

    // Inline Error Highlighting
    new Setting(containerEl)
      .setName('Inline Error Highlighting')
      .setDesc('Highlight errors inline within the preview')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.uiSettings.inlineErrorHighlighting)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.inlineErrorHighlighting = value;
              await this.plugin.saveSettings();
          }));

    // Error Highlight Style
    new Setting(containerEl)
      .setName('Error Highlight Style')
      .setDesc('Style of error highlights in the preview')
      .addDropdown(dropdown => dropdown
          .addOptions({
              'underline': 'Underline',
              'background': 'Background',
              'gutter': 'Gutter',
              'squiggly': 'Squiggly',
              'border': 'Border',
              'side-border': 'Side Border'
          })
          .setValue(this.plugin.settings.uiSettings.errorHighlightStyle)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.errorHighlightStyle = value as 
                  'underline' | 'background' | 'gutter' | 'squiggly' | 'border' | 'side-border';
              await this.plugin.saveSettings();
          }));

    // Error Highlight Color
    new Setting(containerEl)
      .setName('Error Highlight Color')
      .setDesc('Color of error highlights in the preview')
      .addDropdown(dropdown => dropdown
          .addOptions({
              'red': 'Red',
              'orange': 'Orange',
              'yellow': 'Yellow'
          })
          .setValue(this.plugin.settings.uiSettings.errorHighlightColor)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.errorHighlightColor = value as 'red' | 'orange' | 'yellow';
              await this.plugin.saveSettings();
          }));

    // Error Notification Duration
    new Setting(containerEl)
      .setName('Error Notification Duration (ms)')
      .setDesc('Duration for error notifications to display (in milliseconds)')
      .addText(text => text
          .setPlaceholder('5000')
          .setValue(String(this.plugin.settings.uiSettings.errorNotificationDuration))
          .onChange(async (value) => {
              const num = parseInt(value);
              if (!isNaN(num)) {
                  this.plugin.settings.uiSettings.errorNotificationDuration = num;
                  await this.plugin.saveSettings();
              }
          }));

    // Error Grouping
    new Setting(containerEl)
      .setName('Error Grouping')
      .setDesc('Strategy for grouping errors in the UI')
      .addDropdown(dropdown => dropdown
          .addOptions({
              'none': 'None',
              'type': 'Type',
              'location': 'Location'
          })
          .setValue(this.plugin.settings.uiSettings.errorGrouping)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.errorGrouping = value as 'none' | 'type' | 'location';
              await this.plugin.saveSettings();
          }));

    // Error Minimum Severity
    new Setting(containerEl)
      .setName('Error Minimum Severity')
      .setDesc('Minimum severity level for errors to be displayed')
      .addDropdown(dropdown => dropdown
          .addOptions({
              'info': 'Info',
              'warning': 'Warning',
              'error': 'Error'
          })
          .setValue(this.plugin.settings.uiSettings.errorMinSeverity)
          .onChange(async (value) => {
              this.plugin.settings.uiSettings.errorMinSeverity = value as 'info' | 'warning' | 'error';
              await this.plugin.saveSettings();
          }));
  }

  private addBatchOperationSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'Batch Operations' });

    // Default Recursive
    new Setting(containerEl)
      .setName('Default Recursive')
      .setDesc('Process folders recursively by default')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.batchOperations.defaultRecursive)
          .onChange(async (value) => {
              this.plugin.settings.batchOperations.defaultRecursive = value;
              await this.plugin.saveSettings();
          }));

    // Default Skip Existing
    new Setting(containerEl)
      .setName('Default Skip Existing')
      .setDesc('Skip files that already have been processed')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.batchOperations.defaultSkipExisting)
          .onChange(async (value) => {
              this.plugin.settings.batchOperations.defaultSkipExisting = value;
              await this.plugin.saveSettings();
          }));

    // Default Create Backups
    new Setting(containerEl)
      .setName('Default Create Backups')
      .setDesc('Create backups before batch operations by default')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.batchOperations.defaultCreateBackups)
          .onChange(async (value) => {
              this.plugin.settings.batchOperations.defaultCreateBackups = value;
              await this.plugin.saveSettings();
          }));

    // Default Notify on Completion
    new Setting(containerEl)
      .setName('Default Notify on Completion')
      .setDesc('Notify when batch operations complete by default')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.batchOperations.defaultNotifyOnCompletion)
          .onChange(async (value) => {
              this.plugin.settings.batchOperations.defaultNotifyOnCompletion = value;
              await this.plugin.saveSettings();
          }));

    // Default Error Threshold
    new Setting(containerEl)
      .setName('Default Error Threshold')
      .setDesc('Maximum allowed error rate before aborting batch operations (e.g., 0.2 for 20%)')
      .addText(text => text
          .setPlaceholder('0.2')
          .setValue(String(this.plugin.settings.batchOperations.defaultErrorThreshold))
          .onChange(async (value) => {
              const num = parseFloat(value);
              if (!isNaN(num) && num >= 0 && num <= 1) {
                  this.plugin.settings.batchOperations.defaultErrorThreshold = num;
                  await this.plugin.saveSettings();
              } else {
                  new Notice('Please enter a valid number between 0 and 1 for the error threshold.');
              }
          }));

    // Auto Save Error Reports
    new Setting(containerEl)
      .setName('Auto Save Error Reports')
      .setDesc('Automatically save error reports after batch operations')
      .addToggle(toggle => toggle
          .setValue(this.plugin.settings.batchOperations.autoSaveErrorReports)
          .onChange(async (value) => {
              this.plugin.settings.batchOperations.autoSaveErrorReports = value;
              await this.plugin.saveSettings();
          }));

    // Error Report Location
    new Setting(containerEl)
      .setName('Error Report Location')
      .setDesc('Path to save error reports (relative to vault)')
      .addText(text => text
          .setPlaceholder('latex-translator/error-reports')
          .setValue(this.plugin.settings.batchOperations.errorReportLocation)
          .onChange(async (value) => {
              this.plugin.settings.batchOperations.errorReportLocation = value;
              await this.plugin.saveSettings();
          }));

    // Max Concurrent Files
    new Setting(containerEl)
      .setName('Max Concurrent Files')
      .setDesc('Maximum number of files to process concurrently')
      .addSlider(slider => slider
          .setLimits(1, 10, 1)
          .setValue(this.plugin.settings.batchOperations.maxConcurrentFiles)
          .setDynamicTooltip()
          .onChange(async (value) => {
              this.plugin.settings.batchOperations.maxConcurrentFiles = value;
              await this.plugin.saveSettings();
          }));

    // Process Delay
    new Setting(containerEl)
      .setName('Process Delay (ms)')
      .setDesc('Delay between processing files in milliseconds')
      .addText(text => text
          .setPlaceholder('100')
          .setValue(String(this.plugin.settings.batchOperations.processDelay))
          .onChange(async (value) => {
              const num = parseInt(value);
              if (!isNaN(num) && num >= 0) {
                  this.plugin.settings.batchOperations.processDelay = num;
                  await this.plugin.saveSettings();
              } else {
                  new Notice('Please enter a valid non-negative number for the process delay.');
              }
          }));

    // Hotkeys
    containerEl.createEl('h4', { text: 'Hotkeys' });

    // Open Batch Modal Hotkey
    new Setting(containerEl)
      .setName('Open Batch Modal')
      .setDesc('Hotkey to open the batch operations modal')
      .addText(text => text
          .setPlaceholder('mod+shift+b')
          .setValue(this.plugin.settings.batchOperations.hotkeys.openBatchModal)
          .onChange(async (value) => {
              this.plugin.settings.batchOperations.hotkeys.openBatchModal = value;
              await this.plugin.saveSettings();
          }));

    // Quick Batch Current Folder Hotkey
    new Setting(containerEl)
      .setName('Quick Batch Current Folder')
      .setDesc('Hotkey to quickly batch process the current folder')
      .addText(text => text
          .setPlaceholder('mod+shift+f')
          .setValue(this.plugin.settings.batchOperations.hotkeys.quickBatchCurrentFolder)
          .onChange(async (value) => {
              this.plugin.settings.batchOperations.hotkeys.quickBatchCurrentFolder = value;
              await this.plugin.saveSettings();
          }));

    // Quick Batch Vault Hotkey
    new Setting(containerEl)
      .setName('Quick Batch Vault')
      .setDesc('Hotkey to quickly batch process the entire vault')
      .addText(text => text
          .setPlaceholder('mod+shift+v')
          .setValue(this.plugin.settings.batchOperations.hotkeys.quickBatchVault)
          .onChange(async (value) => {
              this.plugin.settings.batchOperations.hotkeys.quickBatchVault = value;
              await this.plugin.saveSettings();
          }));
  }
}
