import {
  doc,
  runTransaction,
  arrayUnion,
  arrayRemove,
  increment,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Investigation } from './investigations';

// Link an investigation to a decision (N→N relationship)
export async function linkInvestigationToDecision(
  decisionLogId: string,
  investigationId: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // Update decision with investigation reference
      const decisionRef = doc(db, 'decision_logs', decisionLogId);
      transaction.update(decisionRef, {
        investigationIds: arrayUnion(investigationId),
        investigationCount: increment(1),
      });
    });
  } catch (error) {
    console.error('Error linking investigation to decision:', error);
    throw error;
  }
}

// Unlink an investigation from a decision
export async function unlinkInvestigationFromDecision(
  decisionLogId: string,
  investigationId: string
): Promise<void> {
  try {
    await runTransaction(db, async (transaction) => {
      // Update decision to remove investigation reference
      const decisionRef = doc(db, 'decision_logs', decisionLogId);
      transaction.update(decisionRef, {
        investigationIds: arrayRemove(investigationId),
        investigationCount: increment(-1),
      });
    });
  } catch (error) {
    console.error('Error unlinking investigation from decision:', error);
    throw error;
  }
}

// Get investigations linked to a decision
export async function getInvestigationsForDecision(
  decisionLogId: string
): Promise<(Investigation & { id: string })[]> {
  try {
    // First get the decision to get investigationIds
    const decisionRef = doc(db, 'decision_logs', decisionLogId);
    const decisionSnap = await runTransaction(db, async (transaction) => {
      return transaction.get(decisionRef);
    });

    if (!decisionSnap.exists()) {
      return [];
    }

    const investigationIds = decisionSnap.data().investigationIds || [];

    if (investigationIds.length === 0) {
      return [];
    }

    // Get all investigations by IDs
    const investigations: (Investigation & { id: string })[] = [];
    for (const invId of investigationIds) {
      const invRef = doc(db, 'investigations', invId);
      const invSnap = await runTransaction(db, async (transaction) => {
        return transaction.get(invRef);
      });

      if (invSnap.exists()) {
        investigations.push({
          id: invSnap.id,
          ...invSnap.data(),
        } as Investigation & { id: string });
      }
    }

    return investigations;
  } catch (error) {
    console.error('Error getting investigations for decision:', error);
    throw error;
  }
}
