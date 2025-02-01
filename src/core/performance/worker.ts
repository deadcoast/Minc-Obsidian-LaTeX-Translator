interface WorkerMessage {
  type: 'process' | 'cancel';
  id: string;
  data: unknown;
  options?: WorkerOptions;
}

interface WorkerOptions {
  chunkSize?: number;
  timeout?: number;
}

interface WorkerResponse {
  type: 'result' | 'error' | 'progress';
  id: string;
  data?: unknown;
  error?: string;
  progress?: number;
}

// Handle incoming messages
self.onmessage = async (e: MessageEvent<WorkerMessage>): Promise<void> => {
  const { type, id, data, options } = e.data;

  switch (type) {
    case 'process':
      try {
        await processData(id, data, options);
      } catch (error) {
        sendError(id, error instanceof Error ? error.message : 'Unknown error');
      }
      break;

    case 'cancel':
      // Handle cancellation
      break;
  }
};

async function processData(
  id: string,
  data: unknown,
  options: WorkerOptions = {}
): Promise<void> {
  const { chunkSize = 1000, timeout = 30000 } = options;

  // Set processing timeout
  const timeoutId = setTimeout(() => {
    sendError(id, 'Processing timeout exceeded');
  }, timeout);

  try {
    if (Array.isArray(data)) {
      // Process array data in chunks
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        await processChunk(chunk);

        // Report progress
        const progress = Math.min(100, ((i + chunkSize) / data.length) * 100);
        sendProgress(id, progress);

        // Yield to main thread occasionally
        if (i % (chunkSize * 4) === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } else {
      // Process single item
      await processChunk([data]);
    }

    // Send final result
    sendResult(id, 'Processing complete');
  } finally {
    clearTimeout(timeoutId);
  }
}

async function processChunk(chunk: unknown[]): Promise<void> {
  // Process each item in the chunk
  await Promise.all(
    chunk.map(async (item) => {
      await processItem(item);
    })
  );
}

async function processItem(_item: unknown): Promise<void> {
  // Implement specific item processing logic
  // This is where you'd put the actual conversion logic
  await new Promise((resolve) => setTimeout(resolve, 1)); // Simulate processing
}

function sendResult(id: string, data: unknown): void {
  const response: WorkerResponse = {
    type: 'result',
    id,
    data,
  };
  self.postMessage(response);
}

function sendError(id: string, error: string): void {
  const response: WorkerResponse = {
    type: 'error',
    id,
    error,
  };
  self.postMessage(response);
}

function sendProgress(id: string, progress: number): void {
  const response: WorkerResponse = {
    type: 'progress',
    id,
    progress,
  };
  self.postMessage(response);
}

// Error handling
self.onerror = (event: Event | string): void => {
  console.error('Worker error:', event);
  self.postMessage({
    type: 'error',
    id: 'global',
    error: event instanceof ErrorEvent ? event.message : String(event),
  });
};

// Unhandled rejection handling
self.onunhandledrejection = (event: PromiseRejectionEvent): void => {
  console.error('Unhandled rejection:', event.reason);
  self.postMessage({
    type: 'error',
    id: 'global',
    error: event.reason?.message || 'Unhandled promise rejection',
  });
};
