import { ItemView, WorkspaceLeaf } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { ReactView } from './ReactView';
import { AppContext } from '../context';

export const LATEX_VIEW_TYPE = 'latex-translator-view';

export class LatexView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return LATEX_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'LaTeX Translator';
	}

	async onOpen(): Promise<void> {
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<StrictMode>
				<AppContext.Provider value={this.app}>
				<ReactView />
				</AppContext.Provider>
				</StrictMode>
		);
	}

	async onClose(): Promise<void> {
		this.root?.unmount();
	}
}
