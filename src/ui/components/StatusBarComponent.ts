import { setIcon } from 'obsidian';
import { CommandHistory, CommandStatistics, ProductivityStats } from '../../core/history/commandHistory';

export class LatexStatusBar {
    private element: HTMLElement;
    private iconEl: HTMLElement;
    private textEl: HTMLElement;
    private tooltipEl: HTMLElement;
    private history: CommandHistory;
    private updateInterval: number;

    constructor(statusBarEl: HTMLElement, history: CommandHistory) {
        this.element = statusBarEl;
        this.history = history;
        this.setupElements();
        this.updateStatus();

        // Update stats every minute
        this.updateInterval = window.setInterval(() => {
            this.updateStatus();
        }, 60000);
    }

    private setupElements() {
        this.element.empty();
        this.element.addClass('latex-translator-status');

        // Create icon element
        this.iconEl = this.element.createDiv('latex-translator-status-icon');
        setIcon(this.iconEl, 'sigma');

        // Create text element
        this.textEl = this.element.createDiv('latex-translator-status-text');
        this.textEl.setText('LaTeX');

        // Create tooltip element
        this.tooltipEl = this.element.createDiv('latex-translator-status-tooltip');
        this.tooltipEl.hide();

        // Add hover listeners
        this.element.addEventListener('mouseenter', () => {
            this.updateTooltip();
            this.tooltipEl.show();
        });

        this.element.addEventListener('mouseleave', () => {
            this.tooltipEl.hide();
        });
    }

    updateStatus(isConverting = false) {
        const stats = this.history.getStatistics();
        const productivity = this.history.getProductivityStats();
        
        // Update icon based on last operation
        if (isConverting) {
            setIcon(this.iconEl, 'loader-2');
            this.iconEl.addClass('rotating');
        } else {
            this.iconEl.removeClass('rotating');
            const lastEntry = this.history.getLastEntry();
            if (lastEntry) {
                setIcon(this.iconEl, lastEntry.success ? 'check' : 'x');
                setTimeout(() => setIcon(this.iconEl, 'sigma'), 2000);
            } else {
                setIcon(this.iconEl, 'sigma');
            }
        }

        // Update text with success rate and commands per hour
        if (stats.totalCommands > 0) {
            const successRate = Math.round((stats.successfulCommands / stats.totalCommands) * 100);
            const commandsPerHour = Math.round(productivity.commandsPerHour);
            this.textEl.setText(`LaTeX (${successRate}% | ${commandsPerHour}/h)`);
        }
    }

    private formatTime(ms: number): string {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
    }

    private formatNumber(num: number): string {
        return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    private updateTooltip() {
        const stats = this.history.getStatistics();
        const productivity = this.history.getProductivityStats();
        const lastEntry = this.history.getLastEntry();

        this.tooltipEl.empty();
        
        // Create tooltip content
        const content = this.tooltipEl.createDiv('tooltip-content');
        
        // Add statistics
        content.createEl('div', { text: `Total Commands: ${stats.totalCommands}` });
        content.createEl('div', { text: `Success Rate: ${Math.round((stats.successfulCommands / stats.totalCommands) * 100)}%` });

        // Add last command info
        if (lastEntry) {
            content.createEl('hr');
            content.createEl('div', { text: 'Last Command:' });
            content.createEl('div', { text: lastEntry.commandName });
            content.createEl('div', { 
                text: `Status: ${lastEntry.success ? 'Success' : 'Failed'}`,
                cls: lastEntry.success ? 'success' : 'error'
            });
            content.createEl('div', { 
                text: new Date(lastEntry.timestamp).toLocaleTimeString() 
                });
        }

        // Add keyboard shortcuts section
        const shortcutsSection = content.createDiv('tooltip-section');
        shortcutsSection.createEl('h4', { text: 'Keyboard Shortcuts' });
        const shortcuts = [
            ['Mod+L', 'Quick Convert'],
            ['Mod+Shift+L', 'Convert File'],
            ['Mod+Alt+M', 'Convert Math'],
            ['Mod+Alt+C', 'Convert Citations'],
            ['Mod+Alt+R', 'Convert References'],
            ['Mod+Alt+Z', 'Undo Last'],
            ['Mod+Alt+E', 'Convert Environments'],
            ['Mod+Alt+P', 'Convert Paragraph'],
            ['Mod+Alt+S', 'Show Statistics']
        ];

        shortcuts.forEach(([key, desc]) => {
            const shortcutEl = shortcutsSection.createEl('div', { cls: 'shortcut-item' });
            shortcutEl.createEl('span', { text: key, cls: 'shortcut-key' });
            shortcutEl.createEl('span', { text: desc, cls: 'shortcut-desc' });
        });
    }

    startConverting() {
        this.updateStatus(true);
    }

    finishConverting() {
        this.updateStatus(false);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}
