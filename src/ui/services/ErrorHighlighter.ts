import { Editor, EditorPosition } from 'obsidian';
import { LatexTranslatorSettings } from '../../core/settings/settings';

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
        if (!this.settings.uiSettings.inlineErrorHighlighting) return;
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
                if (!groups.has(key)) groups.set(key, []);
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
        const marker = this.editor.markText(
            error.from,
            error.to,
            {
                className: `${className} latex-translator-error-underline`,
                title: error.message
            }
        );
        this.markers.push(marker);
    }

    private addBackground(error: ErrorRange, className: string): void {
        const marker = this.editor.markText(
            error.from,
            error.to,
            {
                className: `${className} latex-translator-error-background`,
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

    private addSquiggly(error: ErrorRange, className: string): void {
        const marker = this.editor.markText(
            error.from,
            error.to,
            {
                className: `${className} latex-translator-error-squiggly`,
                title: error.message
            }
        );
        this.markers.push(marker);
    }

    private addBorder(error: ErrorRange, className: string): void {
        const marker = this.editor.markText(
            error.from,
            error.to,
            {
                className: `${className} latex-translator-error-border`,
                title: error.message
            }
        );
        this.markers.push(marker);
    }

    private addSideBorder(error: ErrorRange, className: string): void {
        const marker = this.editor.markText(
            error.from,
            error.to,
            {
                className: `${className} latex-translator-error-side-border`,
                title: error.message
            }
        );
        this.markers.push(marker);
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
