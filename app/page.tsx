import Link from 'next/link';
import { BrutalCard, BrutalButton } from '@/components/ui';
import { BookOpen, Database, BarChart3, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-light">
      {/* Header */}
      <header className="border-b-4 border-dark bg-white p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark">Alpha Math</h1>
            <p className="text-sm text-dark/70">Living Research Repository</p>
          </div>
          <div className="flex gap-4">
            <Link href="/gallery">
              <BrutalButton variant="secondary">View Gallery</BrutalButton>
            </Link>
            <Link href="/admin">
              <BrutalButton variant="primary">Admin Panel</BrutalButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-16">
          <h2 className="text-5xl font-bold text-dark mb-4">
            Living Research Repository
          </h2>
          <p className="text-xl text-dark/70 max-w-2xl font-serif">
            A dynamic ecosystem documenting pedagogical decisions, showcasing real-time
            telemetry, and hosting immersive research reports through scrollytelling.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <BrutalCard hoverable>
            <BookOpen size={40} className="text-cool-blue mb-4" />
            <h3 className="text-xl font-bold text-dark mb-3">Scrollytelling Reports</h3>
            <p className="text-dark/70 font-serif mb-4">
              Immersive HTML narratives that bring research findings to life through
              interactive visualizations and engaging storytelling.
            </p>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-cool-blue font-bold hover:underline"
            >
              Explore Reports <ArrowRight size={16} />
            </Link>
          </BrutalCard>

          <BrutalCard hoverable>
            <Database size={40} className="text-cool-blue mb-4" />
            <h3 className="text-xl font-bold text-dark mb-3">Decision Logs</h3>
            <p className="text-dark/70 font-serif mb-4">
              Document pedagogical adjustments, experimental refutations, and new didactic
              models with evidence-based rationales.
            </p>
            <Link
              href="/admin/decision-logs"
              className="inline-flex items-center gap-2 text-cool-blue font-bold hover:underline"
            >
              View Decisions <ArrowRight size={16} />
            </Link>
          </BrutalCard>

          <BrutalCard hoverable>
            <BarChart3 size={40} className="text-cool-blue mb-4" />
            <h3 className="text-xl font-bold text-dark mb-3">Real-Time Telemetry</h3>
            <p className="text-dark/70 font-serif mb-4">
              Track student progress, analyze performance patterns, and validate
              instructional decisions with live data dashboards.
            </p>
            <span className="inline-flex items-center gap-2 text-dark/40 font-bold">
              Coming Soon
            </span>
          </BrutalCard>
        </div>

        {/* CTA Section */}
        <BrutalCard className="bg-cool-blue">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-dark mb-2">
                Start Documenting Your Research
              </h3>
              <p className="text-dark/80 font-serif">
                Access the admin panel to upload reports and log pedagogical decisions.
              </p>
            </div>
            <Link href="/admin">
              <BrutalButton variant="secondary" className="bg-white whitespace-nowrap">
                Go to Admin Panel <ArrowRight size={20} className="inline ml-2" />
              </BrutalButton>
            </Link>
          </div>
        </BrutalCard>

        {/* Info Section */}
        <div className="mt-12 pt-12 border-t-4 border-dark">
          <h3 className="text-2xl font-bold text-dark mb-4">About This Repository</h3>
          <div className="font-serif text-dark/80 space-y-3">
            <p>
              The Living Research Repository is designed for the Alpha Math program to
              create a transparent, evidence-based record of instructional evolution.
            </p>
            <p>
              This platform combines Swiss design principles with neobrutalist aesthetics
              to deliver a bold, functional interface that prioritizes clarity and
              accessibility.
            </p>
            <p className="text-sm text-dark/60 mt-6">
              Built with Next.js 14, Firebase, and TailwindCSS. Deployed on Vercel.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
