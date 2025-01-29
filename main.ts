import { Plugin, WorkspaceLeaf, Editor, Notice, View, ItemView, addIcon } from 'obsidian';
import { LatexView, LATEX_VIEW_TYPE } from '@views/LatexView';
import { MincLatexSettings, DEFAULT_SETTINGS, MincLatexSettingTab } from '@core/settings';
import { parseLatexToObsidian } from '@core/parser/latexParser';
import { logger } from '@utils/logger';
import {
	TAbstractFile,
	TFile,
	TFolder,
	App,
	Modal,
} from "obsidian";

class PromptModal extends Modal {
	private message: string;
	private resolve: (value: string | null) => void;

	constructor(app: App, message: string, resolve: (value: string | null) => void) {
		super(app);
		this.message = message;
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: this.message });

		const input = contentEl.createEl("input", {
			type: "text",
			placeholder: "Enter folder path",
		});

		// Accept input via Enter key or Confirm button
		input.addEventListener("keypress", (event) => {
			if (event.key === "Enter") {
				this.resolve(input.value);
				this.close();
			}
		});

		const confirmBtn = contentEl.createEl("button", { text: "Confirm" });
		confirmBtn.addEventListener("click", () => {
			this.resolve(input.value);
			this.close();
		});

		const cancelBtn = contentEl.createEl("button", { text: "Cancel" });
		cancelBtn.addEventListener("click", () => {
			this.resolve(null);
			this.close();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

export class MincLatexTranslatorPlugin extends Plugin {
	settings: MincLatexSettings = DEFAULT_SETTINGS;
	private activeView: View | null = null;

	private isTFolder(file: TAbstractFile | null): file is TFolder {
		return file instanceof TFolder;
	}

	async onload() {
		logger.info('Loading M|inc LaTeX Translator plugin...');
		
		await this.loadSettings();

		// Configure logger
		logger.setNotifications(this.settings.showNotifications);

		// Register view
		this.registerView(
			LATEX_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => {
				this.activeView = new LatexView(leaf);
				return this.activeView;
			}
		);

		// Add ribbon icon for LaTeX Translator
		addIcon('latex-translator', `<svg>...</svg>`); // Add your icon SVG here
		const ribbonIcon = this.addRibbonIcon('latex-translator', 'M|inc LaTeX Translator', () => {
			this.activateView();
		});
		ribbonIcon.addClass('minc-latex-translator-ribbon-icon');

		// Add command to open LaTeX Translator
		this.addCommand({
			id: 'open-latex-translator',
			name: 'Open LaTeX Translator',
			callback: () => {
				this.activateView();
			}
		});

		// Add command to convert selection
		this.addCommand({
			id: 'convert-selection-to-obsidian-latex',
			name: 'Convert Selection',
			icon: 'function',
			hotkeys: [{ modifiers: ['Mod', 'Shift'], key: 'l' }],
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection();
				if (selection) {
					try {
						const converted = parseLatexToObsidian(selection, this.settings);
						editor.replaceSelection(converted);
						if (this.settings.showNotifications) {
							new Notice('LaTeX converted successfully!');
						}
					} catch (error) {
						logger.error('Error converting LaTeX:', error);
						if (this.settings.showNotifications) {
							new Notice('Error converting LaTeX: ' + (error instanceof Error ? error.message : 'Unknown error'));
						}
					}
				}
			}
		});

		// Add command to convert entire folder
		this.addCommand({
			id: 'convert-folder-to-obsidian-latex',
			name: 'Convert Folder',
			icon: 'folder-plus',
			callback: async () => {
				try {
					const folderPath = await new Promise<string | null>((resolve) => {
						new PromptModal(
							this.app,
							'Enter the folder path to convert:',
							resolve
						).open();
					});

					if (!folderPath) {
						return;
					}

					const targetFolder = this.app.vault.getAbstractFileByPath(folderPath);
					if (!this.isTFolder(targetFolder)) {
						new Notice('Selected path is not a folder');
						return;
					}

					const files = targetFolder.children
						.filter((file): file is TFile =>
							file instanceof TFile && file.extension === 'md'
						);

					let successCount = 0;
					let errorCount = 0;
					
					for (const file of files) {
						try {
							const content = await this.app.vault.read(file);
							const converted = parseLatexToObsidian(content, this.settings);
							await this.app.vault.modify(file, converted);
							successCount++;
						} catch (error) {
							logger.error(`Error converting file ${file.path}:`, error);
							errorCount++;
						}
					}

					if (this.settings.showNotifications) {
						new Notice(
							`Conversion complete!\n${successCount} files converted successfully.\n${errorCount} files had errors.`
						);
					}
				} catch (error) {
					logger.error('Error in folder conversion:', error);
					if (this.settings.showNotifications) {
						new Notice('Error converting folder: ' + (error instanceof Error ? error.message : 'Unknown error'));
					}
				}
			}
		});

		// Add settings tab
		this.addSettingTab(new MincLatexSettingTab(this.app, this));

		logger.info('M|inc LaTeX Translator plugin loaded successfully');
	}

	async onunload() {
		logger.info('Unloading M|inc LaTeX Translator plugin...');
		
		// Clean up view
		if (this.activeView) {
			await this.app.workspace.detachLeavesOfType(LATEX_VIEW_TYPE);
			this.activeView = null;
		}
	}

	async activateView() {
		try {
			const leaves = this.app.workspace.getLeavesOfType(LATEX_VIEW_TYPE);
			
			if (leaves.length > 0) {
				// View already exists, just reveal it
				this.app.workspace.revealLeaf(leaves[0]);
				return;
			}

			// Create new leaf and view
			const leaf = this.app.workspace.getRightLeaf(false);
			if (!leaf) {
				throw new Error('Could not create sidebar leaf');
			}
			await leaf.setViewState({ type: LATEX_VIEW_TYPE });
			this.app.workspace.revealLeaf(leaf);
		} catch (error) {
			logger.error('Error activating LaTeX Translator view:', error);
			if (this.settings.showNotifications) {
				new Notice('Error opening LaTeX Translator: ' + (error instanceof Error ? error.message : 'Unknown error'));
			}
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		logger.setNotifications(this.settings.showNotifications);
	}
}

export default MincLatexTranslatorPlugin;
