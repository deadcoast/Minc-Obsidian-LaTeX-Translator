/**
 * Interface for UI-related settings in LaTeX Translator
 */
export interface UISettings {
    // Delay before preview updates (in milliseconds)
    previewDelay: number;
    // Whether to show error notifications
    showErrorNotifications: boolean;
    // Whether to show success notifications
    showSuccessNotifications: boolean;
    // Whether to show warning notifications
    showWarningNotifications: boolean;
    // Theme preference ('light', 'dark', or 'system')
    theme: 'light' | 'dark' | 'system';
    // Font size in pixels
    fontSize: number;
    // Line height multiplier
    lineHeight: number;
    // Editor width preference
    editorWidth: 'narrow' | 'medium' | 'wide';
    // Sidebar location preference
    sidebarLocation: 'left' | 'right';
    // Custom CSS string
    customCSS: string;
    // Enable preview panel
    enablePreviewPanel: boolean;
    // Preview panel position
    previewPanelPosition: 'left' | 'right';
    // Auto update preview
    autoUpdatePreview: boolean;
    // Preview theme preference ('light', 'dark', 'auto')
    previewTheme: 'light' | 'dark' | 'auto';
    // Preview font size in pixels
    previewFontSize: number;
    // Show line numbers in preview
    previewLineNumbers: boolean;
    // Sync scroll between editor and preview
    previewSyncScroll: boolean;
    // Show diff in preview
    previewShowDiff: boolean;
    // Whether to highlight inline errors in the editor
    inlineErrorHighlighting: boolean;
    // CSS class for error highlighting
    errorHighlightStyle: string;
}
