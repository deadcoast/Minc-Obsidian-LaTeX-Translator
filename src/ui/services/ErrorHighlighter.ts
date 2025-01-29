import { Editor, EditorPosition } from 'obsidian';
import { LatexTranslatorSettings } from '../../core/settings/settings';
import { Decoration, EditorView } from '@codemirror/view';
import { StateEffect, RangeSet } from '@codemirror/state';

interface ErrorRange {
    from: EditorPosition;
    to: EditorPosition;
    message: string;
    severity?: string;
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
        if (!this.settings.uiSettings.inlineErrorHighlighting) {
          return;
        }
        this.clearHighlights();

        // Group errors if needed
        let groupedErrors = errors;
        if (this.settings.uiSettings.errorGrouping !== 'none') {
            groupedErrors = this.groupErrors(errors);
        }

        // Filter by severity if needed
        const filteredErrors = groupedErrors.filter(error => 
            this.shouldShowError(error.severity || 'error')
        );

        filteredErrors.forEach(error => {
            const className = this.getErrorClassName(error.severity || 'error');
            
            switch (this.settings.uiSettings.errorHighlightStyle) {
                case 'underline':
                    this.addUnderline(error, className);
                    break;
                case 'background':
                    this.addBackground(error, className);
                    break;
                case 'gutter':
                    this.addGutterMarker(error);
                    break;
                case 'squiggly':
                    this.addSquiggly(error, className);
                    break;
                case 'border':
                    this.addBorder(error, className);
                    break;
                case 'side-border':
                    this.addSideBorder(error, className);
                    break;
            }
        });
    }

    private getErrorClassName(severity: string): string {
        const style = this.settings.uiSettings.errorHighlightStyle;
        const color = this.settings.uiSettings.errorHighlightColor;
        return `latex-translator-error-${style} latex-translator-error-${severity} latex-translator-error-${color}`;
    }

    private shouldShowError(severity: string): boolean {
        const minSeverity = this.settings.uiSettings.errorMinSeverity;
        const severityLevels = ['info', 'warning', 'error'];
        return severityLevels.indexOf(severity) >= severityLevels.indexOf(minSeverity);
    }

    private groupErrors(errors: ErrorRange[]): ErrorRange[] {
        if (this.settings.uiSettings.errorGrouping === 'type') {
            // Group by error type/message
            const groups = new Map<string, ErrorRange[]>();
            errors.forEach(error => {
                const key = error.message;
                if (!groups.has(key)) {
                  groups.set(key, []);
                }
                groups.get(key)?.push(error);
            });

            return Array.from(groups.values()).map(group => ({
                ...group[0],
                message: `${group[0].message} (${group.length} occurrences)`
            }));
        } else if (this.settings.uiSettings.errorGrouping === 'location') {
            // Group by proximity in the document
            const grouped: ErrorRange[] = [];
            let currentGroup: ErrorRange[] = [];

            errors.sort((a, b) => a.from.line - b.from.line).forEach(error => {
                if (currentGroup.length === 0) {
                    currentGroup.push(error);
                } else {
                    const last = currentGroup[currentGroup.length - 1];
                    if (error.from.line - last.to.line <= 1) {
                        currentGroup.push(error);
                    } else {
                        grouped.push(this.mergeErrorGroup(currentGroup));
                        currentGroup = [error];
                    }
                }
            });

            if (currentGroup.length > 0) {
                grouped.push(this.mergeErrorGroup(currentGroup));
            }

            return grouped;
        }

        return errors;
    }

    private mergeErrorGroup(group: ErrorRange[]): ErrorRange {
        return {
            from: group[0].from,
            to: group[group.length - 1].to,
            message: group.map(e => e.message).join('\n'),
            severity: group[0].severity
        };
    }

    private addUnderline(error: ErrorRange, className: string): void {
        const range = {
            from: this.editor.offsetToPos(this.editor.posToOffset(error.from)),
            to: this.editor.offsetToPos(this.editor.posToOffset(error.to))
        };
        
        const decoration = (this.editor as any).cm.decorateRange(range, {
            attributes: {
                class: `${className} latex-translator-error-underline`,
                title: error.message
            }
        });
        
        // Store the decoration for later cleanup
        this.markers.push(decoration);
    }

    private addBackground(error: ErrorRange, className: string): void {
        const range = {
            from: this.editor.offsetToPos(this.editor.posToOffset(error.from)),
            to: this.editor.offsetToPos(this.editor.posToOffset(error.to))
        };
        
        const decoration = (this.editor as any).cm.decorateRange(range, {
            attributes: {
                class: `${className} latex-translator-error-background`,
                title: error.message
            }
        });
        
        // Store the decoration for later cleanup
        this.markers.push(decoration);
    }

    private addGutterMarker(error: ErrorRange): void {
        const marker = document.createElement('div');
        marker.className = 'latex-translator-error-gutter';
        marker.setAttribute('aria-label', error.message);
        marker.innerHTML = '⚠️';

        const gutterMarker = (this.editor as any).cm.setGutterMarker(
            error.from.line,
            'latex-translator-errors',
            marker
        );

        if (gutterMarker) {
            this.gutterMarkers.push(gutterMarker);
        }
    }

    private addSquiggly(error: ErrorRange, className: string): void {
        // @ts-expect-error: Using internal CM6 API
        const view = this.editor.cm as any;
        if (!view) {
          return;
        }

        const decoration = view.state.field(view.state.field.decorations).update({
            add: [{
                from: view.posToOffset(error.from),
                to: view.posToOffset(error.to),
                value: view.Decoration.mark({ class: `${className} latex-translator-error-squiggly` })
            }]
        });
        
        view.dispatch(decoration);
        this.markers.push(decoration);
    }

    private addBorder(error: ErrorRange, className: string): void {
        const view = (this.editor as any).cm;
        if (!view) {
          return;
        }

        const decoration = Decoration.mark({
            class: `${className} latex-translator-error-border`
        }).range(view.state.doc.line(error.from.line + 1).from + error.from.ch,
                 view.state.doc.line(error.to.line + 1).from + error.to.ch);

        view.dispatch({
            effects: StateEffect.appendConfig.of([EditorView.decorations.of(RangeSet.of([decoration]))])
        });
        this.markers.push(decoration);
    }

    private addSideBorder(error: ErrorRange, className: string): void {
        const view = (this.editor as any).cm;
        if (!view) {
            return;
        }

        const decoration = Decoration.mark({
            class: `${className} latex-translator-error-side-border`
        }).range(view.state.doc.line(error.from.line + 1).from + error.from.ch,
                 view.state.doc.line(error.to.line + 1).from + error.to.ch);

        view.dispatch({
            effects: StateEffect.appendConfig.of([EditorView.decorations.of(RangeSet.of([decoration]))])
        });
        this.markers.push(decoration);
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
