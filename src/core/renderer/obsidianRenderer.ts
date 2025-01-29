import { App, MarkdownView, MarkdownRenderer } from 'obsidian';
import { OBSIDIAN_THEOREM_CALLOUTS, OBSIDIAN_MATH_DELIMITERS, ObsidianMathConfig, DEFAULT_OBSIDIAN_CONFIG } from '../parser/constants';
import { logger } from '../../utils/logger';

export class ObsidianRenderer {
    private app: App;
    private config: ObsidianMathConfig;

    constructor(app: App, config: Partial<ObsidianMathConfig> = {}) {
        this.app = app;
        this.config = { ...DEFAULT_OBSIDIAN_CONFIG, ...config };
    }

    /**
     * Get the current editor mode
     */
    public getEditorMode(): 'source' | 'preview' {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        return view?.getMode() || 'source';
    }

    /**
     * Convert LaTeX theorem environment to Obsidian callout
     */
    public theoremToCallout(type: string, title: string, content: string): string {
        const callout = OBSIDIAN_THEOREM_CALLOUTS[type.toLowerCase()] || OBSIDIAN_THEOREM_CALLOUTS['theorem'];
        return `> [!${callout.type}]${callout.icon} ${title}\n> ${content.replace(/\n/g, '\n> ')}`;
    }

    /**
     * Render math content in preview mode
     */
    public async renderMathPreview(element: HTMLElement, content: string): Promise<void> {
        try {
            await MarkdownRenderer.renderMath(content, element, true);
        } catch (error) {
            logger.error('Error rendering math preview:', error);
            element.textContent = content;
        }
    }

    /**
     * Process math content based on editor mode
     */
    public processMathContent(content: string, isDisplay: boolean = false): string {
        const delimiters = isDisplay ? OBSIDIAN_MATH_DELIMITERS.display : OBSIDIAN_MATH_DELIMITERS.inline;
        
        if (this.getEditorMode() === 'source') {
            return `${delimiters.start}${content}${delimiters.end}`;
        }

        // In preview mode, we'll let Obsidian's MathJax renderer handle it
        return content;
    }

    /**
     * Process theorem environment based on configuration
     */
    public processTheorem(type: string, title: string, content: string): string {
        if (this.config.useCallouts) {
            return this.theoremToCallout(type, title, content);
        }

        // Fallback to standard LaTeX-style formatting
        return `**${type.toUpperCase()}** (${title})\n${content}`;
    }

    /**
     * Update math preview in the editor
     */
    public async updateMathPreview(view: MarkdownView, content: string): Promise<void> {
        if (!this.config.renderImmediately || this.getEditorMode() !== 'preview') {
            return;
        }

        const previewEl = view.previewMode?.containerEl.querySelector('.markdown-preview-view');
        if (!previewEl) return;

        const mathEl = document.createElement('div');
        mathEl.className = 'math-preview';
        await this.renderMathPreview(mathEl, content);
        
        // Replace existing preview or append new one
        const existingPreview = previewEl.querySelector('.math-preview');
        if (existingPreview) {
            existingPreview.replaceWith(mathEl);
        } else {
            previewEl.appendChild(mathEl);
        }
    }

    /**
     * Check if MathJax is ready in Obsidian
     */
    public isMathJaxReady(): boolean {
        return !!(window as any).MathJax?.typeset;
    }

    /**
     * Force MathJax rerender
     */
    public async rerenderMathJax(): Promise<void> {
        if (this.isMathJaxReady()) {
            (window as any).MathJax.typeset();
        }
    }
}
