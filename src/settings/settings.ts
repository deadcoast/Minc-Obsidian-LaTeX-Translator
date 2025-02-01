import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { default as LatexTranslatorPlugin } from '../../main';
import { ParserOptions } from '../core/parser/latexParser';
import { UISettings } from '../types/UISettings';

// LatexTranslatorSettings.ts

// Import necessary modules or types if required
// import { ... } from '...';

export interface BatchOperationSettings {
  recursive: boolean; // Renamed from defaultRecursive
  skipExisting: boolean; // Renamed from defaultSkipExisting
  createBackups: boolean; // Renamed from defaultCreateBackups
  notifyOnCompletion: boolean; // Renamed from defaultNotifyOnCompletion
  errorThreshold: number; // Renamed from defaultErrorThreshold
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

export interface LatexTranslatorSettings {
  direction: 'latex-to-obsidian' | 'obsidian-to-latex';

  environmentConversion: {
    enabled: boolean;
    customMappings: Record<string, string>;
    preserveOriginalOnUnknown: boolean;
  };

  labelAndReference: {
    removeLabels: boolean;
    preserveLabels: boolean;
    referenceHandling: 'ignore' | 'placeholder' | 'autoNumber' | 'text';
    customReferenceFormats: Record<string, string>;
    autoNumbering: {
      startEquation: number;
      startFigure: number;
      startTable: number;
      startSection: number;
    };
  };

  showNotifications: boolean;
  useCallouts: boolean;
  renderImmediately: boolean;
  autoNumberEquations: boolean;

  // UI Settings
  ui: UISettings;

  bracketReplacement: {
    convertDisplayMath: boolean;
    convertInlineMath: boolean;
    preserveSingleDollar: boolean;
    useDoubleBackslash: boolean;
  };

  citation: {
    citationEnabled: boolean;
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
    previewPanelPosition?: 'right' | 'bottom';
    autoUpdatePreview?: boolean;
    previewDelay?: number;
    previewTheme?: 'auto' | 'light' | 'dark';
    previewFontSize?: number;
    previewLineNumbers?: boolean;
    previewSyncScroll?: boolean;
    previewShowDiff?: boolean;

    showErrorNotifications?: boolean;
    showWarningNotifications?: boolean;
    inlineErrorHighlighting?: boolean;
    errorHighlightStyle?: 'underline' | 'background' | 'gutter' | 'squiggly' | 'border' | 'side-border';
    errorHighlightColor?: 'red' | 'orange' | 'yellow';
    errorNotificationDuration?: number;
    errorGrouping?: 'none' | 'type' | 'location';
    errorMinSeverity?: 'info' | 'warning' | 'error';

    showConversionLogs?: boolean;
    logDetailLevel?: 'basic' | 'detailed' | 'debug' | 'trace' | 'diagnostic';
    maxLogEntries?: number;
    autoExpandLogEntries?: boolean;
    logRetentionDays?: number;
    logExportFormat?: 'text' | 'json' | 'csv';
    logSearchEnabled?: boolean;
    logFilterPresets?: any[];

    showProgressBar?: boolean;
    showStatusBarInfo?: boolean;
    showCommandCount?: boolean;
    minimumBatchSize?: number;
    progressBarStyle?: 'minimal' | 'detailed' | 'circular';
    progressBarPosition?: 'notice' | 'status' | 'floating';
    progressBarTheme?: 'default' | 'colorful' | 'monochrome';
    showEstimatedTime?: boolean;
    showOperationDetails?: boolean;
    batchProgressStrategy?: 'count' | 'size' | 'complexity';

    enableProgressAnimations?: boolean;
    progressAnimationStyle?: 'none' | 'pulse' | 'bounce' | 'slide' | 'fade' | 'rainbow';
    progressAnimationSpeed?: 'slow' | 'normal' | 'fast';
    enableProgressGlow?: boolean;
    showProgressSpinner?: boolean;
    useProgressGradients?: boolean;
    progressCompletionEffect?: 'none' | 'confetti' | 'fade' | 'zoom';

    enableCustomErrorPatterns?: boolean;
    errorPatternStyle?: 'none' | 'dotted' | 'dashed' | 'double' | 'zigzag' | 'striped';
    errorBackgroundOpacity?: number;
    showErrorIcons?: boolean;
    errorIconPosition?: 'left' | 'right' | 'both';
    errorLineHighlight?: boolean;
    errorMarginMarkers?: boolean;
    customErrorColors?: {
      syntax: string;
      semantic: string;
      style: string;
      warning: string;
      info: string;
    };

    enablePreviewFeatures?: boolean;
    previewSplitView?: boolean;
    previewSyncHighlight?: boolean;
    previewAutoScroll?: boolean;
    previewSearchHighlight?: boolean;
    previewCodeFolding?: boolean;
    previewMinimap?: boolean;
    previewWordWrap?: boolean;
    previewLineHeight?: number;
    previewFontFamily?: string;
    customPreviewStyles?: {
      previewStylesEnabled: boolean;
      css: string;
    };

    enableAdvancedLogging?: boolean;
    logCategories?: {
      system: boolean;
      conversion: boolean;
      error: boolean;
      warning: boolean;
      info: boolean;
      debug: boolean;
    };
    logTimestampFormat?: 'none' | 'simple' | 'detailed' | 'relative';
    logColorCoding?: boolean;
    logCollapsibleGroups?: boolean;
    logSearchHistory?: boolean;
    logFilterRules?: {
      filterRulesEnabled: boolean;
      rules: Array<{
        field: string;
        operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex';
        value: string;
        active: boolean;
      }>;
    };
    logExportOptions?: {
      includeMetadata: boolean;
      formatOutput: boolean;
      includeTimestamps: boolean;
      includeStackTraces: boolean;
    };

    enableAdvancedProgressEffects?: boolean;
    progressCompletionEffects?: {
      confetti: boolean;
      sound: boolean;
      vibration: boolean;
      notification: boolean;
      fireworks: boolean;
      sparkles: boolean;
      checkmark: boolean;
    };
    progressEffectStyle?: 'minimal' | 'moderate' | 'elaborate';
    progressSoundEffect?: 'none' | 'ding' | 'chime' | 'success' | 'custom';
    customProgressSound?: string;
    progressVibrationPattern?: number[];
    progressNotificationDuration?: number;
    progressAnimationSequence?: ('fade' | 'scale' | 'slide' | 'spin')[];
    progressParticleEffects?: {
      particleEffectsEnabled: boolean;
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

    enableAdvancedErrorVisualization?: boolean;
    errorVisualizationStyles?: {
      pulsingBackground: boolean;
      gradientUnderline: boolean;
      errorBadges: boolean;
      inlinePreview: boolean;
      miniDiagnostics: boolean;
      contextualHints: boolean;
      smartGrouping: boolean;
      errorDensityMap: boolean;
    };
    errorBadgePosition?: 'inline' | 'margin' | 'floating';
    errorPreviewTrigger?: 'hover' | 'click' | 'auto';
    errorDiagnosticsDisplay?: 'tooltip' | 'panel' | 'inline';
    errorGroupingStrategy?: 'type' | 'severity' | 'location' | 'custom';
    customErrorStyles?: {
      errorStylesEnabled: boolean;
      css: string;
    };
    errorAnimationEffects?: {
      animationEffectsEnabled: boolean;
      duration: number;
      style: 'flash' | 'bounce' | 'shake' | 'custom';
    };

    enableEnhancedPreview?: boolean;
    previewEnhancements?: {
      sideBySideDiff: boolean;
      inlineComments: boolean;
      syntaxHighlighting: boolean;
      imagePreview: boolean;
      mathPreview: boolean;
      tableFormatter: boolean;
      codeBlocks: boolean;
      documentOutline: boolean;
    };
    previewInteractivity?: {
      interactivityEnabled: boolean;
      clickableLinks: boolean;
      editableBlocks: boolean;
      dragAndDrop: boolean;
      contextMenu: boolean;
    };
    previewAutoFormatting?: {
      autoFormattingEnabled: boolean;
      indentation: boolean;
      alignment: boolean;
      spacing: boolean;
      lists: boolean;
    };
    previewCustomizations?: {
      customizationsEnabled: boolean;
      theme: string;
      fontSize: number;
      lineHeight: number;
      fontFamily: string;
      customCSS: string;
    };

    enableAdvancedLoggingSystem?: boolean;
    loggingFeatures?: {
      realTimeFiltering: boolean;
      searchSuggestions: boolean;
      logAnalytics: boolean;
      logVisualization: boolean;
      customViews: boolean;
      automatedReports: boolean;
      logAggregation: boolean;
      smartAlerts: boolean;
    };
    logAnalyticsOptions?: {
      analyticsEnabled: boolean;
      errorTrends: boolean;
      performanceMetrics: boolean;
      userActions: boolean;
      systemEvents: boolean;
    };
    logVisualizationTypes?: {
      visualizationEnabled: boolean;
      timeline: boolean;
      heatmap: boolean;
      errorDistribution: boolean;
      performanceGraphs: boolean;
    };
    logAlertRules?: {
      alertRulesEnabled: boolean;
      rules: Array<{
        condition: string;
        threshold: number;
        action: 'notify' | 'highlight' | 'group' | 'custom';
        priority: 'low' | 'medium' | 'high';
        active: boolean;
      }>;
    };
    logRetentionPolicy?: {
      retentionEnabled: boolean;
      maxEntries: number;
      maxAge: number;
      compressionEnabled: boolean;
      backupEnabled: boolean;
    };
  };

  batch: {
    recursive: boolean;
    skipExisting: boolean;
    createBackups: boolean;
    notifyOnCompletion: boolean;
    errorThreshold: number;
  };

  batchOperations: BatchOperationSettings;
}

export const DEFAULT_SETTINGS: LatexTranslatorSettings = {
  direction: 'latex-to-obsidian',
  
  environmentConversion: {
    enabled: true,
    customMappings: {},
    preserveOriginalOnUnknown: true
  },

  showNotifications: true,
  useCallouts: true,
  renderImmediately: true,
  autoNumberEquations: true,

  bracketReplacement: {
    convertDisplayMath: true,
    convertInlineMath: true,
    preserveSingleDollar: false,
    useDoubleBackslash: false
  },

  labelAndReference: {
    removeLabels: false,
    preserveLabels: true,
    referenceHandling: 'autoNumber',
    customReferenceFormats: {},
    autoNumbering: {
      startEquation: 1,
      startFigure: 1,
      startTable: 1,
      startSection: 1
    }
  },

  citation: {
    citationEnabled: true,
    defaultFormat: '[@$key]',
    customFormats: {}
  },

  advanced: {
    expandMacros: true,
    removeLeftRight: false,
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
    errorHighlightStyle: 'squiggly',
    errorHighlightColor: 'red',
    errorNotificationDuration: 5000,
    errorGrouping: 'type',
    errorMinSeverity: 'warning',

    showConversionLogs: true,
    logDetailLevel: 'detailed',
    maxLogEntries: 1000,
    autoExpandLogEntries: false,
    logRetentionDays: 7,
    logExportFormat: 'text',
    logSearchEnabled: true,
    logFilterPresets: [],

    showProgressBar: true,
    showStatusBarInfo: true,
    showCommandCount: true,
    minimumBatchSize: 10,
    progressBarStyle: 'minimal',
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
    progressCompletionEffect: 'confetti',

    enableCustomErrorPatterns: true,
    errorPatternStyle: 'dotted',
    errorBackgroundOpacity: 0.2,
    showErrorIcons: true,
    errorIconPosition: 'left',
    errorLineHighlight: true,
    errorMarginMarkers: true,
    customErrorColors: {
      syntax: '#000',
      semantic: '#666',
      style: '#999',
      warning: '#ff0',
      info: '#0ff'
    },

    enablePreviewFeatures: true,
    previewSplitView: true,
    previewSyncHighlight: true,
    previewAutoScroll: true,
    previewSearchHighlight: true,
    previewCodeFolding: true,
    previewMinimap: true,
    previewWordWrap: true,
    previewLineHeight: 1.5,
    previewFontFamily: 'monospace',
    customPreviewStyles: {
      previewStylesEnabled: true,
      css: ''
    },

    enableAdvancedLogging: true,
    logCategories: {
      system: true,
      conversion: true,
      error: true,
      warning: true,
      info: true,
      debug: true
    },
    logTimestampFormat: 'simple',
    logColorCoding: true,
    logCollapsibleGroups: true,
    logSearchHistory: true,
    logFilterRules: {
      filterRulesEnabled: true,
      rules: []
    },
    logExportOptions: {
      includeMetadata: true,
      formatOutput: true,
      includeTimestamps: true,
      includeStackTraces: true
    },

    enableAdvancedProgressEffects: true,
    progressCompletionEffects: {
      confetti: true,
      sound: true,
      vibration: true,
      notification: true,
      fireworks: true,
      sparkles: true,
      checkmark: true
    },
    progressEffectStyle: 'moderate',
    progressSoundEffect: 'ding',
    customProgressSound: '',
    progressVibrationPattern: [100, 200, 300],
    progressNotificationDuration: 5000,
    progressAnimationSequence: ['fade', 'scale', 'slide'],
    progressParticleEffects: {
      particleEffectsEnabled: true,
      density: 10,
      speed: 5,
      colors: ['#f00', '#0f0', '#00f'],
      type: 'circle',
      spread: 100,
      particleCount: 100,
      particleSize: 5,
      particleSpeed: 5,
      particleGravity: 0.1,
      particleFriction: 0.9,
      particleRotation: true,
      particleTorque: 0.1,
      particleLifetime: 1000,
      particleBlending: true,
      particleShape: 'circle',
      particleOpacity: 1,
      particleGlow: true,
      particleTrail: true,
      particleTrailLength: 10,
      particleTrailWidth: 2,
      particleTrailColor: '#fff',
      particleTrailOpacity: 1
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
      errorDensityMap: true
    },
    errorBadgePosition: 'inline',
    errorPreviewTrigger: 'hover',
    errorDiagnosticsDisplay: 'tooltip',
    errorGroupingStrategy: 'type',
    customErrorStyles: {
      errorStylesEnabled: true,
      css: ''
    },
    errorAnimationEffects: {
      animationEffectsEnabled: true,
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
      interactivityEnabled: true,
      clickableLinks: true,
      editableBlocks: true,
      dragAndDrop: true,
      contextMenu: true
    },
    previewAutoFormatting: {
      autoFormattingEnabled: true,
      indentation: true,
      alignment: true,
      spacing: true,
      lists: true
    },
    previewCustomizations: {
      customizationsEnabled: true,
      theme: 'light',
      fontSize: 14,
      lineHeight: 1.5,
      fontFamily: 'monospace',
      customCSS: ''
    },

    enableAdvancedLoggingSystem: true,
    loggingFeatures: {
      realTimeFiltering: true,
      searchSuggestions: true,
      logAnalytics: true,
      logVisualization: true,
      customViews: true,
      automatedReports: true,
      logAggregation: true,
      smartAlerts: true
    },
    logAnalyticsOptions: {
      analyticsEnabled: true,
      errorTrends: true,
      performanceMetrics: true,
      userActions: true,
      systemEvents: true
    },
    logVisualizationTypes: {
      visualizationEnabled: true,
      timeline: true,
      heatmap: true,
      errorDistribution: true,
      performanceGraphs: true
    },
    logAlertRules: {
      alertRulesEnabled: true,
      rules: []
    },
    logRetentionPolicy: {
      retentionEnabled: true,
      maxEntries: 1000,
      maxAge: 30,
      compressionEnabled: true,
      backupEnabled: true
    }
  },

  batch: {
    recursive: false,
    skipExisting: true,
    createBackups: true,
    notifyOnCompletion: true,
    errorThreshold: 10,
  },

  batchOperations: {
    recursive: false,
    skipExisting: true,
    createBackups: true,
    notifyOnCompletion: true,
    errorThreshold: 10,
    autoSaveErrorReports: true,
    errorReportLocation: '',
    maxConcurrentFiles: 5,
    processDelay: 100,
    hotkeys: {
      openBatchModal: '',
      quickBatchCurrentFolder: '',
      quickBatchVault: ''
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
    convertCitations: settings.citation.citationEnabled,
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
          .setValue(this.plugin.getSettings().direction || 'latex-to-obsidian')
          .onChange(async (value) => {
              this.plugin.getSettings().direction = value as 'latex-to-obsidian' | 'obsidian-to-latex';
              await this.plugin.saveSettings();
          }));

    // Auto Replace
    new Setting(containerEl)
      .setName('Auto Replace')
      .setDesc('Automatically convert LaTeX when pasting into the editor')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().renderImmediately)
          .onChange(async (value) => {
              this.plugin.getSettings().renderImmediately = value;
              await this.plugin.saveSettings();
          }));

    // Show Notifications
    new Setting(containerEl)
      .setName('Show Notifications')
      .setDesc('Show conversion success/error notifications')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().showNotifications)
          .onChange(async (value) => {
              this.plugin.getSettings().showNotifications = value;
              await this.plugin.saveSettings();
          }));

    // Auto Number Equations
    new Setting(containerEl)
      .setName('Auto Number Equations')
      .setDesc('Automatically number equations')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().autoNumberEquations)
          .onChange(async (value) => {
              this.plugin.getSettings().autoNumberEquations = value;
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
          .setValue(this.plugin.getSettings().environmentConversion.enabled)
          .onChange(async (value) => {
              this.plugin.getSettings().environmentConversion.enabled = value;
              await this.plugin.saveSettings();
          }));

    // Preserve Original on Unknown
    new Setting(containerEl)
      .setName('Preserve Original on Unknown')
      .setDesc('Keep original LaTeX when encountering unknown environments')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().environmentConversion.preserveOriginalOnUnknown)
          .onChange(async (value) => {
              this.plugin.getSettings().environmentConversion.preserveOriginalOnUnknown = value;
              await this.plugin.saveSettings();
          }));

    // Convert Environments
    new Setting(containerEl)
      .setName('Convert Environments')
      .setDesc('Convert LaTeX environments to $$ blocks')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().environmentConversion.enabled)
          .onChange(async (value) => {
              this.plugin.getSettings().environmentConversion.enabled = value;
              await this.plugin.saveSettings();
          }));

    // Extra Environments
    new Setting(containerEl)
      .setName('Extra Environments')
      .setDesc('Additional environment names to treat as display math (comma-separated)')
      .addText(text => text
          .setPlaceholder('matrix, bmatrix, pmatrix')
          .setValue(Object.keys(this.plugin.getSettings().environmentConversion.customMappings).join(', '))
          .onChange(async (value) => {
              const environments = value.split(',').map(env => env.trim()).filter(env => env);
              const customMappings: Record<string, string> = {};
              environments.forEach(env => {
                  customMappings[env] = '$$';
              });
              this.plugin.getSettings().environmentConversion.customMappings = customMappings;
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
              'autoNumber': 'Auto-numbering',
              'text': 'Text'
          })
          .setValue(this.plugin.getSettings().labelAndReference.referenceHandling)
          .onChange(async (value) => {
              this.plugin.getSettings().labelAndReference.referenceHandling = value as 'ignore' | 'placeholder' | 'autoNumber' | 'text';
              await this.plugin.saveSettings();
          }));

    // Remove Labels
    new Setting(containerEl)
      .setName('Remove Labels')
      .setDesc('Remove LaTeX labels during conversion')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().labelAndReference.removeLabels)
          .onChange(async (value) => {
              this.plugin.getSettings().labelAndReference.removeLabels = value;
              await this.plugin.saveSettings();
          }));

    // Preserve Labels
    new Setting(containerEl)
      .setName('Preserve Labels')
      .setDesc('Preserve LaTeX labels during conversion')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().labelAndReference.preserveLabels)
          .onChange(async (value) => {
              this.plugin.getSettings().labelAndReference.preserveLabels = value;
              await this.plugin.saveSettings();
          }));

    // Auto Numbering
    const autoNumberingContainer = containerEl.createDiv();
    new Setting(autoNumberingContainer)
      .setName('Auto Numbering')
      .setDesc('Auto-numbering settings');

    new Setting(autoNumberingContainer)
      .setName('Start Equation')
      .setDesc('Starting number for equations')
      .addText(text => text
        .setPlaceholder('1')
        .setValue(String(this.plugin.getSettings().labelAndReference.autoNumbering.startEquation))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num)) {
            this.plugin.getSettings().labelAndReference.autoNumbering.startEquation = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(autoNumberingContainer)
      .setName('Start Figure')
      .setDesc('Starting number for figures')
      .addText(text => text
        .setPlaceholder('1')
        .setValue(String(this.plugin.getSettings().labelAndReference.autoNumbering.startFigure))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num)) {
            this.plugin.getSettings().labelAndReference.autoNumbering.startFigure = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(autoNumberingContainer)
      .setName('Start Table')
      .setDesc('Starting number for tables')
      .addText(text => text
        .setPlaceholder('1')
        .setValue(String(this.plugin.getSettings().labelAndReference.autoNumbering.startTable))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num)) {
            this.plugin.getSettings().labelAndReference.autoNumbering.startTable = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(autoNumberingContainer)
      .setName('Start Section')
      .setDesc('Starting number for sections')
      .addText(text => text
        .setPlaceholder('1')
        .setValue(String(this.plugin.getSettings().labelAndReference.autoNumbering.startSection))
        .onChange(async (value) => {
          const num = parseInt(value);
          if (!isNaN(num)) {
            this.plugin.getSettings().labelAndReference.autoNumbering.startSection = num;
            await this.plugin.saveSettings();
          }
        }));
  }

  private addCitationSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'Citations' });

    // Enable Citations
    new Setting(containerEl)
      .setName('Enable Citations')
      .setDesc('Enable citation processing')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().citation.citationEnabled)
          .onChange(async (value) => {
              this.plugin.getSettings().citation.citationEnabled = value;
              await this.plugin.saveSettings();
          }));

    // Default Citation Format
    new Setting(containerEl)
      .setName('Default Citation Format')
      .setDesc('Format string for citations')
      .addText(text => text
          .setValue(this.plugin.getSettings().citation.defaultFormat)
          .onChange(async (value) => {
              this.plugin.getSettings().citation.defaultFormat = value;
              await this.plugin.saveSettings();
          }));

    // Convert Citations
    new Setting(containerEl)
      .setName('Convert Citations')
      .setDesc('Convert \\cite commands to Obsidian citations')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().citation.citationEnabled)
          .onChange(async (value) => {
              this.plugin.getSettings().citation.citationEnabled = value;
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
          .setValue(this.plugin.getSettings().advanced.expandMacros)
          .onChange(async (value) => {
              this.plugin.getSettings().advanced.expandMacros = value;
              await this.plugin.saveSettings();
          }));

    // Remove \left and \right
    new Setting(containerEl)
      .setName('Remove \\left and \\right')
      .setDesc('Remove \\left and \\right commands from math expressions')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().advanced.removeLeftRight)
          .onChange(async (value) => {
              this.plugin.getSettings().advanced.removeLeftRight = value;
              await this.plugin.saveSettings();
          }));

    // Unify \text to \mathrm
    new Setting(containerEl)
      .setName('Unify \\text to \\mathrm')
      .setDesc('Convert \\text commands to \\mathrm in math environments')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().advanced.unifyTextToMathrm)
          .onChange(async (value) => {
              this.plugin.getSettings().advanced.unifyTextToMathrm = value;
              await this.plugin.saveSettings();
          }));

    // Debug Logging
    new Setting(containerEl)
      .setName('Debug Logging')
      .setDesc('Enable debug logging for advanced troubleshooting')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().advanced.debugLogging)
          .onChange(async (value) => {
              this.plugin.getSettings().advanced.debugLogging = value;
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
          .setValue(this.plugin.getSettings().uiSettings.enablePreviewPanel)
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.enablePreviewPanel = value;
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
          .setValue(this.plugin.getSettings().uiSettings.previewPanelPosition ?? 'right')
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.previewPanelPosition = value as 'right' | 'bottom';
              await this.plugin.saveSettings();
          }));

    // Auto Update Preview
    new Setting(containerEl)
      .setName('Auto Update Preview')
      .setDesc('Automatically update the preview panel when changes occur')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().uiSettings.autoUpdatePreview ?? false)
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.autoUpdatePreview = value;
              await this.plugin.saveSettings();
          }));

    // Preview Delay
    new Setting(containerEl)
      .setName('Preview Delay (ms)')
      .setDesc('Delay before updating the preview panel (in milliseconds)')
      .addText(text => text
          .setPlaceholder('500')
          .setValue(String(this.plugin.getSettings().uiSettings.previewDelay))
          .onChange(async (value) => {
              const num = parseInt(value);
              if (!isNaN(num)) {
                  this.plugin.getSettings().uiSettings.previewDelay = num;
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
          .setValue(this.plugin.getSettings().uiSettings.previewTheme ?? 'auto')
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.previewTheme = value as 'auto' | 'light' | 'dark';
              await this.plugin.saveSettings();
          }));

    // Preview Font Size
    new Setting(containerEl)
      .setName('Preview Font Size')
      .setDesc('Font size for the preview panel')
      .addSlider(slider => slider
          .setLimits(10, 24, 1)
          .setValue(this.plugin.getSettings().uiSettings.previewFontSize ?? 14)
          .setDynamicTooltip()
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.previewFontSize = value;
              await this.plugin.saveSettings();
          }));

    // Preview Line Numbers
    new Setting(containerEl)
      .setName('Show Line Numbers in Preview')
      .setDesc('Display line numbers in the preview panel')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().uiSettings.previewLineNumbers ?? false)
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.previewLineNumbers = value;
              await this.plugin.saveSettings();
          }));

    // Preview Sync Scroll
    new Setting(containerEl)
      .setName('Sync Scroll with Editor')
      .setDesc('Synchronize scrolling between editor and preview panel')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().uiSettings.previewSyncScroll ?? false)
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.previewSyncScroll = value;
              await this.plugin.saveSettings();
          }));

    // Preview Show Diff
    new Setting(containerEl)
      .setName('Show Differences in Preview')
      .setDesc('Highlight differences between editor and preview content')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().uiSettings.previewShowDiff ?? false)
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.previewShowDiff = value;
              await this.plugin.saveSettings();
          }));

    // Error Notifications (UI Settings)
    new Setting(containerEl)
      .setName('Show Error Notifications')
      .setDesc('Display error notifications in the UI')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().uiSettings.showErrorNotifications ?? false)
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.showErrorNotifications = value;
              await this.plugin.saveSettings();
          }));

    // Warning Notifications (UI Settings)
    new Setting(containerEl)
      .setName('Show Warning Notifications')
      .setDesc('Display warning notifications in the UI')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().uiSettings.showWarningNotifications ?? true)
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.showWarningNotifications = value;
              await this.plugin.saveSettings();
          }));

    // Inline Error Highlighting
    new Setting(containerEl)
      .setName('Inline Error Highlighting')
      .setDesc('Highlight errors inline within the preview')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().uiSettings.inlineErrorHighlighting ?? false)
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.inlineErrorHighlighting = value;
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
          .setValue(this.plugin.getSettings().uiSettings.errorHighlightStyle || 'underline')
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.errorHighlightStyle = value as 
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
          .setValue(this.plugin.getSettings().uiSettings.errorHighlightColor || 'red')
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.errorHighlightColor = value as 'red' | 'orange' | 'yellow';
              await this.plugin.saveSettings();
          }));

    // Error Notification Duration
    new Setting(containerEl)
      .setName('Error Notification Duration (ms)')
      .setDesc('Duration for error notifications to display (in milliseconds)')
      .addText(text => text
          .setPlaceholder('5000')
          .setValue(String(this.plugin.getSettings().uiSettings.errorNotificationDuration))
          .onChange(async (value) => {
              const num = parseInt(value);
              if (!isNaN(num)) {
                  this.plugin.getSettings().uiSettings.errorNotificationDuration = num;
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
          .setValue(this.plugin.getSettings().uiSettings.errorGrouping || 'none')
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.errorGrouping = value as 'none' | 'type' | 'location';
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
          .setValue(this.plugin.getSettings().uiSettings.errorMinSeverity || 'error')
          .onChange(async (value) => {
              this.plugin.getSettings().uiSettings.errorMinSeverity = value as 'info' | 'warning' | 'error';
              await this.plugin.saveSettings();
          }));

    // Auto Expand Log Entries
    new Setting(containerEl)
      .setName('Auto Expand Log Entries')
      .setDesc('Automatically expand log entries')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().uiSettings.autoExpandLogEntries ?? false)
          .onChange(async (value: boolean) => {
              this.plugin.getSettings().uiSettings.autoExpandLogEntries = value;
              await this.plugin.saveSettings();
          }));
  }

  private addBatchOperationSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'Batch Operations' });

    // Recursive
    new Setting(containerEl)
      .setName('Recursive')
      .setDesc('Process folders recursively')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().batchOperations.recursive)
          .onChange(async (value) => {
              this.plugin.getSettings().batchOperations.recursive = value;
              await this.plugin.saveSettings();
          }));

    // Skip Existing
    new Setting(containerEl)
      .setName('Skip Existing')
      .setDesc('Skip files that already have been processed')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().batchOperations.skipExisting)
          .onChange(async (value) => {
              this.plugin.getSettings().batchOperations.skipExisting = value;
              await this.plugin.saveSettings();
          }));

    // Create Backups
    new Setting(containerEl)
      .setName('Create Backups')
      .setDesc('Create backups before batch operations')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().batchOperations.createBackups)
          .onChange(async (value) => {
              this.plugin.getSettings().batchOperations.createBackups = value;
              await this.plugin.saveSettings();
          }));

    // Notify on Completion
    new Setting(containerEl)
      .setName('Notify on Completion')
      .setDesc('Notify when batch operations complete')
      .addToggle(toggle => toggle
          .setValue(this.plugin.getSettings().batchOperations.notifyOnCompletion)
          .onChange(async (value) => {
              this.plugin.getSettings().batchOperations.notifyOnCompletion = value;
              await this.plugin.saveSettings();
          }));

    // Error Threshold
    new Setting(containerEl)
      .setName('Error Threshold')
      .setDesc('Maximum allowed error rate before aborting batch operations (e.g., 0.2 for 20%)')
      .addText(text => text
          .setPlaceholder('0.2')
          .setValue(String(this.plugin.getSettings().batchOperations.errorThreshold))
          .onChange(async (value) => {
              const num = parseFloat(value);
              if (!isNaN(num) && num >= 0 && num <= 1) {
                  this.plugin.getSettings().batchOperations.errorThreshold = num;
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
          .setValue(this.plugin.getSettings().batchOperations.autoSaveErrorReports)
          .onChange(async (value) => {
              this.plugin.getSettings().batchOperations.autoSaveErrorReports = value;
              await this.plugin.saveSettings();
          }));

    // Error Report Location
    new Setting(containerEl)
      .setName('Error Report Location')
      .setDesc('Path to save error reports (relative to vault)')
      .addText(text => text
          .setPlaceholder('latex-translator/error-reports')
          .setValue(this.plugin.getSettings().batchOperations.errorReportLocation)
          .onChange(async (value) => {
              this.plugin.getSettings().batchOperations.errorReportLocation = value;
              await this.plugin.saveSettings();
          }));

    // Max Concurrent Files
    new Setting(containerEl)
      .setName('Max Concurrent Files')
      .setDesc('Maximum number of files to process concurrently')
      .addSlider(slider => slider
          .setLimits(1, 10, 1)
          .setValue(this.plugin.getSettings().batchOperations.maxConcurrentFiles)
          .setDynamicTooltip()
          .onChange(async (value) => {
              this.plugin.getSettings().batchOperations.maxConcurrentFiles = value;
              await this.plugin.saveSettings();
          }));

    // Process Delay
    new Setting(containerEl)
      .setName('Process Delay (ms)')
      .setDesc('Delay between processing files in milliseconds')
      .addText(text => text
          .setPlaceholder('100')
          .setValue(String(this.plugin.getSettings().batchOperations.processDelay))
          .onChange(async (value) => {
              const num = parseInt(value);
              if (!isNaN(num) && num >= 0) {
                  this.plugin.getSettings().batchOperations.processDelay = num;
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
          .setValue(this.plugin.getSettings().batchOperations.hotkeys.openBatchModal)
          .onChange(async (value) => {
              this.plugin.getSettings().batchOperations.hotkeys.openBatchModal = value;
              await this.plugin.saveSettings();
          }));

    // Quick Batch Current Folder Hotkey
    new Setting(containerEl)
      .setName('Quick Batch Current Folder')
      .setDesc('Hotkey to quickly batch process the current folder')
      .addText(text => text
          .setPlaceholder('mod+shift+f')
          .setValue(this.plugin.getSettings().batchOperations.hotkeys.quickBatchCurrentFolder)
          .onChange(async (value) => {
              this.plugin.getSettings().batchOperations.hotkeys.quickBatchCurrentFolder = value;
              await this.plugin.saveSettings();
          }));

    // Quick Batch Vault Hotkey
    new Setting(containerEl)
      .setName('Quick Batch Vault')
      .setDesc('Hotkey to quickly batch process the entire vault')
      .addText(text => text
          .setPlaceholder('mod+shift+v')
          .setValue(this.plugin.getSettings().batchOperations.hotkeys.quickBatchVault)
          .onChange(async (value) => {
              this.plugin.getSettings().batchOperations.hotkeys.quickBatchVault = value;
              await this.plugin.saveSettings();
          }));
  }
}
