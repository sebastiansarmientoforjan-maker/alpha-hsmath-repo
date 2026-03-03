'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Database, Home, Microscope, ArrowLeft, Users, Sparkles, Archive, AlertTriangle, Wand2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { FloatingActionBar } from '@/components/FloatingActionBar';
import { WorkflowProgressBar } from '@/components/WorkflowProgressBar';
import { KeyboardShortcutsHelp } from '@/components/KeyboardShortcutsHelp';
import { BatchProcessingQueue } from '@/components/BatchProcessingQueue';
import { useGlobalShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  // Enable global keyboard shortcuts
  useGlobalShortcuts();

  // Redirect non-admin users to stakeholders
  useEffect(() => {
    if (!loading && user && !isAdmin) {
      router.push('/stakeholders');
    }
  }, [loading, user, isAdmin, router]);

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/gem-generator', label: 'GEM Generator', icon: Sparkles },
    { href: '/admin/process-results', label: 'Process Results', icon: Wand2 },
    { href: '/admin/research', label: 'Research Repository', icon: Microscope },
    { href: '/admin/decision-logs', label: 'Decision Logs', icon: Database },
    { href: '/admin/scrollytelling', label: 'Scrollytelling Reports', icon: FileText },
  ];

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="text-dark/60 mb-2">Verifying permissions...</div>
          <div className="text-sm text-dark/40">Loading...</div>
        </div>
      </div>
    );
  }

  // Redirect non-authenticated users
  if (!user) {
    router.push('/');
    return null;
  }

  // Show access denied for non-admin users (while redirecting)
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center p-6">
        <div className="max-w-md w-full border-4 border-alert-orange bg-white p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 border-4 border-dark bg-alert-orange">
              <AlertTriangle size={32} className="text-dark" />
            </div>
            <h1 className="text-2xl font-bold text-dark">Access Denied</h1>
          </div>
          <p className="text-dark/80 mb-4">
            You don't have permission to access the admin panel.
          </p>
          <p className="text-dark/60 text-sm mb-6">
            Only administrators can access this area. You'll be redirected to the stakeholder portal.
          </p>
          <div className="text-xs text-dark/40">
            Signed in as: <strong>{user.email}</strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r-4 border-dark p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark">
            Alpha Math
            <span className="block text-sm font-normal mt-1">Research Admin</span>
          </h1>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            // For Dashboard, exact match. For others, startsWith to handle subpages
            const isActive = item.href === '/admin'
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 border-4 border-dark font-bold transition-all ${
                  isActive
                    ? 'bg-cool-blue text-dark shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]'
                    : 'bg-white text-dark hover:bg-bg-light'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-8 border-t-4 border-dark space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-dark hover:text-cool-blue font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Home Page
          </Link>
          <Link
            href="/stakeholders"
            className="flex items-center gap-2 text-sm text-dark hover:text-cool-blue font-medium transition-colors"
          >
            <Users size={16} />
            Stakeholder Portal
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Workflow Progress Bar - shown on workflow pages */}
        {pathname !== '/admin' && <WorkflowProgressBar />}
        {children}
      </main>

      {/* Floating Action Bar for workflow navigation */}
      <FloatingActionBar />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp />

      {/* Batch Processing Queue */}
      <BatchProcessingQueue />
    </div>
  );
}
