'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Play,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Plus,
  Download,
  Upload,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { BatchQueueManager, type BatchItem } from '@/lib/batch-queue';
import { useToast } from '@/contexts/ToastContext';

export function BatchProcessingQueue() {
  const router = useRouter();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [queue, setQueue] = useState<BatchItem[]>([]);
  const [stats, setStats] = useState(BatchQueueManager.getStats());

  // Load queue on mount and set up polling
  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  const refreshQueue = () => {
    setQueue(BatchQueueManager.getAll());
    setStats(BatchQueueManager.getStats());
  };

  const handleProcessNext = () => {
    const next = BatchQueueManager.getNextPending();
    if (next) {
      // Store current item for processing
      localStorage.setItem('batch-current-item', JSON.stringify(next));
      BatchQueueManager.updateStatus(next.id, 'processing');

      // Navigate to Process Results
      router.push('/admin/process-results?batch=true');
      toast.showInfo('Processing next item in queue...');
    }
  };

  const handleRemoveItem = (id: string) => {
    BatchQueueManager.removeItem(id);
    refreshQueue();
    toast.showSuccess('Item removed from queue');
  };

  const handleClearCompleted = () => {
    BatchQueueManager.clearCompleted();
    refreshQueue();
    toast.showSuccess('Completed items cleared');
  };

  const handleExport = () => {
    const json = BatchQueueManager.exportQueue();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-queue-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.showSuccess('Queue exported successfully');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        const result = BatchQueueManager.importQueue(text);
        if (result.success) {
          refreshQueue();
          toast.showSuccess(`Imported ${result.count} items`);
        } else {
          toast.showError(`Import failed: ${result.error}`);
        }
      }
    };
    input.click();
  };

  const getStatusIcon = (status: BatchItem['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-3 h-3 rounded-full bg-dark/30" />;
      case 'processing':
        return <Loader2 size={16} className="text-cool-blue animate-spin" />;
      case 'completed':
        return <CheckCircle size={16} className="text-cool-blue" />;
      case 'error':
        return <AlertCircle size={16} className="text-alert-orange" />;
    }
  };

  const getStatusColor = (status: BatchItem['status']) => {
    switch (status) {
      case 'pending':
        return 'border-dark/30 bg-white';
      case 'processing':
        return 'border-cool-blue bg-cool-blue/10';
      case 'completed':
        return 'border-cool-blue bg-cool-blue/20';
      case 'error':
        return 'border-alert-orange bg-alert-orange/20';
    }
  };

  const pendingCount = stats.pending;

  return (
    <>
      {/* Toggle Button - Fixed position */}
      {!isOpen && pendingCount > 0 && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-6 bottom-20 z-[9998] px-4 py-3 border-4 border-dark bg-alert-orange hover:bg-dark hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] hover:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[2px] hover:translate-y-[2px] font-bold flex items-center gap-2"
        >
          <Package size={20} />
          <span>Queue ({pendingCount})</span>
          <ChevronLeft size={20} />
        </button>
      )}

      {/* Queue Panel */}
      {isOpen && (
        <div className="fixed right-0 top-0 h-full z-[9999] w-96 border-l-4 border-dark bg-white shadow-[-8px_0px_0px_0px_rgba(18,18,18,1)] animate-slide-in flex flex-col">
          {/* Header */}
          <div className="p-4 border-b-4 border-dark bg-alert-orange">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package size={24} className="text-dark" />
                <h3 className="text-xl font-bold text-dark">Batch Queue</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-dark/20 transition-colors"
              >
                <ChevronRight size={24} className="text-dark" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-white border-2 border-dark">
                <div className="text-xs font-bold text-dark/60">Total</div>
                <div className="text-lg font-bold text-dark">{stats.total}</div>
              </div>
              <div className="p-2 bg-white border-2 border-dark">
                <div className="text-xs font-bold text-dark/60">Pending</div>
                <div className="text-lg font-bold text-dark">{stats.pending}</div>
              </div>
              <div className="p-2 bg-cool-blue/20 border-2 border-cool-blue">
                <div className="text-xs font-bold text-dark/60">Done</div>
                <div className="text-lg font-bold text-dark">{stats.completed}</div>
              </div>
              <div className="p-2 bg-alert-orange/20 border-2 border-alert-orange">
                <div className="text-xs font-bold text-dark/60">Error</div>
                <div className="text-lg font-bold text-dark">{stats.error}</div>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="p-3 border-b-2 border-dark/20 flex gap-2">
            <button
              onClick={handleProcessNext}
              disabled={stats.pending === 0}
              className={`flex-1 px-3 py-2 border-2 border-dark font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                stats.pending > 0
                  ? 'bg-cool-blue hover:bg-dark hover:text-white'
                  : 'bg-gray-200 text-dark/40 cursor-not-allowed'
              }`}
            >
              <Play size={16} />
              Process Next
            </button>
            <button
              onClick={handleClearCompleted}
              disabled={stats.completed === 0}
              className="px-3 py-2 border-2 border-dark bg-white hover:bg-dark hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Clear completed"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={handleExport}
              className="px-3 py-2 border-2 border-dark bg-white hover:bg-dark hover:text-white transition-all"
              title="Export queue"
            >
              <Download size={16} />
            </button>
            <button
              onClick={handleImport}
              className="px-3 py-2 border-2 border-dark bg-white hover:bg-dark hover:text-white transition-all"
              title="Import queue"
            >
              <Upload size={16} />
            </button>
          </div>

          {/* Queue Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {queue.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-dark/20 mb-3" />
                <p className="text-dark/40 font-medium">Queue is empty</p>
                <p className="text-xs text-dark/30 mt-1">Add items to process in batch</p>
              </div>
            ) : (
              queue.map((item, index) => (
                <div
                  key={item.id}
                  className={`p-3 border-2 ${getStatusColor(item.status)} transition-all`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div className="pt-1">{getStatusIcon(item.status)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-dark truncate">
                        {item.title || `Item ${index + 1}`}
                      </h4>
                      <p className="text-xs text-dark/60 truncate">{item.searchQuery}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 hover:bg-dark/10 transition-colors flex-shrink-0"
                    >
                      <X size={16} className="text-dark/60" />
                    </button>
                  </div>

                  {/* Preview Stats */}
                  {item.preview && (
                    <div className="flex gap-2 text-xs text-dark/60 mb-2">
                      <span>{(item.preview.wordCount / 1000).toFixed(1)}K words</span>
                      <span>•</span>
                      <span>{item.preview.citationCount} cites</span>
                      {item.preview.hasMatrix && (
                        <>
                          <span>•</span>
                          <span className="text-cool-blue">Matrix ✓</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Error Message */}
                  {item.error && (
                    <div className="text-xs text-alert-orange bg-alert-orange/10 p-2 border border-alert-orange/30">
                      {item.error}
                    </div>
                  )}

                  {/* Investigation Link */}
                  {item.investigationId && (
                    <button
                      onClick={() => router.push(`/admin/research`)}
                      className="text-xs text-cool-blue hover:underline flex items-center gap-1 mt-2"
                    >
                      View Investigation →
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t-4 border-dark bg-bg-light">
            <p className="text-xs text-dark/60 text-center">
              💡 Add items from Process Results page
            </p>
          </div>
        </div>
      )}
    </>
  );
}
