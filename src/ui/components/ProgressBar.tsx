import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { Notice } from 'obsidian';
import { formatDistance } from 'date-fns';

interface ProgressBarProps {
  progress: number;
  total: number;
  message?: string;
  onCancel?: () => void;
  style?: 'minimal' | 'detailed' | 'circular';
  position?: 'notice' | 'status' | 'floating';
  theme?: 'default' | 'colorful' | 'monochrome';
  showEstimatedTime?: boolean;
  showOperationDetails?: boolean;
  startTime?: number;
  operationDetails?: {
    type?: string;
    currentItem?: string;
    speed: number;
  };
}

export function ProgressBar({
  progress,
  total,
  message,
  onCancel,
  style = 'detailed',
  position = 'notice',
  theme = 'default',
  showEstimatedTime = true,
  showOperationDetails = true,
  startTime = Date.now(),
  operationDetails,
}: ProgressBarProps): React.ReactElement {
  const percentage = Math.round((progress / total) * 100);
  const [estimatedTimeLeft, setEstimatedTimeLeft] = React.useState<string>('');

  React.useEffect(() => {
    if (showEstimatedTime && progress > 0) {
      const elapsed = Date.now() - startTime;
      const rate = progress / elapsed;
      const remaining = (total - progress) / rate;
      setEstimatedTimeLeft(formatDistance(0, remaining));
    }
  }, [progress, total, startTime, showEstimatedTime]);

  return (
    <div
      className='latex-translator-progress'
      data-style={style}
      data-position={position}
      data-theme={theme}
      style={
        { '--progress-percentage': `${percentage}%` } as React.CSSProperties
      }
    >
      {style !== 'minimal' && (
        <div className='progress-header'>
          <span className='progress-message'>
            {message || `Processing ${progress} of ${total}`}
          </span>
          <span className='progress-percentage'>{percentage}%</span>
        </div>
      )}

      <div className='progress-bar-container'>
        {style === 'circular' ? (
          <div className='progress-circle' />
        ) : (
          <div className='progress-bar' />
        )}
      </div>

      {showEstimatedTime && estimatedTimeLeft && (
        <div className='progress-time'>
          Estimated time remaining: {estimatedTimeLeft}
        </div>
      )}

      {showOperationDetails && operationDetails && (
        <div className='progress-details'>
          <div>Type: {operationDetails.type}</div>
          <div>Current: {operationDetails.currentItem}</div>
          <div>Speed: {operationDetails.speed.toFixed(2)} items/s</div>
        </div>
      )}

      {onCancel && (
        <button
          className='progress-cancel'
          onClick={onCancel}
          aria-label='Cancel operation'
        >
          Cancel
        </button>
      )}
    </div>
  );
}

interface GlobalProgressOptions extends ProgressBarProps {
  persistent?: boolean;
}

export class GlobalProgress {
  private static notice: Notice | null = null;
  private static container: HTMLElement | null = null;
  private static root: ReturnType<typeof ReactDOM.createRoot> | null = null;
  private static startTime: number = Date.now();
  private static updateInterval: NodeJS.Timeout | null = null;
  private static operationDetails: {
    type: string;
    currentItem: string;
    speed: number;
    processed: number[];
  } = {
    type: '',
    currentItem: '',
    speed: 0,
    processed: [],
  };

  static show(props: GlobalProgressOptions): void {
    if (this.notice) {
      this.update(props);
      return;
    }

    this.startTime = Date.now();
    this.operationDetails = {
      type: props.operationDetails?.type || '',
      currentItem: props.operationDetails?.currentItem || '',
      speed: 0,
      processed: [],
    };

    this.notice = new Notice('', props.persistent ? 0 : 30000);
    this.container = this.notice.noticeEl;
    this.container.addClass('latex-translator-progress-notice');

    const progressContainer = this.container.createDiv();
    interface WindowWithReactDOM extends Window {
      ReactDOM: typeof ReactDOM;
    }
    this.root = (window as WindowWithReactDOM).ReactDOM.createRoot(
      progressContainer
    );

    // Start speed calculation interval
    this.updateInterval = setInterval(() => {
      const now = Date.now();
      const recentProcessed = this.operationDetails.processed.filter(
        (time) => now - time < 1000
      );
      this.operationDetails.processed = recentProcessed;
      this.operationDetails.speed = recentProcessed.length;

      if (this.root) {
        this.root.render(
          <ProgressBar
            {...props}
            startTime={this.startTime}
            operationDetails={{
              ...props.operationDetails,
              speed: this.operationDetails.speed,
            }}
          />
        );
      }
    }, 100);

    this.root.render(
      <ProgressBar
        {...props}
        startTime={this.startTime}
        operationDetails={this.operationDetails}
      />
    );
  }

  static update(props: GlobalProgressOptions): void {
    if (!this.root) {
      return;
    }

    if (props.progress > 0) {
      this.operationDetails.processed.push(Date.now());
    }

    this.root.render(
      <ProgressBar
        {...props}
        startTime={this.startTime}
        operationDetails={{
          ...props.operationDetails,
          speed: this.operationDetails.speed,
        }}
      />
    );
  }

  static hide(): void {
    if (this.notice) {
      this.notice.hide();
      this.notice = null;
    }
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.container = null;
    this.operationDetails = {
      type: '',
      currentItem: '',
      speed: 0,
      processed: [],
    };
  }
}
