import { ItemView, WorkspaceLeaf, MarkdownRenderer, debounce } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import * as React from 'react';
import { parseLatexToObsidian } from '../../core/parser/latexParser';
import { LatexTranslatorSettings } from '../../core/settings/settings';
import { logger } from '@utils/logger';

export const PREVIEW_VIEW_TYPE = 'latex-translator-preview';

export class PreviewPanel extends ItemView {
    private root: Root | null = null;
    private settings: LatexTranslatorSettings;
    private content: string = '';
    private updateDebounced: () => void;

    constructor(leaf: WorkspaceLeaf, settings: LatexTranslatorSettings) {
        super(leaf);
        this.settings = settings;
        this.updateDebounced = debounce(
            () => this.renderPreview(),
            this.settings.uiSettings.previewDelay
        );
    }

    getViewType(): string {
        return PREVIEW_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'LaTeX Preview';
    }

    async onOpen(): Promise<void> {
        this.root = createRoot(this.containerEl);
        this.renderView();
    }

    async onClose(): Promise<void> {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }

    updateContent(content: string): void {
        this.content = content;
        if (this.settings.uiSettings.autoUpdatePreview) {
            this.updateDebounced();
        }
    }

    private renderView(): void {
        if (!this.root) return;
        this.root.render(
            <PreviewView
                content={this.content}
                settings={this.settings}
                onManualUpdate={() => this.renderPreview()}
            />
        );
    }

    private async renderPreview(): Promise<void> {
        try {
            const converted = await parseLatexToObsidian(this.content, this.settings);
            this.renderView();
        } catch (error) {
            logger.error('Preview rendering error:', error);
            if (this.settings.uiSettings.showErrorNotifications) {
                // Handle error display
            }
        }
    }
}

interface PreviewViewProps {
    content: string;
    settings: LatexTranslatorSettings;
    onManualUpdate: () => void;
}

function PreviewView({ content, settings, onManualUpdate }: PreviewViewProps): React.ReactElement {
    return (
        <div className="latex-translator-preview">
            <div className="preview-header">
                <h3>LaTeX Preview</h3>
                {!settings.uiSettings.autoUpdatePreview && (
                    <button
                        className="mod-cta"
                        onClick={onManualUpdate}
                        aria-label="Update preview"
                    >
                        Update
                    </button>
                )}
            </div>
            <div className="preview-content markdown-preview-view">
                {content ? (
                    <div dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                    <div className="preview-placeholder">
                        Select LaTeX text to see preview
                    </div>
                )}
            </div>
        </div>
    );
}
