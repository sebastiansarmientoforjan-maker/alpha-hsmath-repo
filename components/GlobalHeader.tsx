'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { BrutalButton } from '@/components/ui';
import { Home, Shield, Users, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function GlobalHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, signOut, isAdmin } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Don't show header if not authenticated
  if (!user || loading) {
    return null;
  }

  return (
    <header className="border-b-4 border-dark bg-white p-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-bold text-dark">Alpha Math Research Hub</h1>
        </Link>

        <nav className="flex items-center gap-2">
          {/* Home */}
          <Link
            href="/"
            className={`px-4 py-2 border-2 border-dark font-bold transition-all ${
              pathname === '/'
                ? 'bg-cool-blue text-dark'
                : 'bg-white text-dark hover:bg-bg-light'
            }`}
          >
            <Home size={16} className="inline mr-2" />
            Home
          </Link>

          {/* Admin Panel - Only for admins */}
          {isAdmin && (
            <Link
              href="/admin"
              className={`px-4 py-2 border-2 border-dark font-bold transition-all ${
                pathname.startsWith('/admin')
                  ? 'bg-cool-blue text-dark'
                  : 'bg-white text-dark hover:bg-bg-light'
              }`}
            >
              <Shield size={16} className="inline mr-2" />
              Admin
            </Link>
          )}

          {/* Stakeholder Portal */}
          <Link
            href="/stakeholders"
            className={`px-4 py-2 border-2 border-dark font-bold transition-all ${
              pathname === '/stakeholders'
                ? 'bg-cool-blue text-dark'
                : 'bg-white text-dark hover:bg-bg-light'
            }`}
          >
            <Users size={16} className="inline mr-2" />
            Reports
          </Link>

          {/* User info and Sign Out */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l-2 border-dark">
            <div className="text-right">
              <p className="text-xs font-medium text-dark">{user.displayName || 'User'}</p>
              <p className="text-xs text-dark/70">{user.email}</p>
            </div>
            <BrutalButton onClick={handleSignOut} variant="secondary" className="gap-2">
              <LogOut size={16} />
              Sign Out
            </BrutalButton>
          </div>
        </nav>
      </div>
    </header>
  );
}
