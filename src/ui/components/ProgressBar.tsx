import * as React from 'react';
import { Notice } from 'obsidian';

interface ProgressBarProps {
    progress: number;
    total: number;
    message?: string;
    onCancel?: () => void;
}

export function ProgressBar({ progress, total, message, onCancel }: ProgressBarProps): React.ReactElement {
    const percentage = Math.round((progress / total) * 100);
    
    return (
        <div className="latex-translator-progress">
            <div className="progress-header">
                <span className="progress-message">
                    {message || `Processing ${progress} of ${total}`}
                </span>
                <span className="progress-percentage">
                    {percentage}%
                </span>
            </div>
            <div className="progress-bar-container">
                <div 
                    className="progress-bar" 
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {onCancel && (
                <button 
                    className="progress-cancel"
                    onClick={onCancel}
                    aria-label="Cancel operation"
                >
                    Cancel
                </button>
            )}
        </div>
    );
}

export class GlobalProgress {
    private static notice: Notice | null = null;
    private static container: HTMLElement | null = null;
    private static root: any = null;

    static show(props: ProgressBarProps): void {
        if (this.notice) {
            this.update(props);
            return;
        }

        this.notice = new Notice('', 0);
        this.container = this.notice.noticeEl;
        this.container.addClass('latex-translator-progress-notice');
        
        const progressContainer = this.container.createDiv();
        this.root = (window as any).ReactDOM.createRoot(progressContainer);
        this.root.render(<ProgressBar {...props} />);
    }

    static update(props: ProgressBarProps): void {
        if (!this.root) return;
        this.root.render(<ProgressBar {...props} />);
    }

    static hide(): void {
        if (this.notice) {
            this.notice.hide();
            this.notice = null;
        }
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
        this.container = null;
    }
}
