'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BrutalCard, BrutalButton } from '@/components/ui';
import { getAllReports, ScrollytellingReport } from '@/lib/scrollytellingReports';
import { getInvestigationsForDecision } from '@/lib/decisionInvestigations';
import { Investigation } from '@/lib/investigations';
import { addReportComment, getReportComments, ReportComment } from '@/lib/reportComments';
import { Eye, MessageSquare, Microscope, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import GlobalHeader from '@/components/GlobalHeader';

export default function StakeholdersPage() {
  const router = useRouter();
  const { user, loading, isAdmin: isAdminUser, isViewer } = useAuth();
  const [reports, setReports] = useState<(ScrollytellingReport & { id: string })[]>([]);
  const [selectedReport, setSelectedReport] = useState<(ScrollytellingReport & { id: string }) | null>(null);
  const [linkedInvestigations, setLinkedInvestigations] = useState<Investigation[]>([]);
  const [comments, setComments] = useState<(ReportComment & { id: string })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showInvestigationsModal, setShowInvestigationsModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user, isAdminUser]);

  const loadReports = async () => {
    try {
      const allReports = await getAllReports();

      if (isAdminUser) {
        // Admin sees all Published reports with decisionLogId
        const publishedDecisionReports = allReports.filter(
          (report) => report.status === 'Published' && report.decisionLogId
        );
        setReports(publishedDecisionReports);
      } else {
        // Viewers only see approved reports
        const approvedReports = allReports.filter(
          (report) =>
            report.status === 'Published' &&
            report.decisionLogId &&
            report.approvedForStakeholders === true
        );
        setReports(approvedReports);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleViewReport = async (report: ScrollytellingReport & { id: string }) => {
    setSelectedReport(report);
    setShowComments(false);

    // Load linked investigations
    if (report.decisionLogId) {
      try {
        const investigations = await getInvestigationsForDecision(report.decisionLogId);
        setLinkedInvestigations(investigations);
      } catch (error) {
        console.error('Error loading investigations:', error);
        setLinkedInvestigations([]);
      }
    }

    // Load comments from Firestore
    setLoadingComments(true);
    try {
      const reportComments = await getReportComments(report.id);
      setComments(reportComments);
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedReport || !user) return;

    try {
      await addReportComment(
        selectedReport.id,
        user.uid,
        user.email || '',
        user.displayName || user.email || 'Anonymous',
        newComment
      );

      // Reload comments to show the new one
      const reportComments = await getReportComments(selectedReport.id);
      setComments(reportComments);
      setNewComment('');
      alert('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <p className="text-dark">Loading...</p>
      </div>
    );
  }

  // Not signed in - Redirect to home page
  if (!user) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-6">
        <BrutalCard className="max-w-md w-full text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-dark mb-2">Authentication Required</h1>
            <p className="text-dark/70">
              Please sign in from the home page to access the Stakeholder Portal
            </p>
          </div>

          <div className="mb-6 p-4 border-2 border-dark bg-cool-blue/20">
            <p className="text-sm text-dark/80">
              <strong>Access Requirements:</strong><br />
              Sign in with your @alpha.school email from the home page
            </p>
          </div>

          <BrutalButton
            onClick={() => window.location.href = '/'}
            variant="primary"
            className="w-full text-lg py-4"
          >
            Go to Home Page
          </BrutalButton>
        </BrutalCard>
      </div>
    );
  }

  // Not authorized
  if (!isViewer) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-6">
        <BrutalCard className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-dark mb-4">Access Denied</h1>
          <p className="text-dark/70 mb-6">
            Only @alpha.school emails are authorized to access this portal.
          </p>
          <p className="text-sm text-dark/50 mb-6">
            Signed in as: {user?.email}
          </p>
          <BrutalButton onClick={() => router.push('/')} variant="secondary" className="w-full">
            Go to Home
          </BrutalButton>
        </BrutalCard>
      </div>
    );
  }

  // Authorized - Show reports
  return (
    <div className="min-h-screen bg-bg-light">
      <GlobalHeader />

      {/* Page Header */}
      <div className="bg-white border-b-4 border-dark p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-dark flex items-center gap-2">
            Decision Reports
            {isAdminUser && (
              <span className="flex items-center gap-1 px-2 py-1 text-sm border-2 border-dark bg-alert-orange text-white">
                <Shield size={16} />
                ADMIN
              </span>
            )}
          </h1>
          <p className="text-sm text-dark/70">
            {isAdminUser ? 'Admin Portal - View and Comment on Reports' : 'Stakeholder Portal'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {!selectedReport ? (
          // Reports List View
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-dark mb-2">
                {isAdminUser ? 'Published Decision Reports' : 'Approved Decision Reports'}
              </h2>
              <p className="text-dark/70">
                {reports.length} {reports.length === 1 ? 'report' : 'reports'} available
              </p>
            </div>

            {reports.length === 0 ? (
              <BrutalCard>
                <p className="text-center text-dark/60 py-8">
                  {isAdminUser
                    ? 'No published reports with decisions available yet.'
                    : 'No approved reports available yet.'}
                </p>
              </BrutalCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map((report) => (
                  <BrutalCard key={report.id} hoverable>
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-dark mb-2">{report.title}</h3>
                      {report.description && (
                        <p className="text-sm text-dark/70 mb-3">{report.description}</p>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        {report.tags?.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 border-2 border-dark bg-cool-blue text-dark text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="pt-3 border-t-2 border-dark">
                      <div className="grid grid-cols-2 gap-2">
                        <BrutalButton
                          onClick={() => handleViewReport(report)}
                          variant="primary"
                          className="gap-2"
                        >
                          <Eye size={16} />
                          View Report
                        </BrutalButton>
                        <BrutalButton
                          onClick={async () => {
                            // Load investigations for this report
                            if (report.decisionLogId) {
                              try {
                                const investigations = await getInvestigationsForDecision(report.decisionLogId);
                                setLinkedInvestigations(investigations);
                                setShowInvestigationsModal(true);
                              } catch (error) {
                                console.error('Error loading investigations:', error);
                                setLinkedInvestigations([]);
                              }
                            }
                          }}
                          variant="secondary"
                          className="gap-2"
                        >
                          <Microscope size={16} />
                          Research
                        </BrutalButton>
                      </div>
                    </div>
                  </BrutalCard>
                ))}
              </div>
            )}
          </>
        ) : (
          // Report Detail View
          <>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-dark mb-1">{selectedReport.title}</h2>
                {selectedReport.description && (
                  <p className="text-dark/70">{selectedReport.description}</p>
                )}
              </div>
              <BrutalButton onClick={() => setSelectedReport(null)} variant="secondary">
                ← Back to Reports
              </BrutalButton>
            </div>

            <div>
              {/* Main content - ScrollyTelling */}
              <BrutalCard>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-dark">Decision Report</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowInvestigationsModal(true)}
                      className="px-3 py-2 border-2 border-dark font-bold bg-white hover:bg-cool-blue transition-colors"
                    >
                      <Microscope size={16} className="inline mr-2" />
                      View Research ({linkedInvestigations.length})
                    </button>
                    <button
                      onClick={() => setShowComments(!showComments)}
                      className={`px-3 py-2 border-2 border-dark font-bold transition-colors ${
                        showComments ? 'bg-cool-blue' : 'bg-white hover:bg-cool-blue'
                      }`}
                    >
                      <MessageSquare size={16} className="inline mr-2" />
                      Comments ({comments.length})
                    </button>
                  </div>
                </div>

                  {showComments ? (
                    // Comments View
                    <div className="space-y-4">
                      <div className="border-4 border-dark bg-white p-4 max-h-96 overflow-y-auto">
                        {loadingComments ? (
                          <p className="text-dark/60 text-center py-8">
                            Loading comments...
                          </p>
                        ) : comments.length === 0 ? (
                          <p className="text-dark/60 text-center py-8">
                            No comments yet. Be the first to comment!
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {comments.map((comment) => (
                              <div key={comment.id} className="border-2 border-dark bg-bg-light p-3">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="font-bold text-dark">{comment.userName}</p>
                                    <p className="text-xs text-dark/70">{comment.userEmail}</p>
                                  </div>
                                  <p className="text-xs text-dark/70">
                                    {comment.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
                                  </p>
                                </div>
                                <p className="text-dark">{comment.comment}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add your comment..."
                          rows={4}
                          className="w-full border-4 border-dark bg-white px-4 py-3 text-dark font-serif focus:outline-none resize-y"
                        />
                        <BrutalButton
                          onClick={handleAddComment}
                          variant="primary"
                          disabled={!newComment.trim()}
                          className="mt-2 w-full"
                        >
                          Add Comment
                        </BrutalButton>
                      </div>
                    </div>
                  ) : (
                    // ScrollyTelling View
                    <div className="border-4 border-dark bg-white">
                      <iframe
                        srcDoc={selectedReport.html_content || undefined}
                        src={selectedReport.html_content ? undefined : selectedReport.storage_url}
                        className="w-full h-[600px]"
                        title={selectedReport.title}
                        sandbox="allow-scripts allow-same-origin"
                      />
                    </div>
                  )}
                </BrutalCard>
            </div>
          </>
        )}
      </div>

      {/* Investigations Modal - Available in both gallery and detail views */}
      {showInvestigationsModal && (
        <div className="fixed inset-0 bg-dark/50 flex items-center justify-center p-6 z-50" onClick={() => setShowInvestigationsModal(false)}>
          <div className="bg-white border-4 border-dark max-w-3xl w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b-4 border-dark p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-dark flex items-center gap-2">
                <Microscope size={24} />
                Research Foundation
              </h3>
              <button
                onClick={() => setShowInvestigationsModal(false)}
                className="px-4 py-2 border-2 border-dark bg-white hover:bg-alert-orange font-bold transition-colors"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6">
              {linkedInvestigations.length === 0 ? (
                <p className="text-dark/60 text-center py-8">No linked investigations</p>
              ) : (
                <div className="space-y-4">
                  {linkedInvestigations.map((inv) => (
                    <div key={inv.id} className="border-4 border-dark bg-bg-light p-6">
                      <h4 className="text-xl font-bold text-dark mb-4">{inv.title}</h4>

                      {inv.description && (
                        <div className="mb-4 pb-4 border-b-2 border-dark">
                          <p className="text-dark font-serif">{inv.description}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-bold text-dark/60 uppercase tracking-wide mb-1">Research Type</p>
                          <p className="text-dark">{inv.researchType}</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-dark/60 uppercase tracking-wide mb-1">Mathematical Area</p>
                          <p className="text-dark">{inv.mathematicalArea}</p>
                        </div>
                        {inv.impactMetrics && (
                          <div className="md:col-span-2">
                            <p className="text-sm font-bold text-dark/60 uppercase tracking-wide mb-1">Impact Metrics</p>
                            <p className="text-dark">{inv.impactMetrics}</p>
                          </div>
                        )}
                        {inv.keyFindings && (
                          <div className="md:col-span-2">
                            <p className="text-sm font-bold text-dark/60 uppercase tracking-wide mb-1">Key Findings</p>
                            <p className="text-dark font-serif">{inv.keyFindings}</p>
                          </div>
                        )}
                        {inv.methodology && (
                          <div className="md:col-span-2">
                            <p className="text-sm font-bold text-dark/60 uppercase tracking-wide mb-1">Methodology</p>
                            <p className="text-dark font-serif">{inv.methodology}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
