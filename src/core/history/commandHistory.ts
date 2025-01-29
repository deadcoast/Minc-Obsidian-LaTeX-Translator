import { ParserOptions } from '../parser/latexParser';

export interface CommandHistoryEntry {
    timestamp: number;
    commandId: string;
    commandName: string;
    selectionLength: number;
    success: boolean;
    options: ParserOptions;
    duration?: number;
    errorMessage?: string;
    conversionStats?: {
        mathCount: number;
        citationCount: number;
        environmentCount: number;
        referenceCount: number;
        macroCount: number;
    };
}

export interface CommandStatistics {
    totalCommands: number;
    successfulCommands: number;
    failedCommands: number;
    averageSelectionLength: number;
    averageDuration?: number;
    commandCounts: Record<string, number>;
    lastUsed?: number;
    conversionTotals: {
        mathCount: number;
        citationCount: number;
        environmentCount: number;
        referenceCount: number;
        macroCount: number;
    };
    timeStats: {
        hourly: Record<number, number>;
        daily: Record<string, number>;
        weekly: Record<string, number>;
    };
    errorStats: {
        commonErrors: Record<string, number>;
        errorRate: number;
    };
}

export class CommandHistory {
    private static readonly MAX_HISTORY = 50;
    private history: CommandHistoryEntry[] = [];
    private startTime: number = Date.now();

    addEntry(entry: CommandHistoryEntry): void {
        this.history.unshift(entry);
        if (this.history.length > CommandHistory.MAX_HISTORY) {
            this.history.pop();
        }
    }

    getEntries(limit?: number): CommandHistoryEntry[] {
        return this.history.slice(0, limit);
    }

    getLastEntry(): CommandHistoryEntry | undefined {
        return this.history[0];
    }

    clearHistory(): void {
        this.history = [];
    }

    getStatistics(): CommandStatistics {
        const stats: CommandStatistics = {
            totalCommands: this.history.length,
            successfulCommands: 0,
            failedCommands: 0,
            averageSelectionLength: 0,
            averageDuration: 0,
            commandCounts: {},
            lastUsed: undefined,
            conversionTotals: {
                mathCount: 0,
                citationCount: 0,
                environmentCount: 0,
                referenceCount: 0,
                macroCount: 0
            },
            timeStats: {
                hourly: {},
                daily: {},
                weekly: {}
            },
            errorStats: {
                commonErrors: {},
                errorRate: 0
            }
        };

        if (this.history.length === 0) {
          return stats;
        }

        let totalSelectionLength = 0;
        let totalDuration = 0;

        this.history.forEach(entry => {
            // Basic stats
            if (entry.success) {
              stats.successfulCommands++;
            } else {
              stats.failedCommands++;
            }

            totalSelectionLength += entry.selectionLength;
            if (entry.duration) {
              totalDuration += entry.duration;
            }
            stats.commandCounts[entry.commandId] = (stats.commandCounts[entry.commandId] || 0) + 1;

            // Conversion stats
            if (entry.conversionStats) {
                stats.conversionTotals.mathCount += entry.conversionStats.mathCount;
                stats.conversionTotals.citationCount += entry.conversionStats.citationCount;
                stats.conversionTotals.environmentCount += entry.conversionStats.environmentCount;
                stats.conversionTotals.referenceCount += entry.conversionStats.referenceCount;
                stats.conversionTotals.macroCount += entry.conversionStats.macroCount;
            }

            // Time-based stats
            const entryDate = new Date(entry.timestamp);
            const hour = entryDate.getHours();
            const dayKey = entryDate.toISOString().split('T')[0];
            const weekKey = this.getWeekKey(entryDate);

            stats.timeStats.hourly[hour] = (stats.timeStats.hourly[hour] || 0) + 1;
            stats.timeStats.daily[dayKey] = (stats.timeStats.daily[dayKey] || 0) + 1;
            stats.timeStats.weekly[weekKey] = (stats.timeStats.weekly[weekKey] || 0) + 1;

            // Error stats
            if (!entry.success && entry.errorMessage) {
                stats.errorStats.commonErrors[entry.errorMessage] = 
                    (stats.errorStats.commonErrors[entry.errorMessage] || 0) + 1;
            }
        });

        // Calculate averages and rates
        stats.averageSelectionLength = totalSelectionLength / this.history.length;
        stats.averageDuration = totalDuration / this.history.length;
        stats.errorStats.errorRate = stats.failedCommands / stats.totalCommands;
        stats.lastUsed = this.history[0].timestamp;

        return stats;
    }

    getProductivityStats(): ProductivityStats {
        const stats = this.getStatistics();
        const uptime = Date.now() - this.startTime;

        return {
            commandsPerHour: (stats.totalCommands / (uptime / 3600000)),
            successRate: stats.successfulCommands / stats.totalCommands,
            averageProcessingTime: stats.averageDuration || 0,
            peakHour: this.findPeakHour(stats.timeStats.hourly),
            mostUsedCommand: this.findMostUsed(stats.commandCounts),
            totalContentProcessed: this.history.reduce((sum, entry) => sum + entry.selectionLength, 0),
            uptime: uptime,
            conversionEfficiency: {
                mathPerCommand: stats.conversionTotals.mathCount / stats.totalCommands,
                citationsPerCommand: stats.conversionTotals.citationCount / stats.totalCommands,
                environmentsPerCommand: stats.conversionTotals.environmentCount / stats.totalCommands,
                referencesPerCommand: stats.conversionTotals.referenceCount / stats.totalCommands,
                macrosPerCommand: stats.conversionTotals.macroCount / stats.totalCommands
            }
        };
    }

    private getWeekKey(date: Date): string {
        const year = date.getFullYear();
        const week = this.getWeekNumber(date);
        return `${year}-W${week}`;
    }

    private getWeekNumber(date: Date): number {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    private findPeakHour(hourly: Record<number, number>): number {
        return Object.entries(hourly)
            .reduce((peak, [hour, count]) => 
                count > (hourly[peak] || 0) ? parseInt(hour) : peak, 0);
    }

    private findMostUsed(counts: Record<string, number>): string {
        return Object.entries(counts)
            .reduce((peak, [cmd, count]) => 
                count > (counts[peak] || 0) ? cmd : peak, '');
    }
}

export interface ProductivityStats {
    commandsPerHour: number;
    successRate: number;
    averageProcessingTime: number;
    peakHour: number;
    mostUsedCommand: string;
    totalContentProcessed: number;
    uptime: number;
    conversionEfficiency: {
        mathPerCommand: number;
        citationsPerCommand: number;
        environmentsPerCommand: number;
        referencesPerCommand: number;
        macrosPerCommand: number;
    };
}
