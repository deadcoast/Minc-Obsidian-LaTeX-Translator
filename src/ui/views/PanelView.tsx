import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { basicSetup } from '@codemirror/basic-setup';
import { Notice } from 'obsidian';
import { transformMarkdownToLatex } from '@core/parser';

interface PreviewPanelProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--background-primary);
  color: var(--text-normal);
`;

const EditorContainer = styled.div`
  display: flex;
  flex: 1;
  gap: 1rem;
  padding: 1rem;
  height: calc(100% - 40px);
`;

const EditorPane = styled.div`
  flex: 1;
  border: 1px solid var(--background-modifier-border);
  border-radius: 4px;
  overflow: hidden;
  
  .cm-editor {
    height: 100%;
    .cm-scroller {
      font-family: var(--font-monospace);
    }
  }
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--background-modifier-border);
`;

const Button = styled.button`
  background: var(--interactive-accent);
  color: var(--text-on-accent);
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  
  &:hover {
    background: var(--interactive-accent-hover);
  }
`;

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  initialContent = '',
  onContentChange
}) => {
  const [latexOutput, setLatexOutput] = useState('');
  
  // Refs for the DOM elements
  const sourceEditorDomRef = useRef<HTMLDivElement>(null);
  const outputEditorDomRef = useRef<HTMLDivElement>(null);
  
  // Refs for the EditorView instances
  const sourceEditorRef = useRef<EditorView>();
  const outputEditorRef = useRef<EditorView>();
  
  useEffect(() => {
    // Source editor setup
    const sourceEditorState = EditorState.create({
      doc: initialContent,
      extensions: [
        basicSetup,
        markdown(),
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            const content = update.state.doc.toString();
            try {
              const latex = transformMarkdownToLatex(content);
              setLatexOutput(latex);
              onContentChange?.(content);
              
              // Update output editor
              if (outputEditorRef.current) {
                outputEditorRef.current.dispatch({
                  changes: {
                    from: 0,
                    to: outputEditorRef.current.state.doc.length,
                    insert: latex
                  }
                });
              }
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              new Notice('Error transforming markdown to LaTeX: ' + errorMessage);
            }
          }
        }),
        EditorView.theme({
          '&': {
            height: '100%'
          }
        })
      ]
    });

    // Output editor setup
    const outputEditorState = EditorState.create({
      doc: '',
      extensions: [
        basicSetup,
        EditorState.readOnly.of(true),
        EditorView.theme({
          '&': {
            height: '100%'
          }
        })
      ]
    });

    // Create editors
    if (sourceEditorDomRef.current && outputEditorDomRef.current) {
      const sourceEditor = new EditorView({
        state: sourceEditorState,
        parent: sourceEditorDomRef.current
      });

      const outputEditor = new EditorView({
        state: outputEditorState,
        parent: outputEditorDomRef.current
      });

      sourceEditorRef.current = sourceEditor;
      outputEditorRef.current = outputEditor;

      return () => {
        sourceEditor.destroy();
        outputEditor.destroy();
      };
    }
  }, [initialContent, onContentChange]);

  const handleCopyLatex = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(latexOutput);
      new Notice('LaTeX copied to clipboard!');
    } catch (error) {
      new Notice('Failed to copy to clipboard');
    }
  }, [latexOutput]);

  return (
    <Container>
      <Toolbar>
        <div>LaTeX Preview</div>
        <Button onClick={handleCopyLatex}>Copy LaTeX</Button>
      </Toolbar>
      <EditorContainer>
        <EditorPane ref={sourceEditorDomRef} />
        <EditorPane ref={outputEditorDomRef} />
      </EditorContainer>
    </Container>
  );
};

export default PreviewPanel;