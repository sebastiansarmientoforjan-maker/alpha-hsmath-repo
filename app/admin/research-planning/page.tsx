'use client';

import { useState, useEffect } from 'react';
import { BrutalCard, BrutalButton, BrutalInput } from '@/components/ui';
import {
  getAllResearchCollections,
  createResearchCollection,
  updateResearchCollection,
  deleteResearchCollection,
  addTopicToCollection,
  updateTopicInCollection,
  deleteTopicFromCollection,
  ResearchCollection,
  ResearchTopic,
  TopicStatus,
} from '@/lib/researchCollections';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, Trash2, Check, Clock, Circle, Sparkles, ExternalLink, X, ClipboardList } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ResearchPlanningPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [collections, setCollections] = useState<ResearchCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<ResearchCollection | null>(null);
  const [showTopicForm, setShowTopicForm] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<{ collectionId: string; topic: ResearchTopic } | null>(null);

  const [collectionForm, setCollectionForm] = useState({
    title: '',
    description: '',
    notes: '',
  });

  const [topicForm, setTopicForm] = useState({
    title: '',
    notes: '',
  });

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await getAllResearchCollections();
      setCollections(data);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetCollectionForm = () => {
    setCollectionForm({ title: '', description: '', notes: '' });
    setShowCollectionForm(false);
    setEditingCollection(null);
  };

  const resetTopicForm = () => {
    setTopicForm({ title: '', notes: '' });
    setShowTopicForm(null);
    setEditingTopic(null);
  };

  const handleSaveCollection = async () => {
    if (!user) {
      alert('Please sign in to edit collections.');
      return;
    }

    if (!collectionForm.title.trim()) {
      alert('Please enter a collection title.');
      return;
    }

    if (!editingCollection) {
      alert('Collections can only be created from investigations.');
      return;
    }

    try {
      await updateResearchCollection(editingCollection.id!, {
        title: collectionForm.title,
        description: collectionForm.description,
        notes: collectionForm.notes,
      });
      await loadCollections();
      resetCollectionForm();
    } catch (error) {
      console.error('Error saving collection:', error);
      alert('Failed to save collection.');
    }
  };

  const handleEditCollection = (collection: ResearchCollection) => {
    setEditingCollection(collection);
    setCollectionForm({
      title: collection.title,
      description: collection.description,
      notes: collection.notes || '',
    });
    setShowCollectionForm(true);
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

  const handleSaveTopic = async (collectionId: string) => {
    if (!topicForm.title.trim()) {
      alert('Please enter a topic title.');
      return;
    }

    try {
      if (editingTopic) {
        await updateTopicInCollection(collectionId, editingTopic.topic.id!, {
          title: topicForm.title,
          notes: topicForm.notes,
        });
      } else {
        await addTopicToCollection(collectionId, {
          title: topicForm.title,
          status: 'pending',
          notes: topicForm.notes,
        });
      }
      await loadCollections();
      resetTopicForm();
    } catch (error) {
      console.error('Error saving topic:', error);
      alert('Failed to save topic.');
    }
  };

  const handleEditTopic = (collectionId: string, topic: ResearchTopic) => {
    setEditingTopic({ collectionId, topic });
    setTopicForm({
      title: topic.title,
      notes: topic.notes || '',
    });
    setShowTopicForm(collectionId);
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

  const handleUpdateTopicStatus = async (
    collectionId: string,
    topicId: string,
    newStatus: TopicStatus
  ) => {
    try {
      const updates: Partial<ResearchTopic> = { status: newStatus };
      if (newStatus === 'completed') {
        updates.completedAt = { seconds: Date.now() / 1000, nanoseconds: 0 } as any;
      }
      await updateTopicInCollection(collectionId, topicId, updates);
      await loadCollections();
    } catch (error) {
      console.error('Error updating topic status:', error);
      alert('Failed to update topic status.');
    }
  };

  const handleGenerateGEM = (topicTitle: string) => {
    // Store topic title in localStorage for GEM Generator to pick up
    localStorage.setItem('gem-query-prefill', topicTitle);
    router.push('/admin/gem-generator');
  };

  const getStatusIcon = (status: TopicStatus) => {
    switch (status) {
      case 'pending':
        return <Circle size={16} className="text-dark/40" />;
      case 'in-progress':
        return <Clock size={16} className="text-alert-orange" />;
      case 'completed':
        return <Check size={16} className="text-cool-blue" />;
    }
  };

  const getStatusLabel = (status: TopicStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in-progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
    }
  };

  const calculateProgress = (topics: ResearchTopic[]) => {
    if (topics.length === 0) return 0;
    const completed = topics.filter((t) => t.status === 'completed').length;
    return Math.round((completed / topics.length) * 100);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-dark mb-2">Research Planning</h1>
        <p className="text-dark/70">
          Track and organize research collections created from investigations
        </p>
        <div className="mt-3 p-3 border-2 border-cool-blue bg-cool-blue/10">
          <p className="text-sm text-dark/80">
            💡 <strong>How to create a collection:</strong> Go to{' '}
            <a href="/admin/research" className="text-cool-blue hover:underline font-bold">
              Research Repository
            </a>
            {' '}→ View an investigation → Click "Create Collection"
          </p>
        </div>
      </div>

      {/* Collection Form Modal */}
      {showCollectionForm && (
        <BrutalCard className="mb-6 border-4 border-cool-blue bg-cool-blue/5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-dark">
              {editingCollection ? 'Edit Collection' : 'New Collection'}
            </h2>
            <button
              onClick={resetCollectionForm}
              className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <BrutalInput
              label="Collection Title *"
              placeholder="e.g., AP Calculus Mastery Framework"
              value={collectionForm.title}
              onChange={(e) => setCollectionForm({ ...collectionForm, title: e.target.value })}
            />

            <div>
              <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                Description *
              </label>
              <textarea
                value={collectionForm.description}
                onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                rows={3}
                className="w-full border-4 border-dark bg-white px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue resize-y"
                placeholder="Brief description of this research collection..."
              />
            </div>

            <div>
              <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                Notes (Optional)
              </label>
              <textarea
                value={collectionForm.notes}
                onChange={(e) => setCollectionForm({ ...collectionForm, notes: e.target.value })}
                rows={2}
                className="w-full border-4 border-dark bg-white px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue resize-y"
                placeholder="Additional notes, context, or objectives..."
              />
            </div>

            <div className="flex gap-3">
              <BrutalButton onClick={handleSaveCollection} variant="primary" className="gap-2">
                {editingCollection ? 'Update Collection' : 'Create Collection'}
              </BrutalButton>
              <BrutalButton onClick={resetCollectionForm} variant="secondary">
                Cancel
              </BrutalButton>
            </div>
          </div>
        </BrutalCard>
      )}

      {/* Collections List */}
      {loading ? (
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
            <a
              href="/admin/research"
              className="inline-flex items-center gap-2 px-6 py-3 border-4 border-dark bg-cool-blue text-dark font-bold hover:shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] transition-all"
            >
              Go to Research Repository →
            </a>
          </div>
        </BrutalCard>
      ) : (
        <div className="space-y-6">
          {collections.map((collection) => {
            const progress = calculateProgress(collection.topics);
            const completedCount = collection.topics.filter((t) => t.status === 'completed').length;
            const totalCount = collection.topics.length;

            return (
              <BrutalCard key={collection.id} className="p-6">
                {/* Collection Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b-4 border-dark">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-xs px-2 py-1 border-2 border-dark bg-cool-blue font-bold">
                        📄 FROM INVESTIGATION
                      </span>
                      <a
                        href="/admin/research"
                        className="text-xs text-cool-blue hover:underline"
                        title={`Source: ${collection.sourceInvestigationTitle}`}
                      >
                        {collection.sourceInvestigationTitle}
                      </a>
                    </div>
                    <h2 className="text-2xl font-bold text-dark mb-2">{collection.title}</h2>
                    <p className="text-dark/70 mb-3">{collection.description}</p>

                    {/* Progress Bar */}
                    {totalCount > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-4 border-4 border-dark bg-white overflow-hidden">
                          <div
                            className="h-full bg-cool-blue transition-all"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-dark whitespace-nowrap">
                          {completedCount}/{totalCount} completed ({progress}%)
                        </span>
                      </div>
                    )}

                    {collection.notes && (
                      <div className="mt-3 p-3 border-2 border-dark bg-bg-light">
                        <p className="text-sm text-dark/80">📝 {collection.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditCollection(collection)}
                      className="p-2 border-2 border-dark bg-white hover:bg-cool-blue transition-colors"
                      title="Edit collection"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteCollection(collection.id!)}
                      className="p-2 border-2 border-dark bg-white hover:bg-alert-orange transition-colors"
                      title="Delete collection"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Topics List */}
                <div className="space-y-3 mb-4">
                  {collection.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-start gap-3 p-4 border-4 border-dark bg-white"
                    >
                      {/* Status Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(topic.status)}
                      </div>

                      {/* Topic Content */}
                      <div className="flex-1">
                        <h3 className="font-bold text-dark mb-1">{topic.title}</h3>
                        {topic.notes && (
                          <p className="text-sm text-dark/60 mb-2">{topic.notes}</p>
                        )}

                        {/* Linked Investigation */}
                        {topic.linkedInvestigationId && (
                          <a
                            href={`/admin/research`}
                            className="inline-flex items-center gap-1 text-sm text-cool-blue hover:underline"
                          >
                            <ExternalLink size={14} />
                            {topic.linkedInvestigationTitle || 'View Investigation'}
                          </a>
                        )}

                        {/* Status Badge */}
                        <span
                          className={`inline-block mt-2 px-3 py-1 border-2 border-dark text-xs font-bold ${
                            topic.status === 'completed'
                              ? 'bg-cool-blue'
                              : topic.status === 'in-progress'
                              ? 'bg-alert-orange'
                              : 'bg-white'
                          }`}
                        >
                          {getStatusLabel(topic.status)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {topic.status !== 'completed' && (
                          <BrutalButton
                            onClick={() => handleGenerateGEM(topic.title)}
                            variant="primary"
                            className="gap-2 text-xs bg-alert-orange border-alert-orange"
                          >
                            <Sparkles size={14} />
                            Generate GEM
                          </BrutalButton>
                        )}

                        <div className="flex gap-1">
                          {topic.status === 'pending' && (
                            <button
                              onClick={() =>
                                handleUpdateTopicStatus(collection.id!, topic.id!, 'in-progress')
                              }
                              className="p-1 border-2 border-dark bg-white hover:bg-alert-orange transition-colors text-xs"
                              title="Start"
                            >
                              <Clock size={14} />
                            </button>
                          )}
                          {topic.status === 'in-progress' && (
                            <button
                              onClick={() =>
                                handleUpdateTopicStatus(collection.id!, topic.id!, 'completed')
                              }
                              className="p-1 border-2 border-dark bg-white hover:bg-cool-blue transition-colors text-xs"
                              title="Complete"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditTopic(collection.id!, topic)}
                            className="p-1 border-2 border-dark bg-white hover:bg-cool-blue transition-colors text-xs"
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(collection.id!, topic.id!)}
                            className="p-1 border-2 border-dark bg-white hover:bg-alert-orange transition-colors text-xs"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Topic Form */}
                {showTopicForm === collection.id && (
                  <div className="p-4 border-4 border-cool-blue bg-cool-blue/5 mb-4">
                    <h3 className="text-lg font-bold text-dark mb-3">
                      {editingTopic ? 'Edit Topic' : 'Add New Topic'}
                    </h3>
                    <div className="space-y-3">
                      <BrutalInput
                        label="Topic Title *"
                        placeholder="e.g., Discriminant fluency patterns"
                        value={topicForm.title}
                        onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                      />
                      <div>
                        <label className="block text-dark font-bold mb-2 text-sm uppercase tracking-wide">
                          Notes (Optional)
                        </label>
                        <textarea
                          value={topicForm.notes}
                          onChange={(e) => setTopicForm({ ...topicForm, notes: e.target.value })}
                          rows={2}
                          className="w-full border-4 border-dark bg-white px-4 py-3 text-dark focus:outline-none focus:ring-4 focus:ring-cool-blue resize-y text-sm"
                          placeholder="Additional context or specific questions..."
                        />
                      </div>
                      <div className="flex gap-3">
                        <BrutalButton
                          onClick={() => handleSaveTopic(collection.id!)}
                          variant="primary"
                          className="gap-2 text-sm"
                        >
                          {editingTopic ? 'Update Topic' : 'Add Topic'}
                        </BrutalButton>
                        <BrutalButton
                          onClick={resetTopicForm}
                          variant="secondary"
                          className="text-sm"
                        >
                          Cancel
                        </BrutalButton>
                      </div>
                    </div>
                  </div>
                )}

                {/* Add Topic Button */}
                {showTopicForm !== collection.id && (
                  <button
                    onClick={() => setShowTopicForm(collection.id!)}
                    className="w-full px-4 py-3 border-4 border-dashed border-dark bg-white text-dark font-bold hover:bg-bg-light transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={20} />
                    Add Topic to Collection
                  </button>
                )}
              </BrutalCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
