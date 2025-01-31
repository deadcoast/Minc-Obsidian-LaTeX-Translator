import { App, Modal, MarkdownRenderer, Component, MarkdownView } from 'obsidian';
import { HelpContent, HelpSection } from './HelpContent';

export class HelpManager {
    private static instance: HelpManager;
    private app: App;

    private constructor(app: App) {
        this.app = app;
    }

    public static getInstance(app: App): HelpManager {
        if (!HelpManager.instance) {
            HelpManager.instance = new HelpManager(app);
        }
        return HelpManager.instance;
    }

    public showHelp(section?: string): void {
        new HelpModal(this.app, section).open();
    }

    public async renderHelpContent(containerEl: HTMLElement, section?: string, component?: Component): Promise<void> {
        const content = section ? HelpContent[section as keyof typeof HelpContent] : HelpContent.overview;
        const activeView = component ?? this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) {
            throw new Error('No active markdown view found to render markdown');
        }
        await MarkdownRenderer.renderMarkdown(content, containerEl, '', activeView);
    }

    public getHelpSections(): HelpSection[] {
        return [
            { id: 'overview', title: 'Overview', icon: 'info' },
            { id: 'getting-started', title: 'Getting Started', icon: 'play' },
            { id: 'features', title: 'Features', icon: 'list' },
            { id: 'settings', title: 'Settings', icon: 'settings' },
            { id: 'commands', title: 'Commands', icon: 'terminal' },
            { id: 'examples', title: 'Examples', icon: 'code' },
            { id: 'troubleshooting', title: 'Troubleshooting', icon: 'help' },
            { id: 'batch-operations', title: 'Batch Operations', icon: 'files' },
            { id: 'keyboard-shortcuts', title: 'Keyboard Shortcuts', icon: 'keyboard' }
        ];
    }
}

export class HelpModal extends Modal {
    private currentSection: string;

    constructor(app: App, section?: string) {
        super(app);
        this.currentSection = section || 'overview';
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('latex-translator-help-modal');

        // Create navigation sidebar
        const container = contentEl.createDiv({ cls: 'help-container' });
        const sidebar = container.createDiv({ cls: 'help-sidebar' });
        const content = container.createDiv({ cls: 'help-content' });

        // Add search bar
        const searchContainer = sidebar.createDiv({ cls: 'help-search' });
        const searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: 'Search documentation...'
        });

        searchInput.addEventListener('input', (e) => {
            const query = (e.target as HTMLInputElement).value.toLowerCase();
            this.filterSections(query);
        });

        // Add navigation items
        const nav = sidebar.createDiv({ cls: 'help-nav' });
        HelpManager.getInstance(this.app).getHelpSections().forEach(section => {
            const item = nav.createDiv({ cls: 'help-nav-item' });
            if (section.id === this.currentSection) {
                item.addClass('active');
            }

            const icon = item.createSpan({ cls: 'help-nav-icon' });
            icon.setAttribute('data-icon', section.icon);
            
            item.createSpan({ cls: 'help-nav-title', text: section.title });
            
            item.addEventListener('click', () => {
                this.switchSection(section.id);
                nav.querySelectorAll('.help-nav-item').forEach(el => el.removeClass('active'));
                item.addClass('active');
            });
        });

        // Render initial content
        this.renderContent(content);
    }

    private async renderContent(containerEl: HTMLElement) {
        containerEl.empty();
        await HelpManager.getInstance(this.app).renderHelpContent(containerEl, this.currentSection, this as unknown as Component);

        // Add navigation buttons at the bottom
        const navButtons = containerEl.createDiv({ cls: 'help-nav-buttons' });
        const sections = HelpManager.getInstance(this.app).getHelpSections();
        const currentIndex = sections.findIndex(s => s.id === this.currentSection);

        if (currentIndex > 0) {
            const prevButton = navButtons.createEl('button', {
                cls: 'help-nav-button',
                text: `← ${sections[currentIndex - 1].title}`
            });
            prevButton.addEventListener('click', () => {
                this.switchSection(sections[currentIndex - 1].id);
            });
        }

        if (currentIndex < sections.length - 1) {
            const nextButton = navButtons.createEl('button', {
                cls: 'help-nav-button',
                text: `${sections[currentIndex + 1].title} →`
            });
            nextButton.addEventListener('click', () => {
                this.switchSection(sections[currentIndex + 1].id);
            });
        }
    }

    private switchSection(sectionId: string) {
        this.currentSection = sectionId;
        const contentEl = this.contentEl.querySelector('.help-content') as HTMLElement;
        if (contentEl) {
            this.renderContent(contentEl);
        }
    }

    private filterSections(query: string) {
        const navItems = this.contentEl.querySelectorAll<HTMLElement>('.help-nav-item');
        navItems.forEach(item => {
            const title = item.querySelector('.help-nav-title')?.textContent?.toLowerCase() || '';
            if (title.includes(query)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
