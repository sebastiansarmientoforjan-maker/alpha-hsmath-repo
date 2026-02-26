import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type CommentTargetType = 'investigation' | 'decision';

export interface Comment {
  id?: string;
  targetType: CommentTargetType;
  targetId: string; // ID of the investigation or decision
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: Timestamp;
  isPublic: boolean; // For moderation
}

// Create a new comment
export async function createComment(
  data: Omit<Comment, 'id' | 'createdAt' | 'isPublic'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'comments'), {
      ...data,
      createdAt: Timestamp.now(),
      isPublic: false, // Default to false for moderation
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating comment:', error);
    throw error;
  }
}

// Update a comment (mainly for moderation)
export async function updateComment(
  id: string,
  data: Partial<Omit<Comment, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'comments', id);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
}

// Delete a comment
export async function deleteComment(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'comments', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}

// Get comments for a target (investigation or decision)
export async function getCommentsForTarget(
  targetType: CommentTargetType,
  targetId: string,
  publicOnly: boolean = true
): Promise<(Comment & { id: string })[]> {
  try {
    let q;
    if (publicOnly) {
      q = query(
        collection(db, 'comments'),
        where('targetType', '==', targetType),
        where('targetId', '==', targetId),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'comments'),
        where('targetType', '==', targetType),
        where('targetId', '==', targetId),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (Comment & { id: string })[];
  } catch (error) {
    console.error('Error getting comments for target:', error);
    throw error;
  }
}

// Get all pending comments (for moderation)
export async function getPendingComments(): Promise<(Comment & { id: string })[]> {
  try {
    const q = query(
      collection(db, 'comments'),
      where('isPublic', '==', false),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (Comment & { id: string })[];
  } catch (error) {
    console.error('Error getting pending comments:', error);
    throw error;
  }
}

// Approve a comment (make it public)
export async function approveComment(id: string): Promise<void> {
  return updateComment(id, { isPublic: true });
}
