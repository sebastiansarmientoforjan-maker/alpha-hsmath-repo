import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { storage, db } from './firebase';

export interface ScrollytellingReport {
  title: string;
  filename: string;
  storage_url: string;
  status: 'Published' | 'Archived' | 'Draft';
  tags: string[];
  createdAt: Timestamp;
  decisionLogId: string | null; // Reference to parent decision
  description?: string; // Brief context about the report
  reportType?: string; // Type of evidence (Pre-Analysis, Mid-Term, Final, Other)
}

export async function uploadHtmlReport(
  file: File,
  title: string,
  tags: string[] = [],
  status: 'Published' | 'Archived' | 'Draft' = 'Draft',
  decisionLogId: string | null = null,
  description: string = '',
  reportType: string = 'Other'
): Promise<string> {
  try {
    // Create a reference to the file in Firebase Storage
    const storageRef = ref(storage, `scrollytelling_files/${Date.now()}_${file.name}`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Save metadata to Firestore
    const reportData: Omit<ScrollytellingReport, 'id'> = {
      title,
      filename: file.name,
      storage_url: downloadURL,
      status,
      tags,
      createdAt: Timestamp.now(),
      decisionLogId,
      description,
      reportType,
    };

    const docRef = await addDoc(collection(db, 'scrollytelling_reports'), reportData);

    return docRef.id;
  } catch (error) {
    console.error('Error uploading HTML report:', error);
    throw error;
  }
}

export async function uploadMultipleReports(
  files: File[],
  titles: string[],
  tags: string[][] = [],
  status: 'Published' | 'Archived' | 'Draft' = 'Draft'
): Promise<string[]> {
  const uploadPromises = files.map((file, index) =>
    uploadHtmlReport(file, titles[index], tags[index] || [], status)
  );

  return Promise.all(uploadPromises);
}
