import { App, Modal, Notice, TFolder } from 'obsidian';
import type MincLatexTranslatorPlugin from '../../../main';
import { BatchProcessor } from '../../core/batch/BatchProcessor';
import { LatexTranslatorSettings } from '../../settings/settings';
import { LatexTranslator } from '../../core/translator/LatexTranslator';
import * as React from 'react';
import { createRoot } from 'react-dom/client';

interface BatchOperationsModalProps {
    app: App;
    settings: LatexTranslatorSettings;
    translator: LatexTranslator;
    plugin: MincLatexTranslatorPlugin;
    onClose: () => void;
}

interface BatchOperationsState {
    isProcessing: boolean;
    progress: {
        totalFiles: number;
        processedFiles: number;
        successfulFiles: number;
        failedFiles: number;
    };
    selectedFolder: string;
    options: {
        recursive: boolean;
        skipExisting: boolean;
        createBackups: boolean;
        notifyOnCompletion: boolean;
        errorThreshold: number;
    };
}

export class BatchOperationsModal extends Modal {
    private root: any;
    private settings: LatexTranslatorSettings;
    private translator: LatexTranslator;
    private plugin: MincLatexTranslatorPlugin;

    constructor(app: App, settings: LatexTranslatorSettings, translator: LatexTranslator, plugin: MincLatexTranslatorPlugin) {
        super(app);
        this.settings = settings;
        this.translator = translator;
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        this.root = createRoot(contentEl);
        this.root.render(
            <BatchOperationsComponent
                app={this.app}
                settings={this.settings}
                translator={this.translator}
                plugin={this.plugin}
                onClose={() => this.close()}
            />
        );
    }

    onClose() {
        const { contentEl } = this;
        this.root.unmount();
        contentEl.empty();
    }
}

const BatchOperationsComponent: React.FC<BatchOperationsModalProps> = ({
    app,
    settings,
    translator,
    plugin,
    onClose
}) => {
    const [state, setState] = React.useState<BatchOperationsState>({
        isProcessing: false,
        progress: {
            totalFiles: 0,
            processedFiles: 0,
            successfulFiles: 0,
            failedFiles: 0
        },
        selectedFolder: '/',
        options: {
            recursive: true,
            skipExisting: true,
            createBackups: true,
            notifyOnCompletion: true,
            errorThreshold: 0.2 // 20% error threshold
        }
    });

    const batchProcessor = React.useMemo(
        () => new BatchProcessor(
            app.vault,
            settings,
            translator,
            plugin,
            (progress) => setState(prev => ({ ...prev, progress }))
        ),
        [app.vault, settings, translator, plugin]
    );

    const handleStartProcessing = async () => {
        setState(prev => ({ ...prev, isProcessing: true }));
        try {
            if (state.selectedFolder === '/') {
                await batchProcessor.processVault(state.options);
            } else {
                await batchProcessor.processSingleFolder(state.selectedFolder, state.options);
            }
        } catch (error) {
            console.error('Batch processing failed:', error);
        } finally {
            setState(prev => ({ ...prev, isProcessing: false }));
        }
    };

    const handleGenerateReport = async () => {
        const report = await batchProcessor.generateErrorReport();
        const reportFile = `latex-translator-error-report-${Date.now()}.md`;
        await app.vault.create(reportFile, report);
        new Notice(`Error report saved as ${reportFile}`);
    };

    return (
        <div className="latex-translator-batch-operations">
            <h2>Batch Operations</h2>
            
            <div className="progress-section">
                <h3>Progress</h3>
                <div className="progress-bar-container">
                    <div 
                        className="progress-bar"
                        style={{
                            width: `${(state.progress.processedFiles / state.progress.totalFiles) * 100}%`
                        }}
                    />
                </div>
                <div className="progress-stats">
                    <div>Processed: {state.progress.processedFiles}/{state.progress.totalFiles}</div>
                    <div>Successful: {state.progress.successfulFiles}</div>
                    <div>Failed: {state.progress.failedFiles}</div>
                </div>
            </div>

            <div className="options-section">
                <h3>Options</h3>
                
                <div className="option">
                    <label>Target Folder</label>
                    <select 
                        value={state.selectedFolder}
                        onChange={(e) => setState(prev => ({
                            ...prev,
                            selectedFolder: e.target.value
                        }))}
                    >
                        <option value="/">Entire Vault</option>
                        {getFolderOptions(app.vault.getRoot())}
                    </select>
                </div>

                <div className="option">
                    <label>
                        <input
                            type="checkbox"
                            checked={state.options.recursive}
                            onChange={(e) => setState(prev => ({
                                ...prev,
                                options: {
                                    ...prev.options,
                                    recursive: e.target.checked
                                }
                            }))}
                        />
                        Include Subfolders
                    </label>
                </div>

                <div className="option">
                    <label>
                        <input
                            type="checkbox"
                            checked={state.options.skipExisting}
                            onChange={(e) => setState(prev => ({
                                ...prev,
                                options: {
                                    ...prev.options,
                                    skipExisting: e.target.checked
                                }
                            }))}
                        />
                        Skip Existing Translations
                    </label>
                </div>

                <div className="option">
                    <label>
                        <input
                            type="checkbox"
                            checked={state.options.createBackups}
                            onChange={(e) => setState(prev => ({
                                ...prev,
                                options: {
                                    ...prev.options,
                                    createBackups: e.target.checked
                                }
                            }))}
                        />
                        Create Backups
                    </label>
                </div>

                <div className="option">
                    <label>
                        <input
                            type="checkbox"
                            checked={state.options.notifyOnCompletion}
                            onChange={(e) => setState(prev => ({
                                ...prev,
                                options: {
                                    ...prev.options,
                                    notifyOnCompletion: e.target.checked
                                }
                            }))}
                        />
                        Show Completion Notification
                    </label>
                </div>

                <div className="option">
                    <label>Error Threshold (%)</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={state.options.errorThreshold * 100}
                        onChange={(e) => setState(prev => ({
                            ...prev,
                            options: {
                                ...prev.options,
                                errorThreshold: Number(e.target.value) / 100
                            }
                        }))}
                    />
                </div>
            </div>

            <div className="button-section">
                <button
                    className="mod-cta"
                    onClick={handleStartProcessing}
                    disabled={state.isProcessing}
                >
                    {state.isProcessing ? 'Processing...' : 'Start Processing'}
                </button>
                
                <button
                    onClick={handleGenerateReport}
                    disabled={state.isProcessing || state.progress.failedFiles === 0}
                >
                    Generate Error Report
                </button>
                
                <button onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
};

function getFolderOptions(folder: TFolder, depth = 0): JSX.Element[] {
    const options: JSX.Element[] = [];
    
    if (depth > 0) {
        options.push(
            <option key={folder.path} value={folder.path}>
                {'  '.repeat(depth - 1)}└─ {folder.name}
            </option>
        );
    }
    
    folder.children
        .filter((child): child is TFolder => child instanceof TFolder)
        .forEach(childFolder => {
            options.push(...getFolderOptions(childFolder, depth + 1));
        });
    
    return options;
}
