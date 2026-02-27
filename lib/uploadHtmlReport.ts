import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

// Extract metadata from HTML content
export function extractMetadataFromHTML(htmlContent: string): {
  title: string;
  description: string;
  tags: string[];
} {
  // Create a temporary DOM parser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');

  // Extract title (try multiple sources)
  let title =
    doc.querySelector('title')?.textContent ||
    doc.querySelector('h1')?.textContent ||
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    'Untitled Report';

  title = title.trim();

  // Extract description (try multiple sources)
  let description =
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    doc.querySelector('p')?.textContent ||
    '';

  description = description.trim().substring(0, 500); // Limit to 500 chars

  // Extract tags from meta keywords if available
  const keywordsContent = doc.querySelector('meta[name="keywords"]')?.getAttribute('content');
  const tags = keywordsContent
    ? keywordsContent.split(',').map(tag => tag.trim()).filter(Boolean)
    : [];

  return { title, description, tags };
}

export interface ScrollytellingReport {
  title: string;
  filename: string;
  html_content?: string; // Store HTML directly in Firestore (new method)
  storage_url?: string; // Legacy: URL from Firebase Storage (backward compatibility)
  status: 'Published' | 'Archived' | 'Draft';
  tags: string[];
  createdAt: Timestamp;

  // MODIFIED: Can belong to investigation OR decision
  investigationId: string | null; // If belongs to investigation
  decisionLogId: string | null; // If belongs to decision (own scrollytelling)

  description?: string; // Brief context about the report
  reportType?: string; // Type of evidence (Pre-Analysis, Mid-Term, Final, Other)

  // Stakeholder portal approval
  approvedForStakeholders?: boolean; // Whether this report is approved for stakeholder viewing
}

export async function uploadHtmlReport(
  file: File,
  title: string,
  tags: string[] = [],
  status: 'Published' | 'Archived' | 'Draft' = 'Draft',
  investigationId: string | null = null,
  decisionLogId: string | null = null,
  description: string = '',
  reportType: string = 'Other'
): Promise<string> {
  try {
    // Read file content as text
    const htmlContent = await file.text();

    // Save HTML content and metadata directly to Firestore
    const reportData: Omit<ScrollytellingReport, 'id'> = {
      title,
      filename: file.name,
      html_content: htmlContent,
      status,
      tags,
      createdAt: Timestamp.now(),
      investigationId,
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

export async function uploadHtmlFromString(
  htmlContent: string,
  title: string,
  tags: string[] = [],
  status: 'Published' | 'Archived' | 'Draft' = 'Draft',
  investigationId: string | null = null,
  decisionLogId: string | null = null,
  description: string = '',
  reportType: string = 'Other'
): Promise<string> {
  try {
    const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.html`;

    // Save HTML content and metadata directly to Firestore (no Storage needed)
    const reportData: Omit<ScrollytellingReport, 'id'> = {
      title,
      filename,
      html_content: htmlContent,
      status,
      tags,
      createdAt: Timestamp.now(),
      investigationId,
      decisionLogId,
      description,
      reportType,
    };

    const docRef = await addDoc(collection(db, 'scrollytelling_reports'), reportData);

    return docRef.id;
  } catch (error) {
    console.error('Error uploading HTML from string:', error);
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
