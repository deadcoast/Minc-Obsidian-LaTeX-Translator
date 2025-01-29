import { Editor, EditorPosition } from 'obsidian';
import { LatexTranslatorSettings } from '../../core/settings/settings';

interface ErrorRange {
    from: EditorPosition;
    to: EditorPosition;
    message: string;
}

export class ErrorHighlighter {
    private editor: Editor;
    private settings: LatexTranslatorSettings;
    private markers: any[] = [];
    private gutterMarkers: HTMLElement[] = [];

    constructor(editor: Editor, settings: LatexTranslatorSettings) {
        this.editor = editor;
        this.settings = settings;
    }

    highlight(errors: ErrorRange[]): void {
        if (!this.settings.uiSettings.inlineErrorHighlighting) return;
        this.clearHighlights();

        errors.forEach(error => {
            switch (this.settings.uiSettings.errorHighlightStyle) {
                case 'underline':
                    this.addUnderline(error);
                    break;
                case 'background':
                    this.addBackground(error);
                    break;
                case 'gutter':
                    this.addGutterMarker(error);
                    break;
            }
        });
    }

    private addUnderline(error: ErrorRange): void {
        const marker = this.editor.markText(
            error.from,
            error.to,
            {
                className: 'latex-translator-error-underline',
                title: error.message
            }
        );
        this.markers.push(marker);
    }

    private addBackground(error: ErrorRange): void {
        const marker = this.editor.markText(
            error.from,
            error.to,
            {
                className: 'latex-translator-error-background',
                title: error.message
            }
        );
        this.markers.push(marker);
    }

    private addGutterMarker(error: ErrorRange): void {
        const marker = document.createElement('div');
        marker.className = 'latex-translator-error-gutter';
        marker.setAttribute('aria-label', error.message);
        marker.innerHTML = '⚠️';

        // @ts-expect-error - CM6 API
        const gutterMarker = this.editor.cm.setGutterMarker(
            error.from.line,
            'latex-translator-errors',
            marker
        );

        if (gutterMarker) {
            this.gutterMarkers.push(gutterMarker);
        }
    }

    clearHighlights(): void {
        // Clear text markers
        this.markers.forEach(marker => marker.clear());
        this.markers = [];

        // Clear gutter markers
        this.gutterMarkers.forEach(marker => marker.remove());
        this.gutterMarkers = [];
    }

    destroy(): void {
        this.clearHighlights();
    }
}
