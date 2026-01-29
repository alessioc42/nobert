// TODO better error handling and logging

import { Ollama, type ChatRequest, type ChatResponse, type GenerateRequest, type GenerateResponse } from 'ollama';

type QueuePositionCallback = (position: number, total: number) => void;

interface QueuedRequest<T> {
  id: string;
  priority: number;
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  positionCallback?: QueuePositionCallback;
}

interface OllamaQueueOptions {
  model: string;
  apiUrl?: string;
  enablePriorityQueue?: boolean;
}

interface ChatOptions {
  messages: ChatRequest['messages'];
  options?: ChatRequest['options'];
  format?: ChatRequest['format'];
  stream?: false;
  keepAlive?: ChatRequest['keep_alive'];
  positionCallback?: QueuePositionCallback;
  priority?: number;
}

interface GenerateOptions {
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  options?: GenerateRequest['options'];
  format?: GenerateRequest['format'];
  stream?: false;
  keepAlive?: GenerateRequest['keep_alive'];
  positionCallback?: QueuePositionCallback;
  priority?: number;
}

export class OllamaQueue {
  private client: Ollama;
  private model: string;
  private queue: QueuedRequest<unknown>[] = [];
  private isProcessing = false;
  private requestCounter = 0;
  private enablePriorityQueue: boolean;

  constructor(options: OllamaQueueOptions) {
    this.model = options.model;
    this.client = new Ollama({ host: options.apiUrl });
    this.enablePriorityQueue = options.enablePriorityQueue ?? false;
  }

  private generateRequestId(): string {
    return `req_${++this.requestCounter}_${Date.now()}`;
  }

  private notifyQueuePositions(): void {
    this.queue.forEach((request, index) => {
      request.positionCallback?.(index + 1, this.queue.length);
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      this.notifyQueuePositions();

      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.isProcessing = false;
  }

  private enqueue<T>(
    execute: () => Promise<T>,
    positionCallback?: QueuePositionCallback,
    priority: number = 0
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest<T> = {
        id: this.generateRequestId(),
        priority,
        execute,
        resolve: resolve as (value: unknown) => void,
        reject,
        positionCallback,
      };

      if (this.enablePriorityQueue) {
        // Insert based on priority (higher priority first)
        const insertIndex = this.queue.findIndex(r => r.priority < priority);
        if (insertIndex === -1) {
          this.queue.push(request as QueuedRequest<unknown>);
        } else {
          this.queue.splice(insertIndex, 0, request as QueuedRequest<unknown>);
        }
      } else {
        this.queue.push(request as QueuedRequest<unknown>);
      }

      this.notifyQueuePositions();
      this.processQueue();
    });
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    const { positionCallback, keepAlive, priority, ...chatOptions } = options;

    return this.enqueue(
      () =>
        this.client.chat({
          model: this.model,
          ...chatOptions,
          keep_alive: keepAlive,
          stream: false,
        }),
      positionCallback,
      priority
    );
  }

  async generate(options: GenerateOptions): Promise<GenerateResponse> {
    const { positionCallback, keepAlive, priority, ...generateOptions } = options;

    return this.enqueue(
      () =>
        this.client.generate({
          model: this.model,
          ...generateOptions,
          keep_alive: keepAlive,
          stream: false,
        }),
      positionCallback,
      priority
    );
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isIdle(): boolean {
    return !this.isProcessing && this.queue.length === 0;
  }
}

// Default instance with common defaults
export const defaultOllamaQueue = new OllamaQueue({
  model: process.env.OLLAMA_MODEL || 'llama3',
  apiUrl: process.env.OLLAMA_API_URL || 'http://localhost:11434',
  enablePriorityQueue: true,
});

export default OllamaQueue;