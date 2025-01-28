import { Plugin, WorkspaceLeaf, Editor, MarkdownView, Notice } from 'obsidian';
import { LatexView, LATEX_VIEW_TYPE } from './src/views/LatexView';
import { MincLatexSettings, DEFAULT_SETTINGS, MincLatexSettingTab } from './src/settings';
import { parseLatexToObsidian } from './src/latexParser';
import { logger } from './src/utils/logger';
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

export default class MyPlugin extends Plugin {
	settings: MincLatexSettings;

	async onload() {
		await this.loadSettings();

		// Configure logger
		logger.setNotifications(this.settings.showNotifications);

		this.registerView(
			LATEX_VIEW_TYPE,
			(leaf: WorkspaceLeaf) => new LatexView(leaf)
		);

		// Add ribbon icon for LaTeX Translator
		this.addRibbonIcon('function', 'M|inc LaTeX Translator', () => {
			this.activateView();
		});

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
						if (this.settings.showNotifications) {
							new Notice('Error converting LaTeX: ' + (error instanceof Error ? error.message : 'Unknown error'));
						}
					}
				}
			}
		});

		// Utility function to check if a file is a folder
		function isTFolder(file: TAbstractFile | null): file is TFolder {
			return file instanceof TFolder;
		}

		// Add command to convert entire folder
		this.addCommand({
			id: 'convert-folder-to-obsidian-latex',
			name: 'Convert Folder',
			icon: 'folder-plus',
			callback: async () => {
				try {
					// Prompt user to enter a folder path
					const folderPath = await new Promise<string | null>((resolve) => {
						new PromptModal(
							this.app,
							'Enter the folder path to convert:',
							resolve
						).open();
					});

					if (!folderPath) return;

					// Get folder abstract file
					const targetFolder = this.app.vault.getAbstractFileByPath(folderPath);
					if (!isTFolder(targetFolder)) {
						new Notice('Selected path is not a folder');
						return;
					}

					// Filter target folder children for markdown files
					const files = targetFolder.children
						.filter((file): file is TFile =>
							file instanceof TFile && file.extension === 'md'
						);

					let successCount = 0; // Keep track of successful conversions
					for (const file of files) {
						const content = await this.app.vault.read(file); // Read file content
						const converted = parseLatexToObsidian(content, this.settings); // Convert content
						await this.app.vault.modify(file, converted); // Save converted content
						successCount++;
					}

					// Notify user of conversion success
					if (this.settings.showNotifications) {
						new Notice(`Converted ${successCount} files successfully!`);
					}
				} catch (error) {
					// Handle errors gracefully
					if (this.settings.showNotifications) {
						new Notice(
							'Error converting folder: ' +
							(error instanceof Error
								? error.message
								: 'Unknown error')
						);
					}
					logger.error('Error converting folder:', error);
				}
			}
		});

		this.addSettingTab(new MincLatexSettingTab(this.app, this));

		// Register paste event handler for auto-replace
		if (this.settings.autoReplace) {
			this.registerEvent(
				// Handle paste events for auto-conversion
				this.app.workspace.on('editor-paste', (evt: ClipboardEvent, editor: Editor) => {
					if (evt.clipboardData) {
						const text = evt.clipboardData.getData('text');
						try {
							const converted = parseLatexToObsidian(text, this.settings);
							evt.preventDefault();
							editor.replaceSelection(converted);
						} catch (error) {
							logger.error('Auto-replace failed:', error);
							console.error('Auto-replace failed:', error);
						}
					}
				})
			);
		}
	}

	onunload() {
		this.app.workspace.detachLeavesOfType(LATEX_VIEW_TYPE);
	}

	async activateView() {
		try {
			const { workspace } = this.app;

			// Get the first leaf with the specific LATEX_VIEW_TYPE, or null if none exists
			let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(LATEX_VIEW_TYPE)[0];

			// If no leaf exists, create a new one
			if (!leaf) {
				const newLeaf = workspace.getRightLeaf(false);

				// Ensure that newLeaf is not null
				if (!newLeaf) {
					throw new Error("Failed to create a new workspace leaf.");
				}

				leaf = newLeaf;

				await leaf.setViewState({
					type: LATEX_VIEW_TYPE,
					active: true,
				});
			}

			// Now reveal the leaf safely
			workspace.revealLeaf(leaf);
		} catch (error) {
			// Log the error and notify the user
			logger.error('Failed to activate LaTeX view:', error);
			new Notice('Failed to open LaTeX Translator view');
		}
	}

	async loadSettings() {
		try {
			const loadedData = await this.loadData();
			this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
		} catch (error) {
			logger.error('Failed to load settings:', error);
			this.settings = Object.assign({}, DEFAULT_SETTINGS);
		}
	}

	async saveSettings() {
		try {
			await this.saveData(this.settings);
		} catch (error) {
			logger.error('Failed to save settings:', error);
			new Notice('Failed to save settings');
		}
	}
}
