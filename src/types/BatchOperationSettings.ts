/**
 * Interface for batch operation settings in LaTeX Translator
 */
export interface BatchOperationSettings {
    // Whether to process files recursively in subdirectories
    recursive: boolean;
    // Whether to skip files that have already been processed
    skipExisting: boolean;
    // Whether to create backup files before processing
    createBackups: boolean;
    // Whether to show notification when batch processing completes
    notifyOnCompletion: boolean;
    // Maximum number of errors before stopping batch processing
    errorThreshold: number;
    // Whether to automatically save error reports
    autoSaveErrorReports: boolean;
    // Directory where error reports will be saved
    errorReportLocation: string;
    // Maximum number of files to process concurrently
    maxConcurrentFiles: number;
    // Delay between processing each file (in milliseconds)
    processDelay: number;
    // Keyboard shortcuts for batch operations
    hotkeys: {
        openBatchModal: string;
        quickBatchCurrentFolder: string;
        quickBatchVault: string;
    };
}
