import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { EditorView, ViewUpdate, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap } from '@codemirror/commands';
import {
  syntaxHighlighting,
  defaultHighlightStyle,
} from '@codemirror/language';
import { markdown } from '@codemirror/lang-markdown';
import { Notice } from 'obsidian';
import LatexParser from '@core/parser/latexParser';

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
  onContentChange,
}) => {
  const [latexOutput, setLatexOutput] = useState('');

  // Refs for the DOM elements
  const sourceEditorDomRef = useRef<HTMLDivElement>(null);
  const outputEditorDomRef = useRef<HTMLDivElement>(null);

  // Refs for the EditorView instances
  const sourceEditorRef = useRef<EditorView | null>(null);
  const outputEditorRef = useRef<EditorView | null>(null);

  const latexParser = useRef<LatexParser>(new LatexParser());

  useEffect(() => {
    // Source editor setup
    const sourceEditorState = EditorState.create({
      doc: initialContent,
      extensions: [
        keymap.of(defaultKeymap),
        syntaxHighlighting(defaultHighlightStyle),
        markdown(),
        EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            const content = update.state.doc.toString();
            try {
              const latex = latexParser.current.parseLatexToObsidian(content);
              setLatexOutput(latex);
              onContentChange?.(content);

              // Update output editor
              if (outputEditorRef.current) {
                outputEditorRef.current.dispatch({
                  changes: {
                    from: 0,
                    to: outputEditorRef.current.state.doc.length,
                    insert: latex,
                  },
                });
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              new Notice('Error parsing LaTeX: ' + errorMessage);
            }
          }
        }),
      ],
    });

    // Output editor setup
    const outputEditorState = EditorState.create({
      doc: latexOutput,
      extensions: [
        keymap.of(defaultKeymap),
        syntaxHighlighting(defaultHighlightStyle),
        markdown(),
        EditorView.editable.of(false),
      ],
    });

    if (sourceEditorDomRef.current && outputEditorDomRef.current) {
      sourceEditorRef.current = new EditorView({
        state: sourceEditorState,
        parent: sourceEditorDomRef.current,
      });

      outputEditorRef.current = new EditorView({
        state: outputEditorState,
        parent: outputEditorDomRef.current,
      });
    }

    return (): void => {
      sourceEditorRef.current?.destroy();
      outputEditorRef.current?.destroy();
    };
  }, [initialContent, latexOutput, onContentChange]);

  return (
    <Container>
      <Toolbar>
        <Button
          onClick={(): void => {
            try {
              const content =
                sourceEditorRef.current?.state.doc.toString() || '';
              const latex = latexParser.current.parseLatexToObsidian(content);
              setLatexOutput(latex);
              new Notice('LaTeX converted successfully!');
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              new Notice('Error parsing LaTeX: ' + errorMessage);
            }
          }}
        >
          Convert LaTeX
        </Button>
      </Toolbar>
      <EditorContainer>
        <EditorPane ref={sourceEditorDomRef} />
        <EditorPane ref={outputEditorDomRef} />
      </EditorContainer>
    </Container>
  );
};

export default PreviewPanel;
