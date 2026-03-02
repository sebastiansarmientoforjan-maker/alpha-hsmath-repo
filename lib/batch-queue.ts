/**
 * Batch Processing Queue Manager
 * Handles multiple research items processing
 */

export interface BatchItem {
  id: string;
  title: string;
  resultsText: string;
  searchQuery: string;
  engine: 'gemini' | 'perplexity' | 'both';
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: number;
  processedAt?: number;
  error?: string;
  investigationId?: string;
  // Preview data
  preview?: {
    wordCount: number;
    citationCount: number;
    hasMatrix: boolean;
  };
}

const QUEUE_KEY = 'alpha-batch-processing-queue';

export class BatchQueueManager {
  private static getQueue(): BatchItem[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private static saveQueue(queue: BatchItem[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  // Add item to queue
  static addItem(
    title: string,
    resultsText: string,
    searchQuery: string,
    engine: 'gemini' | 'perplexity' | 'both'
  ): string {
    const queue = this.getQueue();

    const item: BatchItem = {
      id: Date.now().toString() + Math.random().toString(36),
      title,
      resultsText,
      searchQuery,
      engine,
      status: 'pending',
      createdAt: Date.now(),
      preview: this.generatePreview(resultsText),
    };

    queue.push(item);
    this.saveQueue(queue);
    return item.id;
  }

  // Add multiple items at once
  static addMultipleItems(items: Array<{
    title: string;
    resultsText: string;
    searchQuery: string;
    engine: 'gemini' | 'perplexity' | 'both';
  }>): string[] {
    const queue = this.getQueue();
    const ids: string[] = [];

    for (const item of items) {
      const batchItem: BatchItem = {
        id: Date.now().toString() + Math.random().toString(36) + ids.length,
        ...item,
        status: 'pending',
        createdAt: Date.now(),
        preview: this.generatePreview(item.resultsText),
      };
      queue.push(batchItem);
      ids.push(batchItem.id);
    }

    this.saveQueue(queue);
    return ids;
  }

  // Get all items
  static getAll(): BatchItem[] {
    return this.getQueue();
  }

  // Get items by status
  static getByStatus(status: BatchItem['status']): BatchItem[] {
    return this.getQueue().filter(item => item.status === status);
  }

  // Get pending count
  static getPendingCount(): number {
    return this.getByStatus('pending').length;
  }

  // Get next pending item
  static getNextPending(): BatchItem | null {
    const pending = this.getByStatus('pending');
    return pending.length > 0 ? pending[0] : null;
  }

  // Update item status
  static updateStatus(
    id: string,
    status: BatchItem['status'],
    data?: { investigationId?: string; error?: string }
  ) {
    const queue = this.getQueue();
    const item = queue.find(i => i.id === id);

    if (item) {
      item.status = status;
      if (status === 'completed' || status === 'error') {
        item.processedAt = Date.now();
      }
      if (data?.investigationId) {
        item.investigationId = data.investigationId;
      }
      if (data?.error) {
        item.error = data.error;
      }
      this.saveQueue(queue);
    }
  }

  // Remove item
  static removeItem(id: string) {
    const queue = this.getQueue().filter(item => item.id !== id);
    this.saveQueue(queue);
  }

  // Clear completed items
  static clearCompleted() {
    const queue = this.getQueue().filter(item => item.status !== 'completed');
    this.saveQueue(queue);
  }

  // Clear all items
  static clearAll() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(QUEUE_KEY);
  }

  // Reorder items (drag & drop)
  static reorder(fromIndex: number, toIndex: number) {
    const queue = this.getQueue();
    const [removed] = queue.splice(fromIndex, 1);
    queue.splice(toIndex, 0, removed);
    this.saveQueue(queue);
  }

  // Get statistics
  static getStats() {
    const queue = this.getQueue();
    return {
      total: queue.length,
      pending: queue.filter(i => i.status === 'pending').length,
      processing: queue.filter(i => i.status === 'processing').length,
      completed: queue.filter(i => i.status === 'completed').length,
      error: queue.filter(i => i.status === 'error').length,
    };
  }

  // Generate preview data
  private static generatePreview(resultsText: string) {
    const wordCount = resultsText.split(/\s+/).length;
    const citationCount = (resultsText.match(/\[([^\]]+)\]\(https?:\/\/[^\)]+\)/g) || []).length;
    const hasMatrix = /Source Reliability Matrix/i.test(resultsText);

    return {
      wordCount,
      citationCount,
      hasMatrix,
    };
  }

  // Export queue as JSON
  static exportQueue(): string {
    const queue = this.getQueue();
    return JSON.stringify(queue, null, 2);
  }

  // Import queue from JSON
  static importQueue(jsonString: string): { success: boolean; count: number; error?: string } {
    try {
      const items = JSON.parse(jsonString) as BatchItem[];

      if (!Array.isArray(items)) {
        return { success: false, count: 0, error: 'Invalid format: not an array' };
      }

      // Validate items
      const validItems = items.filter(item =>
        item.id && item.title && item.resultsText && item.status
      );

      if (validItems.length === 0) {
        return { success: false, count: 0, error: 'No valid items found' };
      }

      const currentQueue = this.getQueue();
      const mergedQueue = [...currentQueue, ...validItems];
      this.saveQueue(mergedQueue);

      return { success: true, count: validItems.length };
    } catch (error) {
      return { success: false, count: 0, error: 'Invalid JSON format' };
    }
  }
}
