import { App, PluginSettingTab, Setting } from 'obsidian';
import LatexTranslatorPlugin from '../../main';

export class LatexTranslatorSettingTab extends PluginSettingTab {
    plugin: LatexTranslatorPlugin;

    constructor(app: App, plugin: LatexTranslatorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'LaTeX Translator Settings' });

        // Preview Settings
        containerEl.createEl('h3', { text: 'Preview Settings' });

        new Setting(containerEl)
            .setName('Render Immediately')
            .setDesc('Automatically render math preview when editing')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.renderImmediately)
                .onChange(async (value) => {
                    this.plugin.settings.renderImmediately = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Use Callouts')
            .setDesc('Convert theorem environments to Obsidian callouts')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.useCallouts)
                .onChange(async (value) => {
                    this.plugin.settings.useCallouts = value;
                    await this.plugin.saveSettings();
                }));

        // Equation Settings
        containerEl.createEl('h3', { text: 'Equation Settings' });

        new Setting(containerEl)
            .setName('Auto-Number Equations')
            .setDesc('Automatically number equations when converting from LaTeX')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.autoNumberEquations)
                .onChange(async (value) => {
                    this.plugin.settings.autoNumberEquations = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Preserve Labels')
            .setDesc('Keep LaTeX labels for cross-referencing')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.preserveLabels)
                .onChange(async (value) => {
                    this.plugin.settings.preserveLabels = value;
                    await this.plugin.saveSettings();
                }));
    }
}
