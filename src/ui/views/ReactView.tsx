// ReactView.tsx

// Import Statements
import * as React from "react"; // Named import to comply without 'allowSyntheticDefaultImports'
import { useCallback, useState, createContext, useContext } from "react";
import { Notice, TFolder, TFile, Modal, App } from "obsidian";
import { parseLatexToObsidian, ParserOptions } from "@core/parser"; // Ensure correct path
import { FileConversionProgress } from "@views/index"; // Using named import

// Define Parser Options
const DEFAULT_PARSER_OPTIONS: ParserOptions = {
	convertEnvironments: true,
	removeLabels: false,
	handleRefs: "placeholder",
	expandMacros: true,
	convertCitations: true,
	removeLeftRight: false,
	unifyTextToMathrm: true,
};

/**
 * Context to provide the Obsidian App instance to React components.
 */
interface AppContextType {
	app: App;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * AppProvider component to wrap around React components and provide the Obsidian App via context.
 */
const AppProvider: React.FC<{ app: App; children: React.ReactNode }> = ({ app, children }) => {
	return <AppContext.Provider value={{ app }}>{children}</AppContext.Provider>;
};

/**
 * Custom hook to use the App context.
 * Ensures that the hook is used within an AppProvider.
 */
const useApp = (): App => {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("useApp must be used within an AppProvider");
	}
	return context.app;
};

/**
 * Modal for selecting a folder path.
 */
class FolderSelectModal extends Modal {
	private resolve: (folderPath: string | null) => void;

	constructor(app: App, resolve: (folderPath: string | null) => void) {
		super(app);
		this.resolve = resolve;
	}

	onOpen() {
		const { contentEl } = this;

		// Modal Title
		contentEl.createEl("h2", { text: "Select Folder" });

		// Input for folder path with CSS class
		const input = contentEl.createEl("input", {
			type: "text",
			placeholder: "Enter folder path",
			cls: "folder-input", // Apply CSS class for styling
		});

		// Confirm and Cancel buttons container
		const buttonsContainer = contentEl.createDiv({ cls: "buttons-container" });

		const confirmButton = buttonsContainer.createEl("button", { text: "Confirm" });
		confirmButton.style.marginRight = "10px"; // Inline style for spacing
		const cancelButton = buttonsContainer.createEl("button", { text: "Cancel" });

		confirmButton.onclick = () => {
			const path = input.value.trim();
			this.resolve(path || null);
			this.close();
		};

		cancelButton.onclick = () => {
			this.resolve(null); // Return null if canceled
			this.close();
		};
	}

	onClose() {
		this.contentEl.empty();
	}
}

/**
 * React component for the LaTeX Translator view.
 * This component is wrapped with AppProvider to access the Obsidian App instance.
 */
export default function ReactView({ app }: { app: App }) {
	const [input, setInput] = useState<string>("");
	const [output, setOutput] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [isConverting, setIsConverting] = useState<boolean>(false);
	const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

	const convertFile = useCallback(
		async (file: TFile): Promise<boolean> => {
			try {
				const content = await useApp().vault.read(file);
				const converted = parseLatexToObsidian(content, DEFAULT_PARSER_OPTIONS);
				await useApp().vault.modify(file, converted);
				return true;
			} catch (error) {
				console.error(`Error converting ${file.path}:`, error);
				return false;
			}
		},
		[]
	);

	const processFolder = useCallback(
		async (folder: TFolder): Promise<{ total: number; success: number }> => {
			const files = folder.children.filter(
				(file): file is TFile => file instanceof TFile && file.extension === "md"
			);

			setProgress({ current: 0, total: files.length });

			let successCount = 0;
			for (let i = 0; i < files.length; i++) {
				const file = files[i];
				try {
					await convertFile(file);
					successCount++;
				} catch (error) {
					console.error(`Error converting file ${file.path}:`, error);
				}
				setProgress({ current: i + 1, total: files.length });
			}

			return { total: files.length, success: successCount };
		},
		[convertFile, setProgress]
	);

	const handleFolderConversion = useCallback(async () => {
		const app = useApp();
		const folderPath = await new Promise<string | null>((resolve) => {
			new FolderSelectModal(app, resolve).open(); // Open folder selection modal
		});

		if (!folderPath) {
    return;
  } // Exit if no folder is selected

		const targetFolder = app.vault.getAbstractFileByPath(folderPath);
		if (!(targetFolder instanceof TFolder)) {
			new Notice("The selected path is not a folder");
			return;
		}

		setIsConverting(true);
		try {
			const result = await processFolder(targetFolder);
			new Notice(`Conversion complete! ${result.success} of ${result.total} files converted.`);
		} catch (error) {
			new Notice(
				"Error during folder conversion: " + (error instanceof Error ? error.message : "Unknown error")
			);
			console.error("Folder conversion error:", error);
		} finally {
			setIsConverting(false);
			setProgress({ current: 0, total: 0 });
		}
	}, [processFolder]);

	const handleVaultConversion = useCallback(async () => {
		const confirmMessage =
			"Are you sure you want to convert all markdown files in the vault? This cannot be undone.";
		if (!confirm(confirmMessage)) {
    return;
  }

		const files = useApp().vault.getMarkdownFiles();
		setProgress({ current: 0, total: files.length });
		setIsConverting(true);

		let successCount = 0;
		for (let i = 0; i < files.length; i++) {
			if (await convertFile(files[i])) {
				successCount++;
			}
			setProgress((prev) => ({ ...prev, current: i + 1 }));
		}

		new Notice(
			`Vault conversion complete!\n${successCount} of ${files.length} files converted successfully.`
		);

		setIsConverting(false);
		setProgress({ current: 0, total: 0 });
	}, [convertFile]);

	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			const newInput = e.target.value;
			setInput(newInput);

			try {
				const converted = parseLatexToObsidian(newInput, DEFAULT_PARSER_OPTIONS);
				setOutput(converted);
				setError(null);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
				new Notice("Error converting LaTeX: " + (err instanceof Error ? err.message : "Unknown error"));
			}
		},
		[]
	);

	const handleCopy = useCallback(() => {
		if (output) {
			navigator.clipboard
				.writeText(output)
				.then(() => new Notice("Converted LaTeX copied to clipboard!"))
				.catch(() => new Notice("Failed to copy to clipboard"));
		}
	}, [output]);

	return (
		<AppProvider app={app}>
			<div className="latex-translator-view">
				<div className="batch-conversion-buttons">
					<button className="mod-cta" onClick={handleFolderConversion} disabled={isConverting}>
						Convert Folder
					</button>
					<button className="mod-warning" onClick={handleVaultConversion} disabled={isConverting}>
						Convert Entire Vault
					</button>
				</div>
				{isConverting && <FileConversionProgress current={progress.current} total={progress.total} />}
				<div className="latex-input-section">
					<h4>LaTeX Input</h4>
					<textarea
						className="latex-input"
						placeholder="Enter LaTeX here..."
						value={input}
						onChange={handleInputChange}
					/>
				</div>
				<div className="latex-output-section">
					<div className="output-header">
						<h4>Obsidian Preview</h4>
						<button className="copy-button" onClick={handleCopy} disabled={!output}>
							Copy
						</button>
					</div>
					<div className={`latex-preview ${error ? "error" : ""}`}>
						{error ? <div className="error-message">{error}</div> : output || "Preview will appear here..."}
					</div>
				</div>
			</div>
		</AppProvider>
	);

	/**
	 * Initialize the React application and render ReactView.
	 * This part should be handled in your main plugin file, not within ReactView.tsx.
	 * Provided here for completeness.
	 */

	// Example: In your main plugin file (e.g., main.ts), you would render the React component like this:

	/*
import { Plugin } from "obsidian";
import * as React from "react";
import { render } from "react-dom";
import { AppProvider, ReactView } from "./ReactView"; // Adjust the path as necessary

export default class LaTeXTranslatorPlugin extends Plugin {
  onload() {
    // Create a container for the React app
    const container = document.createElement("div");
    container.id = "react-view-container";
    this.app.workspace.getRightLeaf(false).setViewState({
      type: "react-view", // Ensure this view type is registered
      active: true,
    });

    // Append the container to the leaf
    this.app.workspace.activeLeaf.view.containerEl.appendChild(container);

    // Render the React app
    render(
      <AppProvider app={this.app}>
        <ReactView />
      </AppProvider>,
      container
    );
  }

  onunload() {
    // Clean up the React app when the plugin is unloaded
    const container = document.getElementById("react-view-container");
    if (container) {
      unmountComponentAtNode(container);
      container.remove();
    }
  }
}
	*/
}
