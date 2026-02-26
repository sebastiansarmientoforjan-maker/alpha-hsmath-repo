'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, Database, Home } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: Home },
    { href: '/admin/scrollytelling', label: 'Scrollytelling Reports', icon: FileText },
    { href: '/admin/decision-logs', label: 'Decision Logs', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-bg-light flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r-4 border-dark p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark">
            Alpha Math
            <span className="block text-sm font-normal mt-1">Research Admin</span>
          </h1>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

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

        <div className="mt-8 pt-8 border-t-4 border-dark">
          <Link
            href="/gallery"
            className="text-sm text-dark hover:text-cool-blue font-medium transition-colors"
          >
            → View Public Gallery
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
