import {
  doc,
  runTransaction,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { getReportsByDecisionLog } from './scrollytellingReports';

// Attach a report to a decision log (using transaction for consistency)
export async function attachReportToDecision(
  decisionLogId: string,
  reportId: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // Update report with decision reference
      const reportRef = doc(db, 'scrollytelling_reports', reportId);
      transaction.update(reportRef, {
        decisionLogId,
      });

      // Update decision with report reference
      const logRef = doc(db, 'decision_logs', decisionLogId);
      transaction.update(logRef, {
        reportIds: arrayUnion(reportId),
        reportCount: increment(1),
      });
    });
  } catch (error) {
    console.error('Error attaching report to decision:', error);
    throw error;
  }
}

// Detach a report from a decision log (using transaction for consistency)
export async function detachReportFromDecision(
  decisionLogId: string,
  reportId: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // Update report to remove decision reference
      const reportRef = doc(db, 'scrollytelling_reports', reportId);
      transaction.update(reportRef, {
        decisionLogId: null,
      });

      // Update decision to remove report reference
      const logRef = doc(db, 'decision_logs', decisionLogId);
      transaction.update(logRef, {
        reportIds: arrayRemove(reportId),
        reportCount: increment(-1),
      });
    });
  } catch (error) {
    console.error('Error detaching report from decision:', error);
    throw error;
  }
}

// Get all reports for a decision log
export async function getReportsForDecision(decisionLogId: string) {
  return getReportsByDecisionLog(decisionLogId);
}
