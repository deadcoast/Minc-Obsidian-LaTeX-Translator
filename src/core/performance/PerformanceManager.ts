import { debounce } from 'obsidian';
import throttle from 'lodash.throttle';
import { logger } from '@utils/logger';

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

declare global {
  interface Performance {
    memory?: PerformanceMemory;
  }
}

export interface PerformanceMetrics {
  memoryUsage: number;
  processingTime: number;
  cacheSize: number;
  batchSize: number;
  queueLength: number;
}

export interface PerformanceConfig {
  maxMemoryUsage: number;
  maxBatchSize: number;
  maxQueueLength: number;
  chunkSize: number;
  cacheTimeout: number;
  workerCount: number;
}

export class PerformanceManager {
  private static instance: PerformanceManager;
  private metrics: PerformanceMetrics;
  private config: PerformanceConfig;
  private workers: Worker[] = [];
  private taskQueue: Array<() => Promise<void>> = [];
  private processing = false;
  private priority: number;

  private constructor() {
    this.metrics = {
      memoryUsage: 0,
      processingTime: 0,
      cacheSize: 0,
      batchSize: 0,
      queueLength: 0,
    };

    this.config = {
      maxMemoryUsage: 512 * 1024 * 1024, // 512MB
      maxBatchSize: 100,
      maxQueueLength: 1000,
      chunkSize: 50000, // 50KB
      cacheTimeout: 3600000, // 1 hour
      workerCount: navigator.hardwareConcurrency || 4,
    };

    this.priority = 1; // Default priority level
    this.initializeWorkers();
  }

  public static getInstance(): PerformanceManager {
    if (!PerformanceManager.instance) {
      PerformanceManager.instance = new PerformanceManager();
    }
    return PerformanceManager.instance;
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.config.workerCount; i++) {
      const worker = new Worker('worker.js');
      worker.onmessage = this.handleWorkerMessage.bind(this);
      this.workers.push(worker);
    }
  }

  private handleWorkerMessage(event: MessageEvent): void {
    // Handle worker responses
    logger.info('Worker response', event.data);
  }

  public async processBatch<T>(
    items: T[],
    processor: (item: T) => Promise<void>,
    options: { priority?: number; chunkSize?: number } = {}
  ): Promise<void> {
    const chunks = this.createChunks(
      items,
      options.chunkSize || this.config.chunkSize
    );
    const tasks = chunks.map((chunk) => async () => {
      await this.processChunk(chunk, processor);
    });

    await this.scheduleTask(tasks, options.priority);
  }

  private createChunks<T>(items: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      chunks.push(items.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async processChunk<T>(
    chunk: T[],
    processor: (item: T) => Promise<void>
  ): Promise<void> {
    const startTime = performance.now();
    const startMemory = this.getCurrentMemoryUsage();

    try {
      await Promise.all(chunk.map(processor));
    } finally {
      const endTime = performance.now();
      const endMemory = this.getCurrentMemoryUsage();

      this.updateMetrics({
        processingTime: endTime - startTime,
        memoryUsage: endMemory - startMemory,
      });
    }
  }

  private async scheduleTask(
    tasks: Array<() => Promise<void>>,
    priority?: number
  ): Promise<void> {
    // Add tasks to queue with priority
    const prioritizedTasks = tasks.map((task) => ({
      task,
      priority: priority ?? this.priority,
    }));
    this.taskQueue.push(...prioritizedTasks.map((pt) => pt.task));
    this.metrics.queueLength = this.taskQueue.length;

    if (!this.processing) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    this.processing = true;

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (task) {
        await this.executeWithMemoryCheck(task);
      }

      // Update metrics
      this.metrics.queueLength = this.taskQueue.length;

      // Allow other operations to proceed
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    this.processing = false;
  }

  private async executeWithMemoryCheck(
    task: () => Promise<void>
  ): Promise<void> {
    const currentMemory = this.getCurrentMemoryUsage();

    if (currentMemory > this.config.maxMemoryUsage) {
      await this.performGarbageCollection();
    }

    await task();
  }

  private getCurrentMemoryUsage(): number {
    if (performance && 'memory' in performance) {
      return performance.memory?.usedJSHeapSize || 0;
    }
    return 0;
  }

  private async performGarbageCollection(): Promise<void> {
    // Clear cache
    await this.clearCache();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    // Wait for memory to be freed
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  private updateMetrics(newMetrics: Partial<PerformanceMetrics>): void {
    this.metrics = { ...this.metrics, ...newMetrics };
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public async clearCache(): Promise<void> {
    // Implementation depends on caching mechanism
    this.metrics.cacheSize = 0;
  }

  // Debounced version of processBatch for frequent calls
  public debouncedProcessBatch = <T>(
    items: T[],
    processor: (item: T) => Promise<void>,
    options?: { priority?: number; chunkSize?: number }
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const debouncedFn = debounce(
        async (
          items: T[],
          processor: (item: T) => Promise<void>,
          options?: { priority?: number; chunkSize?: number }
        ) => {
          try {
            await this.processBatch(items, processor, options);
            resolve();
          } catch (error) {
            reject(error);
          }
        },
        1000,
        true
      );
      debouncedFn(items, processor, options);
    });
  };

  // Throttled version for real-time processing
  public throttledProcessBatch: <T>(
    items: T[],
    processor: (item: T) => Promise<void>,
    options?: { priority?: number; chunkSize?: number }
  ) => Promise<void> = throttle(
    (
      items: unknown[],
      processor: (item: unknown) => Promise<void>,
      options?: { priority?: number; chunkSize?: number }
    ) => this.processBatch(items, processor, options),
    100
  );
}
