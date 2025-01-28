import { Notice } from 'obsidian';

export type LogLevel = 'info' | 'warning' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
    details?: unknown;
}

class Logger {
    private logs: LogEntry[] = [];
    private maxLogs = 100;
    private showNotifications: boolean;

    constructor(showNotifications = true) {
        this.showNotifications = showNotifications;
    }

    log(level: LogLevel, message: string, details?: unknown) {
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date(),
            details
        };

        this.logs.unshift(entry);
        if (this.logs.length > this.maxLogs) {
            this.logs.pop();
        }

        if (this.showNotifications) {
            new Notice(message);
        }

        // Also log to console for debugging
        console.log(`[LaTeX Translator] ${level.toUpperCase()}: ${message}`, details || '');
    }

    info(message: string, details?: unknown) {
        this.log('info', message, details);
    }

    warning(message: string, details?: unknown) {
        this.log('warning', message, details);
    }

    error(message: string, details?: unknown) {
        this.log('error', message, details);
    }

    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    clearLogs() {
        this.logs = [];
    }

    setNotifications(show: boolean) {
        this.showNotifications = show;
    }
}

export const logger = new Logger();