'use client';

import { useState, useEffect } from 'react';
import { BrutalCard, BrutalButton } from '@/components/ui';
import { Archive, Copy, Trash2, Check, Calendar, FileText } from 'lucide-react';
import { getAllGemPrompts, deleteGemPrompt, GemPrompt } from '@/lib/gemPrompts';
import { useToast } from '@/contexts/ToastContext';
import { WorkflowBreadcrumb } from '@/components/WorkflowBreadcrumb';

export default function PromptRepository() {
  const toast = useToast();
  const [prompts, setPrompts] = useState<(GemPrompt & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const allPrompts = await getAllGemPrompts();
      setPrompts(allPrompts);
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast.showError('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (promptId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(promptId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.showSuccess('Prompt copied to clipboard!');
  };

  const handleDelete = async (promptId: string) => {
    setDeletingId(promptId);
    try {
      await deleteGemPrompt(promptId);
      setPrompts(prompts.filter((p) => p.id !== promptId));
      toast.showSuccess('Prompt deleted successfully');
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast.showError('Failed to delete prompt. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-dark text-lg">Loading prompts...</p>
      </div>
    );
  }

  return (
    <div>
      <WorkflowBreadcrumb />

      <div className="mb-6">
        <h1 className="text-4xl font-bold text-dark mb-2 flex items-center gap-3">
          <Archive size={36} className="text-cool-blue" />
          Prompt Repository
        </h1>
        <p className="text-dark/70">
          Saved GEM prompts ready to use with Gemini Deep Research
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <BrutalCard>
          <div className="flex items-center gap-3">
            <FileText size={32} className="text-cool-blue" />
            <div>
              <p className="text-sm uppercase tracking-wide text-dark/60 font-bold">
                Total Prompts
              </p>
              <p className="text-3xl font-bold text-dark">{prompts.length}</p>
            </div>
          </div>
        </BrutalCard>
      </div>

      {/* Prompts List */}
      {prompts.length === 0 ? (
        <BrutalCard>
          <div className="text-center py-12">
            <FileText size={64} className="mx-auto text-dark/20 mb-4" />
            <p className="text-xl text-dark/60 mb-2">No saved prompts yet</p>
            <p className="text-dark/50">
              Generate a prompt in the GEM Generator and save it to see it here
            </p>
          </div>
        </BrutalCard>
      ) : (
        <div className="space-y-4">
          {prompts.map((prompt) => (
            <BrutalCard key={prompt.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-dark mb-2">
                    {prompt.searchQuery}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-dark/60">
                    <Calendar size={14} />
                    <span>{formatDate(prompt.createdAt)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <BrutalButton
                    onClick={() => handleCopy(prompt.id!, prompt.promptContent)}
                    variant="primary"
                    className="gap-2"
                  >
                    {copiedId === prompt.id ? (
                      <>
                        <Check size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy size={16} />
                        Copy
                      </>
                    )}
                  </BrutalButton>
                  <BrutalButton
                    onClick={() => handleDelete(prompt.id!)}
                    variant="secondary"
                    className="gap-2"
                    disabled={deletingId === prompt.id}
                  >
                    <Trash2 size={16} />
                    {deletingId === prompt.id ? 'Deleting...' : 'Delete'}
                  </BrutalButton>
                </div>
              </div>

              {/* Collapsible Prompt Preview */}
              <details className="group">
                <summary className="cursor-pointer text-sm font-bold text-dark uppercase mb-2 hover:text-cool-blue transition-colors">
                  View Full Prompt →
                </summary>
                <div className="mt-2 bg-bg-light border-4 border-dark p-4 font-mono text-xs max-h-96 overflow-auto">
                  <pre className="whitespace-pre-wrap text-dark">
                    {prompt.promptContent}
                  </pre>
                </div>
              </details>
            </BrutalCard>
          ))}
        </div>
      )}
    </div>
  );
}
