import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface RawResult {
  id?: string;
  searchQuery: string;
  geminiResults?: string;
  perplexityResults?: string;
  createdAt: Timestamp;
  createdBy: string;
}

// Save raw research results
export async function saveRawResults(data: Omit<RawResult, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'rawResearchResults'), {
      ...data,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving raw results:', error);
    throw error;
  }
}

// Get all raw results
export async function getAllRawResults(): Promise<(RawResult & { id: string })[]> {
  try {
    const q = query(
      collection(db, 'rawResearchResults'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (RawResult & { id: string })[];
  } catch (error) {
    console.error('Error getting raw results:', error);
    throw error;
  }
}

// Get most recent raw result
export async function getMostRecentRawResult(): Promise<(RawResult & { id: string }) | null> {
  try {
    const q = query(
      collection(db, 'rawResearchResults'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as RawResult & { id: string };
  } catch (error) {
    console.error('Error getting most recent raw result:', error);
    throw error;
  }
}

// Delete raw result
export async function deleteRawResult(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'rawResearchResults', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting raw result:', error);
    throw error;
  }
}
