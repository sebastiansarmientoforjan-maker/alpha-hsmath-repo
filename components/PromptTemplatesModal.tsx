'use client';

import { useState } from 'react';
import { X, Search, BookOpen } from 'lucide-react';
import { promptTemplates, getAllCategories, searchTemplates, type PromptTemplate } from '@/lib/prompt-templates';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: PromptTemplate) => void;
}

export function PromptTemplatesModal({ isOpen, onClose, onSelectTemplate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!isOpen) return null;

  const categories = ['All', ...getAllCategories()];
  const filteredTemplates = searchQuery
    ? searchTemplates(searchQuery)
    : selectedCategory === 'All'
    ? promptTemplates
    : promptTemplates.filter(t => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-dark/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-dark shadow-[8px_8px_0px_0px_rgba(18,18,18,1)] max-w-5xl w-full max-h-[90vh] flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b-4 border-dark">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cool-blue border-2 border-dark">
                <BookOpen size={28} className="text-dark" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark">Prompt Templates</h2>
                <p className="text-sm text-dark/60">Quick-start templates for common research topics</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-dark/10 transition-colors">
              <X size={24} className="text-dark" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/40" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-dark focus:border-cool-blue outline-none"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 px-6 py-3 border-b-2 border-dark/20 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`
                px-4 py-2 border-2 font-bold text-sm whitespace-nowrap transition-all
                ${
                  selectedCategory === category
                    ? 'bg-cool-blue border-dark'
                    : 'bg-white border-dark/30 hover:border-dark'
                }
              `}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-dark/40 text-lg">No templates found</p>
              <p className="text-dark/30 text-sm mt-2">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                  className="p-4 border-4 border-dark bg-white hover:bg-cool-blue hover:scale-105 transition-all text-left"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-3xl">{template.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-dark mb-1">{template.name}</h3>
                      <p className="text-xs text-dark/60 uppercase tracking-wide mb-2">
                        {template.category}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-dark/70 mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-dark/10 text-dark/70 text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-4 border-dark bg-bg-light">
          <p className="text-xs text-dark/60 text-center">
            💡 Templates automatically fill the search query. You can customize before generating.
          </p>
        </div>
      </div>
    </div>
  );
}
