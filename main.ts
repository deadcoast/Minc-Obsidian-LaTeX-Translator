import { 
    App,
    Editor,
    MarkdownView,
    Plugin,
    Setting,
    ItemView,
    WorkspaceLeaf, 
    Notice,
    View,
    addIcon,
    TAbstractFile,
    TFile,
    TFolder,
    Modal
} from 'obsidian';
import { LatexTranslatorSettingsTab } from '@ui/ui_settings/LatexTranslatorSettingsTab';
import LatexParser from '@core/parser/latexParser';
import { LatexTranslatorView } from '@views/LatexTranslatorView';
import { LatexTranslatorSettings } from './src/settings/settings';
import { ILatexTranslatorPlugin } from './src/types';
import { LatexView, LATEX_VIEW_TYPE } from '@views/LatexView';
import { logger } from '@utils/logger';
import { LatexTranslator } from './src/core/translator/LatexTranslator';
import { CommandHistory } from '@core/history/commandHistory';
import { ErrorHandler } from '@core/error/ErrorHandler';
import { BatchOperationSettings } from './src/types/BatchOperationSettings'; // Import the BatchOperationSettings interface


// Default Settings
const DEFAULT_SETTINGS: LatexTranslatorSettings = {
    direction: 'latex-to-obsidian',
    renderImmediately: true,
    useCallouts: true,
    showNotifications: true,
    autoNumberEquations: true,
    
    environmentConversion: {
        enabled: true,
        customMappings: {},
        preserveOriginalOnUnknown: true
    },
    
    labelAndReference: {
        preserveLabels: true,
        removeLabels: false,
        referenceHandling: 'autoNumber',
        customReferenceFormats: {},
        autoNumbering: {
            startEquation: 1,
            startFigure: 1,
            startTable: 1,
            startSection: 1
        }
    },
    
    bracketReplacement: {
        convertDisplayMath: true,
        convertInlineMath: true,
        preserveSingleDollar: true,
        useDoubleBackslash: false
    },
    
    citation: {
        citationEnabled: true,
        defaultFormat: '[%citationKey%]',
        customFormats: {}
    },
    
    advanced: {
        expandMacros: true,
        removeLeftRight: false,
        unifyTextToMathrm: true,
        debugLogging: false
    },

    batch: {
        recursive: true,
        skipExisting: true,
        createBackups: true,
        notifyOnCompletion: true,
        errorThreshold: 5,
        autoSaveErrorReports: true,
        errorReportLocation: 'errors',
        maxConcurrentFiles: 5,
        processDelay: 100,
        hotkeys: {
            openBatchModal: 'Ctrl/Cmd + Shift + B',
            quickBatchCurrentFolder: 'Ctrl/Cmd + Shift + F',
            quickBatchVault: 'Ctrl/Cmd + Shift + V'
        }
    } as BatchOperationSettings, // Update the batch settings type to match the BatchOperationSettings interface

    ui: {
        previewDelay: 1000,
        showErrorNotifications: true,
        showSuccessNotifications: true,
        theme: 'system',
        fontSize: 14,
        lineHeight: 1.5,
        editorWidth: 'medium',
        sidebarLocation: 'right',
        customCSS: '',
        enablePreviewPanel: true,
        previewPanelPosition: 'right',
        autoUpdatePreview: true,
        previewTheme: 'auto',
        previewFontSize: 14,
        previewLineNumbers: true,
        previewSyncScroll: true,
        previewShowDiff: true,
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
        logFilterPresets: []
    },

    debug: {
        logging: false,
        verboseOutput: false,
        saveDebugInfo: false,
        debugInfoLocation: 'debug'
    }
};

// Prompt Modal for Folder Conversion
class PromptModal extends Modal {
    private message: string;
    private resolve: (value: string | null) => void;

    constructor(app: App, message: string, resolve: (value: string | null) => void) {
        super(app);
        this.message = message;
        this.resolve = resolve;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: this.message });

        const input = contentEl.createEl("input", {
            type: "text",
            placeholder: "Enter folder path",
        });

        // Accept input via Enter key or Confirm button
        input.addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                this.resolve(input.value);
                this.close();
            }
        });

        const buttonsDiv = contentEl.createDiv({ cls: 'modal-buttons' });

        const confirmBtn = buttonsDiv.createEl("button", { text: "Confirm" });
        confirmBtn.addEventListener("click", () => {
            this.resolve(input.value);
            this.close();
        });

        const cancelBtn = buttonsDiv.createEl("button", { text: "Cancel" });
        cancelBtn.addEventListener("click", () => {
            this.resolve(null);
            this.close();
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

const isObject = (item: any): item is Record<string, any> =>
    item && typeof item === 'object' && !Array.isArray(item);

export class LatexTranslatorPlugin extends Plugin implements ILatexTranslatorPlugin {
    private translator: LatexTranslator;
    private commandHistory: CommandHistory;
    private errorHandler!: ErrorHandler;
    public parser: LatexParser;
    public settings: LatexTranslatorSettings;
    public activeView: View | null = null;
    public isProcessing = false;

    constructor() {
        super();
        this.settings = { ...DEFAULT_SETTINGS };
        this.parser = new LatexParser();
        this.commandHistory = new CommandHistory();
    }

    /**
     * Activate or reveal a view of the specified type
     * @param viewType The type of view to activate
     */
    async activateView(viewType: string = LATEX_VIEW_TYPE): Promise<void> {
        const leaves = this.app.workspace.getLeavesOfType(viewType);
        
        if (leaves.length > 0) {
            // View already exists, just reveal it
            this.app.workspace.revealLeaf(leaves[0]);
            return;
        }

        // Create new leaf and view
        const leaf = this.app.workspace.getRightLeaf(false);
        if (!leaf) {
            logger.error('Could not create sidebar leaf');
            if (this.settings.showNotifications) {
                new Notice('Error: Could not create view');
            }
            return;
        }

        await leaf.setViewState({
            type: viewType,
            active: true
        });

        this.app.workspace.revealLeaf(leaf);
    }

    async onload() {
        // Initialize error handler
        this.errorHandler = ErrorHandler.getInstance(this.app);
        this.translator = new LatexTranslator(this.settings, this.commandHistory, this.errorHandler);
        logger.info('Loading Latex Translator plugin...');
        
        // Initialize core components
        this.parser = new LatexParser();
        this.commandHistory = new CommandHistory();
        this.errorHandler = new ErrorHandler();
        this.translator = new LatexTranslator(this.settings, this.commandHistory, this.errorHandler);
        
        await this.loadSettings();

        // Configure logger
        logger.setNotifications(this.settings.showNotifications);

        // Add settings tab
        this.addSettingTab(new LatexTranslatorSettingsTab(this.app, this));

        // Register views
        this.registerView(
            LATEX_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => new LatexView(leaf, this)
        );

        this.registerView(
            'latex-translator-view',
            (leaf: WorkspaceLeaf) => new LatexTranslatorView(leaf, this)
        );

        // Initialize views if they don't exist
        if (this.app.workspace.getLeavesOfType(LATEX_VIEW_TYPE).length === 0) {
            await this.activateView(LATEX_VIEW_TYPE);
        }

        if (this.app.workspace.getLeavesOfType('latex-translator-view').length === 0) {
            await this.activateView('latex-translator-view');
        }

        // Add ribbon icon for LaTeX Translator
        // Add ribbon icons for both views
        addIcon('latex-translator', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="currentColor" d="M11 4v2H4v12h14v-6h2v8H2V4h9zm5.364-4L22 5.636l-8 8L8 8l8-8zM16 6.414L14.586 5 10 9.586 11.414 11 16 6.414z"/></svg>`);
        
        const mainRibbonIcon = this.addRibbonIcon('latex-translator', 'LaTeX Translator', () => {
            this.activateView(LATEX_VIEW_TYPE);
        });
        mainRibbonIcon.addClass('latex-translator-ribbon-icon');

        const translatorRibbonIcon = this.addRibbonIcon('latex-translator', 'LaTeX Preview', () => {
            this.activateView('latex-translator-view');
        });
        translatorRibbonIcon.addClass('latex-preview-ribbon-icon');

        // Add commands
        this.addCommand({
            id: 'latex-to-obsidian',
            name: 'Convert LaTeX to Obsidian',
            editorCallback: (editor: Editor) => {
                try {
                    const text = editor.getSelection() || editor.getValue();
                    const converted = this.parser.parse(text, { 
                        direction: 'latex-to-obsidian',
                        preserveLabels: !this.settings.labelAndReference.removeLabels,
                        numberEquations: this.settings.autoNumberEquations
                    });
                    
                    if (editor.getSelection()) {
                        editor.replaceSelection(converted);
                    } else {
                        editor.setValue(converted);
                    }

                    if (this.settings.showNotifications) {
                        new Notice('LaTeX converted successfully!');
                    }
                } catch (error) {
                    logger.error('Error converting LaTeX:', error);
                    if (this.settings.showNotifications) {
                        new Notice('Error converting LaTeX: ' + (error instanceof Error ? error.message : 'Unknown error'));
                    }
                }
            }
        });

        this.addCommand({
            id: 'obsidian-to-latex',
            name: 'Convert Obsidian to LaTeX',
            editorCallback: (editor: Editor) => {
                try {
                    const text = editor.getSelection() || editor.getValue();
                    const converted = this.parser.parse(text, { 
                        direction: 'obsidian-to-latex'
                    });
                    
                    if (editor.getSelection()) {
                        editor.replaceSelection(converted);
                    } else {
                        editor.setValue(converted);
                    }

                    if (this.settings.showNotifications) {
                        new Notice('Obsidian converted to LaTeX successfully!');
                    }
                } catch (error) {
                    logger.error('Error converting to LaTeX:', error);
                    if (this.settings.showNotifications) {
                        new Notice('Error converting to LaTeX: ' + (error instanceof Error ? error.message : 'Unknown error'));
                    }
                }
            }
        });

        this.addCommand({
            id: 'convert-selection-to-obsidian-latex',
            name: 'Convert Selection',
            icon: 'function',
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'L' }],
            editorCallback: (editor: Editor) => {
                const selection = editor.getSelection();
                if (selection) {
                    try {
                        const converted = this.parser.parse(selection, { 
                            direction: 'latex-to-obsidian',
                            preserveLabels: !this.settings.labelAndReference.removeLabels,
                            numberEquations: this.settings.autoNumberEquations
                        });
                        editor.replaceSelection(converted);
                        if (this.settings.showNotifications) {
                            new Notice('LaTeX converted successfully!');
                        }
                    } catch (error) {
                        logger.error('Error converting LaTeX:', error);
                        if (this.settings.showNotifications) {
                            new Notice('Error converting LaTeX: ' + (error instanceof Error ? error.message : 'Unknown error'));
                        }
                    }
                }
            }
        });

        this.addCommand({
            id: 'convert-folder-to-obsidian-latex',
            name: 'Convert Folder',
            icon: 'folder-plus',
            callback: async () => {
                try {
                    const folderPath = await new Promise<string | null>((resolve) => {
                        new PromptModal(
                            this.app,
                            'Enter the folder path to convert:',
                            resolve
                        ).open();
                    });

                    if (!folderPath) {
                        return;
                    }

                    const targetFolder = this.app.vault.getAbstractFileByPath(folderPath);
                    if (!this.isTFolder(targetFolder)) {
                        new Notice('Selected path is not a folder');
                        return;
                    }

                    const files = targetFolder.children
                        .filter((file): file is TFile =>
                            file instanceof TFile && file.extension === 'md'
                        );

                    let successCount = 0;
                    let errorCount = 0;
                    
                    for (const file of files) {
                        try {
                            const content = await this.app.vault.read(file);
                            const converted = this.parser.parse(content, { 
                                direction: 'latex-to-obsidian',
                                preserveLabels: !this.settings.labelAndReference.removeLabels,
                                numberEquations: this.settings.autoNumberEquations
                            });
                            await this.app.vault.modify(file, converted);
                            successCount++;
                        } catch (error) {
                            logger.error(`Error converting file ${file.path}:`, error);
                            errorCount++;
                        }
                    }

                    if (this.settings.showNotifications) {
                        new Notice(
                            `Conversion complete!\n${successCount} files converted successfully.\n${errorCount} files had errors.`
                        );
                    }
                } catch (error) {
                    logger.error('Error in folder conversion:', error);
                    if (this.settings.showNotifications) {
                        new Notice('Error converting folder: ' + (error instanceof Error ? error.message : 'Unknown error'));
                    }
                }
            }
        });

        // Register event handlers
        this.registerEvent(
            this.app.workspace.on('editor-change', (ev: Editor) => {
                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (view) {
                    this.handleEditorChange(ev, view);
                }
            })
        );

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', this.handleActiveLeafChange.bind(this))
        );

        logger.info('Latex Translator plugin loaded successfully');
    }

    /**
     * Consolidated editor operation handler
     */
    private async handleEditorOperation(
        editor: Editor, 
        operation: (text: string) => string
    ) {
        try {
            const selection = editor.getSelection();
            const result = operation(selection || editor.getValue());
            
            if (selection) {
                editor.replaceSelection(result);
            } else {
                editor.setValue(result);
            }

            // Refresh preview if in preview mode
            if (this.isPreviewMode()) {
                await this.refreshPreview();
            }

            if (this.settings.showNotifications) {
                new Notice('Conversion completed successfully!');
            }
        } catch (error) {
            console.error('Error during editor operation:', error);
            if (this.settings.showNotifications) {
                new Notice('Error during conversion: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
        }
    }

    /**
     * Check if current view is in preview mode
     */
    private isPreviewMode(): boolean {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        return view?.getMode() === 'preview';
    }

    /**
     * Refresh the preview pane
     */
    private async refreshPreview() {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view?.previewMode) {
            await view.previewMode.rerender(true);
        }
    }

    /**
     * Handle editor changes for immediate rendering
     */
    private async handleEditorChange(editor: Editor, markdownView: MarkdownView) {
        if (!this.settings.renderImmediately || this.isProcessing) {
            return;
        }

        try {
            this.isProcessing = true;
            const content = editor.getValue();
            const mathContent = this.parser.parse(content, {
                direction: 'latex-to-obsidian',
                preserveLabels: !this.settings.labelAndReference.removeLabels,
                numberEquations: this.settings.autoNumberEquations
            });
            
            editor.setValue(mathContent);
            
            // Only refresh preview if we're in preview mode
            if (markdownView.getMode() === 'preview') {
                await this.refreshPreview();
            }
        } catch (error) {
            logger.error('Error in immediate rendering:', error);
            if (this.settings.showNotifications) {
                new Notice('Error in immediate rendering: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Handle active leaf changes for immediate rendering
     */
    private async handleActiveLeafChange(leaf: WorkspaceLeaf | null) {
        if (!leaf) {
            return;
        }

        const {view} = leaf;
        if (view instanceof MarkdownView && this.settings.renderImmediately) {
            const content = view.editor.getValue();
            const mathContent = this.parser.parse(content, {
                direction: 'latex-to-obsidian',
                preserveLabels: !this.settings.labelAndReference.removeLabels,
                numberEquations: this.settings.autoNumberEquations
            });
            
            view.editor.setValue(mathContent);
            await this.refreshPreview();
        }
    }



    /**
     * Check if a file is a folder
     */
    /**
     * Handle LaTeX to Obsidian conversion
     */
    private async handleLatexToObsidian(editor: Editor): Promise<void> {
        if (this.isProcessing) {
            new Notice('A conversion is already in progress');
            return;
        }

        this.isProcessing = true;
        try {
            const text = editor.getSelection() || editor.getValue();
            const { translatedContent, error } = await this.translator.translateContent(
                text,
                undefined,
                {
                    preserveLabels: !this.settings.labelAndReference.removeLabels,
                    numberEquations: this.settings.autoNumberEquations
                }
            );

            if (error) {
                logger.error('Translation error:', error);
                if (this.settings.showNotifications) {
                    new Notice('Error converting LaTeX: ' + error.lastError?.message);
                }
                return;
            }

            if (editor.getSelection()) {
                editor.replaceSelection(translatedContent);
            } else {
                editor.setValue(translatedContent);
            }

            if (this.settings.showNotifications) {
                new Notice('LaTeX converted successfully!');
            }
        } catch (error) {
            logger.error('Error converting LaTeX:', error);
            if (this.settings.showNotifications) {
                new Notice('Error converting LaTeX: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Handle Obsidian to LaTeX conversion
     */
    private async handleObsidianToLatex(editor: Editor): Promise<void> {
        if (this.isProcessing) {
            new Notice('A conversion is already in progress');
            return;
        }

        this.isProcessing = true;
        try {
            const text = editor.getSelection() || editor.getValue();
            const { translatedContent, error } = await this.translator.translateContent(
                text,
                undefined,
                { direction: 'obsidian-to-latex' }
            );

            if (error) {
                logger.error('Translation error:', error);
                if (this.settings.showNotifications) {
                    new Notice('Error converting to LaTeX: ' + error.lastError?.message);
                }
                return;
            }

            if (editor.getSelection()) {
                editor.replaceSelection(translatedContent);
            } else {
                editor.setValue(translatedContent);
            }

            if (this.settings.showNotifications) {
                new Notice('Converted to LaTeX successfully!');
            }
        } catch (error) {
            logger.error('Error converting to LaTeX:', error);
            if (this.settings.showNotifications) {
                new Notice('Error converting to LaTeX: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
        } finally {
            this.isProcessing = false;
        }
    }

    private isTFolder(file: TAbstractFile | null): file is TFolder {
        return file instanceof TFolder;
    }

    private deepMerge(target: any, source: any): any {
        // If either target or source is not an object, return source
        if (!isObject(target) || !isObject(source)) {
            return source;
        }

        const output = { ...target };
        
        // Ensure all keys from DEFAULT_SETTINGS exist in output
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                // If key doesn't exist in target, initialize it with empty object
                if (!(key in target)) {
                    output[key] = {};
                }
                // Always recursively merge objects
                output[key] = this.deepMerge(target[key], source[key]);
            } else if (Array.isArray(source[key])) {
                // For arrays, create a new array with source values
                output[key] = [...source[key]];
            } else {
                // For primitive values, use source value
                output[key] = source[key];
            }
        });
        
        return output;
    }

    public async loadSettings(): Promise<void> {
        const savedData = await this.loadData() || {};
        
        // Ensure labelAndReference exists and has all required properties
        if (!savedData.labelAndReference) {
            savedData.labelAndReference = DEFAULT_SETTINGS.labelAndReference;
        }
        else if (!savedData.labelAndReference.autoNumbering) {
            savedData.labelAndReference.autoNumbering = DEFAULT_SETTINGS.labelAndReference.autoNumbering;
        }
        
        this.settings = this.deepMerge(DEFAULT_SETTINGS, savedData);
        
        // Update translator settings
        if (this.translator) {
            this.translator = new LatexTranslator(this.settings, this.commandHistory, this.errorHandler);
        }
    }

    public async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
        logger.setNotifications(this.settings.showNotifications);
    }

    public getSettings(): LatexTranslatorSettings {
        return this.settings;
    }

    public setSettings(settings: LatexTranslatorSettings): void {
        this.settings = settings;
        this.saveSettings();
        // Update translator settings
        if (this.translator) {
            this.translator = new LatexTranslator(settings, this.commandHistory, this.errorHandler);
        }
    }

    onunload() {
        logger.info('Unloading Latex Translator plugin...');
        
        // Clean up view
        if (this.activeView) {
            this.app.workspace.detachLeavesOfType(LATEX_VIEW_TYPE);
            this.activeView = null;
        }
    }
}