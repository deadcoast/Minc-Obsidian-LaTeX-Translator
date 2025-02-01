import { ItemView, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import * as React from 'react';
import {
  CommandHistory,
  CommandStatistics,
  ProductivityStats,
} from '../../core/history/commandHistory';

export const STATISTICS_VIEW_TYPE = 'latex-translator-statistics';

export class StatisticsView extends ItemView {
  private root: Root | null = null;
  private history: CommandHistory;

  constructor(leaf: WorkspaceLeaf, history: CommandHistory) {
    super(leaf);
    this.history = history;
  }

  getViewType(): string {
    return STATISTICS_VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'LaTeX Translator Statistics';
  }

  async onOpen(): Promise<void> {
    this.root = createRoot(this.containerEl);
    this.renderView();
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  private renderView(): void {
    if (!this.root) {
      return;
    }
    this.root.render(<StatisticsPanel history={this.history} />);
  }
}

interface StatisticsPanelProps {
  history: CommandHistory;
}

function StatisticsPanel({
  history,
}: StatisticsPanelProps): React.ReactElement {
  const [stats, setStats] = React.useState<CommandStatistics>(
    history.getStatistics()
  );
  const [productivity, setProductivity] = React.useState<ProductivityStats>(
    history.getProductivityStats()
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(history.getStatistics());
      setProductivity(history.getProductivityStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [history]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
  };

  return (
    <div className='latex-translator-statistics'>
      <div className='statistics-header'>
        <h2>LaTeX Translator Statistics</h2>
        <div className='statistics-summary'>
          <span>
            Success Rate: {formatNumber(productivity.successRate * 100)}%
          </span>
          <span>
            Commands/Hour: {formatNumber(productivity.commandsPerHour)}
          </span>
          <span>Uptime: {formatTime(productivity.uptime)}</span>
        </div>
      </div>

      <div className='statistics-grid'>
        <div className='statistics-card'>
          <h3>Productivity</h3>
          <div className='statistics-data'>
            <div>Total Commands: {stats.totalCommands}</div>
            <div>Successful: {stats.successfulCommands}</div>
            <div>Failed: {stats.failedCommands}</div>
            <div>
              Avg. Processing:{' '}
              {formatNumber(productivity.averageProcessingTime)}ms
            </div>
            <div>Peak Hour: {productivity.peakHour}:00</div>
          </div>
        </div>

        <div className='statistics-card'>
          <h3>Conversion Efficiency</h3>
          <div className='statistics-data'>
            <div>
              Math/Command:{' '}
              {formatNumber(productivity.conversionEfficiency.mathPerCommand)}
            </div>
            <div>
              Citations/Command:{' '}
              {formatNumber(
                productivity.conversionEfficiency.citationsPerCommand
              )}
            </div>
            <div>
              Environments/Command:{' '}
              {formatNumber(
                productivity.conversionEfficiency.environmentsPerCommand
              )}
            </div>
            <div>
              References/Command:{' '}
              {formatNumber(
                productivity.conversionEfficiency.referencesPerCommand
              )}
            </div>
            <div>
              Macros/Command:{' '}
              {formatNumber(productivity.conversionEfficiency.macrosPerCommand)}
            </div>
          </div>
        </div>

        {stats.errorStats.errorRate > 0 && (
          <div className='statistics-card error-card'>
            <h3>Common Errors</h3>
            <div className='statistics-data'>
              {Object.entries(stats.errorStats.commonErrors)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([error, count], index) => (
                  <div key={index} className='error-item'>
                    <span className='error-count'>{count}×</span>
                    <span className='error-message'>{error}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className='statistics-card'>
          <h3>Time Distribution</h3>
          <div className='statistics-data time-distribution'>
            {Object.entries(stats.timeStats.hourly)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([hour, count]) => (
                <div key={hour} className='hour-bar'>
                  <div
                    className='bar'
                    style={{
                      height: `${(count / Math.max(...Object.values(stats.timeStats.hourly))) * 100}%`,
                    }}
                  />
                  <span className='hour-label'>{hour}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className='statistics-footer'>
        <button
          className='mod-cta'
          onClick={(): void => history.clearHistory()}
        >
          Clear History
        </button>
      </div>
    </div>
  );
}
