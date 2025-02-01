/**
 * Interface for UI-related settings in LaTeX Translator
 */
/**
 * Interface defining all UI-related settings for the LaTeX Translator plugin.
 */
export interface UISettings {
  // Preview Panel Settings
  enablePreviewPanel: boolean;
  previewPanelPosition: 'right' | 'bottom';
  previewDelay: number;
  previewTheme: 'auto' | 'light' | 'dark';
  previewFontSize: number;
  previewLineHeight: number;
  previewFontFamily: string;
  previewLineNumbers: boolean;
  previewSyncScroll: boolean;
  previewShowDiff: boolean;
  autoUpdatePreview: boolean;

  // Error Handling and Notifications
  showErrorNotifications: boolean;
  showWarningNotifications: boolean;
  showSuccessNotifications: boolean;
  errorNotificationDuration: number;
  errorGrouping: 'none' | 'type' | 'location';
  inlineErrorHighlighting: boolean;
  errorHighlightStyle: 'underline' | 'background' | 'gutter' | 'squiggly' | 'border' | 'side-border';
  errorHighlightColor: 'red' | 'orange' | 'yellow';

  // Theme and Styling
  theme: 'light' | 'dark' | 'system';
  customStyles: {
    enabled: boolean;
    css: string;
  };
  fontSize: number;
  lineHeight: number;

  // Layout
  editorWidth: 'narrow' | 'medium' | 'wide';
  sidebarLocation: 'left' | 'right';

  // Progress and Status
  showProgressBar: boolean;
  showStatusBarInfo: boolean;
  showCommandCount: boolean;
  progressBarStyle: 'minimal' | 'detailed' | 'circular';
  progressBarPosition: 'notice' | 'status' | 'floating';
  progressBarTheme: 'default' | 'colorful' | 'monochrome';
  showEstimatedTime: boolean;
}

/**
 * Default UI settings
 */
export const DEFAULT_UI_SETTINGS: UISettings = {
  // Preview Panel Settings
  enablePreviewPanel: true,
  previewPanelPosition: 'right',
  previewDelay: 1000,
  previewTheme: 'auto',
  previewFontSize: 14,
  previewLineHeight: 1.5,
  previewFontFamily: 'monospace',
  previewLineNumbers: false,
  previewSyncScroll: true,
  previewShowDiff: true,
  autoUpdatePreview: true,

  // Error Handling and Notifications
  showErrorNotifications: true,
  showWarningNotifications: true,
  showSuccessNotifications: true,
  errorNotificationDuration: 5000,
  errorGrouping: 'type',
  inlineErrorHighlighting: true,
  errorHighlightStyle: 'underline',
  errorHighlightColor: 'red',

  // Theme and Styling
  theme: 'system',
  customStyles: {
    enabled: false,
    css: ''
  },
  fontSize: 14,
  lineHeight: 1.5,

  // Layout
  editorWidth: 'medium',
  sidebarLocation: 'right',

  // Progress and Status
  showProgressBar: true,
  showStatusBarInfo: true,
  showCommandCount: true,
  progressBarStyle: 'minimal',
  progressBarPosition: 'status',
  progressBarTheme: 'default',
  showEstimatedTime: true
};
