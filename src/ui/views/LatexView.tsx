import * as React from 'react';
import { ItemView, WorkspaceLeaf, App } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { ReactView } from '@views/index';
import { AppContext } from '@core/context';
import { default as LatexTranslatorPlugin } from '../../../main';

export const LATEX_VIEW_TYPE = 'latex-translator-view';

export class LatexView extends ItemView {
  root: Root | null = null;
  app: App;
  plugin: LatexTranslatorPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: LatexTranslatorPlugin) {
    super(leaf);
    this.app = this.leaf.app;
    this.plugin = plugin;
  }

  getViewType(): string {
    return LATEX_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'LaTeX Translator';
  }

  async onOpen(): Promise<void> {
    this.root = createRoot(this.containerEl.children[1]);
    this.root.render(
      <StrictMode>
        <AppContext.Provider value={this.app}>
          <ReactView app={this.app} plugin={this.plugin} />
        </AppContext.Provider>
      </StrictMode>
    );
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
  }
}
