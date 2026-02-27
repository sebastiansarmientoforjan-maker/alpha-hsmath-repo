import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { ScrollytellingReport } from './uploadHtmlReport';

// Re-export the type for external use
export type { ScrollytellingReport };

// Get all reports
export async function getAllReports(): Promise<(ScrollytellingReport & { id: string })[]> {
  try {
    const q = query(collection(db, 'scrollytelling_reports'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (ScrollytellingReport & { id: string })[];
  } catch (error) {
    console.error('Error getting all reports:', error);
    throw error;
  }
}

// Get a single report by ID
export async function getReportById(reportId: string): Promise<(ScrollytellingReport & { id: string }) | null> {
  try {
    const docRef = doc(db, 'scrollytelling_reports', reportId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as ScrollytellingReport & { id: string };
    }
    return null;
  } catch (error) {
    console.error('Error getting report by ID:', error);
    throw error;
  }
}

// Update a report
export async function updateReport(
  reportId: string,
  updates: Partial<Omit<ScrollytellingReport, 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, 'scrollytelling_reports', reportId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
}

// Delete a report
export async function deleteReport(reportId: string): Promise<void> {
  try {
    const docRef = doc(db, 'scrollytelling_reports', reportId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
}

// Get reports by decision log
export async function getReportsByDecisionLog(
  decisionLogId: string
): Promise<(ScrollytellingReport & { id: string })[]> {
  try {
    const q = query(
      collection(db, 'scrollytelling_reports'),
      where('decisionLogId', '==', decisionLogId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (ScrollytellingReport & { id: string })[];
  } catch (error) {
    console.error('Error getting reports by decision log:', error);
    throw error;
  }
}

// Get reports by investigation
export async function getReportsByInvestigation(
  investigationId: string
): Promise<(ScrollytellingReport & { id: string })[]> {
  try {
    const q = query(
      collection(db, 'scrollytelling_reports'),
      where('investigationId', '==', investigationId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (ScrollytellingReport & { id: string })[];
  } catch (error) {
    console.error('Error getting reports by investigation:', error);
    throw error;
  }
}

// Get orphaned reports (not associated with any decision or investigation)
export async function getOrphanedReports(): Promise<(ScrollytellingReport & { id: string })[]> {
  try {
    // Get all reports and filter in memory (Firestore doesn't support OR queries easily)
    const allReports = await getAllReports();
    return allReports.filter(
      (report) => !report.decisionLogId && !report.investigationId
    );
  } catch (error) {
    console.error('Error getting orphaned reports:', error);
    throw error;
  }
}
