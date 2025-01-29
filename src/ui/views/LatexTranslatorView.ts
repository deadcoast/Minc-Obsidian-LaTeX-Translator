import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import * as React from 'react';
import { ReactView } from './ReactView';
import { LATEX_VIEW_TYPE } from '../../main';
import type MincLatexTranslatorPlugin from '../../main';

export class LatexTranslatorView extends ItemView {
    private root: Root | null = null;
    private plugin: MincLatexTranslatorPlugin;

    constructor(leaf: WorkspaceLeaf, plugin: MincLatexTranslatorPlugin) {
        super(leaf);
        this.plugin = plugin;
    }

    getViewType(): string {
        return LATEX_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'LaTeX Translator';
    }

    async onOpen(): Promise<void> {
        // Create the main container
        const container = this.containerEl.children[1];
        container.empty();
        container.createEl('div', { cls: 'latex-translator-container' });

        // Mount React
        this.root = createRoot(container);
        this.root.render(
            React.createElement(ReactView, { 
                app: this.app,
                plugin: this.plugin
            })
        );
    }

    async onClose() {
        // Cleanup React root
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }
}
