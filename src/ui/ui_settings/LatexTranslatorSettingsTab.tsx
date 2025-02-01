import { App, ButtonComponent, Notice, PluginSettingTab, Setting } from 'obsidian';
import { LatexTranslatorSettings, DEFAULT_SETTINGS } from '../../settings/settings';
import { ILatexTranslatorPlugin } from '../../types';
import { logger } from '@utils/logger';
import { validateSettings, validateAndSanitizeFormat, exportSettings, importSettings } from '../../settings/settingsValidation';

export class LatexTranslatorSettingsTab extends PluginSettingTab {
    plugin: ILatexTranslatorPlugin;
    settings: LatexTranslatorSettings;
    private availableSettings: LatexTranslatorSettings & Required<Pick<LatexTranslatorSettings, 'uiSettings'>>;
    
    constructor(app: App, plugin: ILatexTranslatorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        // First load default settings, then override with any existing user settings
        this.settings = { ...DEFAULT_SETTINGS };
        
        // If user has custom settings, apply them
        if (plugin.settings) {
            this.settings = { ...this.settings, ...plugin.settings };
        }

        // These are the available settings that users can modify in the UI:
        this.availableSettings = {
                direction: 'latex-to-obsidian',
                environmentConversion: {
                    enabled: true,
                    customMappings: {},
                    preserveOriginalOnUnknown: true,
                },
                showNotifications: true,
                useCallouts: true,
                renderImmediately: true,
                autoNumberEquations: false,
                bracketReplacement: {
                    convertDisplayMath: true,
                    convertInlineMath: true,
                    preserveSingleDollar: false,
                    useDoubleBackslash: false,
                },
                batchOperations: {
                    recursive: false,
                    skipExisting: true,
                    createBackups: true,
                    notifyOnCompletion: true,
                    errorThreshold: 10,
                    autoSaveErrorReports: false,
                    errorReportLocation: '',
                    maxConcurrentFiles: 5,
                    processDelay: 100,
                    hotkeys: {
                        openBatchModal: '',
                        quickBatchCurrentFolder: '',
                        quickBatchVault: '',
                    }
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
                        startSection: 1,
                    },
                },
                citation: {
                    citationEnabled: true,
                    defaultFormat: '[@$key]',
                    customFormats: {},
                },
                advanced: {
                    expandMacros: true,
                    removeLeftRight: false,
                    unifyTextToMathrm: true,
                    debugLogging: false,
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
                    logExportFormat: 'json',
                    logSearchEnabled: true,
                }
            };
            
        // The availableSettings object above shows all settings that can be modified through the UI

    }

    private addDefaultSettingsReference(containerEl: HTMLElement): void {
        containerEl.createEl('h2', { text: 'Default Settings Reference' });
        const defaultSettingsContainer = containerEl.createEl('details');
        defaultSettingsContainer.createEl('summary', { text: 'Click to view all available settings and their default values' });
        const pre = defaultSettingsContainer.createEl('pre', { cls: 'settings-reference' });
        pre.createEl('code', { text: JSON.stringify(this.availableSettings, null, 2) });
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'LaTeX Translator Settings' });

        this.addEnvironmentSettings(containerEl);
        this.addBracketSettings(containerEl);
        this.addLabelSettings(containerEl);
        this.addCitationSettings(containerEl);
        this.addAdvancedSettings(containerEl);
        this.addBatchOperationSettings(containerEl);
        this.addImportExportSettings(containerEl);
        this.addDefaultSettingsReference(containerEl);

        // UI Settings
        containerEl.createEl('h2', { text: 'UI Settings' });

        // Preview Panel Settings
        new Setting(containerEl)
            .setName('Enable Preview Panel')
            .setDesc('Show a real-time preview panel when converting LaTeX')
            .addToggle(toggle => toggle
                .setValue(this.settings.uiSettings.enablePreviewPanel)
                .onChange(async (value) => {
                    this.settings.uiSettings.enablePreviewPanel = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Preview Panel Position')
            .setDesc('Choose where to display the preview panel')
            .addDropdown(dropdown => dropdown
                .addOption('right', 'Right')
                .addOption('bottom', 'Bottom')
                .setValue(this.settings.uiSettings.previewPanelPosition ?? 'right')
                .onChange(async (value) => {
                    this.settings.uiSettings.previewPanelPosition = value as 'right' | 'bottom';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Auto-Update Preview')
            .setDesc('Automatically update the preview as you type')
            .addToggle(toggle => toggle
                .setValue(this.settings.uiSettings.autoUpdatePreview ?? false)
                .onChange(async (value) => {
                    this.settings.uiSettings.autoUpdatePreview = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Preview Delay')
            .setDesc('Delay in milliseconds before updating the preview (when auto-update is enabled)')
            .addSlider(slider => slider
                .setLimits(100, 2000, 100)
                .setValue(this.settings.uiSettings.previewDelay ?? 500)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.settings.uiSettings.previewDelay = value;
                    await this.plugin.saveSettings();
                }));

        // Error and Warning Display
        containerEl.createEl('h3', { text: 'Error & Warning Display' });

        new Setting(containerEl)
            .setName('Show Error Notifications')
            .setDesc('Display error notifications when conversion fails')
            .addToggle(toggle => toggle
                .setValue(this.settings.uiSettings.showErrorNotifications ?? true)
                .onChange(async (value) => {
                    this.settings.uiSettings.showErrorNotifications = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show Warning Notifications')
            .setDesc('Display warning notifications for potential issues')
            .addToggle(toggle => toggle
                .setValue(this.settings.uiSettings.showWarningNotifications ?? false)
                .onChange(async (value) => {
                    this.settings.uiSettings.showWarningNotifications = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Inline Error Highlighting')
            .setDesc('Highlight errors directly in the editor')
            .addToggle(toggle => toggle
                .setValue(this.settings.uiSettings.inlineErrorHighlighting ?? false)
                .onChange(async (value) => {
                    this.settings.uiSettings.inlineErrorHighlighting = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Error Highlight Style')
            .setDesc('Choose how to highlight errors in the editor')
            .addDropdown(dropdown => dropdown
                .addOption('underline', 'Underline')
                .addOption('background', 'Background')
                .addOption('gutter', 'Gutter Icon')
                .setValue(this.settings.uiSettings.errorHighlightStyle ?? 'underline')
                .onChange(async (value) => {
                    this.settings.uiSettings.errorHighlightStyle = value as 'underline' | 'background' | 'gutter';
                    await this.plugin.saveSettings();
                }));

        // Conversion Logs
        containerEl.createEl('h3', { text: 'Conversion Logs' });

        new Setting(containerEl)
            .setName('Show Conversion Logs')
            .setDesc('Display a panel with conversion logs and errors')
            .addToggle(toggle => toggle
                .setValue(this.settings.uiSettings.showConversionLogs ?? false)
                .onChange(async (value) => {
                    this.settings.uiSettings.showConversionLogs = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Log Detail Level')
            .setDesc('Choose how much information to include in logs')
            .addDropdown(dropdown => dropdown
                .addOption('basic', 'Basic')
                .addOption('detailed', 'Detailed')
                .addOption('debug', 'Debug')
                .setValue(this.settings.uiSettings.logDetailLevel ?? 'basic')
                .onChange(async (value) => {
                    this.settings.uiSettings.logDetailLevel = value as 'basic' | 'detailed' | 'debug';
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Maximum Log Entries')
            .setDesc('Maximum number of log entries to keep')
            .addSlider(slider => slider
                .setLimits(50, 500, 50)
                .setValue(this.settings.uiSettings.maxLogEntries ?? 50)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    this.settings.uiSettings.maxLogEntries = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Auto-Expand Log Entries')
            .setDesc('Automatically expand detailed log entries')
            .addToggle(toggle => toggle
                .setValue(this.settings.uiSettings.autoExpandLogEntries ?? false)
                .onChange(async (value) => {
                    this.settings.uiSettings.autoExpandLogEntries = value;
                    await this.plugin.saveSettings();
                }));

        // Progress Indicators
        containerEl.createEl('h3', { text: 'Progress Indicators' });

        new Setting(containerEl)
            .setName('Show Progress Bar')
            .setDesc('Display a progress bar for batch operations')
            .addToggle(toggle => toggle
                .setValue(this.settings.uiSettings.showProgressBar ?? true)
                .onChange(async (value) => {
                    this.settings.uiSettings.showProgressBar = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show Status Bar Info')
            .setDesc('Display conversion information in the status bar')
            .addToggle(toggle => toggle
                .setValue(this.settings.uiSettings.showStatusBarInfo ?? true)
                .onChange(async (value) => {
                    this.settings.uiSettings.showStatusBarInfo = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show Command Count')
            .setDesc('Display command count in the status bar')
            .addToggle(toggle => toggle
                .setValue(this.settings.uiSettings.showCommandCount ?? false)
                .onChange(async (value) => {
                    this.settings.uiSettings.showCommandCount = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Minimum Batch Size')
            .setDesc('Minimum number of operations to show progress bar')
            .addSlider(slider => slider
                .setLimits(5, 50, 5)
                .setValue(this.settings.uiSettings.minimumBatchSize ?? 5)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.settings.uiSettings.minimumBatchSize = value ?? 5;
                    await this.plugin.saveSettings();
                }));
    }

    private addEnvironmentSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: 'Environment Conversion' });

        new Setting(containerEl)
            .setName('Enable Environment Conversion')
            .setDesc('Convert LaTeX environments to their Obsidian equivalents')
            .addToggle(toggle => toggle
                .setValue(this.settings.environmentConversion.enabled)
                .onChange(async (value) => {
                    this.settings.environmentConversion.enabled = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Preserve Unknown Environments')
            .setDesc('Keep original environment names when no mapping exists')
            .addToggle(toggle => toggle
                .setValue(this.settings.environmentConversion.preserveOriginalOnUnknown)
                .onChange(async (value) => {
                    this.settings.environmentConversion.preserveOriginalOnUnknown = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Custom Environment Mappings')
            .setDesc('Add custom environment mappings (one per line, format: source=target)')
            .addTextArea(text => {
                text.setPlaceholder('theorem=callout-theorem\nproof=callout-proof')
                    .setValue(Object.entries(this.settings.environmentConversion.customMappings)
                        .map(([k, v]) => `${k}=${v}`).join('\n'))
                    .onChange(async (value) => {
                        try {
                            const mappings: Record<string, string> = {};
                            value.split('\n').forEach(line => {
                                const [source, target] = line.trim().split('=');
                                if (source && target) {
                                    const sanitizedSource = source.trim();
                                    const sanitizedTarget = target.trim();
                                    if (/^[a-zA-Z][a-zA-Z0-9*]*$/.test(sanitizedSource) &&
                                        /^[a-zA-Z][a-zA-Z0-9-]*$/.test(sanitizedTarget)) {
                                        mappings[sanitizedSource] = sanitizedTarget;
                                    } else {
                                        new Notice('Invalid environment name format');
                                    }
                                }
                            });
                            this.settings.environmentConversion.customMappings = mappings;
                            await this.plugin.saveSettings();
                        } catch (error) {
                            logger.error('Error parsing custom environment mappings', error);
                            new Notice('Error saving environment mappings');
                        }
                    });
                return text;
            });
    }

    private addBracketSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: 'Math Mode & Brackets' });

        new Setting(containerEl)
            .setName('Convert Display Math')
            .setDesc('Convert \\[...\\] and \\begin{displaymath} to $$...$$')
            .addToggle(toggle => toggle
                .setValue(this.settings.bracketReplacement.convertDisplayMath)
                .onChange(async (value) => {
                    this.settings.bracketReplacement.convertDisplayMath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Convert Inline Math')
            .setDesc('Convert \\(...\\) and \\begin{math} to $...$')
            .addToggle(toggle => toggle
                .setValue(this.settings.bracketReplacement.convertInlineMath)
                .onChange(async (value) => {
                    this.settings.bracketReplacement.convertInlineMath = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Preserve Single Dollar')
            .setDesc('Keep single $ delimiters unchanged')
            .addToggle(toggle => toggle
                .setValue(this.settings.bracketReplacement.preserveSingleDollar)
                .onChange(async (value) => {
                    this.settings.bracketReplacement.preserveSingleDollar = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Use Double Backslash')
            .setDesc('Use \\\\ for newlines in math mode')
            .addToggle(toggle => toggle
                .setValue(this.settings.bracketReplacement.useDoubleBackslash)
                .onChange(async (value) => {
                    this.settings.bracketReplacement.useDoubleBackslash = value;
                    await this.plugin.saveSettings();
                }));
    }

    private addLabelSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: 'Labels & References' });

        new Setting(containerEl)
            .setName('Remove Labels')
            .setDesc('Remove \\label{...} commands from the output')
            .addToggle(toggle => toggle
                .setValue(this.settings.labelAndReference.removeLabels)
                .onChange(async (value) => {
                    this.settings.labelAndReference.removeLabels = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Reference Handling')
            .setDesc('How to handle \\ref and \\eqref commands')
            .addDropdown(dropdown => dropdown
                .addOption('ignore', 'Leave as-is')
                .addOption('placeholder', 'Use placeholders')
                .addOption('autoNumber', 'Auto-number')
                .setValue(this.settings.labelAndReference.referenceHandling)
                .onChange(async (value) => {
                    this.settings.labelAndReference.referenceHandling = value as 'ignore' | 'placeholder' | 'autoNumber';
                    await this.plugin.saveSettings();
                }));

        // Only show auto-numbering settings if auto-number is selected
        if (this.settings.labelAndReference.referenceHandling === 'autoNumber') {
            new Setting(containerEl)
                .setName('Starting Numbers')
                .setDesc('Set starting numbers for auto-numbering')
                .addText(text => text
                    .setPlaceholder('1')
                    .setValue(this.settings.labelAndReference.autoNumbering.startEquation.toString())
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num)) {
                            this.settings.labelAndReference.autoNumbering.startEquation = num;
                            await this.plugin.saveSettings();
                        }
                    }))
                .addText(text => text
                    .setPlaceholder('1')
                    .setValue(this.settings.labelAndReference.autoNumbering.startFigure.toString())
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num)) {
                            this.settings.labelAndReference.autoNumbering.startFigure = num;
                            await this.plugin.saveSettings();
                        }
                    }));
        }
    }

    private addCitationSettings(containerEl: HTMLElement): void {
        // Define allowed placeholders for citation formats
        const allowedPlaceholders = ['key', 'author', 'year', 'title'];

        containerEl.createEl('h3', { text: 'Citations' });

        new Setting(containerEl)
            .setName('Enable Citation Conversion')
            .setDesc('Convert LaTeX citations to Obsidian format')
            .addToggle(toggle => toggle
                .setValue(this.settings.citation.citationEnabled)
                .onChange(async (value) => {
                    this.settings.citation.citationEnabled = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Default Citation Format')
            .setDesc('Format for basic \\cite{} commands. Available placeholders: $key, $author, $year, $title')
            .addText(text => text
                .setPlaceholder('[cite: $key]')
                .setValue(this.settings.citation.defaultFormat)
                .onChange(async (value) => {
                    this.settings.citation.defaultFormat = validateAndSanitizeFormat(value, allowedPlaceholders);
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Custom Citation Formats')
            .setDesc('Add custom citation formats (one per line, format: command=template). Available placeholders: $key, $author, $year, $title')
            .addTextArea(text => text
                .setPlaceholder('citet=$author ($year)\ncitep=[$key]')
                .setValue(Object.entries(this.settings.citation.customFormats)
                    .map(([k, v]) => `${k}=${v}`).join('\n'))
                .onChange(async (value) => {
                    try {
                        const formats: Record<string, string> = {};
                        value.split('\n').forEach(line => {
                            const [cmd, template] = line.trim().split('=');
                            if (cmd && template) {
                                const sanitizedCmd = cmd.trim();
                                const sanitizedTemplate = validateAndSanitizeFormat(template.trim(), allowedPlaceholders);
                                if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(sanitizedCmd)) {
                                    formats[sanitizedCmd] = sanitizedTemplate;
                                } else {
                                    new Notice('Invalid citation command format');
                                }
                            }
                        });
                        this.settings.citation.customFormats = formats;
                        await this.plugin.saveSettings();
                    } catch (error) {
                        logger.error('Error parsing custom citation formats', error);
                        new Notice('Error saving citation formats');
                    }
                }));
    }

    private addAdvancedSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: 'Advanced Settings' });

        new Setting(containerEl)
            .setName('Expand Macros')
            .setDesc('Expand LaTeX macros in the input')
            .addToggle(toggle => toggle
                .setValue(this.settings.advanced.expandMacros)
                .onChange(async (value) => {
                    this.settings.advanced.expandMacros = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Remove \\left and \\right')
            .setDesc('Remove \\left and \\right commands from delimiters')
            .addToggle(toggle => toggle
                .setValue(this.settings.advanced.removeLeftRight)
                .onChange(async (value) => {
                    this.settings.advanced.removeLeftRight = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Unify \\text to \\mathrm')
            .setDesc('Convert \\text{} to \\mathrm{} in math mode')
            .addToggle(toggle => toggle
                .setValue(this.settings.advanced.unifyTextToMathrm)
                .onChange(async (value) => {
                    this.settings.advanced.unifyTextToMathrm = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Debug Logging')
            .setDesc('Enable detailed logging for debugging')
            .addToggle(toggle => toggle
                .setValue(this.settings.advanced.debugLogging)
                .onChange(async (value) => {
                    this.settings.advanced.debugLogging = value;
                    await this.plugin.saveSettings();
                }));
    }

    private addBatchOperationSettings(containerEl: HTMLElement): void {
        const { settings } = this;

        new Setting(containerEl)
            .setName('Batch Operations')
            .setHeading();

        new Setting(containerEl)
            .setName('Recursive Processing')
            .setDesc('Process subfolders by default in batch operations')
            .addToggle(toggle => toggle
                .setValue(settings.batchOperations.recursive)
                .onChange(async value => {
                    settings.batchOperations.recursive = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Skip Existing Translations')
            .setDesc('Skip files that have already been translated')
            .addToggle(toggle => toggle
                .setValue(settings.batchOperations.skipExisting)
                .onChange(async value => {
                    settings.batchOperations.skipExisting = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Create Backups')
            .setDesc('Create backup files before translating')
            .addToggle(toggle => toggle
                .setValue(settings.batchOperations.createBackups)
                .onChange(async value => {
                    settings.batchOperations.createBackups = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show Completion Notification')
            .setDesc('Show a notification when batch processing completes')
            .addToggle(toggle => toggle
                .setValue(settings.batchOperations.notifyOnCompletion)
                .onChange(async value => {
                    settings.batchOperations.notifyOnCompletion = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Error Threshold')
            .setDesc('Stop processing if error rate exceeds this percentage (0-100)')
            .addSlider(slider => slider
                .setLimits(0, 100, 5)
                .setValue(settings.batchOperations.errorThreshold * 100)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    settings.batchOperations.errorThreshold = value / 100;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Auto-save Error Reports')
            .setDesc('Automatically save error reports after batch processing')
            .addToggle(toggle => toggle
                .setValue(settings.batchOperations.autoSaveErrorReports)
                .onChange(async value => {
                    settings.batchOperations.autoSaveErrorReports = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Error Report Location')
            .setDesc('Folder path for error reports (relative to vault root)')
            .addText(text => text
                .setValue(settings.batchOperations.errorReportLocation)
                .onChange(async value => {
                    settings.batchOperations.errorReportLocation = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Max Concurrent Files')
            .setDesc('Maximum number of files to process simultaneously')
            .addSlider(slider => slider
                .setLimits(1, 10, 1)
                .setValue(settings.batchOperations.maxConcurrentFiles)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    settings.batchOperations.maxConcurrentFiles = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Process Delay')
            .setDesc('Delay between processing files (ms)')
            .addSlider(slider => slider
                .setLimits(0, 500, 50)
                .setValue(settings.batchOperations.processDelay)
                .setDynamicTooltip()
                .onChange(async (value: number) => {
                    settings.batchOperations.processDelay = value;
                    await this.plugin.saveSettings();
                }));

        // Hotkeys section
        new Setting(containerEl)
            .setName('Batch Operation Hotkeys')
            .setHeading();

        new Setting(containerEl)
            .setName('Open Batch Modal')
            .setDesc('Hotkey to open the batch operations modal')
            .addText(text => text
                .setValue(settings.batchOperations.hotkeys.openBatchModal)
                .onChange(async value => {
                    settings.batchOperations.hotkeys.openBatchModal = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Quick Batch Current Folder')
            .setDesc('Hotkey to quickly process the current folder')
            .addText(text => text
                .setValue(settings.batchOperations.hotkeys.quickBatchCurrentFolder)
                .onChange(async value => {
                    settings.batchOperations.hotkeys.quickBatchCurrentFolder = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Quick Batch Vault')
            .setDesc('Hotkey to quickly process the entire vault')
            .addText(text => text
                .setValue(settings.batchOperations.hotkeys.quickBatchVault)
                .onChange(async value => {
                    settings.batchOperations.hotkeys.quickBatchVault = value;
                    await this.plugin.saveSettings();
                }));
    }

    private addImportExportSettings(containerEl: HTMLElement): void {
        containerEl.createEl('h3', { text: 'Import/Export Settings' });

        // Export button
        new Setting(containerEl)
            .setName('Export Settings')
            .setDesc('Export your settings to a JSON file')
            .addButton((button: ButtonComponent) => {
                button
                    .setButtonText('Export')
                    .onClick(async () => {
                        try {
                            const json = exportSettings(this.settings);
                            const blob = new Blob([json], { type: 'application/json' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'latex-translator-settings.json';
                            document.body.appendChild(a);
                            a.click();
                            window.URL.revokeObjectURL(url);
                            document.body.removeChild(a);
                            new Notice('Settings exported successfully');
                        } catch (error) {
                            logger.error('Error exporting settings', error);
                            new Notice('Error exporting settings');
                        }
                    });
            });

        // Import interface
        const importSetting = new Setting(containerEl)
            .setName('Import Settings')
            .setDesc('Import settings from a JSON file');

        // Add file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';

        fileInput.addEventListener('change', async () => {
            const file = fileInput.files?.[0];
            if (!file) {
              return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const json = e.target?.result as string;
                    const imported = importSettings(json);
                    
                    // Validate imported settings
                    const validation = validateSettings(imported);
                    
                    if (validation.warnings.length > 0) {
                        new Notice(`Warnings:\n${validation.warnings.join('\n')}`, 5000);
                    }
                    
                    if (validation.isValid) {
                        this.settings = imported;
                        await this.plugin.saveSettings();
                        this.display(); // Refresh settings UI
                        new Notice('Settings imported successfully');
                    } else {
                        new Notice(`Invalid settings:\n${validation.errors.join('\n')}`, 5000);
                    }
                } catch (error) {
                    logger.error('Error importing settings', error);
                    new Notice('Error importing settings');
                }
            };
            reader.readAsText(file);
        });

        containerEl.appendChild(fileInput);

        importSetting.addButton((button: ButtonComponent) => {
            button
                .setButtonText('Import')
                .onClick(() => {
                    fileInput.click();
                });
        });

        // Add validation status
        const validation = validateSettings(this.settings);
        if (validation.warnings.length > 0 || !validation.isValid) {
            const statusContainer = containerEl.createDiv('settings-validation-status');
            
            if (!validation.isValid) {
                statusContainer.createEl('h4', { 
                    text: 'Settings Errors',
                    cls: 'settings-validation-error'
                });
                const errorList = statusContainer.createEl('ul');
                validation.errors.forEach(error => {
                    errorList.createEl('li', { text: error });
                });
            }
            
            if (validation.warnings.length > 0) {
                statusContainer.createEl('h4', { 
                    text: 'Settings Warnings',
                    cls: 'settings-validation-warning'
                });
                const warningList = statusContainer.createEl('ul');
                validation.warnings.forEach(warning => {
                    warningList.createEl('li', { text: warning });
                });
            }
        }
    }
}
