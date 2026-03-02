'use client';

import { useState, useEffect } from 'react';
import { BrutalCard } from '@/components/ui';
import {
  deleteInvestigation,
  getAllInvestigations,
  Investigation,
} from '@/lib/investigations';
import { getReportsByInvestigation } from '@/lib/scrollytellingReports';
import { ScrollytellingReport } from '@/lib/uploadHtmlReport';
import {
  createResearchCollection,
  addTopicToCollection,
  getAllResearchCollections,
  updateResearchCollection,
  deleteResearchCollection,
  updateTopicInCollection,
  deleteTopicFromCollection,
  ResearchCollection,
  ResearchTopic,
} from '@/lib/researchCollections';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, FileText, Eye, X, ClipboardList, Edit, Check, Clock, Circle, Sparkles, Plus, Microscope } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';

export default function ResearchRepositoryAdmin() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Tab state
  const [activeTab, setActiveTab] = useState<'investigations' | 'collections'>('investigations');

  // Investigations state
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loadingInvestigations, setLoadingInvestigations] = useState(true);
  const [viewingInvestigation, setViewingInvestigation] = useState<Investigation | null>(null);
  const [viewingReports, setViewingReports] = useState<(ScrollytellingReport & { id: string })[]>([]);
  const [creatingCollection, setCreatingCollection] = useState(false);

  // Collections state
  const [collections, setCollections] = useState<ResearchCollection[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [expandedCollectionId, setExpandedCollectionId] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] = useState<ResearchCollection | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ collectionId: string; topic: ResearchTopic } | null>(null);
  const [addingTopicToCollection, setAddingTopicToCollection] = useState<string | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');

  // Link existing investigation to topic
  const [linkingInvestigation, setLinkingInvestigation] = useState(false);
  const [linkCollectionId, setLinkCollectionId] = useState('');
  const [linkTopicId, setLinkTopicId] = useState('');

  useEffect(() => {
    // Check query param for initial tab
    const tab = searchParams.get('tab');
    if (tab === 'collections') {
      setActiveTab('collections');
      loadCollections();
    } else {
      loadInvestigations();
    }
  }, [searchParams]);

  // Reload collections when switching to collections tab
  useEffect(() => {
    if (activeTab === 'collections') {
      loadCollections();
    }
  }, [activeTab]);

  // Reload collections when window regains focus (e.g., coming back from Process Results)
  useEffect(() => {
    const handleFocus = () => {
      if (activeTab === 'collections') {
        console.log('Window focused, reloading collections...');
        loadCollections();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeTab]);

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

    // Load collections for linking if not already loaded
    if (collections.length === 0) {
      loadCollections();
    }

    if (investigation.id) {
      const reports = await getReportsByInvestigation(investigation.id);
      setViewingReports(reports);
    }
  };

  const extractTopicsFromKeyFindings = (keyFindings: string | any): string[] => {
    const topics: string[] = [];

    // Convert to string if it's an array (legacy data format)
    let keyFindingsStr: string;
    if (Array.isArray(keyFindings)) {
      console.log('Converting keyFindings from array to string');
      keyFindingsStr = keyFindings.join('\n');
    } else if (typeof keyFindings === 'string') {
      keyFindingsStr = keyFindings;
    } else {
      console.error('keyFindings is not a valid string or array:', keyFindings);
      return [];
    }

    if (!keyFindingsStr) {
      return [];
    }

    const lines = keyFindingsStr.split('\n');

    for (const line of lines) {
      // Match lines with bullet points and category tags like "• [PEDAGOGY] Finding Title:"
      const match = line.match(/^[•\-\*]\s*(?:\[[\w\s]+\])?\s*(.+?)(?::|$)/);
      if (match) {
        let topic = match[1].trim();
        // Remove category tags if present
        topic = topic.replace(/^\[[\w\s]+\]\s*/, '');
        // Limit to first 100 characters
        if (topic.length > 100) {
          topic = topic.substring(0, 97) + '...';
        }
        if (topic) {
          topics.push(topic);
        }
      }
    }

    // If no topics found, split by paragraphs and use first sentence of each
    if (topics.length === 0) {
      const paragraphs = keyFindingsStr.split('\n\n').filter(p => p.trim());
      for (const paragraph of paragraphs.slice(0, 7)) {
        const firstSentence = paragraph.split(/[.!?]/)[0].trim();
        if (firstSentence && firstSentence.length > 10) {
          const topic = firstSentence.length > 100
            ? firstSentence.substring(0, 97) + '...'
            : firstSentence;
          topics.push(topic);
        }
      }
    }

    return topics.slice(0, 10); // Max 10 topics
  };

  const handleCreateResearchCollection = async (investigation: Investigation) => {
    if (!user) {
      alert('Please sign in to create research collections.');
      return;
    }

    if (!investigation.id) {
      alert('Investigation ID is missing.');
      return;
    }

    setCreatingCollection(true);
    try {
      // Create collection (empty - user will add topics manually)
      const collectionId = await createResearchCollection({
        title: `${investigation.title} - Research Collection`,
        description: `Research collection based on: ${investigation.title}`,
        notes: `Source: ${investigation.title}\n\nAdd topics manually to organize your research.`,
        sourceInvestigationId: investigation.id,
        sourceInvestigationTitle: investigation.title,
        createdBy: user.email || user.displayName || 'Unknown',
      });

      // Close investigation modal
      setViewingInvestigation(null);

      // Switch to collections tab and load collections
      setActiveTab('collections');
      await loadCollections();
      setExpandedCollectionId(collectionId);

      // Show success message
      alert(`✅ Research Collection created!\n\nYou can now add topics manually.`);
    } catch (error) {
      console.error('Error creating research collection:', error);
      alert('Failed to create research collection. Please try again.');
    } finally {
      setCreatingCollection(false);
    }
  };

  // Collections functions
  const loadCollections = async () => {
    console.log('Loading collections...');
    setLoadingCollections(true);
    try {
      const data = await getAllResearchCollections();
      console.log('Collections loaded:', data.length, 'collections');
      setCollections(data);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoadingCollections(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (!confirm('Delete this collection? All topics will be lost.')) {
      return;
    }

    try {
      await deleteResearchCollection(id);
      await loadCollections();
    } catch (error) {
      console.error('Error deleting collection:', error);
      alert('Failed to delete collection.');
    }
  };

  const handleToggleTopicStatus = async (collectionId: string, topic: ResearchTopic) => {
    const statusOrder: Record<string, string> = {
      'pending': 'in-progress',
      'in-progress': 'completed',
      'completed': 'pending',
    };
    const newStatus = statusOrder[topic.status] as ResearchTopic['status'];

    try {
      await updateTopicInCollection(collectionId, topic.id!, {
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date() : undefined,
      } as any);
      await loadCollections();
    } catch (error) {
      console.error('Error updating topic status:', error);
    }
  };

  const handleDeleteTopic = async (collectionId: string, topicId: string) => {
    if (!confirm('Delete this topic?')) {
      return;
    }

    try {
      await deleteTopicFromCollection(collectionId, topicId);
      await loadCollections();
    } catch (error) {
      console.error('Error deleting topic:', error);
      alert('Failed to delete topic.');
    }
  };

  const handleAddTopic = async (collectionId: string) => {
    if (!newTopicTitle.trim()) {
      alert('Please enter a topic title.');
      return;
    }

    try {
      await addTopicToCollection(collectionId, {
        title: newTopicTitle.trim(),
        status: 'pending',
      });
      await loadCollections();
      setNewTopicTitle('');
      setAddingTopicToCollection(null);
    } catch (error) {
      console.error('Error adding topic:', error);
      alert('Failed to add topic.');
    }
  };

  const handleLinkInvestigationToTopic = async () => {
    if (!viewingInvestigation || !linkCollectionId || !linkTopicId) {
      alert('Please select both collection and topic.');
      return;
    }

    if (!viewingInvestigation.id) {
      alert('Investigation ID is missing.');
      return;
    }

    setLinkingInvestigation(true);
    try {
      console.log('Linking investigation to topic:', {
        investigationId: viewingInvestigation.id,
        collectionId: linkCollectionId,
        topicId: linkTopicId,
      });

      await updateTopicInCollection(linkCollectionId, linkTopicId, {
        linkedInvestigationId: viewingInvestigation.id,
        linkedInvestigationTitle: viewingInvestigation.title,
        status: 'completed',
        completedAt: Timestamp.now(),
      } as any);

      console.log('Investigation linked successfully, reloading collections...');

      // Reload collections and close modal
      await loadCollections();
      setViewingInvestigation(null);
      setLinkCollectionId('');
      setLinkTopicId('');

      // Switch to collections tab
      setActiveTab('collections');

      alert(`✅ Investigation linked to topic!\n\nTopic marked as completed.`);
    } catch (error) {
      console.error('Error linking investigation:', error);
      alert('Failed to link investigation to topic. Please try again.');
    } finally {
      setLinkingInvestigation(false);
    }
  };

  const handleGenerateGEM = (topicTitle: string) => {
    localStorage.setItem('gem-query-prefill', topicTitle);
    router.push('/admin/gem-generator');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Circle size={16} className="text-dark/40" />;
      case 'in-progress':
        return <Clock size={16} className="text-alert-orange" />;
      case 'completed':
        return <Check size={16} className="text-cool-blue" />;
      default:
        return <Circle size={16} />;
    }
  };

  const getProgressPercentage = (topics: ResearchTopic[]) => {
    if (topics.length === 0) return 0;
    const completed = topics.filter(t => t.status === 'completed').length;
    return Math.round((completed / topics.length) * 100);
  };


  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-dark mb-2">Research Repository</h1>
        <p className="text-dark/70">
          View and manage research investigations and research collections. Create new investigations from{' '}
          <a href="/admin/process-results" className="text-cool-blue hover:underline font-bold">
            Process Results
          </a>
          .
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={() => {
            setActiveTab('investigations');
            if (investigations.length === 0) loadInvestigations();
          }}
          className={`px-6 py-3 border-4 border-dark font-bold transition-all ${
            activeTab === 'investigations'
              ? 'bg-cool-blue text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]'
              : 'bg-white text-dark hover:bg-bg-light'
          }`}
        >
          <Microscope size={20} className="inline mr-2" />
          Investigations
        </button>
        <button
          onClick={() => {
            setActiveTab('collections');
            if (collections.length === 0) loadCollections();
          }}
          className={`px-6 py-3 border-4 border-dark font-bold transition-all ${
            activeTab === 'collections'
              ? 'bg-cool-blue text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]'
              : 'bg-white text-dark hover:bg-bg-light'
          }`}
        >
          <ClipboardList size={20} className="inline mr-2" />
          Collections
        </button>
      </div>

      {/* Investigations Tab */}
      {activeTab === 'investigations' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-dark">All Investigations</h2>

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
              No investigations yet. Create one from{' '}
              <a href="/admin/process-results" className="text-cool-blue hover:underline font-bold">
                Process Results
              </a>
              .
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
                    onClick={() => handleDelete(inv.id!)}
                    className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
                    title="Delete investigation"
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
      )}

      {/* View Modal (shared between tabs) */}
      {viewingInvestigation && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center z-50 p-4 overflow-auto">
          <div className="bg-white border-4 border-dark max-w-4xl w-full max-h-[90vh] overflow-auto my-8">
            <div className="sticky top-0 bg-cool-blue border-b-4 border-dark p-6 flex items-start justify-between z-10">
              <div className="flex-1">
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
              <div className="flex gap-2">
                <button
                  onClick={() => handleCreateResearchCollection(viewingInvestigation)}
                  disabled={creatingCollection}
                  className="flex items-center gap-2 px-4 py-2 border-4 border-dark bg-alert-orange text-dark font-bold hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Create research collection with topics from this investigation"
                >
                  {creatingCollection ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-dark border-t-transparent"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <ClipboardList size={20} />
                      <span>Create Collection</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setViewingInvestigation(null)}
                  className="p-2 border-4 border-dark bg-white hover:bg-alert-orange transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
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

              {/* CTA: Create Research Collection */}
              <div className="bg-alert-orange/20 border-4 border-alert-orange p-6 my-6">
                <h3 className="text-xl font-bold text-dark mb-3 flex items-center gap-2">
                  <ClipboardList size={24} />
                  Organize Follow-Up Research
                </h3>
                <p className="text-dark/80 mb-4">
                  Create a <strong>Research Collection</strong> to track and organize follow-up investigations based on these findings.
                  You can add topics manually to organize your research goals.
                </p>
                <button
                  onClick={() => handleCreateResearchCollection(viewingInvestigation)}
                  disabled={creatingCollection}
                  className={`flex items-center gap-3 px-8 py-4 border-4 border-dark font-bold text-base transition-all ${
                    creatingCollection
                      ? 'bg-gray-300 text-dark/40 cursor-not-allowed'
                      : 'bg-alert-orange text-dark hover:shadow-[6px_6px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[-3px] hover:translate-y-[-3px]'
                  }`}
                >
                  {creatingCollection ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-4 border-dark border-t-transparent"></div>
                      <span>Creating Collection...</span>
                    </>
                  ) : (
                    <>
                      <ClipboardList size={20} />
                      <span>Create Research Collection</span>
                    </>
                  )}
                </button>
              </div>

              {/* Link to Existing Topic */}
              <div className="bg-cool-blue/20 border-4 border-cool-blue p-6 my-6">
                <h3 className="text-xl font-bold text-dark mb-3 flex items-center gap-2">
                  <Check size={24} />
                  Link to Existing Topic
                </h3>
                <p className="text-dark/80 mb-4">
                  Already have a research topic waiting for this investigation? Link it here to mark the topic as completed.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-dark mb-2">
                      Select Collection
                    </label>
                    <select
                      value={linkCollectionId}
                      onChange={(e) => {
                        setLinkCollectionId(e.target.value);
                        setLinkTopicId(''); // Reset topic when collection changes
                      }}
                      className="w-full border-4 border-dark px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue"
                    >
                      <option value="">-- Select a collection --</option>
                      {collections.map((collection) => (
                        <option key={collection.id} value={collection.id}>
                          {collection.title} ({collection.topics.length} topics)
                        </option>
                      ))}
                    </select>
                  </div>

                  {linkCollectionId && (
                    <div>
                      <label className="block text-sm font-bold text-dark mb-2">
                        Select Topic
                      </label>
                      <select
                        value={linkTopicId}
                        onChange={(e) => setLinkTopicId(e.target.value)}
                        className="w-full border-4 border-dark px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue"
                      >
                        <option value="">-- Select a topic --</option>
                        {collections
                          .find((c) => c.id === linkCollectionId)
                          ?.topics.filter((t) => t.status === 'in-progress')
                          .map((topic) => (
                            <option key={topic.id} value={topic.id}>
                              {topic.title}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-dark/60 mt-2">
                        Only showing in-progress topics
                      </p>
                    </div>
                  )}

                  {linkCollectionId && linkTopicId && (
                    <button
                      onClick={handleLinkInvestigationToTopic}
                      disabled={linkingInvestigation}
                      className={`w-full flex items-center justify-center gap-3 px-6 py-4 border-4 border-dark font-bold text-base transition-all ${
                        linkingInvestigation
                          ? 'bg-gray-300 text-dark/40 cursor-not-allowed'
                          : 'bg-cool-blue text-dark hover:shadow-[6px_6px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[-3px] hover:translate-y-[-3px]'
                      }`}
                    >
                      {linkingInvestigation ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-4 border-dark border-t-transparent"></div>
                          <span>Linking...</span>
                        </>
                      ) : (
                        <>
                          <Check size={20} />
                          <span>Link Investigation to Topic</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
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

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-dark">Research Collections</h2>

          {loadingCollections ? (
            <BrutalCard>
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-dark border-t-transparent mb-4"></div>
                <p className="text-dark/60">Loading collections...</p>
              </div>
            </BrutalCard>
          ) : collections.length === 0 ? (
            <BrutalCard>
              <div className="text-center py-12">
                <ClipboardList size={48} className="mx-auto mb-4 text-dark/40" />
                <p className="text-dark/60 mb-2 text-lg font-bold">No research collections yet.</p>
                <p className="text-dark/50 mb-6">
                  Collections are created from investigations to organize deep-dive research topics.
                </p>
                <button
                  onClick={() => setActiveTab('investigations')}
                  className="px-6 py-3 border-4 border-dark bg-cool-blue text-dark font-bold hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all"
                >
                  <Microscope size={20} className="inline mr-2" />
                  View Investigations
                </button>
              </div>
            </BrutalCard>
          ) : (
            <div className="space-y-6">
              {collections.map((collection) => {
                const progress = getProgressPercentage(collection.topics);
                const isExpanded = expandedCollectionId === collection.id;

                return (
                  <BrutalCard key={collection.id} className="overflow-hidden">
                    {/* Collection Header */}
                    <div className="p-6 border-b-4 border-dark">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-dark">{collection.title}</h3>
                            <div className="px-2 py-1 border-2 border-cool-blue bg-cool-blue/20 text-xs font-bold">
                              {collection.topics.length} {collection.topics.length === 1 ? 'Topic' : 'Topics'}
                            </div>
                          </div>
                          <p className="text-dark/80 mb-3">{collection.description}</p>
                          <div className="text-sm text-dark/60">
                            <span className="font-bold">Source:</span>{' '}
                            <span className="italic">{collection.sourceInvestigationTitle}</span>
                          </div>
                          {collection.notes && (
                            <p className="text-sm text-dark/60 mt-2 italic">{collection.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteCollection(collection.id!)}
                            className="p-2 border-4 border-dark bg-white hover:bg-alert-orange transition-colors"
                            title="Delete collection"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-dark">Progress</span>
                          <span className="text-sm font-bold text-dark">{progress}%</span>
                        </div>
                        <div className="h-3 border-4 border-dark bg-white">
                          <div
                            className="h-full bg-cool-blue transition-all"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Toggle Button */}
                      <button
                        onClick={() => setExpandedCollectionId(isExpanded ? null : collection.id!)}
                        className="w-full mt-4 px-4 py-2 border-4 border-dark bg-white hover:bg-bg-light font-bold transition-all"
                      >
                        {isExpanded ? '▲ Hide Topics' : '▼ View Topics'}
                      </button>
                    </div>

                    {/* Topics List (Collapsible) */}
                    {isExpanded && (
                      <div className="p-6 bg-bg-light">
                        {/* Add Topic Button/Form */}
                        {addingTopicToCollection === collection.id ? (
                          <div className="mb-4 p-4 border-4 border-cool-blue bg-white">
                            <h4 className="text-sm font-bold text-dark mb-3">Add New Topic</h4>
                            <div className="flex gap-3">
                              <input
                                type="text"
                                value={newTopicTitle}
                                onChange={(e) => setNewTopicTitle(e.target.value)}
                                placeholder="Enter topic title..."
                                className="flex-1 border-2 border-dark px-3 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-cool-blue"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddTopic(collection.id!);
                                  }
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleAddTopic(collection.id!)}
                                className="px-4 py-2 border-2 border-dark bg-cool-blue text-dark font-bold hover:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] transition-all"
                              >
                                <Check size={20} />
                              </button>
                              <button
                                onClick={() => {
                                  setAddingTopicToCollection(null);
                                  setNewTopicTitle('');
                                }}
                                className="px-4 py-2 border-2 border-dark bg-white text-dark font-bold hover:bg-bg-light transition-all"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingTopicToCollection(collection.id!)}
                            className="mb-4 w-full px-4 py-3 border-4 border-dark bg-cool-blue text-dark font-bold hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all"
                          >
                            <Plus size={20} className="inline mr-2" />
                            Add Topic
                          </button>
                        )}

                        <div className="space-y-3">
                          {collection.topics.length === 0 ? (
                            <div className="text-center py-8 text-dark/60">
                              <p className="text-sm">No topics yet. Click "Add Topic" to get started.</p>
                            </div>
                          ) : (
                            collection.topics.map((topic) => (
                            <div
                              key={topic.id}
                              className="p-4 border-4 border-dark bg-white hover:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] transition-all"
                            >
                              <div className="flex items-start gap-4">
                                {/* Status Toggle */}
                                <button
                                  onClick={() => handleToggleTopicStatus(collection.id!, topic)}
                                  className="flex-shrink-0 p-2 border-2 border-dark hover:bg-bg-light transition-colors"
                                  title={`Status: ${topic.status}`}
                                >
                                  {getStatusIcon(topic.status)}
                                </button>

                                {/* Topic Content */}
                                <div className="flex-1">
                                  <h4 className="font-bold text-dark mb-1">{topic.title}</h4>
                                  {topic.notes && (
                                    <p className="text-sm text-dark/60 mb-2 italic">{topic.notes}</p>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-dark/50">
                                    <span className="font-medium uppercase">{topic.status}</span>
                                    {topic.linkedInvestigationTitle && (
                                      <>
                                        <span>•</span>
                                        <span>Linked: {topic.linkedInvestigationTitle}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleGenerateGEM(topic.title)}
                                    className="px-3 py-2 border-2 border-dark bg-cool-blue text-dark text-sm font-bold hover:bg-white transition-colors"
                                    title="Generate GEM prompt for this topic"
                                  >
                                    <Sparkles size={16} className="inline mr-1" />
                                    GEM
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTopic(collection.id!, topic.id!)}
                                    className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
                                    title="Delete topic"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                          )}
                        </div>
                      </div>
                    )}
                  </BrutalCard>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
