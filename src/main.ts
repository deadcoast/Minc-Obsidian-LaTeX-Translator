import { Notice, Plugin, MarkdownView, Editor } from 'obsidian';
import { LatexTranslatorSettings, DEFAULT_SETTINGS, settingsToParserOptions } from './core/settings/settings';
import { LatexTranslatorSettingsTab } from './ui/settings/LatexTranslatorSettingsTab';
import { parseLatexToObsidian } from './core/parser/latexParser';
import { logger } from '@utils/logger';
import { validateSettings } from './core/settings/settingsValidation';
import { CommandHistory } from './core/history/commandHistory';
import { LatexStatusBar } from './ui/components/StatusBarComponent';
import { StatisticsView } from './ui/views/StatisticsView';
import { KeyboardShortcutsModal } from './ui/modals/KeyboardShortcutsModal';

const STATISTICS_VIEW_TYPE = 'latex-translator-statistics-view';

export default class LatexTranslatorPlugin extends Plugin {
    settings: LatexTranslatorSettings;
    history: CommandHistory;
    statusBar: LatexStatusBar;

    async onload() {
        // Load and validate settings
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        const validation = validateSettings(this.settings);
        
        if (!validation.isValid) {
            new Notice('LaTeX Translator: Invalid settings detected. Please check the settings tab.', 5000);
            logger.error('Invalid settings', validation.errors);
        }
        
        if (validation.warnings.length > 0 && this.settings.advanced.debugLogging) {
            logger.warning('Settings warnings', validation.warnings);
        }

        // Initialize command history
        this.history = new CommandHistory();

        // Add settings tab
        this.addSettingTab(new LatexTranslatorSettingsTab(this.app, this));

        // Register main command
        this.addCommand({
            id: 'translate-latex-selection',
            name: 'Translate LaTeX in Selection',
            editorCallback: async (editor) => {
                await this.translateWithOptions(editor, settings => settings);
            }
        });

        // Register specialized commands
        this.addCommand({
            id: 'translate-latex-environments',
            name: 'Convert LaTeX Environments Only',
            editorCallback: async (editor) => {
                await this.translateWithOptions(editor, settings => ({
                    ...settings,
                    environmentConversion: {
                        ...settings.environmentConversion,
                        enabled: true
                    },
                    bracketReplacement: {
                        ...settings.bracketReplacement,
                        convertDisplayMath: false,
                        convertInlineMath: false
                    },
                    citation: {
                        ...settings.citation,
                        enabled: false
                    }
                }));
            }
        });

        this.addCommand({
            id: 'translate-latex-math',
            name: 'Convert Math Mode Only',
            editorCallback: async (editor) => {
                await this.translateWithOptions(editor, settings => ({
                    ...settings,
                    environmentConversion: {
                        ...settings.environmentConversion,
                        enabled: false
                    },
                    bracketReplacement: {
                        ...settings.bracketReplacement,
                        convertDisplayMath: true,
                        convertInlineMath: true
                    },
                    citation: {
                        ...settings.citation,
                        enabled: false
                    }
                }));
            }
        });

        // Add more specialized commands
        this.addCommand({
            id: 'translate-latex-citations',
            name: 'Convert Citations Only',
            editorCallback: async (editor) => {
                await this.translateWithOptions(editor, settings => ({
                    ...settings,
                    environmentConversion: {
                        ...settings.environmentConversion,
                        enabled: false
                    },
                    bracketReplacement: {
                        ...settings.bracketReplacement,
                        convertDisplayMath: false,
                        convertInlineMath: false
                    },
                    citation: {
                        ...settings.citation,
                        enabled: true
                    }
                }));
            }
        });

        this.addCommand({
            id: 'translate-latex-references',
            name: 'Convert References Only',
            editorCallback: async (editor) => {
                await this.translateWithOptions(editor, settings => ({
                    ...settings,
                    environmentConversion: {
                        ...settings.environmentConversion,
                        enabled: false
                    },
                    bracketReplacement: {
                        ...settings.bracketReplacement,
                        convertDisplayMath: false,
                        convertInlineMath: false
                    },
                    citation: {
                        ...settings.citation,
                        enabled: false
                    },
                    labelAndReference: {
                        ...settings.labelAndReference,
                        removeLabels: false
                    }
                }));
            }
        });

        this.addCommand({
            id: 'translate-latex-clean',
            name: 'Clean LaTeX Commands',
            editorCallback: async (editor) => {
                await this.translateWithOptions(editor, settings => ({
                    ...settings,
                    environmentConversion: {
                        ...settings.environmentConversion,
                        enabled: false
                    },
                    bracketReplacement: {
                        ...settings.bracketReplacement,
                        convertDisplayMath: false,
                        convertInlineMath: false
                    },
                    citation: {
                        ...settings.citation,
                        enabled: false
                    },
                    advanced: {
                        ...settings.advanced,
                        expandMacros: true,
                        removeLeftRight: true,
                        unifyTextToMathrm: true
                    }
                }));
            }
        });

        // Full file conversion command
        this.addCommand({
            id: 'translate-latex-full-file',
            name: 'Convert LaTeX in Entire File',
            checkCallback: (checking: boolean) => {
                const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (activeView?.editor) {
                    if (!checking) {
                        this.translateFullFile(activeView.editor);
                    }
                    return true;
                }
                return false;
            },
            hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'l' }]
        });

        // Selection-based quick commands with hotkeys
        this.addCommand({
            id: 'translate-latex-selection-quick',
            name: 'Quick Convert LaTeX in Selection',
            hotkeys: [{ modifiers: ['Mod'], key: 'l' }],
            editorCallback: async (editor) => {
                await this.translateWithOptions(editor, settings => settings);
            }
        });

        this.addCommand({
            id: 'translate-latex-math-quick',
            name: 'Quick Convert Math in Selection',
            hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'm' }],
            editorCallback: async (editor) => {
                await this.translateWithOptions(editor, settings => ({
                    ...settings,
                    environmentConversion: {
                        ...settings.environmentConversion,
                        enabled: false
                    },
                    bracketReplacement: {
                        ...settings.bracketReplacement,
                        convertDisplayMath: true,
                        convertInlineMath: true
                    },
                    citation: {
                        ...settings.citation,
                        enabled: false
                    }
                }));
            }
        });

        // Add citation quick command
        this.addCommand({
            id: 'translate-latex-citations-quick',
            name: 'Quick Convert Citations in Selection',
            hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'c' }],
            editorCallback: async (editor) => {
                await this.translateWithOptions(editor, settings => ({
                    ...settings,
                    environmentConversion: {
                        ...settings.environmentConversion,
                        enabled: false
                    },
                    bracketReplacement: {
                        ...settings.bracketReplacement,
                        convertDisplayMath: false,
                        convertInlineMath: false
                    },
                    citation: {
                        ...settings.citation,
                        enabled: true
                    }
                }));
            }
        });

        // Add reference quick command
        this.addCommand({
            id: 'translate-latex-references-quick',
            name: 'Quick Convert References in Selection',
            hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'r' }],
            editorCallback: async (editor) => {
                await this.translateWithOptions(editor, settings => ({
                    ...settings,
                    environmentConversion: {
                        ...settings.environmentConversion,
                        enabled: false
                    },
                    bracketReplacement: {
                        ...settings.bracketReplacement,
                        convertDisplayMath: false,
                        convertInlineMath: false
                    },
                    citation: {
                        ...settings.citation,
                        enabled: false
                    },
                    labelAndReference: {
                        ...settings.labelAndReference,
                        removeLabels: false
                    }
                }));
            }
        });

        // Add undo last conversion command
        this.addCommand({
            id: 'undo-last-latex-conversion',
            name: 'Undo Last LaTeX Conversion',
            hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'z' }],
            checkCallback: (checking: boolean) => {
                const lastEntry = this.history.getLastEntry();
                if (lastEntry && lastEntry.success) {
                    if (!checking) {
                        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
                        if (activeView?.editor) {
                            this.app.commands.executeCommandById('editor:undo');
                        }
                    }
                    return true;
                }
                return false;
            }
        });

        // Register statistics view
        this.registerView(
            STATISTICS_VIEW_TYPE,
            (leaf) => new StatisticsView(leaf, this.history)
        );

        // Add commands
        this.addCommand({
            id: 'show-statistics',
            name: 'Show Statistics',
            callback: async () => {
                const leaf = this.app.workspace.getRightLeaf(false);
                await leaf.setViewState({ type: STATISTICS_VIEW_TYPE });
                this.app.workspace.revealLeaf(leaf);
            },
            hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'S' }]
        });

        // Add more keyboard shortcuts
        this.addCommand({
            id: 'convert-paragraph',
            name: 'Convert Current Paragraph',
            editorCallback: async (editor) => {
                const cursor = editor.getCursor();
                const line = editor.getLine(cursor.line);
                let start = cursor.line;
                let end = cursor.line;

                // Find paragraph boundaries
                while (start > 0 && editor.getLine(start - 1).trim() !== '') {
                    start--;
                }
                while (end < editor.lineCount() - 1 && editor.getLine(end + 1).trim() !== '') {
                    end++;
                }

                const text = editor.getRange({ line: start, ch: 0 }, { line: end, ch: editor.getLine(end).length });
                const converted = await this.latexParser.convertText(text);
                editor.replaceRange(converted, { line: start, ch: 0 }, { line: end, ch: editor.getLine(end).length });
            },
            hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'P' }]
        });

        this.addCommand({
            id: 'convert-environments',
            name: 'Convert LaTeX Environments',
            editorCallback: async (editor) => {
                const selection = editor.getSelection();
                const text = selection || editor.getValue();
                const converted = await this.latexParser.convertEnvironments(text);
                
                if (selection) {
                    editor.replaceSelection(converted);
                } else {
                    editor.setValue(converted);
                }
            },
            hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'E' }]
        });

        this.addCommand({
            id: 'show-keyboard-shortcuts',
            name: 'Show Keyboard Shortcuts',
            callback: () => {
                const modal = new KeyboardShortcutsModal(this.app);
                modal.open();
            },
            hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'K' }]
        });

        this.addCommand({
            id: 'toggle-auto-convert',
            name: 'Toggle Auto-Convert',
            callback: () => {
                this.settings.autoConvert = !this.settings.autoConvert;
                this.saveSettings();
                new Notice(`Auto-Convert ${this.settings.autoConvert ? 'enabled' : 'disabled'}`);
            },
            hotkeys: [{ modifiers: ['Mod', 'Alt'], key: 'A' }]
        });

        this.registerBatchOperationCommands();

        // Initialize status bar
        const statusBarItem = this.addStatusBarItem();
        this.statusBar = new LatexStatusBar(statusBarItem, this.history);

        // Log plugin load
        logger.info('LaTeX Translator plugin loaded');
    }

    private registerBatchOperationCommands(): void {
        // Open batch operations modal
        this.addCommand({
            id: 'open-batch-operations',
            name: 'Open Batch Operations',
            callback: () => {
                new BatchOperationsModal(
                    this.app,
                    this.settings,
                    this.translator
                ).open();
            },
            hotkeys: [
                {
                    modifiers: this.parseHotkey(this.settings.batchOperations.hotkeys.openBatchModal),
                    key: this.settings.batchOperations.hotkeys.openBatchModal.split('+').pop() || ''
                }
            ]
        });

        // Quick batch current folder
        this.addCommand({
            id: 'quick-batch-current-folder',
            name: 'Quick Batch Current Folder',
            checkCallback: (checking: boolean) => {
                const activeFile = this.app.workspace.getActiveFile();
                if (!activeFile) return false;
                
                if (!checking) {
                    const folder = activeFile.parent;
                    if (folder) {
                        const batchProcessor = new BatchProcessor(
                            this.app.vault,
                            this.settings,
                            this.translator
                        );
                        
                        batchProcessor.processSingleFolder(folder.path, {
                            recursive: this.settings.batchOperations.defaultRecursive,
                            skipExisting: this.settings.batchOperations.defaultSkipExisting,
                            createBackups: this.settings.batchOperations.defaultCreateBackups,
                            notifyOnCompletion: this.settings.batchOperations.defaultNotifyOnCompletion,
                            errorThreshold: this.settings.batchOperations.defaultErrorThreshold
                        });
                    }
                }
                return true;
            },
            hotkeys: [
                {
                    modifiers: this.parseHotkey(this.settings.batchOperations.hotkeys.quickBatchCurrentFolder),
                    key: this.settings.batchOperations.hotkeys.quickBatchCurrentFolder.split('+').pop() || ''
                }
            ]
        });

        // Quick batch entire vault
        this.addCommand({
            id: 'quick-batch-vault',
            name: 'Quick Batch Entire Vault',
            callback: () => {
                const batchProcessor = new BatchProcessor(
                    this.app.vault,
                    this.settings,
                    this.translator
                );
                
                batchProcessor.processVault({
                    recursive: this.settings.batchOperations.defaultRecursive,
                    skipExisting: this.settings.batchOperations.defaultSkipExisting,
                    createBackups: this.settings.batchOperations.defaultCreateBackups,
                    notifyOnCompletion: this.settings.batchOperations.defaultNotifyOnCompletion,
                    errorThreshold: this.settings.batchOperations.defaultErrorThreshold
                });
            },
            hotkeys: [
                {
                    modifiers: this.parseHotkey(this.settings.batchOperations.hotkeys.quickBatchVault),
                    key: this.settings.batchOperations.hotkeys.quickBatchVault.split('+').pop() || ''
                }
            ]
        });
    }

    private parseHotkey(hotkeyStr: string): string[] {
        return hotkeyStr
            .toLowerCase()
            .split('+')
            .filter(part => part !== '')
            .map(part => {
                switch (part.trim()) {
                    case 'mod':
                        return Platform.isMacOS ? 'Meta' : 'Ctrl';
                    case 'cmd':
                        return 'Meta';
                    case 'ctrl':
                        return 'Ctrl';
                    case 'shift':
                        return 'Shift';
                    case 'alt':
                        return 'Alt';
                    default:
                        return '';
                }
            })
            .filter(mod => mod !== '');
    }

    private async translateWithOptions(
        editor: Editor,
        settingsModifier: (settings: LatexTranslatorSettings) => LatexTranslatorSettings
    ) {
        try {
            const selection = editor.getSelection();
            if (!selection) {
                new Notice('No text selected');
                return;
            }

            this.statusBar.startConverting();

            // Apply settings modifier and convert to parser options
            const modifiedSettings = settingsModifier(this.settings);
            const parserOptions = settingsToParserOptions(modifiedSettings);

            // Convert LaTeX to Obsidian
            const translated = parseLatexToObsidian(selection, parserOptions);

            // Replace selection with translated text
            editor.replaceSelection(translated);

            // Add to command history
            this.history.addEntry({
                timestamp: Date.now(),
                commandId: 'translate-latex-selection',
                commandName: 'Convert LaTeX in Selection',
                selectionLength: selection.length,
                success: true,
                options: parserOptions
            });

            if (this.settings.advanced.debugLogging) {
                logger.info('LaTeX translation completed', {
                    original: selection,
                    translated: translated,
                    options: parserOptions
                });
            }
        } catch (error) {
            logger.error('Error translating LaTeX', error);
            new Notice('Error translating LaTeX');

            // Add failed command to history
            this.history.addEntry({
                timestamp: Date.now(),
                commandId: 'translate-latex-selection',
                commandName: 'Convert LaTeX in Selection',
                selectionLength: editor.getSelection()?.length || 0,
                success: false,
                options: settingsToParserOptions(settingsModifier(this.settings))
            });
        } finally {
            this.statusBar.finishConverting();
        }
    }

    private async translateFullFile(editor: Editor) {
        try {
            const currentContent = editor.getValue();
            const cursorPos = editor.getCursor();

            this.statusBar.startConverting();

            // Convert LaTeX to Obsidian using current settings
            const parserOptions = settingsToParserOptions(this.settings);
            const translated = parseLatexToObsidian(currentContent, parserOptions);

            // Replace entire file content
            editor.setValue(translated);
            
            // Restore cursor position
            editor.setCursor(cursorPos);

            // Add to command history
            this.history.addEntry({
                timestamp: Date.now(),
                commandId: 'translate-latex-full-file',
                commandName: 'Convert LaTeX in Entire File',
                selectionLength: currentContent.length,
                success: true,
                options: parserOptions
            });

            if (this.settings.advanced.debugLogging) {
                logger.info('Full file LaTeX translation completed', {
                    contentLength: currentContent.length,
                    translatedLength: translated.length,
                    options: parserOptions
                });
            }

            new Notice('Full file LaTeX conversion complete');
        } catch (error) {
            logger.error('Error translating full file', error);
            new Notice('Error converting full file');

            // Add failed command to history
            this.history.addEntry({
                timestamp: Date.now(),
                commandId: 'translate-latex-full-file',
                commandName: 'Convert LaTeX in Entire File',
                selectionLength: editor.getValue().length,
                success: false,
                options: settingsToParserOptions(this.settings)
            });
        } finally {
            this.statusBar.finishConverting();
        }
    }

    async saveSettings() {
        // Validate settings before saving
        const validation = validateSettings(this.settings);
        
        if (!validation.isValid) {
            new Notice('Invalid settings. Changes not saved.', 5000);
            logger.error('Invalid settings', validation.errors);
            return;
        }
        
        await this.saveData(this.settings);
        
        if (this.settings.advanced.debugLogging) {
            logger.info('Settings saved', this.settings);
        }
    }

    async onunload() {
        this.statusBar = null;
        // Clean up statistics view
        this.app.workspace.detachLeavesOfType(STATISTICS_VIEW_TYPE);
        logger.info('LaTeX Translator plugin unloaded');
    }
}
