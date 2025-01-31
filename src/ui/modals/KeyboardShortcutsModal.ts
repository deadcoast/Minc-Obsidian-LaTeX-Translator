import { App, Modal } from 'obsidian';

export class KeyboardShortcutsModal extends Modal {
    constructor(app: App) {
        super(app);
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('keyboard-shortcuts-modal');

        contentEl.createEl('h2', { text: 'LaTeX Translator Keyboard Shortcuts' });

        const shortcutsList = contentEl.createDiv('keyboard-shortcuts-list');

        // Quick Actions
        this.createShortcutSection(shortcutsList, 'Quick Actions', [
            ['Mod+L', 'Quick Convert'],
            ['Mod+Shift+L', 'Convert File'],
            ['Mod+Alt+Z', 'Undo Last'],
            ['Mod+Alt+A', 'Toggle Auto-Convert'],
            ['Mod+Alt+K', 'Show Shortcuts']
        ]);

        // Specific Conversions
        this.createShortcutSection(shortcutsList, 'Specific Conversions', [
            ['Mod+Alt+M', 'Convert Math'],
            ['Mod+Alt+C', 'Convert Citations'],
            ['Mod+Alt+R', 'Convert References'],
            ['Mod+Alt+E', 'Convert Environments'],
            ['Mod+Alt+P', 'Convert Paragraph']
        ]);

        // Tools & Statistics
        this.createShortcutSection(shortcutsList, 'Tools & Statistics', [
            ['Mod+Alt+S', 'Show Statistics'],
            ['Mod+,', 'Open Settings'],
            ['Mod+Alt+H', 'Command History'],
            ['Mod+Alt+V', 'Validation Report']
        ]);

        // Note about platform-specific modifier keys
        contentEl.createEl('p', {
            text: 'Note: "Mod" key is Command (⌘) on macOS and Control on Windows/Linux',
            cls: 'setting-item-description'
        });
    }

    private createShortcutSection(parent: HTMLElement, title: string, shortcuts: [string, string][]) {
        const section = parent.createDiv('keyboard-shortcuts-section');
        section.createEl('h3', { text: title });

        shortcuts.forEach(([key, desc]) => {
            const item = section.createDiv('keyboard-shortcut-item');
            item.createSpan({ text: key, cls: 'keyboard-shortcut-key' });
            item.createSpan({ text: desc, cls: 'keyboard-shortcut-desc' });
        });

        return section;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
