import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type ResearchType =
  | 'Systematic Literature Review'
  | 'Learning Pattern Analysis'
  | 'Content Development'
  | 'AI-Powered Pathways'
  | 'Student Data Analysis'
  | 'Pedagogical Innovation';

export type MathematicalArea =
  | 'Elementary Arithmetic'
  | 'Algebra'
  | 'Geometry'
  | 'Calculus'
  | 'Statistics'
  | 'Cross-Domain';

export type InvestigationStatus = 'In Progress' | 'Completed' | 'Published';

export interface Investigation {
  id?: string;
  title: string;
  description: string; // Executive summary
  researchType: ResearchType;
  mathematicalArea: MathematicalArea;
  status: InvestigationStatus;
  keyFindings: string; // Main discoveries
  methodology: string; // How the analysis was done
  impactMetrics?: string; // e.g., "2x acceleration in concept mastery"
  // Systematic Literature Review specific fields
  searchKeywords?: string[]; // Keywords used in literature search
  databases?: string[]; // Databases searched (Google Scholar, ERIC, JSTOR, etc.)
  paperCount?: number; // Number of papers reviewed
  citationLinks?: Array<{ title: string; url: string; authors?: string }>; // Key papers
  scrollytellingReportIds: string[]; // Multiple reports
  reportCount: number;
  author: string;
  startDate: Timestamp;
  completionDate?: Timestamp;
  createdAt: Timestamp;
}

// Create a new investigation
export async function createInvestigation(
  data: Omit<Investigation, 'id' | 'createdAt' | 'scrollytellingReportIds' | 'reportCount'>
): Promise<string> {
  try {
    // Remove undefined fields (Firestore doesn't accept undefined)
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(collection(db, 'investigations'), {
      ...cleanData,
      createdAt: Timestamp.now(),
      scrollytellingReportIds: [],
      reportCount: 0,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating investigation:', error);
    throw error;
  }
}

// Update an existing investigation
export async function updateInvestigation(
  id: string,
  data: Partial<Omit<Investigation, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    // Remove undefined fields (Firestore doesn't accept undefined)
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    );

    const docRef = doc(db, 'investigations', id);
    await updateDoc(docRef, cleanData);
  } catch (error) {
    console.error('Error updating investigation:', error);
    throw error;
  }
}

// Delete an investigation
export async function deleteInvestigation(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'investigations', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting investigation:', error);
    throw error;
  }
}

// Get all investigations
export async function getAllInvestigations(): Promise<Investigation[]> {
  try {
    const q = query(collection(db, 'investigations'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Investigation[];
  } catch (error) {
    console.error('Error getting investigations:', error);
    throw error;
  }
}

// Get a single investigation by ID
export async function getInvestigationById(id: string): Promise<Investigation | null> {
  try {
    const docRef = doc(db, 'investigations', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Investigation;
    }
    return null;
  } catch (error) {
    console.error('Error getting investigation by ID:', error);
    throw error;
  }
}
