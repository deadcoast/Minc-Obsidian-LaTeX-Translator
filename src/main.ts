import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { LatexTranslatorSettingTab } from './ui/settings/LatexTranslatorSettingTab';
import { LatexParser } from './core/parser/latexParser';

interface LatexTranslatorSettings {
    renderImmediately: boolean;
    useCallouts: boolean;
    autoNumberEquations: boolean;
    preserveLabels: boolean;
}

const DEFAULT_SETTINGS: LatexTranslatorSettings = {
    renderImmediately: true,
    useCallouts: true,
    autoNumberEquations: true,
    preserveLabels: true
};

export default class LatexTranslatorPlugin extends Plugin {
    private parser: LatexParser;
    private settings: LatexTranslatorSettings;

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
                        direction: 'latexToObsidian',
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
                        direction: 'obsidianToLatex' 
                    })
                );
            }
        });

        // Register event handlers
        this.registerEvent(
            this.app.workspace.on('editor-change', this.handleEditorChange.bind(this))
        );

        this.registerEvent(
            this.app.workspace.on('active-leaf-change', this.handleActiveLeafChange.bind(this))
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

    private async handleEditorChange(editor: Editor, markdownView: MarkdownView) {
        if (!this.settings.renderImmediately) return;

        const content = editor.getValue();
        const mathContent = this.parser.parse(content, {
            direction: 'latexToObsidian',
            preserveLabels: this.settings.preserveLabels,
            numberEquations: this.settings.autoNumberEquations
        });

        await this.refreshPreview();
    }

    private async handleActiveLeafChange(leaf: WorkspaceLeaf | null) {
        if (!leaf) return;

        const view = leaf.view;
        if (view instanceof MarkdownView && this.settings.renderImmediately) {
            const content = view.editor.getValue();
            const mathContent = this.parser.parse(content, {
                direction: 'latexToObsidian',
                preserveLabels: this.settings.preserveLabels,
                numberEquations: this.settings.autoNumberEquations
            });

            await this.refreshPreview();
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    onunload() {
        // Cleanup
    }
}
