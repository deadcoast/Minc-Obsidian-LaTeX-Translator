import * as React from 'react';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import styled from 'styled-components';
import { PreviewPanel } from './PanelView';
import { AppProvider } from '../components/AppContext';
import { TransformationControls } from '../components/TransformationControls';
import { ParserOptions } from '../../core/parser';
import { LATEX_VIEW_TYPE } from './LatexView';
import type MincLatexTranslatorPlugin from '../../../main';

const ViewContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

interface ViewContentProps {
  plugin: MincLatexTranslatorPlugin;
}

const ViewContent: React.FC<ViewContentProps> = ({ plugin: _plugin }) => {
  const [parserOptions, setParserOptions] = React.useState<ParserOptions>({
    direction: 'latex-to-obsidian',
    convertEnvironments: true,
    removeLabels: false,
    handleRefs: 'placeholder',
    expandMacros: true,
    convertCitations: false,
    removeLeftRight: false,
    unifyTextToMathrm: false,
  });

  return (
    <ViewContainer>
      <TransformationControls
        options={parserOptions}
        onOptionsChange={setParserOptions}
      />
      <PreviewPanel />
    </ViewContainer>
  );
};

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
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('div', { cls: 'latex-translator-container' });

    this.root = createRoot(container.children[0]);
    this.root.render(
      <React.StrictMode>
        <AppProvider app={this.app}>
          <ViewContent plugin={this.plugin} />
        </AppProvider>
      </React.StrictMode>
    );
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}
