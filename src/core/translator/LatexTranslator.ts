import { TFile } from 'obsidian';
import parseLatexToObsidian, { ParserOptions } from '../parser/latexParser';
import { LatexTranslatorSettings, settingsToParserOptions } from '../settings/settings';
import { CommandHistory } from '../history/commandHistory';
import { ErrorReport } from '../error/ErrorReport';
import { ErrorHandler } from '../error/ErrorHandler';

export class LatexTranslator {
    private settings: LatexTranslatorSettings;
    private commandHistory: CommandHistory;
    private errorHandler: ErrorHandler;

    constructor(
        settings: LatexTranslatorSettings,
        commandHistory: CommandHistory,
        errorHandler: ErrorHandler
    ) {
        this.settings = settings;
        this.commandHistory = commandHistory;
        this.errorHandler = errorHandler;
    }

    /**
     * Translates LaTeX content to Obsidian markdown
     * @param content The LaTeX content to translate
     * @param file Optional file reference for error reporting
     * @param customOptions Optional parser options to override settings
     * @returns The translated content and any errors that occurred
     */
    async translateContent(
        content: string,
        file?: TFile,
        customOptions?: Partial<ParserOptions>
    ): Promise<{ 
        translatedContent: string;
        error?: ErrorReport;
    }> {
        const startTime = Date.now();
        const commandId = crypto.randomUUID();

        try {
            // Merge default options from settings with any custom options
            const baseOptions = settingsToParserOptions(this.settings);
            const options: ParserOptions = {
                ...baseOptions,
                ...customOptions
            };

            // Perform the translation
            const translatedContent = parseLatexToObsidian(content, options);

            // Record successful translation in history
            this.commandHistory.addEntry({
                timestamp: new Date(startTime).getTime(),
                commandId,
                commandName: 'translate',
                selectionLength: content.length,
                success: true,
                options,
                duration: Date.now() - startTime,
                conversionStats: {
                    mathCount: (content.match(/\$/g) || []).length / 2,
                    citationCount: (content.match(/\\cite{/g) || []).length,
                    environmentCount: (content.match(/\\begin{/g) || []).length,
                    referenceCount: (content.match(/\\ref{/g) || []).length,
                    macroCount: (content.match(/\\[a-zA-Z]+/g) || []).length
                }
            });

            return { translatedContent };

        } catch (error) {
            // Handle and log error
            const errorToHandle = error instanceof Error ? error : String(error);
            const errorReport = this.errorHandler.handleError(errorToHandle, {
                file: file?.path,
                content: content,
                latexCommand: error instanceof Error ? error.name : undefined
            });

            // Update command history with error
            this.commandHistory.addEntry({
                timestamp: new Date(startTime).getTime(),
                commandId,
                commandName: 'translate',
                selectionLength: content.length,
                success: false,
                options: customOptions || settingsToParserOptions(this.settings),
                duration: Date.now() - startTime,
                conversionStats: {
                    mathCount: 0,
                    citationCount: 0,
                    environmentCount: 0,
                    referenceCount: 0,
                    macroCount: 0
                },
                errorMessage: errorReport.message
            });

            // Generate a proper error report
            const fullErrorReport = await this.errorHandler.generateErrorReport();

            return {
                translatedContent: content, // Return original content on error
                error: fullErrorReport
            };
        }
    }

    /**
     * Updates the translator settings
     * @param newSettings The new settings to apply
     */
    updateSettings(newSettings: LatexTranslatorSettings): void {
        this.settings = newSettings;
    }

    /**
     * Gets the current settings
     * @returns The current translator settings
     */
    getSettings(): LatexTranslatorSettings {
        return this.settings;
    }

    /**
     * Gets the command history for analytics
     * @returns The command history instance
     */
    getCommandHistory(): CommandHistory {
        return this.commandHistory;
    }
}