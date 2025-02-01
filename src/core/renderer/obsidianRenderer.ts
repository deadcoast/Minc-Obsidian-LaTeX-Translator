import { App, MarkdownView, MarkdownRenderer, Component } from 'obsidian';
import {
  OBSIDIAN_THEOREM_CALLOUTS,
  MATH_DELIMITERS,
  ObsidianMathConfig,
  DEFAULT_OBSIDIAN_CONFIG,
} from '../parser/constants';
import { logger } from '../../utils/logger';

export class ObsidianRenderer extends Component {
  private app: App;
  private config: ObsidianMathConfig;

  constructor(app: App, config: Partial<ObsidianMathConfig> = {}) {
    super();
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
  public theoremToCallout(
    type: string,
    title: string,
    content: string
  ): string {
    const calloutType =
      type.toLowerCase() as keyof typeof OBSIDIAN_THEOREM_CALLOUTS;
    const callout =
      OBSIDIAN_THEOREM_CALLOUTS[calloutType] ||
      OBSIDIAN_THEOREM_CALLOUTS['theorem'];
    return `> [!${callout}] ${title}\n> ${content.replace(/\n/g, '\n> ')}`;
  }

  /**
   * Render math content in preview mode
   */
  public async renderMathPreview(
    element: HTMLElement,
    content: string,
    isInline: boolean
  ): Promise<void> {
    try {
      const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
      await MarkdownRenderer.renderMarkdown(
        isInline ? `$${content}$` : `$$${content}$$`,
        element,
        activeView?.file?.path || '',
        activeView || this
      );
    } catch (error) {
      logger.error('Error rendering math preview:', error);
      element.textContent = content;
    }
  }

  /**
   * Process math content based on editor mode
   */
  public processMathContent(content: string, isDisplay = false): string {
    const delimiters = isDisplay
      ? MATH_DELIMITERS.DISPLAY
      : MATH_DELIMITERS.INLINE;

    if (this.getEditorMode() === 'source') {
      // Use the first delimiter pair from the array for wrapping
      const [, wrapperDelimiter] = delimiters[0];
      return `${wrapperDelimiter}${content}${wrapperDelimiter}`;
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
  public async updateMathPreview(
    view: MarkdownView,
    content: string
  ): Promise<void> {
    if (!this.config.renderImmediately || this.getEditorMode() !== 'preview') {
      return;
    }

    const previewEl = view.previewMode?.containerEl.querySelector(
      '.markdown-preview-view'
    );
    if (!previewEl) {
      return;
    }

    const mathEl = document.createElement('div');
    mathEl.className = 'math-preview';
    await this.renderMathPreview(mathEl, content, false);

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
    interface MathJaxWindow extends Window {
      MathJax?: {
        typeset: () => void;
      };
    }
    return !!(window as MathJaxWindow).MathJax?.typeset;
  }

  /**
   * Force MathJax rerender
   */
  public async rerenderMathJax(): Promise<void> {
    if (this.isMathJaxReady()) {
      (window as MathJaxWindow).MathJax?.typeset();
    }
  }
}
