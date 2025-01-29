import React from 'react';
import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import styled from 'styled-components';
import { PreviewPanel } from './PanelView';
import { AppProvider } from '../components/AppContext';
import { TransformationControls } from '../components/TransformationControls';
import { ParserOptions } from '../../core/parser';

export const LATEX_VIEW_TYPE = 'latex-translator-view';

const ViewContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
`;

interface ViewContentProps {
}

const ViewContent: React.FC<ViewContentProps> = () => {
  const [parserOptions, setParserOptions] = React.useState<ParserOptions>({
    convertEnvironments: true,
    removeLabels: false,
    handleRefs: 'ignore',
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

export default class LatexTranslatorView extends ItemView {
  root: Root | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
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
        <AppProvider app={(this.app as any)}>
          <ViewContent />
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
