import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export interface ReportComment {
  reportId: string;
  userId: string;
  userEmail: string;
  userName: string;
  comment: string;
  createdAt: Timestamp;
}

// Add a comment to a report
export async function addReportComment(
  reportId: string,
  userId: string,
  userEmail: string,
  userName: string,
  comment: string
): Promise<string> {
  try {
    const commentData: Omit<ReportComment, 'id'> = {
      reportId,
      userId,
      userEmail,
      userName,
      comment,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, 'report_comments'), commentData);
    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}

// Get all comments for a report
export async function getReportComments(
  reportId: string
): Promise<(ReportComment & { id: string })[]> {
  try {
    const q = query(
      collection(db, 'report_comments'),
      where('reportId', '==', reportId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (ReportComment & { id: string })[];
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
}
