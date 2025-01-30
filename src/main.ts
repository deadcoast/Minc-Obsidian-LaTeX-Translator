import { Editor, MarkdownView, Plugin, WorkspaceLeaf } from 'obsidian';
import { LatexTranslatorSettingTab } from './ui/ui_settings/LatexTranslatorSettingTab';
import { LatexParser } from './core/parser/latexParser';
import { LatexTranslatorSettings } from './settings/settings';

const DEFAULT_SETTINGS: LatexTranslatorSettings = {
    direction: 'latex-to-obsidian',
    environmentConversion: {
        enabled: true,
        customMappings: {},
        preserveOriginalOnUnknown: true
    },
    showNotifications: true,
    useCallouts: true,
    renderImmediately: true,
    bracketReplacement: {
        convertDisplayMath: true,
        convertInlineMath: true,
        preserveSingleDollar: true,
        useDoubleBackslash: false
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
        enablePreviewPanel: true
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

export class LatexTranslatorPlugin extends Plugin {
    private parser!: LatexParser;
    private settings!: LatexTranslatorSettings;
    private isProcessing = false;

    async onload() {
        this.parser = new LatexParser();
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new LatexTranslatorSettingTab(this.app, this));

        // Add commands
        this.addCommand({
            id: 'latex-to-obsidian',
            name: 'Convert LaTeX to Obsidian',
            editorCallback: (editor: Editor) => {
                this.handleEditorOperation(editor, (text) => 
                    this.parser.parse(text, { 
                        direction: 'latex-to-obsidian',
                        preserveLabels: this.settings.labelAndReference.removeLabels,
                        numberEquations: true
                    })
                );
            }
        });

        this.addCommand({
            id: 'obsidian-to-latex',
            name: 'Convert Obsidian to LaTeX',
            editorCallback: (editor: Editor) => {
                this.handleEditorOperation(editor, (text) => 
                    this.parser.parse(text, { 
                        direction: 'obsidian-to-latex' 
                    })
                );
            }
        });

        // Register event handlers
        this.registerEvent(
            this.app.workspace.on('active-leaf-change', this.handleActiveLeafChange.bind(this))
        );

        // Register editor change event
        this.registerEvent(
            this.app.workspace.on('editor-change', (editor: Editor) => {
                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (view) {
                    this.handleEditorChange(editor, view);
                }
            })
        );
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
        } catch (error) {
            console.error('Error during editor operation:', error);
            // TODO: Add user-friendly error notification
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
        if (this.isProcessing || !this.settings.renderImmediately) {
            return;
        }

        // Only process if we're in a markdown view and not in preview mode
        if (!markdownView || markdownView.getMode() !== 'source') {
            return;
        }

        try {
            this.isProcessing = true;
            const content = editor.getValue();
            
            const mathContent = this.parser.parse(content, {
                direction: 'latex-to-obsidian',
                preserveLabels: !this.settings.labelAndReference.removeLabels,
                numberEquations: true
            });

            // Only update if content has changed
            if (mathContent !== content) {
                editor.setValue(mathContent);
                await this.refreshPreview();
            }
        } finally {
            this.isProcessing = false;
        }
    }

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
                numberEquations: true
            });
            
            view.editor.setValue(mathContent);
            await this.refreshPreview();
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    public getSettings(): LatexTranslatorSettings {
        return this.settings;
    }

    setSettings(settings: LatexTranslatorSettings): void {
        this.settings = settings;
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    onunload() {
        // Cleanup
    }
}
