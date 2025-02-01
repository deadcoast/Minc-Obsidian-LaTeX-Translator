import { Plugin } from 'obsidian';
import { LatexTranslatorSettings } from './settings/settings';
import LatexParser from './core/parser/latexParser';
import { View } from 'obsidian';

export interface ILatexTranslatorPlugin extends Plugin {
  settings: LatexTranslatorSettings;
  parser: LatexParser;
  activeView: View | null;
  isProcessing: boolean;
  loadSettings(): Promise<void>;
  saveSettings(): Promise<void>;
  getSettings(): LatexTranslatorSettings;
  setSettings(settings: LatexTranslatorSettings): void;
}
