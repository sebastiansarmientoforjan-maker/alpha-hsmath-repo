import {
  doc,
  runTransaction,
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { getReportsByInvestigation } from './scrollytellingReports';

// Attach a report to an investigation (using transaction for consistency)
export async function attachReportToInvestigation(
  investigationId: string,
  reportId: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // Update report with investigation reference
      const reportRef = doc(db, 'scrollytelling_reports', reportId);
      transaction.update(reportRef, {
        investigationId,
      });

      // Update investigation with report reference
      const investigationRef = doc(db, 'investigations', investigationId);
      transaction.update(investigationRef, {
        scrollytellingReportIds: arrayUnion(reportId),
        reportCount: increment(1),
      });
    });
  } catch (error) {
    console.error('Error attaching report to investigation:', error);
    throw error;
  }
}

// Detach a report from an investigation (using transaction for consistency)
export async function detachReportFromInvestigation(
  investigationId: string,
  reportId: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // Update report to remove investigation reference
      const reportRef = doc(db, 'scrollytelling_reports', reportId);
      transaction.update(reportRef, {
        investigationId: null,
      });

      // Update investigation to remove report reference
      const investigationRef = doc(db, 'investigations', investigationId);
      transaction.update(investigationRef, {
        scrollytellingReportIds: arrayRemove(reportId),
        reportCount: increment(-1),
      });
    });
  } catch (error) {
    console.error('Error detaching report from investigation:', error);
    throw error;
  }
}

// Get all reports for an investigation
export async function getReportsForInvestigation(investigationId: string) {
  return getReportsByInvestigation(investigationId);
}
