import { ItemView, WorkspaceLeaf, App } from 'obsidian';
import { Root, createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { ReactView } from '@views/index';
import { AppContext } from '@core/context';

export const LATEX_VIEW_TYPE = 'latex-translator-view';

export class LatexView extends ItemView {
	root: Root | null = null;
	app: App;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.app = (this.leaf as any).app;
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
					<ReactView app={this.app} />
				</AppContext.Provider>
			</StrictMode>
		);
	}

	async onClose(): Promise<void> {
		this.root?.unmount();
	}
}
