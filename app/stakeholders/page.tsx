'use client';

import { useState, useEffect } from 'react';
import { BrutalCard, BrutalButton } from '@/components/ui';
import { getAllReports, ScrollytellingReport } from '@/lib/scrollytellingReports';
import { getInvestigationsForDecision } from '@/lib/decisionInvestigations';
import { Investigation } from '@/lib/investigations';
import { addReportComment, getReportComments, ReportComment } from '@/lib/reportComments';
import {
  isAdmin,
  isAuthorizedViewer,
  approveReportForStakeholders,
  disapproveReportForStakeholders
} from '@/lib/stakeholderApproval';
import { Eye, MessageSquare, Microscope, LogOut, CheckCircle, XCircle, Shield } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithRedirect, getRedirectResult, signOut, User } from 'firebase/auth';

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
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    // Handle redirect result from Google sign-in
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const userEmail = result.user.email;
          if (!isAuthorizedViewer(userEmail)) {
            await signOut(auth);
            alert('Access denied. Only @alpha.school emails are authorized.');
          }
        }
      } catch (error) {
        console.error('Redirect result error:', error);
      }
    };

    handleRedirectResult();

    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsAdminUser(isAdmin(currentUser?.email || null));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isAuthorizedViewer(user.email)) {
      loadReports();
    }
  }, [user, isAdminUser]);

  const handleGoogleSignIn = async () => {
    try {
      // Use redirect instead of popup to avoid popup blockers
      await signInWithRedirect(auth, googleProvider);
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
      setIsAdminUser(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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

  const handleApprove = async (reportId: string) => {
    try {
      await approveReportForStakeholders(reportId);
      await loadReports();
      alert('Report approved for stakeholder viewing!');
    } catch (error) {
      console.error('Error approving report:', error);
      alert('Failed to approve report.');
    }
  };

  const handleDisapprove = async (reportId: string) => {
    try {
      await disapproveReportForStakeholders(reportId);
      await loadReports();
      alert('Report disapproved for stakeholder viewing.');
    } catch (error) {
      console.error('Error disapproving report:', error);
      alert('Failed to disapprove report.');
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

  // Not signed in - Show login page with Google button
  if (!user) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-6">
        <BrutalCard className="max-w-md w-full text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-dark mb-2">Stakeholder Portal</h1>
            <p className="text-dark/70">
              View decision reports and research foundations
            </p>
          </div>

          <div className="mb-6 p-4 border-2 border-dark bg-cool-blue/20">
            <p className="text-sm text-dark/80">
              <strong>Access Requirements:</strong><br />
              Sign in with your @alpha.school email
            </p>
          </div>

          <BrutalButton
            onClick={handleGoogleSignIn}
            variant="primary"
            className="w-full text-lg py-4"
          >
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </BrutalButton>
        </BrutalCard>
      </div>
    );
  }

  // Not authorized
  if (!isAuthorizedViewer(user.email)) {
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
              {isAdminUser ? 'Admin Portal - Manage Stakeholder Reports' : 'Stakeholder Portal'}
            </p>
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
              <h2 className="text-xl font-bold text-dark mb-2">
                {isAdminUser ? 'Published Reports - Approval Management' : 'Approved Decision Reports'}
              </h2>
              <p className="text-dark/70">
                {reports.length} {reports.length === 1 ? 'report' : 'reports'} available
                {isAdminUser && ' (Approve reports to make them visible to stakeholders)'}
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
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-dark flex-1">{report.title}</h3>
                        {isAdminUser && (
                          <span className={`px-2 py-1 text-xs font-bold border-2 border-dark ${
                            report.approvedForStakeholders
                              ? 'bg-success-green text-white'
                              : 'bg-gray-300 text-dark'
                          }`}>
                            {report.approvedForStakeholders ? '✓ APPROVED' : 'PENDING'}
                          </span>
                        )}
                      </div>
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
                    <div className="pt-3 border-t-2 border-dark space-y-2">
                      <BrutalButton
                        onClick={() => handleViewReport(report)}
                        variant="primary"
                        className="w-full gap-2"
                      >
                        <Eye size={16} />
                        View Report
                      </BrutalButton>

                      {isAdminUser && (
                        <div className="grid grid-cols-2 gap-2">
                          <BrutalButton
                            onClick={() => handleApprove(report.id)}
                            variant="secondary"
                            className="gap-1 text-sm"
                            disabled={report.approvedForStakeholders === true}
                          >
                            <CheckCircle size={14} />
                            Approve
                          </BrutalButton>
                          <BrutalButton
                            onClick={() => handleDisapprove(report.id)}
                            variant="secondary"
                            className="gap-1 text-sm"
                            disabled={report.approvedForStakeholders === false}
                          >
                            <XCircle size={14} />
                            Disapprove
                          </BrutalButton>
                        </div>
                      )}
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
