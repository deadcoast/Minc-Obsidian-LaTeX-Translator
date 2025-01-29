import { App, PluginSettingTab, Setting } from 'obsidian';
import MincLatexTranslatorPlugin from '../../../main';

export interface MincLatexSettings {
  autoReplace: boolean;
  showNotifications: boolean;
  convertEnvironments: boolean;
  extraEnvironments: string[];
  convertEqnarray: boolean;
  removeLabels: boolean;
  handleRefs: 'ignore' | 'placeholder' | 'autoNumber';
  expandMacros: boolean;
  convertCitations: boolean;
  removeLeftRight: boolean;
  unifyTextToMathrm: boolean;
}

export const DEFAULT_SETTINGS: MincLatexSettings = {
  autoReplace: false,
  showNotifications: true,
  convertEnvironments: true,
  extraEnvironments: [],
  convertEqnarray: true,
  removeLabels: false,
  handleRefs: 'placeholder',
  expandMacros: true,
  convertCitations: true,
  removeLeftRight: false,
  unifyTextToMathrm: true
};

export class MincLatexSettingTab extends PluginSettingTab {
  plugin: MincLatexTranslatorPlugin;

  constructor(app: App, plugin: MincLatexTranslatorPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'M|inc LaTeX Translator Settings' });
    containerEl.createEl('p', { 
      text: 'Configure how LaTeX is converted to Obsidian-compatible format.',
      cls: 'setting-item-description'
    });

    this.createGeneralSettings(containerEl);
    this.createEnvironmentSettings(containerEl);
    this.createReferenceSettings(containerEl);
    this.createAdvancedSettings(containerEl);
  }

  private createGeneralSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'General Settings' });

    new Setting(containerEl)
      .setName('Auto Replace')
      .setDesc('Automatically convert LaTeX when pasting into the editor')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoReplace)
        .onChange(async (value) => {
          this.plugin.settings.autoReplace = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Show Notifications')
      .setDesc('Show success/error notifications when converting LaTeX')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showNotifications)
        .onChange(async (value) => {
          this.plugin.settings.showNotifications = value;
          await this.plugin.saveSettings();
        }));
  }

  private createEnvironmentSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'Environment Settings' });

    new Setting(containerEl)
      .setName('Convert Environments')
      .setDesc('Convert LaTeX environments to $$ blocks')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.convertEnvironments)
        .onChange(async (value) => {
          this.plugin.settings.convertEnvironments = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Extra Environments')
      .setDesc('Additional environment names to treat as display math (comma-separated)')
      .addText(text => text
        .setPlaceholder('matrix, bmatrix, pmatrix')
        .setValue(this.plugin.settings.extraEnvironments.join(', '))
        .onChange(async (value) => {
          this.plugin.settings.extraEnvironments = value
            .split(',')
            .map(env => env.trim())
            .filter(env => env.length > 0);
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Convert eqnarray')
      .setDesc('Convert eqnarray environments to $$ blocks')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.convertEqnarray)
        .onChange(async (value) => {
          this.plugin.settings.convertEqnarray = value;
          await this.plugin.saveSettings();
        }));
  }

  private createReferenceSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'Reference Settings' });

    new Setting(containerEl)
      .setName('Remove Labels')
      .setDesc('Remove \\label{} commands entirely')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.removeLabels)
        .onChange(async (value) => {
          this.plugin.settings.removeLabels = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Reference Handling')
      .setDesc('How to handle \\ref{} and \\eqref{} commands')
      .addDropdown(dropdown => dropdown
        .addOption('ignore', 'Leave as-is')
        .addOption('placeholder', 'Convert to (ref: label)')
        .addOption('autoNumber', 'Auto-number equations')
        .setValue(this.plugin.settings.handleRefs)
        .onChange(async (value) => {
          this.plugin.settings.handleRefs = value as 'ignore' | 'placeholder' | 'autoNumber';
          await this.plugin.saveSettings();
        }));
  }

  private createAdvancedSettings(containerEl: HTMLElement): void {
    containerEl.createEl('h3', { text: 'Advanced Settings' });

    new Setting(containerEl)
      .setName('Expand Macros')
      .setDesc('Expand custom macros from \\newcommand or \\renewcommand')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.expandMacros)
        .onChange(async (value) => {
          this.plugin.settings.expandMacros = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Convert Citations')
      .setDesc('Convert \\cite{} to [cite: ...]')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.convertCitations)
        .onChange(async (value) => {
          this.plugin.settings.convertCitations = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Remove \\left and \\right')
      .setDesc('Remove \\left and \\right commands from brackets')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.removeLeftRight)
        .onChange(async (value) => {
          this.plugin.settings.removeLeftRight = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Unify \\text to \\mathrm')
      .setDesc('Convert \\text{} to \\mathrm{}')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.unifyTextToMathrm)
        .onChange(async (value) => {
          this.plugin.settings.unifyTextToMathrm = value;
          await this.plugin.saveSettings();
        }));
  }
}