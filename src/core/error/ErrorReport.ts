import { ErrorDetails } from './ErrorHandler';

export interface BatchErrorReport {
    file: string;
    message: string;
    details?: string;
    timestamp: string;
}

export interface ErrorReport {
    timestamp: string;
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    lastError?: ErrorDetails;
    logEntries: string[];
}

export class ErrorReportGenerator {
    public static generateMarkdownReport(report: ErrorReport): string {
        const lines: string[] = [];
        
        // Header
        lines.push('# LaTeX Translator Error Report');
        lines.push(`Generated: ${report.timestamp}\n`);
        
        // Summary
        lines.push('## Summary');
        lines.push(`Total Errors: ${report.totalErrors}\n`);
        
        // Errors by Category
        lines.push('## Errors by Category');
        Object.entries(report.errorsByCategory)
            .sort(([, a], [, b]) => b - a)
            .forEach(([category, count]) => {
                lines.push(`- ${category}: ${count}`);
            });
        lines.push('');
        
        // Last Error
        if (report.lastError) {
            lines.push('## Last Error');
            lines.push(`Severity: ${report.lastError.severity}`);
            lines.push(`Category: ${report.lastError.category}`);
            lines.push(`Message: ${report.lastError.message}`);
            
            if (report.lastError.context) {
                lines.push('\nContext:');
                Object.entries(report.lastError.context).forEach(([key, value]) => {
                    lines.push(`- ${key}: ${value}`);
                });
            }
            
            if (report.lastError.suggestions?.length) {
                lines.push('\nSuggestions:');
                report.lastError.suggestions.forEach(suggestion => {
                    lines.push(`- ${suggestion}`);
                });
            }
            
            if (report.lastError.recoverySteps?.length) {
                lines.push('\nRecovery Steps:');
                report.lastError.recoverySteps.forEach(step => {
                    lines.push(`1. ${step}`);
                });
            }
            lines.push('');
        }
        
        // Recent Log Entries
        lines.push('## Recent Log Entries');
        report.logEntries.forEach(entry => {
            lines.push('```');
            lines.push(entry);
            lines.push('```\n');
        });
        
        // Recommendations
        lines.push('## Recommendations');
        const recommendations = ErrorReportGenerator.generateRecommendations(report);
        recommendations.forEach(rec => {
            lines.push(`- ${rec}`);
        });
        
        return lines.join('\n');
    }
    
    private static generateRecommendations(report: ErrorReport): string[] {
        const recommendations: string[] = [];
        const errorCategories = Object.entries(report.errorsByCategory);
        
        // Most common error category
        const [mostCommonCategory, mostCommonCount] = errorCategories
            .sort(([, a], [, b]) => b - a)[0];
            
        if (mostCommonCount > 0) {
            recommendations.push(
                `Focus on reducing ${mostCommonCategory} errors as they account for the majority of issues.`
            );
        }
        
        // Check for patterns
        const hasMultipleCategories = errorCategories.filter(([, count]) => count > 0).length > 1;
        if (hasMultipleCategories) {
            recommendations.push(
                'Multiple error categories detected. Consider a systematic review of the codebase.'
            );
        }
        
        // Recent errors
        if (report.lastError) {
            recommendations.push(
                `Address the most recent ${report.lastError.severity} error in the ${report.lastError.category} category.`
            );
        }
        
        // General recommendations
        recommendations.push(
            'Regularly review error logs to identify patterns and recurring issues.',
            'Consider implementing automated tests to catch common errors early.',
            'Keep documentation updated with common error solutions.'
        );
        
        return recommendations;
    }
}
