import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export interface GemPrompt {
  id?: string;
  searchQuery: string;
  promptContent: string;
  createdAt: Timestamp;
}

const COLLECTION_NAME = 'gemPrompts';

/**
 * Save a generated GEM prompt to Firebase
 */
export async function saveGemPrompt(
  searchQuery: string,
  promptContent: string
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      searchQuery,
      promptContent,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving GEM prompt:', error);
    throw new Error('Failed to save prompt');
  }
}

/**
 * Get all saved GEM prompts, ordered by creation date (newest first)
 */
export async function getAllGemPrompts(): Promise<(GemPrompt & { id: string })[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<GemPrompt, 'id'>),
    }));
  } catch (error) {
    console.error('Error getting GEM prompts:', error);
    throw new Error('Failed to load prompts');
  }
}

/**
 * Delete a GEM prompt by ID
 */
export async function deleteGemPrompt(promptId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, promptId));
  } catch (error) {
    console.error('Error deleting GEM prompt:', error);
    throw new Error('Failed to delete prompt');
  }
}
