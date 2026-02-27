'use client';

import { useState, useEffect } from 'react';
import { BrutalCard, BrutalButton } from '@/components/ui';
import { getAllReports, ScrollytellingReport } from '@/lib/scrollytellingReports';
import { getInvestigationsForDecision } from '@/lib/decisionInvestigations';
import { Investigation } from '@/lib/investigations';
import { addReportComment, getReportComments, ReportComment } from '@/lib/reportComments';
import { Eye, MessageSquare, Microscope, LogOut } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup, signOut, User } from 'firebase/auth';

export default function StakeholdersPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<(ScrollytellingReport & { id: string })[]>([]);
  const [selectedReport, setSelectedReport] = useState<(ScrollytellingReport & { id: string }) | null>(null);
  const [linkedInvestigations, setLinkedInvestigations] = useState<Investigation[]>([]);
  const [comments, setComments] = useState<(ReportComment & { id: string })[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isAuthorized(user.email)) {
      loadPublishedReports();
    }
  }, [user]);

  const isAuthorized = (email: string | null): boolean => {
    if (!email) return false;
    return email.endsWith('@alpha.school');
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;

      if (!isAuthorized(userEmail)) {
        await signOut(auth);
        alert('Access denied. Only @alpha.school emails are authorized.');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setReports([]);
      setSelectedReport(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const loadPublishedReports = async () => {
    try {
      const allReports = await getAllReports();
      // Filter: only Published status AND has a decisionLogId (linked to a decision)
      const publishedDecisionReports = allReports.filter(
        (report) => report.status === 'Published' && report.decisionLogId
      );
      setReports(publishedDecisionReports);
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
      // Save comment to Firestore
      const commentId = await addReportComment(
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

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-6">
        <BrutalCard className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-dark mb-4">Stakeholder Portal</h1>
          <p className="text-dark/70 mb-6">
            Sign in with your @alpha.school email to access decision reports.
          </p>
          <BrutalButton onClick={handleGoogleSignIn} variant="primary" className="w-full">
            Sign in with Google
          </BrutalButton>
        </BrutalCard>
      </div>
    );
  }

  // Not authorized
  if (!isAuthorized(user.email)) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-6">
        <BrutalCard className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-dark mb-4">Access Denied</h1>
          <p className="text-dark/70 mb-6">
            Only @alpha.school emails are authorized to access this portal.
          </p>
          <p className="text-sm text-dark/50 mb-6">
            Signed in as: {user.email}
          </p>
          <BrutalButton onClick={handleSignOut} variant="secondary" className="w-full">
            Sign Out
          </BrutalButton>
        </BrutalCard>
      </div>
    );
  }

  // Authorized - Show gallery or report view
  return (
    <div className="min-h-screen bg-bg-light">
      {/* Header */}
      <div className="bg-white border-b-4 border-dark p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark">Decision Reports</h1>
            <p className="text-sm text-dark/70">Stakeholder Portal</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-dark">{user.displayName || 'User'}</p>
              <p className="text-xs text-dark/70">{user.email}</p>
            </div>
            <BrutalButton onClick={handleSignOut} variant="secondary" className="gap-2">
              <LogOut size={16} />
              Sign Out
            </BrutalButton>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {!selectedReport ? (
          // Gallery View
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-dark mb-2">Published Decision Reports</h2>
              <p className="text-dark/70">
                {reports.length} {reports.length === 1 ? 'report' : 'reports'} available
              </p>
            </div>

            {reports.length === 0 ? (
              <BrutalCard>
                <p className="text-center text-dark/60 py-8">
                  No published reports available yet.
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
                      <BrutalButton
                        onClick={() => handleViewReport(report)}
                        variant="primary"
                        className="w-full gap-2"
                      >
                        <Eye size={16} />
                        View Report
                      </BrutalButton>
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
                ← Back to Gallery
              </BrutalButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main content - ScrollyTelling */}
              <div className="lg:col-span-3">
                <BrutalCard>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-dark">Decision Report</h3>
                    <div className="flex gap-2">
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

              {/* Sidebar - Linked Investigations */}
              <div className="lg:col-span-1">
                <BrutalCard>
                  <h3 className="text-lg font-bold text-dark mb-4 flex items-center gap-2">
                    <Microscope size={20} />
                    Research Foundation
                  </h3>

                  {linkedInvestigations.length === 0 ? (
                    <p className="text-sm text-dark/60">No linked investigations</p>
                  ) : (
                    <div className="space-y-3">
                      {linkedInvestigations.map((inv) => (
                        <div key={inv.id} className="border-2 border-dark bg-bg-light p-3">
                          <h4 className="font-bold text-dark text-sm mb-2">{inv.title}</h4>
                          <div className="space-y-1">
                            <p className="text-xs text-dark/70">
                              <strong>Type:</strong> {inv.researchType}
                            </p>
                            <p className="text-xs text-dark/70">
                              <strong>Area:</strong> {inv.mathematicalArea}
                            </p>
                            {inv.impactMetrics && (
                              <p className="text-xs text-dark/70">
                                <strong>Impact:</strong> {inv.impactMetrics}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </BrutalCard>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
