import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  Timestamp,
  VectorValue,
} from 'firebase/firestore';
import { db } from './firebase';

export interface DecisionLog {
  id?: string;
  title: string;
  taxonomy: 'Pedagogical Adjustment' | 'Experimental Refutation' | 'New Didactic Model';
  status: 'Under Debate' | 'Empirically Validated' | 'Refuted';
  rationale: string; // Markdown/LaTeX text
  embedding?: VectorValue; // Vector for semantic search
  evidence_url?: string; // URL for iframe or dashboard
  author: string;
  createdAt: Timestamp;
  reportIds: string[]; // Array of associated report IDs
  reportCount: number; // Denormalized count for quick display
}

// Create a new decision log
export async function createDecisionLog(
  data: Omit<DecisionLog, 'id' | 'createdAt' | 'reportIds' | 'reportCount'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'decision_logs'), {
      ...data,
      createdAt: Timestamp.now(),
      reportIds: [],
      reportCount: 0,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating decision log:', error);
    throw error;
  }
}

// Update an existing decision log
export async function updateDecisionLog(
  id: string,
  data: Partial<Omit<DecisionLog, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'decision_logs', id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating decision log:', error);
    throw error;
  }
}

// Delete a decision log
export async function deleteDecisionLog(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'decision_logs', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting decision log:', error);
    throw error;
  }
}

// Get all decision logs
export async function getAllDecisionLogs(): Promise<DecisionLog[]> {
  try {
    const q = query(collection(db, 'decision_logs'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DecisionLog[];
  } catch (error) {
    console.error('Error getting decision logs:', error);
    throw error;
  }
}
