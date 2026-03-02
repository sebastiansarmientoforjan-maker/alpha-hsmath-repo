'use client';

import { useState } from 'react';
import { X, Plus, Package, Sparkles } from 'lucide-react';
import { BatchQueueManager } from '@/lib/batch-queue';
import { useToast } from '@/contexts/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentResults?: string;
  currentQuery?: string;
  currentEngine?: 'gemini' | 'perplexity' | 'both';
}

export function AddToBatchModal({ isOpen, onClose, currentResults, currentQuery, currentEngine }: Props) {
  const toast = useToast();
  const [items, setItems] = useState<Array<{
    title: string;
    resultsText: string;
    searchQuery: string;
    engine: 'gemini' | 'perplexity' | 'both';
  }>>([
    {
      title: '',
      resultsText: currentResults || '',
      searchQuery: currentQuery || '',
      engine: currentEngine || 'both',
    }
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, {
      title: '',
      resultsText: '',
      searchQuery: '',
      engine: 'both',
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: string) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const handleSubmit = () => {
    // Validate items
    const validItems = items.filter(item =>
      item.title.trim() && item.resultsText.trim()
    );

    if (validItems.length === 0) {
      toast.showWarning('Please add at least one item with title and results');
      return;
    }

    // Add to queue
    const ids = BatchQueueManager.addMultipleItems(validItems);
    toast.showSuccess(`Added ${ids.length} item(s) to batch queue!`, 5000);

    onClose();
  };

  const handlePasteMultiple = async () => {
    try {
      const text = await navigator.clipboard.readText();

      // Try to split by common delimiters
      const sections = text.split(/\n={3,}\n|\n-{3,}\n/);

      if (sections.length > 1) {
        const newItems = sections.map((section, index) => ({
          title: `Batch Item ${items.length + index + 1}`,
          resultsText: section.trim(),
          searchQuery: '',
          engine: 'both' as const,
        }));

        setItems([...items, ...newItems]);
        toast.showSuccess(`Pasted ${newItems.length} sections`);
      } else {
        toast.showInfo('Clipboard contains single section. Paste manually per item.');
      }
    } catch (error) {
      toast.showError('Failed to read clipboard');
    }
  };

  return (
    <div className="fixed inset-0 bg-dark/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-dark shadow-[8px_8px_0px_0px_rgba(18,18,18,1)] max-w-5xl w-full max-h-[90vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b-4 border-dark bg-alert-orange">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package size={32} className="text-dark" />
              <div>
                <h2 className="text-2xl font-bold text-dark">Add to Batch Queue</h2>
                <p className="text-sm text-dark/80">Process multiple research results at once</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-dark/20 transition-colors">
              <X size={24} className="text-dark" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border-4 border-dark p-4 bg-bg-light">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-dark">Item {index + 1}</h3>
                {items.length > 1 && (
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="p-1 hover:bg-dark/10 transition-colors"
                  >
                    <X size={20} className="text-dark/60" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {/* Title */}
                <div>
                  <label className="block text-sm font-bold text-dark mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                    placeholder="e.g., Active Learning Strategies Research"
                    className="w-full px-3 py-2 border-2 border-dark focus:border-cool-blue outline-none"
                  />
                </div>

                {/* Search Query */}
                <div>
                  <label className="block text-sm font-bold text-dark mb-1">
                    Search Query (optional)
                  </label>
                  <input
                    type="text"
                    value={item.searchQuery}
                    onChange={(e) => handleUpdateItem(index, 'searchQuery', e.target.value)}
                    placeholder="Original search query"
                    className="w-full px-3 py-2 border-2 border-dark focus:border-cool-blue outline-none"
                  />
                </div>

                {/* Engine */}
                <div>
                  <label className="block text-sm font-bold text-dark mb-1">
                    Engine
                  </label>
                  <select
                    value={item.engine}
                    onChange={(e) => handleUpdateItem(index, 'engine', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-dark focus:border-cool-blue outline-none bg-white"
                  >
                    <option value="both">Both (Mixed)</option>
                    <option value="gemini">Gemini</option>
                    <option value="perplexity">Perplexity</option>
                  </select>
                </div>

                {/* Results Text */}
                <div>
                  <label className="block text-sm font-bold text-dark mb-1">
                    Results Text *
                  </label>
                  <textarea
                    value={item.resultsText}
                    onChange={(e) => handleUpdateItem(index, 'resultsText', e.target.value)}
                    placeholder="Paste research results here..."
                    rows={6}
                    className="w-full px-3 py-2 border-2 border-dark focus:border-cool-blue outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-dark/60 mt-1">
                    {item.resultsText.length > 0 && `${(item.resultsText.length / 1000).toFixed(1)}K characters`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t-4 border-dark bg-bg-light flex gap-3">
          <button
            onClick={handleAddItem}
            className="px-4 py-2 border-2 border-dark bg-white hover:bg-dark hover:text-white transition-all font-bold flex items-center gap-2"
          >
            <Plus size={20} />
            Add Another Item
          </button>

          <button
            onClick={handlePasteMultiple}
            className="px-4 py-2 border-2 border-dark bg-white hover:bg-dark hover:text-white transition-all font-bold flex items-center gap-2"
          >
            <Sparkles size={20} />
            Smart Paste Multiple
          </button>

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="px-6 py-2 border-2 border-dark bg-white hover:bg-dark/10 transition-all font-bold"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            className="px-6 py-2 border-4 border-dark bg-cool-blue hover:bg-dark hover:text-white transition-all font-bold"
          >
            Add to Queue ({items.filter(i => i.title && i.resultsText).length})
          </button>
        </div>
      </div>
    </div>
  );
}
