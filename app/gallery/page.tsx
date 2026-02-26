'use client';

import { useState, useEffect } from 'react';
import { BrutalCard } from '@/components/ui';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ScrollytellingReport } from '@/lib/uploadHtmlReport';
import { Calendar, Tag } from 'lucide-react';
import Link from 'next/link';

export default function Gallery() {
  const [reports, setReports] = useState<(ScrollytellingReport & { id: string })[]>([]);
  const [selectedReport, setSelectedReport] = useState<
    (ScrollytellingReport & { id: string }) | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const q = query(
        collection(db, 'scrollytelling_reports'),
        where('status', '==', 'Published'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);

      const loadedReports = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (ScrollytellingReport & { id: string })[];

      setReports(loadedReports);
      if (loadedReports.length > 0) {
        setSelectedReport(loadedReports[0]);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center">
        <div className="text-2xl font-bold text-dark">Loading...</div>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="min-h-screen bg-bg-light p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-dark mb-4">Research Gallery</h1>
          <BrutalCard>
            <div className="text-center py-12">
              <p className="text-xl text-dark/60 mb-4">No published reports yet</p>
              <p className="text-dark/50">
                Reports will appear here once they are published in the admin panel.
              </p>
              <Link
                href="/admin"
                className="inline-block mt-6 px-6 py-3 border-4 border-dark bg-cool-blue text-dark font-bold shadow-[6px_6px_0px_0px_rgba(18,18,18,1)] hover:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
              >
                Go to Admin Panel
              </Link>
            </div>
          </BrutalCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Header */}
      <div className="border-b-4 border-dark bg-white p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark">HS Math Research Gallery</h1>
            <p className="text-dark/70">Documentation & Analysis Hub</p>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 border-4 border-dark bg-cool-blue text-dark font-bold shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] hover:shadow-[2px_2px_0px_0px_rgba(18,18,18,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-sm"
          >
            Admin Panel
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8">
        {/* Hero Iframe */}
        <div className="mb-8">
          <BrutalCard className="p-0 overflow-hidden">
            <div className="bg-dark text-white p-4 border-b-4 border-dark">
              <h2 className="text-xl font-bold">{selectedReport?.title}</h2>
              <div className="flex gap-4 mt-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  {selectedReport?.createdAt.toDate().toLocaleDateString()}
                </div>
                {selectedReport && selectedReport.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag size={16} />
                    {selectedReport.tags.join(', ')}
                  </div>
                )}
              </div>
            </div>
            <iframe
              src={selectedReport?.storage_url}
              className="w-full h-[600px] bg-white"
              title={selectedReport?.title}
              sandbox="allow-scripts allow-same-origin"
            />
          </BrutalCard>
        </div>

        {/* Report Cards Grid */}
        <div>
          <h2 className="text-2xl font-bold text-dark mb-4">All Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <BrutalCard
                key={report.id}
                hoverable
                onClick={() => setSelectedReport(report)}
                className={`cursor-pointer ${
                  selectedReport?.id === report.id ? 'ring-4 ring-cool-blue' : ''
                }`}
              >
                <h3 className="text-lg font-bold text-dark mb-2">{report.title}</h3>

                <div className="flex flex-wrap gap-2 mb-3">
                  {report.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs border-2 border-dark bg-bg-light font-bold uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm text-dark/60">
                  <Calendar size={14} />
                  {report.createdAt.toDate().toLocaleDateString()}
                </div>

                <div className="mt-3 pt-3 border-t-2 border-dark">
                  <p className="text-xs text-dark/60 uppercase tracking-wide font-bold">
                    {report.filename}
                  </p>
                </div>
              </BrutalCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
