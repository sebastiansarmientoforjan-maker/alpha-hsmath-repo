import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Admin email
const ADMIN_EMAIL = 'sebastian.sarmiento@alpha.school';

// Check if user is admin
export function isAdmin(email: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

// Check if user is authorized viewer (any @alpha.school email)
export function isAuthorizedViewer(email: string | null): boolean {
  if (!email) return false;
  return email.endsWith('@alpha.school');
}

// Approve a report for stakeholder viewing
export async function approveReportForStakeholders(reportId: string): Promise<void> {
  try {
    const docRef = doc(db, 'scrollytelling_reports', reportId);
    await updateDoc(docRef, {
      approvedForStakeholders: true,
    });
  } catch (error) {
    console.error('Error approving report:', error);
    throw error;
  }
}

// Disapprove a report for stakeholder viewing
export async function disapproveReportForStakeholders(reportId: string): Promise<void> {
  try {
    const docRef = doc(db, 'scrollytelling_reports', reportId);
    await updateDoc(docRef, {
      approvedForStakeholders: false,
    });
  } catch (error) {
    console.error('Error disapproving report:', error);
    throw error;
  }
}
