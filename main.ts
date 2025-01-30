import { 
    App, 
    Editor, 
    MarkdownView, 
    Plugin, 
    Setting, 
    WorkspaceLeaf, 
    Notice, 
    View, 
    ItemView, 
    addIcon,
    TAbstractFile,
    TFile,
    TFolder,
    Modal
} from 'obsidian';
import { LatexTranslatorSettingsTab } from '@ui/ui_settings/LatexTranslatorSettingsTab';
import LatexParser from '@core/parser/latexParser';
import { LatexView, LATEX_VIEW_TYPE } from '@views/LatexView';
import { logger } from '@utils/logger';

// Consolidated Settings Interface
interface LatexTranslatorSettings {
    renderImmediately: boolean;
    useCallouts: boolean;
    autoNumberEquations: boolean;
    preserveLabels: boolean;
    showNotifications: boolean;
    // Add any additional settings from MincLatexSettings here
    // Example:
    // enableAdvancedFeatures: boolean;
}

// Consolidated Default Settings
const DEFAULT_SETTINGS: LatexTranslatorSettings = {
    renderImmediately: true,
    useCallouts: true,
    autoNumberEquations: true,
    preserveLabels: true,
    showNotifications: true,
    // Initialize additional settings here
    // Example:
    // enableAdvancedFeatures: false,
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

export default class LatexTranslatorPlugin extends Plugin {
    private parser!: LatexParser;
    public settings!: LatexTranslatorSettings;
    private activeView: View | null = null;
    private isProcessing = false;

    async onload() {
        logger.info('Loading Latex Translator plugin...');
        
        this.parser = new LatexParser();
        await this.loadSettings();

        // Configure logger
        logger.setNotifications(this.settings.showNotifications);

        // Add settings tab
        this.addSettingTab(new LatexTranslatorSettingsTab(this.app, this));

        // Register custom view
        this.registerView(
            LATEX_VIEW_TYPE,
            (leaf: WorkspaceLeaf) => {
                this.activeView = new LatexView(leaf);
                return this.activeView;
            }
        );

        // Add ribbon icon for LaTeX Translator
        addIcon('latex-translator', `<svg>...</svg>`); // Add your icon SVG here
        const ribbonIcon = this.addRibbonIcon('latex-translator', 'Latex Translator', () => {
            this.activateView();
        });
        ribbonIcon.addClass('latex-translator-ribbon-icon');

        // Add commands
        this.addCommand({
            id: 'latex-to-obsidian',
            name: 'Convert LaTeX to Obsidian',
            editorCallback: (editor: Editor) => {
                this.handleEditorOperation(editor, (text) => 
                    this.parser.parse(text, { 
                        direction: 'latex-to-obsidian',
                        preserveLabels: this.settings.preserveLabels,
                        numberEquations: this.settings.autoNumberEquations
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
                            preserveLabels: this.settings.preserveLabels,
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
                                preserveLabels: this.settings.preserveLabels,
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
            this.app.workspace.on('editor:change', this.handleEditorChange.bind(this))
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
    private async handleEditorChange(editor: Editor, _markdownView: MarkdownView) {
        if (!this.settings.renderImmediately || this.isProcessing) {
            return;
        }

        try {
            this.isProcessing = true;
            const content = editor.getValue();
            const mathContent = this.parser.parse(content, {
                direction: 'latex-to-obsidian',
                preserveLabels: this.settings.preserveLabels,
                numberEquations: this.settings.autoNumberEquations
            });
            
            editor.setValue(mathContent);
            await this.refreshPreview();
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
                preserveLabels: this.settings.preserveLabels,
                numberEquations: this.settings.autoNumberEquations
            });
            
            view.editor.setValue(mathContent);
            await this.refreshPreview();
        }
    }

    /**
     * Activate the custom LaTeX view
     */
    async activateView() {
        try {
            const leaves = this.app.workspace.getLeavesOfType(LATEX_VIEW_TYPE);
            
            if (leaves.length > 0) {
                // View already exists, just reveal it
                this.app.workspace.revealLeaf(leaves[0]);
                return;
            }

            // Create new leaf and view
            const leaf = this.app.workspace.getRightLeaf(false);
            if (!leaf) {
                throw new Error('Could not create sidebar leaf');
            }
            await leaf.setViewState({ type: LATEX_VIEW_TYPE });
            this.app.workspace.revealLeaf(leaf);
        } catch (error) {
            logger.error('Error activating LaTeX Translator view:', error);
            if (this.settings.showNotifications) {
                new Notice('Error opening LaTeX Translator: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
        }
    }

    /**
     * Check if a file is a folder
     */
    private isTFolder(file: TAbstractFile | null): file is TFolder {
        return file instanceof TFolder;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        logger.setNotifications(this.settings.showNotifications);
    }

    getSettings(): LatexTranslatorSettings {
        return this.settings;
    }

    setSettings(settings: LatexTranslatorSettings): void {
        this.settings = settings;
        this.saveSettings();
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
