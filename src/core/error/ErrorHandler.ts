import { Notice } from 'obsidian';
import { ErrorReport } from './ErrorReport';
import { ErrorLogger } from './ErrorLogger';
import { ErrorRecovery } from './ErrorRecovery';
import { App } from 'obsidian';

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  SYNTAX = 'syntax',
  VALIDATION = 'validation',
  PARSING = 'parsing',
  CONVERSION = 'conversion',
  FILE_SYSTEM = 'file_system',
  NETWORK = 'network',
  CONFIGURATION = 'configuration',
  RUNTIME = 'runtime',
}

export interface ErrorContext {
  file?: string;
  line?: number;
  column?: number;
  code?: string;
  latexCommand?: string;
  markdownElement?: string;
  content?: string; // The content being processed when the error occurred
  commandId?: string; // The ID of the command that caused the error
  timestamp?: Date; // When the error occurred
  relatedFiles?: string[];
}

export interface ErrorDetails {
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: ErrorContext;
  timestamp: Date;
  stackTrace?: string;
  suggestions?: string[];
  recoverySteps?: string[];
}

export class ErrorHandler {
  private static instance: ErrorHandler;
  private logger: ErrorLogger;
  private recovery: ErrorRecovery;
  private errorCount: Map<ErrorCategory, number> = new Map();
  private lastError?: ErrorDetails;

  private constructor(app: App) {
    this.logger = new ErrorLogger(app);
    this.recovery = new ErrorRecovery();
    this.initializeErrorCounts();
  }

  public static getInstance(app: App): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(app);
    }
    return ErrorHandler.instance;
  }

  private initializeErrorCounts(): void {
    Object.values(ErrorCategory).forEach((category: ErrorCategory) => {
      this.errorCount.set(category, 0);
    });
  }

  public handleError(
    error: Error | string,
    context?: ErrorContext
  ): ErrorDetails {
    const errorDetails = this.createErrorDetails(error, context);

    // Log the error
    this.logger.log(errorDetails);

    // Update error statistics
    this.updateErrorStats(errorDetails);

    // Show visual notification based on severity
    this.showNotification(errorDetails);

    // Generate recovery suggestions
    const suggestions = this.recovery.getSuggestions(errorDetails);
    errorDetails.suggestions = suggestions;

    // Store as last error
    this.lastError = errorDetails;

    return errorDetails;
  }

  private createErrorDetails(
    error: Error | string,
    context?: ErrorContext
  ): ErrorDetails {
    const isErrorObject = error instanceof Error;
    const message = isErrorObject ? error.message : error;
    const stackTrace = isErrorObject ? error.stack : new Error().stack;

    // Analyze error to determine severity and category
    const { severity, category } = this.analyzeError(message, context);

    return {
      message,
      severity,
      category,
      context,
      timestamp: new Date(),
      stackTrace,
      suggestions: [],
      recoverySteps: this.recovery.getRecoverySteps(category, message),
    };
  }

  private analyzeError(
    message: string,
    context?: ErrorContext
  ): { severity: ErrorSeverity; category: ErrorCategory } {
    // Default values
    let severity = ErrorSeverity.ERROR;
    let category = ErrorCategory.RUNTIME;

    // Determine severity based on message content and context
    if (
      message.toLowerCase().includes('critical') ||
      message.toLowerCase().includes('fatal')
    ) {
      severity = ErrorSeverity.CRITICAL;
    } else if (message.toLowerCase().includes('warning')) {
      severity = ErrorSeverity.WARNING;
    } else if (message.toLowerCase().includes('info')) {
      severity = ErrorSeverity.INFO;
    }

    // Determine category based on context and message
    if (context?.latexCommand) {
      category = ErrorCategory.SYNTAX;
    } else if (message.includes('parse') || message.includes('parsing')) {
      category = ErrorCategory.PARSING;
    } else if (message.includes('convert') || message.includes('conversion')) {
      category = ErrorCategory.CONVERSION;
    } else if (message.includes('file') || message.includes('directory')) {
      category = ErrorCategory.FILE_SYSTEM;
    } else if (message.includes('network') || message.includes('connection')) {
      category = ErrorCategory.NETWORK;
    } else if (message.includes('config') || message.includes('setting')) {
      category = ErrorCategory.CONFIGURATION;
    }

    return { severity, category };
  }

  private updateErrorStats(error: ErrorDetails): void {
    const currentCount = this.errorCount.get(error.category) || 0;
    this.errorCount.set(error.category, currentCount + 1);
  }

  private showNotification(error: ErrorDetails): void {
    const duration = this.getNotificationDuration(error.severity);
    const message = this.formatNotificationMessage(error);

    new Notice(message, duration);
  }

  private getNotificationDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 10000; // 10 seconds
      case ErrorSeverity.ERROR:
        return 7000; // 7 seconds
      case ErrorSeverity.WARNING:
        return 5000; // 5 seconds
      case ErrorSeverity.INFO:
        return 3000; // 3 seconds
      default:
        return 5000;
    }
  }

  private formatNotificationMessage(error: ErrorDetails): string {
    let message = `${error.severity.toUpperCase()}: ${error.message}`;

    if (error.context?.file) {
      message += `\nFile: ${error.context.file}`;
    }

    if (error.context?.line) {
      message += `\nLine: ${error.context.line}`;
    }

    if (error.suggestions && error.suggestions.length > 0) {
      message += `\nSuggestion: ${error.suggestions[0]}`;
    }

    return message;
  }

  public getErrorStats(): Map<ErrorCategory, number> {
    return new Map(this.errorCount);
  }

  public getLastError(): ErrorDetails | undefined {
    return this.lastError;
  }

  public clearErrorStats(): void {
    this.initializeErrorCounts();
    this.lastError = undefined;
  }

  public async generateErrorReport(): Promise<ErrorReport> {
    return {
      timestamp: new Date().toISOString(),
      totalErrors: Array.from(this.errorCount.values()).reduce(
        (a, b) => a + b,
        0
      ),
      errorsByCategory: Object.fromEntries(this.errorCount),
      lastError: this.lastError,
      logEntries: await this.logger.getRecentLogs(100),
    };
  }
}
