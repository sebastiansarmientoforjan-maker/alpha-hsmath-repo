'use client';

import { useState, useEffect } from 'react';
import { BrutalCard, BrutalInput, BrutalButton } from '@/components/ui';
import {
  createInvestigation,
  updateInvestigation,
  deleteInvestigation,
  getAllInvestigations,
  Investigation,
  ResearchType,
  MathematicalArea,
  InvestigationStatus,
} from '@/lib/investigations';
import { getReportsByInvestigation } from '@/lib/scrollytellingReports';
import { ScrollytellingReport } from '@/lib/uploadHtmlReport';
import { Edit, Trash2, Plus, Save, X, FileText, Eye, Upload } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export default function ResearchRepositoryAdmin() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingInvestigations, setLoadingInvestigations] = useState(true);
  const [viewingInvestigation, setViewingInvestigation] = useState<Investigation | null>(null);
  const [viewingReports, setViewingReports] = useState<(ScrollytellingReport & { id: string })[]>([]);
  const [showJsonPaste, setShowJsonPaste] = useState(false);
  const [jsonText, setJsonText] = useState('');

  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    researchType: ResearchType;
    mathematicalArea: MathematicalArea;
    status: InvestigationStatus;
    keyFindings: string;
    methodology: string;
    impactMetrics: string;
    author: string;
    startDate: string;
    completionDate: string;
    // Systematic Literature Review fields
    searchKeywords: string;
    databases: string;
    paperCount: string;
    citations: Array<{ title: string; url: string; authors?: string }>;
  }>({
    title: '',
    description: '',
    researchType: 'Systematic Literature Review',
    mathematicalArea: 'Algebra',
    status: 'In Progress',
    keyFindings: '',
    methodology: '',
    impactMetrics: '',
    author: '',
    startDate: new Date().toISOString().split('T')[0],
    completionDate: '',
    searchKeywords: '',
    databases: '',
    paperCount: '',
    citations: [],
  });

  useEffect(() => {
    loadInvestigations();
  }, []);

  const loadInvestigations = async () => {
    setLoadingInvestigations(true);
    try {
      const data = await getAllInvestigations();
      setInvestigations(data);
    } catch (error) {
      console.error('Failed to load investigations:', error);
    } finally {
      setLoadingInvestigations(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      researchType: 'Systematic Literature Review',
      mathematicalArea: 'Algebra',
      status: 'In Progress',
      keyFindings: '',
      methodology: '',
      impactMetrics: '',
      author: '',
      startDate: new Date().toISOString().split('T')[0],
      completionDate: '',
      searchKeywords: '',
      databases: '',
      paperCount: '',
      citations: [],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startDate = Timestamp.fromDate(new Date(formData.startDate));
      const completionDate = formData.completionDate
        ? Timestamp.fromDate(new Date(formData.completionDate))
        : undefined;

      // Process systematic review fields
      const isSystematicReview = formData.researchType === 'Systematic Literature Review';
      const systematicReviewData = isSystematicReview ? {
        searchKeywords: formData.searchKeywords ? formData.searchKeywords.split(',').map(k => k.trim()).filter(Boolean) : undefined,
        databases: formData.databases ? formData.databases.split(',').map(d => d.trim()).filter(Boolean) : undefined,
        paperCount: formData.paperCount ? parseInt(formData.paperCount) : undefined,
        citationLinks: formData.citations.length > 0 ? formData.citations : undefined,
      } : {};

      const investigationData = {
        title: formData.title,
        description: formData.description,
        researchType: formData.researchType,
        mathematicalArea: formData.mathematicalArea,
        status: formData.status,
        keyFindings: formData.keyFindings,
        methodology: formData.methodology,
        impactMetrics: formData.impactMetrics || undefined,
        author: formData.author,
        startDate,
        completionDate,
        ...systematicReviewData,
      };

      if (editingId) {
        await updateInvestigation(editingId, investigationData);
      } else {
        await createInvestigation(investigationData);
      }
      await loadInvestigations();
      resetForm();
    } catch (error) {
      console.error('Failed to save investigation:', error);
      alert('Failed to save. Make sure Firebase is configured correctly.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (investigation: Investigation) => {
    setFormData({
      title: investigation.title,
      description: investigation.description,
      researchType: investigation.researchType,
      mathematicalArea: investigation.mathematicalArea,
      status: investigation.status,
      keyFindings: investigation.keyFindings,
      methodology: investigation.methodology,
      impactMetrics: investigation.impactMetrics || '',
      author: investigation.author,
      startDate: new Date(investigation.startDate.seconds * 1000).toISOString().split('T')[0],
      completionDate: investigation.completionDate
        ? new Date(investigation.completionDate.seconds * 1000).toISOString().split('T')[0]
        : '',
      searchKeywords: investigation.searchKeywords?.join(', ') || '',
      databases: investigation.databases?.join(', ') || '',
      paperCount: investigation.paperCount?.toString() || '',
      citations: investigation.citationLinks || [],
    });
    setEditingId(investigation.id!);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investigation?')) return;

    try {
      await deleteInvestigation(id);
      await loadInvestigations();
    } catch (error) {
      console.error('Failed to delete investigation:', error);
    }
  };

  const handleView = async (investigation: Investigation) => {
    setViewingInvestigation(investigation);
    if (investigation.id) {
      const reports = await getReportsByInvestigation(investigation.id);
      setViewingReports(reports);
    }
  };

  const processJSON = (jsonString: string) => {
    try {
      const json = JSON.parse(jsonString);

      // Validate required fields
      const requiredFields = ['title', 'description', 'researchType', 'mathematicalArea', 'status', 'keyFindings', 'methodology', 'author', 'startDate'];
      const missingFields = requiredFields.filter(field => !json[field]);

      if (missingFields.length > 0) {
        alert(`Missing required fields: ${missingFields.join(', ')}`);
        return false;
      }

      // Validate enum values
      const validResearchTypes: ResearchType[] = ['Systematic Literature Review', 'Learning Pattern Analysis', 'Content Development', 'AI-Powered Pathways', 'Student Data Analysis', 'Pedagogical Innovation'];
      const validMathAreas: MathematicalArea[] = ['Elementary Arithmetic', 'Algebra', 'Geometry', 'Calculus', 'Statistics', 'Cross-Domain'];
      const validStatuses: InvestigationStatus[] = ['In Progress', 'Completed', 'Published'];

      if (!validResearchTypes.includes(json.researchType)) {
        alert(`Invalid researchType. Must be one of: ${validResearchTypes.join(', ')}`);
        return false;
      }

      if (!validMathAreas.includes(json.mathematicalArea)) {
        alert(`Invalid mathematicalArea. Must be one of: ${validMathAreas.join(', ')}`);
        return false;
      }

      if (!validStatuses.includes(json.status)) {
        alert(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        return false;
      }

      // Pre-fill form with JSON data
      setFormData({
        title: json.title,
        description: json.description,
        researchType: json.researchType,
        mathematicalArea: json.mathematicalArea,
        status: json.status,
        keyFindings: json.keyFindings,
        methodology: json.methodology,
        impactMetrics: json.impactMetrics || '',
        author: json.author,
        startDate: json.startDate,
        completionDate: json.completionDate || '',
        searchKeywords: Array.isArray(json.searchKeywords) ? json.searchKeywords.join(', ') : '',
        databases: Array.isArray(json.databases) ? json.databases.join(', ') : '',
        paperCount: json.paperCount?.toString() || '',
        citations: json.citationLinks || [],
      });

      setShowForm(true);
      setEditingId(null);
      setShowJsonPaste(false);
      setJsonText('');
      return true;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      alert('Invalid JSON format. Please check the syntax and try again.');
      return false;
    }
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const success = processJSON(e.target?.result as string);
      if (success) {
        alert('JSON loaded successfully! Review the form and click "Create Investigation" to save.');
      }
    };

    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const handleLoadFromPaste = () => {
    if (!jsonText.trim()) {
      alert('Please paste JSON content first');
      return;
    }

    const success = processJSON(jsonText);
    if (success) {
      alert('JSON loaded successfully! Review the form and click "Create Investigation" to save.');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-dark mb-2">Research Repository</h1>
          <p className="text-dark/70">
            Document investigations, analyze learning patterns, and track research findings
          </p>
        </div>
        <div className="flex gap-3">
          <BrutalButton
            onClick={() => {
              setShowJsonPaste(!showJsonPaste);
              setShowForm(false);
            }}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <FileText size={20} />
            {showJsonPaste ? 'Close' : 'Paste JSON'}
          </BrutalButton>
          <input
            type="file"
            id="json-upload"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
          <BrutalButton
            onClick={() => document.getElementById('json-upload')?.click()}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Upload size={20} />
            Upload File
          </BrutalButton>
          <BrutalButton
            onClick={() => {
              setShowForm(!showForm);
              setShowJsonPaste(false);
            }}
            variant="primary"
            className="flex items-center gap-2"
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
            {showForm ? 'Cancel' : 'New Investigation'}
          </BrutalButton>
        </div>
      </div>

      {/* JSON Paste Area */}
      {showJsonPaste && (
        <BrutalCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-dark">Paste JSON from Gemini</h2>
              <p className="text-sm text-dark/70">Copy JSON output from Gemini and paste it below</p>
            </div>
            <button
              onClick={() => setShowJsonPaste(false)}
              className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='Paste your JSON here, e.g.:
{
  "title": "Investigation Title",
  "description": "Description...",
  "researchType": "Systematic Literature Review",
  ...
}'
            rows={12}
            className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-mono text-sm focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] resize-y mb-4"
          />

          <div className="flex gap-3">
            <BrutalButton
              onClick={handleLoadFromPaste}
              variant="primary"
              disabled={!jsonText.trim()}
            >
              <FileText size={20} className="inline mr-2" />
              Load Investigation from JSON
            </BrutalButton>
            <BrutalButton
              onClick={() => {
                setJsonText('');
              }}
              variant="secondary"
            >
              Clear
            </BrutalButton>
          </div>
        </BrutalCard>
      )}

      {/* Form */}
      {showForm && (
        <BrutalCard className="mb-6">
          <h2 className="text-xl font-bold text-dark mb-4">
            {editingId ? 'Edit Investigation' : 'Create New Investigation'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <BrutalInput
              label="Title"
              placeholder="e.g., Pattern Analysis: Algebra Mastery in 8th Grade"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            <div>
              <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                Description (Executive Summary)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-serif focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] resize-y"
                placeholder="Brief executive summary of the investigation..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                  Research Type
                </label>
                <select
                  value={formData.researchType}
                  onChange={(e) =>
                    setFormData({ ...formData, researchType: e.target.value as ResearchType })
                  }
                  className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]"
                  required
                >
                  <option value="Systematic Literature Review">Systematic Literature Review</option>
                  <option value="Learning Pattern Analysis">Learning Pattern Analysis</option>
                  <option value="Content Development">Content Development</option>
                  <option value="AI-Powered Pathways">AI-Powered Pathways</option>
                  <option value="Student Data Analysis">Student Data Analysis</option>
                  <option value="Pedagogical Innovation">Pedagogical Innovation</option>
                </select>
              </div>

              <div>
                <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                  Mathematical Area
                </label>
                <select
                  value={formData.mathematicalArea}
                  onChange={(e) =>
                    setFormData({ ...formData, mathematicalArea: e.target.value as MathematicalArea })
                  }
                  className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]"
                  required
                >
                  <option value="Elementary Arithmetic">Elementary Arithmetic</option>
                  <option value="Algebra">Algebra</option>
                  <option value="Geometry">Geometry</option>
                  <option value="Calculus">Calculus</option>
                  <option value="Statistics">Statistics</option>
                  <option value="Cross-Domain">Cross-Domain</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as InvestigationStatus })
                  }
                  className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-medium focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]"
                  required
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Published">Published</option>
                </select>
              </div>

              <BrutalInput
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />

              <BrutalInput
                label="Completion Date (Optional)"
                type="date"
                value={formData.completionDate}
                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                Key Findings
              </label>
              <textarea
                value={formData.keyFindings}
                onChange={(e) => setFormData({ ...formData, keyFindings: e.target.value })}
                rows={4}
                className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-serif focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] resize-y"
                placeholder="Main discoveries and insights..."
                required
              />
            </div>

            <div>
              <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                Methodology
              </label>
              <textarea
                value={formData.methodology}
                onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                rows={4}
                className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-serif focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] resize-y"
                placeholder="How the analysis was conducted..."
                required
              />
            </div>

            <BrutalInput
              label="Impact Metrics (Optional)"
              placeholder="e.g., 2x acceleration in concept mastery"
              value={formData.impactMetrics}
              onChange={(e) => setFormData({ ...formData, impactMetrics: e.target.value })}
            />

            {/* Systematic Literature Review Fields */}
            {formData.researchType === 'Systematic Literature Review' && (
              <div className="border-4 border-cool-blue bg-cool-blue/10 p-4 space-y-4">
                <h3 className="text-lg font-bold text-dark mb-2">Systematic Review Details</h3>

                <BrutalInput
                  label="Search Keywords (comma-separated)"
                  placeholder="e.g., algebra learning, conceptual understanding, 8th grade"
                  value={formData.searchKeywords}
                  onChange={(e) => setFormData({ ...formData, searchKeywords: e.target.value })}
                />

                <BrutalInput
                  label="Databases Searched (comma-separated)"
                  placeholder="e.g., Google Scholar, ERIC, JSTOR, ResearchGate"
                  value={formData.databases}
                  onChange={(e) => setFormData({ ...formData, databases: e.target.value })}
                />

                <BrutalInput
                  label="Number of Papers Reviewed"
                  type="number"
                  placeholder="e.g., 45"
                  value={formData.paperCount}
                  onChange={(e) => setFormData({ ...formData, paperCount: e.target.value })}
                />

                <div>
                  <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                    Key Citations
                  </label>
                  <div className="space-y-2 mb-2">
                    {formData.citations.map((citation, index) => (
                      <div key={index} className="flex gap-2 items-start p-2 border-2 border-dark bg-white">
                        <div className="flex-1 text-sm">
                          <p className="font-bold text-dark">{citation.title}</p>
                          {citation.authors && <p className="text-dark/60 text-xs">{citation.authors}</p>}
                          <a href={citation.url} target="_blank" rel="noopener noreferrer" className="text-cool-blue text-xs underline">
                            {citation.url}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newCitations = formData.citations.filter((_, i) => i !== index);
                            setFormData({ ...formData, citations: newCitations });
                          }}
                          className="p-1 border-2 border-dark bg-alert-orange hover:bg-alert-orange/80"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="Paper title"
                      id="citation-title"
                      className="col-span-5 border-2 border-dark px-2 py-1 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Authors (optional)"
                      id="citation-authors"
                      className="col-span-3 border-2 border-dark px-2 py-1 text-sm"
                    />
                    <input
                      type="url"
                      placeholder="URL"
                      id="citation-url"
                      className="col-span-3 border-2 border-dark px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const titleInput = document.getElementById('citation-title') as HTMLInputElement;
                        const authorsInput = document.getElementById('citation-authors') as HTMLInputElement;
                        const urlInput = document.getElementById('citation-url') as HTMLInputElement;

                        if (titleInput.value && urlInput.value) {
                          setFormData({
                            ...formData,
                            citations: [
                              ...formData.citations,
                              {
                                title: titleInput.value,
                                authors: authorsInput.value,
                                url: urlInput.value,
                              },
                            ],
                          });
                          titleInput.value = '';
                          authorsInput.value = '';
                          urlInput.value = '';
                        }
                      }}
                      className="col-span-1 p-1 border-2 border-dark bg-cool-blue hover:bg-cool-blue/80"
                      title="Add citation"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                {loading ? 'Saving...' : editingId ? 'Update Investigation' : 'Create Investigation'}
              </BrutalButton>
              <BrutalButton type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </BrutalButton>
            </div>
          </form>
        </BrutalCard>
      )}

      {/* List of Investigations */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-dark">Existing Investigations</h2>

        {loadingInvestigations ? (
          <BrutalCard>
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-dark border-t-transparent mb-4"></div>
              <p className="text-dark/60">Loading investigations...</p>
            </div>
          </BrutalCard>
        ) : investigations.length === 0 ? (
          <BrutalCard>
            <p className="text-dark/60 text-center py-8">
              No investigations yet. Create your first one above.
            </p>
          </BrutalCard>
        ) : (
          investigations.map((inv) => (
            <BrutalCard key={inv.id} hoverable>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-dark">{inv.title}</h3>
                    {inv.reportCount > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 border-2 border-dark bg-cool-blue text-dark font-bold text-xs">
                        <FileText size={14} />
                        {inv.reportCount}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-sm mb-3">
                    <span className="px-3 py-1 border-2 border-dark bg-cool-blue font-bold">
                      {inv.researchType}
                    </span>
                    <span className="px-3 py-1 border-2 border-dark bg-bg-light font-bold">
                      {inv.mathematicalArea}
                    </span>
                    <span
                      className={`px-3 py-1 border-2 border-dark font-bold ${
                        inv.status === 'Published'
                          ? 'bg-cool-blue'
                          : inv.status === 'Completed'
                          ? 'bg-alert-orange'
                          : 'bg-bg-light'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleView(inv)}
                    className="p-2 border-2 border-dark bg-white hover:bg-cool-blue transition-colors"
                    title="View details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleEdit(inv)}
                    className="p-2 border-2 border-dark bg-white hover:bg-cool-blue transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(inv.id!)}
                    className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <p className="text-dark/80 font-serif mb-3">
                {inv.description.length > 200
                  ? inv.description.substring(0, 200) + '...'
                  : inv.description}
              </p>

              {inv.impactMetrics && (
                <div className="mb-3 px-3 py-2 border-2 border-dark bg-cool-blue/20">
                  <p className="text-sm font-bold text-dark">
                    📈 Impact: {inv.impactMetrics}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 text-sm text-dark/60">
                <span>By {inv.author}</span>
                <span>Started: {new Date(inv.startDate.seconds * 1000).toLocaleDateString()}</span>
              </div>
            </BrutalCard>
          ))
        )}
      </div>

      {/* View Modal */}
      {viewingInvestigation && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white border-4 border-dark max-w-4xl w-full max-h-[90vh] overflow-auto my-8">
            <div className="sticky top-0 bg-cool-blue border-b-4 border-dark p-6 flex items-start justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold text-dark mb-2">{viewingInvestigation.title}</h2>
                <div className="flex gap-2 text-sm">
                  <span className="px-2 py-1 border-2 border-dark bg-white font-bold">
                    {viewingInvestigation.researchType}
                  </span>
                  <span className="px-2 py-1 border-2 border-dark bg-white font-bold">
                    {viewingInvestigation.mathematicalArea}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setViewingInvestigation(null)}
                className="p-2 border-4 border-dark bg-white hover:bg-alert-orange transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-dark mb-2">Description</h3>
                <p className="text-dark font-serif whitespace-pre-wrap">
                  {viewingInvestigation.description}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-dark mb-2">Key Findings</h3>
                <p className="text-dark font-serif whitespace-pre-wrap">
                  {viewingInvestigation.keyFindings}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-dark mb-2">Methodology</h3>
                <p className="text-dark font-serif whitespace-pre-wrap">
                  {viewingInvestigation.methodology}
                </p>
              </div>

              {viewingInvestigation.impactMetrics && (
                <div>
                  <h3 className="text-lg font-bold text-dark mb-2">Impact Metrics</h3>
                  <p className="text-dark font-serif">{viewingInvestigation.impactMetrics}</p>
                </div>
              )}

              {/* Systematic Literature Review Details */}
              {viewingInvestigation.researchType === 'Systematic Literature Review' && (
                <div className="border-4 border-cool-blue bg-cool-blue/10 p-4 space-y-4">
                  <h3 className="text-lg font-bold text-dark mb-2">Systematic Review Details</h3>

                  {viewingInvestigation.searchKeywords && viewingInvestigation.searchKeywords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-dark mb-1 uppercase tracking-wide">Search Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingInvestigation.searchKeywords.map((keyword, index) => (
                          <span key={index} className="px-2 py-1 border-2 border-dark bg-white text-sm font-medium">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingInvestigation.databases && viewingInvestigation.databases.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-dark mb-1 uppercase tracking-wide">Databases Searched</h4>
                      <div className="flex flex-wrap gap-2">
                        {viewingInvestigation.databases.map((db, index) => (
                          <span key={index} className="px-2 py-1 border-2 border-dark bg-white text-sm font-medium">
                            {db}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingInvestigation.paperCount && (
                    <div>
                      <h4 className="text-sm font-bold text-dark mb-1 uppercase tracking-wide">Papers Reviewed</h4>
                      <p className="text-2xl font-bold text-dark">{viewingInvestigation.paperCount}</p>
                    </div>
                  )}

                  {viewingInvestigation.citationLinks && viewingInvestigation.citationLinks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-dark mb-2 uppercase tracking-wide">
                        Key Citations ({viewingInvestigation.citationLinks.length})
                      </h4>
                      <div className="space-y-2">
                        {viewingInvestigation.citationLinks.map((citation, index) => (
                          <div key={index} className="border-2 border-dark bg-white p-3">
                            <p className="font-bold text-dark mb-1">{citation.title}</p>
                            {citation.authors && (
                              <p className="text-sm text-dark/60 mb-1">{citation.authors}</p>
                            )}
                            <a
                              href={citation.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-cool-blue hover:underline"
                            >
                              {citation.url} →
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-dark mb-3">
                  Associated Reports ({viewingReports.length})
                </h3>
                {viewingReports.length === 0 ? (
                  <p className="text-dark/60">No reports associated yet. Upload reports from the Scrollytelling Reports page.</p>
                ) : (
                  <div className="space-y-2">
                    {viewingReports.map((report) => (
                      <div
                        key={report.id}
                        className="border-4 border-dark bg-white p-3 hover:bg-bg-light transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-dark">{report.title}</h4>
                            <div className="flex gap-2 mt-1 text-xs">
                              <span className={`px-2 py-1 border-2 border-dark font-bold ${
                                report.status === 'Published' ? 'bg-cool-blue' :
                                report.status === 'Archived' ? 'bg-alert-orange' : 'bg-bg-light'
                              }`}>
                                {report.status}
                              </span>
                              {report.reportType && (
                                <span className="px-2 py-1 border-2 border-dark bg-bg-light font-bold">
                                  {report.reportType}
                                </span>
                              )}
                            </div>
                          </div>
                          <a
                            href={report.storage_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 border-4 border-dark bg-cool-blue text-dark font-bold hover:bg-white transition-colors text-sm"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
