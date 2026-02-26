'use client';

import { useState, useEffect } from 'react';
import { BrutalCard, BrutalInput, BrutalButton } from '@/components/ui';
import {
  createDecisionLog,
  updateDecisionLog,
  deleteDecisionLog,
  getAllDecisionLogs,
  DecisionLog,
} from '@/lib/decisionLogs';
import { Edit, Trash2, Plus, Save, X } from 'lucide-react';

export default function DecisionLogsAdmin() {
  const [logs, setLogs] = useState<DecisionLog[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    taxonomy: 'Pedagogical Adjustment' as DecisionLog['taxonomy'],
    status: 'Under Debate' as DecisionLog['status'],
    rationale: '',
    evidence_url: '',
    author: '',
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await getAllDecisionLogs();
      setLogs(data);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      taxonomy: 'Pedagogical Adjustment',
      status: 'Under Debate',
      rationale: '',
      evidence_url: '',
      author: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        await updateDecisionLog(editingId, formData);
      } else {
        await createDecisionLog(formData);
      }
      await loadLogs();
      resetForm();
    } catch (error) {
      console.error('Failed to save log:', error);
      alert('Failed to save. Make sure Firebase is configured correctly.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log: DecisionLog) => {
    setFormData({
      title: log.title,
      taxonomy: log.taxonomy,
      status: log.status,
      rationale: log.rationale,
      evidence_url: log.evidence_url || '',
      author: log.author,
    });
    setEditingId(log.id!);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this decision log?')) return;

    try {
      await deleteDecisionLog(id);
      await loadLogs();
    } catch (error) {
      console.error('Failed to delete log:', error);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-dark mb-2">Decision Logs</h1>
          <p className="text-dark/70">
            Document pedagogical decisions and experimental findings
          </p>
        </div>
        <BrutalButton
          onClick={() => setShowForm(!showForm)}
          variant="primary"
          className="flex items-center gap-2"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'New Log'}
        </BrutalButton>
      </div>

      {/* Form */}
      {showForm && (
        <BrutalCard className="mb-6">
          <h2 className="text-xl font-bold text-dark mb-4">
            {editingId ? 'Edit Decision Log' : 'Create New Decision Log'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <BrutalInput
              label="Title"
              placeholder="e.g., Shift from Traditional to Inquiry-Based Learning"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                  Taxonomy
                </label>
                <select
                  value={formData.taxonomy}
                  onChange={(e) =>
                    setFormData({ ...formData, taxonomy: e.target.value as any })
                  }
                  className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]"
                  required
                >
                  <option value="Pedagogical Adjustment">Pedagogical Adjustment</option>
                  <option value="Experimental Refutation">Experimental Refutation</option>
                  <option value="New Didactic Model">New Didactic Model</option>
                </select>
              </div>

              <div>
                <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]"
                  required
                >
                  <option value="Under Debate">Under Debate</option>
                  <option value="Empirically Validated">Empirically Validated</option>
                  <option value="Refuted">Refuted</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                Rationale (Supports Markdown/LaTeX)
              </label>
              <textarea
                value={formData.rationale}
                onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                rows={8}
                className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-serif focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] resize-y"
                placeholder="Explain the reasoning, evidence, and implications..."
                required
              />
            </div>

            <BrutalInput
              label="Evidence URL (Optional)"
              placeholder="https://dashboard.example.com/data"
              value={formData.evidence_url}
              onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })}
              type="url"
            />

            <BrutalInput
              label="Author"
              placeholder="e.g., Dr. Smith"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
            />

            <div className="flex gap-4 pt-4">
              <BrutalButton type="submit" variant="primary" disabled={loading}>
                <Save size={20} className="inline mr-2" />
                {loading ? 'Saving...' : editingId ? 'Update Log' : 'Create Log'}
              </BrutalButton>
              <BrutalButton type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </BrutalButton>
            </div>
          </form>
        </BrutalCard>
      )}

      {/* List of Logs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-dark">Existing Logs</h2>

        {logs.length === 0 ? (
          <BrutalCard>
            <p className="text-dark/60 text-center py-8">
              No decision logs yet. Create your first one above.
            </p>
          </BrutalCard>
        ) : (
          logs.map((log) => (
            <BrutalCard key={log.id} hoverable>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-dark mb-2">{log.title}</h3>
                  <div className="flex gap-3 text-sm">
                    <span className="px-3 py-1 border-2 border-dark bg-cool-blue font-bold">
                      {log.taxonomy}
                    </span>
                    <span
                      className={`px-3 py-1 border-2 border-dark font-bold ${
                        log.status === 'Empirically Validated'
                          ? 'bg-cool-blue'
                          : log.status === 'Refuted'
                          ? 'bg-alert-orange'
                          : 'bg-bg-light'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(log)}
                    className="p-2 border-2 border-dark bg-white hover:bg-cool-blue transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(log.id!)}
                    className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <p className="text-dark/80 font-serif mb-3 whitespace-pre-wrap">
                {log.rationale.length > 300
                  ? log.rationale.substring(0, 300) + '...'
                  : log.rationale}
              </p>

              <div className="flex items-center gap-4 text-sm text-dark/60">
                <span>By {log.author}</span>
                {log.evidence_url && (
                  <a
                    href={log.evidence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cool-blue hover:underline font-medium"
                  >
                    View Evidence →
                  </a>
                )}
              </div>
            </BrutalCard>
          ))
        )}
      </div>
    </div>
  );
}
