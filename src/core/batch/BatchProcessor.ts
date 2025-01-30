import { TFile, TFolder, Vault, Notice } from 'obsidian';
import { LatexTranslatorSettings } from '../../settings/settings';
import { BatchErrorReport } from '../error/ErrorReport';
import { LatexTranslator } from '../translator/LatexTranslator';

interface BatchProgress {
    totalFiles: number;
    processedFiles: number;
    successfulFiles: number;
    failedFiles: number;
    errors: BatchErrorReport[];
}

interface BatchOptions {
    recursive: boolean;
    skipExisting: boolean;
    createBackups: boolean;
    notifyOnCompletion: boolean;
    errorThreshold?: number; // Stop if error rate exceeds threshold
}

export class BatchProcessor {
    private vault: Vault;
    private settings: LatexTranslatorSettings;
    private translator: LatexTranslator;
    private progress: BatchProgress;
    private onProgressUpdate: (progress: BatchProgress) => void;

    constructor(
        vault: Vault,
        settings: LatexTranslatorSettings,
        translator: LatexTranslator,
        onProgressUpdate?: (progress: BatchProgress) => void
    ) {
        this.vault = vault;
        this.settings = settings;
        this.translator = translator;
        this.onProgressUpdate = onProgressUpdate || (() => {});
        this.progress = this.initializeProgress();
    }

    private initializeProgress(): BatchProgress {
        return {
            totalFiles: 0,
            processedFiles: 0,
            successfulFiles: 0,
            failedFiles: 0,
            errors: []
        };
    }

    private async processFile(file: TFile): Promise<void> {
        try {
            const content = await this.vault.read(file);
            
            // Apply settings-specific processing
            let { translatedContent, error } = await this.translator.translateContent(content);
            
            // If there was an error, add it to the progress
            if (error) {
                this.progress.errors.push({
                    file: file.path,
                    message: error.lastError?.message || 'Unknown error occurred',
                    details: error.lastError?.stackTrace,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Handle label removal if configured
            if (this.settings.labelAndReference?.removeLabels) {
                translatedContent = this.removeLabels(translatedContent);
            }

            // Handle reference formatting
            if (this.settings.labelAndReference?.referenceHandling === 'autoNumber') {
                translatedContent = this.applyAutoNumbering(translatedContent);
            }

            await this.vault.modify(file, translatedContent);
            this.progress.successfulFiles++;
        } catch (error) {
            this.progress.failedFiles++;
            // Type guard for custom error type
            type CustomError = {
                lastError?: {
                    message?: string;
                    stackTrace?: string;
                }
            };
            
            const errorMessage = error instanceof Error 
                ? error.message 
                : (error as CustomError)?.lastError?.message 
                    ?? 'Unknown error occurred';
                    
            const errorDetails = error instanceof Error
                ? error.stack
                : (error as CustomError)?.lastError?.stackTrace;

            this.progress.errors.push({
                file: file.path,
                message: errorMessage,
                details: errorDetails,
                timestamp: new Date().toISOString()
            });
        } finally {
            this.progress.processedFiles++;
            this.onProgressUpdate(this.progress);
        }
    }

    private removeLabels(content: string): string {
        // Implementation of label removal based on settings
        const labelPattern = /\\label{[^}]*}/g;
        return content.replace(labelPattern, '');
    }

    private applyAutoNumbering(content: string): string {
        // Implementation of auto-numbering based on settings
        let counter = this.settings.labelAndReference.autoNumbering.startEquation;
        const labelMap = new Map<string, number>();

        // First pass: collect all labels
        content.replace(/\\label{eq:([^}]*)}/g, (_, label) => {
            if (!labelMap.has(label)) {
                labelMap.set(label, counter++);
            }
            return '';
        });

        // Second pass: replace references with their corresponding numbers
        return content.replace(/\\ref{eq:([^}]*)}/g, (_, label) => {
            const num = labelMap.get(label);
            return num !== undefined ? `${num}` : `??`;  // Return ?? for undefined references
        });
    }

    private async createBackup(file: TFile): Promise<void> {
        const backupPath = `${file.path}.backup`;
        const content = await this.vault.read(file);
        await this.vault.create(backupPath, content);
    }

    private shouldProcessFile(file: TFile, options: BatchOptions): boolean {
        if (!file.extension.toLowerCase().endsWith('md')) {
            return false;
        }
        
        // Apply settings-based file processing rules
        if (this.settings.environmentConversion?.enabled === false) {
            // Skip files if environment conversion is disabled
            return false;
        }

        if (options.skipExisting && (file.path.includes('.translated') || 
                        (this.settings.labelAndReference?.removeLabels && file.path.includes('.nolabels')))) {
              return false;
        }

        return true;
    }

    private async processFolder(
        folder: TFolder,
        options: BatchOptions
    ): Promise<void> {
        for (const item of folder.children) {
            if (item instanceof TFile && this.shouldProcessFile(item, options)) {
                if (options.createBackups) {
                    await this.createBackup(item);
                }
                await this.processFile(item);

                // Check error threshold
                if (options.errorThreshold) {
                    const errorRate = this.progress.failedFiles / this.progress.processedFiles;
                    if (errorRate > options.errorThreshold) {
                        throw new Error(`Error threshold exceeded: ${(errorRate * 100).toFixed(2)}%`);
                    }
                }
            } else if (item instanceof TFolder && options.recursive) {
                await this.processFolder(item, options);
            }
        }
    }

    public async processVault(options: BatchOptions): Promise<BatchProgress> {
        this.progress = this.initializeProgress();
        const rootFolder = this.vault.getRoot();
        
        try {
            // Count total files first
            this.countMarkdownFiles(rootFolder, options);
            
            // Process all files
            await this.processFolder(rootFolder, options);
            
            if (options.notifyOnCompletion) {
                new Notice(
                    `Batch conversion complete:\n` +
                    `${this.progress.successfulFiles} files converted\n` +
                    `${this.progress.failedFiles} files failed`
                );
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            new Notice(`Batch conversion failed: ${errorMessage}`);
            throw error;
        }

        return this.progress;
    }

    private countMarkdownFiles(folder: TFolder, options: BatchOptions): void {
        for (const item of folder.children) {
            if (item instanceof TFile && this.shouldProcessFile(item, options)) {
                this.progress.totalFiles++;
            } else if (item instanceof TFolder && options.recursive) {
                this.countMarkdownFiles(item, options);
            }
        }
    }

    public async processSingleFolder(
        folderPath: string,
        options: BatchOptions
    ): Promise<BatchProgress> {
        const folder = this.vault.getAbstractFileByPath(folderPath);
        if (!(folder instanceof TFolder)) {
            throw new Error(`Invalid folder path: ${folderPath}`);
        }

        this.progress = this.initializeProgress();
        
        try {
            // Count total files first
            this.countMarkdownFiles(folder, options);
            
            // Process folder
            await this.processFolder(folder, options);
            
            if (options.notifyOnCompletion) {
                new Notice(
                    `Folder conversion complete:\n` +
                    `${this.progress.successfulFiles} files converted\n` +
                    `${this.progress.failedFiles} files failed`
                );
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            new Notice(`Folder conversion failed: ${errorMessage}`);
            throw error;
        }

        return this.progress;
    }

    public getProgress(): BatchProgress {
        return { ...this.progress };
    }

    public async generateErrorReport(): Promise<string> {
        let report = '# LaTeX Translator Batch Processing Error Report\n\n';
        report += `Generated: ${new Date().toLocaleString()}\n\n`;
        report += `Total Files: ${this.progress.totalFiles}\n`;
        report += `Processed: ${this.progress.processedFiles}\n`;
        report += `Successful: ${this.progress.successfulFiles}\n`;
        report += `Failed: ${this.progress.failedFiles}\n\n`;

        if (this.progress.errors.length > 0) {
            report += '## Detailed Error List\n\n';
            this.progress.errors.forEach((error, index) => {
                report += `### Error ${index + 1}\n`;
                report += `**File:** ${error.file}\n`;
                report += `**Time:** ${new Date(error.timestamp).toLocaleString()}\n`;
                report += `**Message:** ${error.message}\n`;
                report += `**Details:**\n\`\`\`\n${error.details}\n\`\`\`\n\n`;
            });
        }

        return report;
    }
}
