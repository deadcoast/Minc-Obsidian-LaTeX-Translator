import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import * as React from 'react';
import { LatexTranslatorSettings } from '../../settings/settings';
import { CommandHistory } from '../../core/history/commandHistory';

export const LOGS_VIEW_TYPE = 'latex-translator-logs';

interface LogEntry {
    id: string;
    timestamp: number;
    type: 'info' | 'warning' | 'error';
    message: string;
    details?: string;
    commandId?: string;
}

export class ConversionLogsPanel extends ItemView {
    private root: Root | null = null;
    private settings: LatexTranslatorSettings;
    private history: CommandHistory;
    private logs: LogEntry[] = [];

    constructor(leaf: WorkspaceLeaf, settings: LatexTranslatorSettings, history: CommandHistory) {
        super(leaf);
        this.settings = settings;
        this.history = history;
    }

    getViewType(): string {
        return LOGS_VIEW_TYPE;
    }

    getDisplayText(): string {
        return 'LaTeX Conversion Logs';
    }

    async onOpen(): Promise<void> {
        this.root = createRoot(this.containerEl);
        this.renderView();
    }

    async onClose(): Promise<void> {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }

    addLog(entry: Omit<LogEntry, 'id' | 'timestamp'>): void {
        const newEntry: LogEntry = {
            ...entry,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        };

        this.logs.unshift(newEntry);
        if (this.logs.length > this.settings.uiSettings.maxLogEntries) {
            this.logs.pop();
        }
        this.renderView();
    }

    clearLogs(): void {
        this.logs = [];
        this.renderView();
    }

    private renderView(): void {
        if (!this.root) return;
        this.root.render(
            <LogsView
                logs={this.logs}
                settings={this.settings}
                onClear={() => this.clearLogs()}
            />
        );
    }
}

interface LogsViewProps {
    logs: LogEntry[];
    settings: LatexTranslatorSettings;
    onClear: () => void;
}

function LogsView({ logs, settings, onClear }: LogsViewProps): React.ReactElement {
    const [expandedLogs, setExpandedLogs] = React.useState<Set<string>>(new Set());
    const [filter, setFilter] = React.useState<'all' | 'info' | 'warning' | 'error'>('all');

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedLogs(newExpanded);
    };

    const filteredLogs = logs.filter(log => 
        filter === 'all' || log.type === filter
    );

    return (
        <div className="latex-translator-logs">
            <div className="logs-header">
                <h3>Conversion Logs</h3>
                <div className="logs-controls">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as any)}
                        className="dropdown"
                    >
                        <option value="all">All</option>
                        <option value="info">Info</option>
                        <option value="warning">Warnings</option>
                        <option value="error">Errors</option>
                    </select>
                    <button
                        onClick={onClear}
                        className="mod-warning"
                        aria-label="Clear logs"
                    >
                        Clear
                    </button>
                </div>
            </div>
            <div className="logs-content">
                {filteredLogs.length === 0 ? (
                    <div className="logs-empty">No logs to display</div>
                ) : (
                    filteredLogs.map(log => (
                        <div
                            key={log.id}
                            className={`log-entry ${log.type} ${expandedLogs.has(log.id) ? 'expanded' : ''}`}
                            onClick={() => log.details && toggleExpand(log.id)}
                        >
                            <div className="log-header">
                                <span className="log-timestamp">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                                <span className={`log-type ${log.type}`}>
                                    {log.type.toUpperCase()}
                                </span>
                                <span className="log-message">{log.message}</span>
                                {log.details && (
                                    <span className="log-expand">
                                        {expandedLogs.has(log.id) ? '▼' : '▶'}
                                    </span>
                                )}
                            </div>
                            {log.details && expandedLogs.has(log.id) && (
                                <div className="log-details">
                                    <pre>{log.details}</pre>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
