// Import Statements
import * as React from "react"; // Adjusted to named import to comply without 'allowSyntheticDefaultImports'
import { useCallback, useState } from "react";
import { Notice, TFolder, TFile, Modal, App } from "obsidian";
import { useApp } from "../hooks";
import { parseLatexToObsidian, ParserOptions } from "../latexParser";
import * as React from "react";
import { render } from "react-dom";
import { AppProvider } from "obsidian";
import { ReactView } from "src/views/ReactView.tsx";
import { App as ObsidianApp } from "obsidian";
// Import the FileConversionProgress component
import FileConversionProgress from "./FileConversionProgress"; // Ensure this path is correct

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

const app: ObsidianApp = /Applications/Obsidian.app; // Initialize your Obsidian app instance

render(
	<AppProvider app={app}>
		<ReactView />
	</AppProvider>,
	document.getElementById("root")
);

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
 * React component for displaying file conversion progress.
 * Ensure that this component is defined correctly in './FileConversionProgress'.
 */
interface FileConversionProgressProps {
	current: number;
	total: number;
}

interface FileConversionProgressProps {
	current: number;
	total: number;
}

const FileConversionProgress: React.FC<FileConversionProgressProps> = ({ current, total }) => {
	const percentage = total === 0 ? 0 : (current / total) * 100;
	return (
		<div className="file-conversion-progress">
			<div className="progress-bar" style={{ width: `${percentage}%` }}></div>
			<span>{`Converting file ${current} of ${total}`}</span>
		</div>
	);
};

export default FileConversionProgress;


/**
 * React component for the LaTeX Translator view.
 */
export const ReactView: React.FC = () => {
	const app = useApp(); // Access the Obsidian app
	const [input, setInput] = useState<string>("");
	const [output, setOutput] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [isConverting, setIsConverting] = useState<boolean>(false);
	const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

	/**
	 * Converts a single markdown file by parsing its LaTeX content.
	 * @param file - The markdown file to convert.
	 * @returns A promise that resolves to true if conversion is successful, otherwise false.
	 */
	const convertFile = useCallback(
		async (file: TFile): Promise<boolean> => {
			try {
				const content = await app.vault.read(file);
				const converted = parseLatexToObsidian(content, DEFAULT_PARSER_OPTIONS);
				await app.vault.modify(file, converted);
				return true;
			} catch (error) {
				console.error(`Error converting ${file.path}:`, error);
				return false;
			}
		},
		[app.vault]
	);

	/**
	 * Handles changes in the LaTeX input textarea.
	 * Parses the input and updates the output preview.
	 * @param e - The change event from the textarea.
	 */
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

	/**
	 * Copies the converted LaTeX output to the clipboard.
	 */
	const handleCopy = useCallback(() => {
		if (output) {
			navigator.clipboard
				.writeText(output)
				.then(() => new Notice("Converted LaTeX copied to clipboard!"))
				.catch(() => new Notice("Failed to copy to clipboard"));
		}
	}, [output]);

	/**
	 * Processes all markdown files within a specified folder.
	 * @param folder - The target folder containing markdown files.
	 * @returns An object containing the total and successfully converted file counts.
	 */
	const processFolder = useCallback(
		async (folder: TFolder): Promise<{ total: number; success: number }> => {
			const files = folder.children.filter(
				(file): file is TFile => file instanceof TFile && file.extension === "md"
			);

			setProgress({ current: 0, total: files.length });

			let successCount = 0;
			for (let i = 0; i < files.length; i++) {
				if (await convertFile(files[i])) {
					successCount++;
				}
				setProgress((prev) => ({ ...prev, current: i + 1 }));
			}

			return { total: files.length, success: successCount };
		},
		[convertFile]
	);

	/**
	 * Initiates the folder conversion process by prompting the user to select a folder.
	 */
	const handleFolderConversion = useCallback(async () => {
		const folderPath = await new Promise<string | null>((resolve) => {
			new FolderSelectModal(app, resolve).open(); // Open folder selection modal
		});

		if (!folderPath) return; // Exit if no folder is selected

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
	}, [app, processFolder]);

	/**
	 * Initiates the vault-wide conversion process after user confirmation.
	 */
	const handleVaultConversion = useCallback(async () => {
		const confirmMessage =
			"Are you sure you want to convert all markdown files in the vault? This cannot be undone.";
		if (!confirm(confirmMessage)) return;

		const files = app.vault.getMarkdownFiles();
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
	}, [convertFile, app.vault]);

	return (
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
	);
};
