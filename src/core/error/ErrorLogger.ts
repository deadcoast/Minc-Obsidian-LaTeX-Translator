import { App, Vault } from 'obsidian';
import { ErrorDetails } from './ErrorHandler';

export class ErrorLogger {
  private readonly LOG_FOLDER = '.latex-translator/logs';
  private readonly MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly MAX_LOG_AGE_DAYS = 7;
  private currentLogFile: string;
  private app: App;

  constructor(app: App) {
    this.app = app;
    this.currentLogFile = this.generateLogFileName();
    this.initializeLogFolder();
  }

  private generateLogFileName(): string {
    const date = new Date();
    return `error_log_${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}.log`;
  }

  private async initializeLogFolder(): Promise<void> {
    const vault = this.getVault();
    try {
      const folderExists = await vault.adapter.exists(this.LOG_FOLDER);
      if (!folderExists) {
        await vault.adapter.mkdir(this.LOG_FOLDER);
      }
      await this.cleanupOldLogs();
    } catch (error) {
      console.error('Failed to initialize log folder:', error);
    }
  }

  private getVault(): Vault {
    return this.app.vault;
  }

  public async log(errorDetails: ErrorDetails): Promise<void> {
    const logEntry = this.formatLogEntry(errorDetails);

    try {
      await this.writeToLog(logEntry);
      await this.rotateLogIfNeeded();
    } catch (error) {
      console.error('Failed to write to error log:', error);
    }
  }

  private formatLogEntry(errorDetails: ErrorDetails): string {
    const timestamp = new Date().toISOString();
    const context = errorDetails.context
      ? JSON.stringify(errorDetails.context)
      : '';

    return (
      [
        `[${timestamp}] ${errorDetails.severity.toUpperCase()} - ${errorDetails.category}`,
        `Message: ${errorDetails.message}`,
        context ? `Context: ${context}` : '',
        errorDetails.stackTrace
          ? `Stack Trace: ${errorDetails.stackTrace}`
          : '',
        errorDetails.suggestions?.length
          ? `Suggestions: ${errorDetails.suggestions.join(', ')}`
          : '',
        '---',
      ]
        .filter(Boolean)
        .join('\n') + '\n'
    );
  }

  private async writeToLog(entry: string): Promise<void> {
    const vault = this.getVault();
    const logPath = `${this.LOG_FOLDER}/${this.currentLogFile}`;

    try {
      const exists = await vault.adapter.exists(logPath);
      if (!exists) {
        await vault.adapter.write(logPath, entry);
      } else {
        const currentContent = await vault.adapter.read(logPath);
        await vault.adapter.write(logPath, currentContent + entry);
      }
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private async rotateLogIfNeeded(): Promise<void> {
    const vault = this.getVault();
    const logPath = `${this.LOG_FOLDER}/${this.currentLogFile}`;

    try {
      const stats = await vault.adapter.stat(logPath);
      if (stats && stats.size > this.MAX_LOG_SIZE) {
        // Create new log file
        this.currentLogFile = this.generateLogFileName();
        // Archive old log
        const archiveName = `${logPath}.${Date.now()}.archive`;
        await vault.adapter.rename(logPath, archiveName);
      }
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    const vault = this.getVault();
    try {
      const files = await vault.adapter.list(this.LOG_FOLDER);
      const now = Date.now();
      const maxAge = this.MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000;

      for (const file of files.files) {
        const stats = await vault.adapter.stat(file);
        if (stats && now - stats.mtime > maxAge) {
          await vault.adapter.remove(file);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  public async getRecentLogs(limit = 100): Promise<string[]> {
    const vault = this.getVault();
    const logPath = `${this.LOG_FOLDER}/${this.currentLogFile}`;

    try {
      const exists = await vault.adapter.exists(logPath);
      if (!exists) {
        return [];
      }

      const content = await vault.adapter.read(logPath);
      return content
        .split('---\n')
        .filter(Boolean)
        .slice(-limit)
        .map((entry) => entry.trim());
    } catch (error) {
      console.error('Failed to read recent logs:', error);
      return [];
    }
  }
}
