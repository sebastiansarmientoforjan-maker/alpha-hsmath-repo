import Link from 'next/link';
import { BrutalCard, BrutalButton } from '@/components/ui';
import { Microscope, Database, FileText, ArrowRight, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-light">
      {/* Header */}
      <header className="border-b-4 border-dark bg-white p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-dark">Alpha Math Research Hub</h1>
            <p className="text-sm text-dark/70">AI-Powered Learning Pattern Analysis</p>
          </div>
          <div className="flex gap-4">
            <Link href="/gallery">
              <BrutalButton variant="secondary">Explore Research</BrutalButton>
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
          <div className="inline-block px-4 py-2 border-4 border-dark bg-cool-blue text-dark font-bold mb-6">
            📈 Accelerating Math Mastery 2x Through Data-Driven Insights
          </div>
          <h2 className="text-5xl font-bold text-dark mb-6">
            Transform Math Education Through AI-Powered Research
          </h2>
          <p className="text-xl text-dark/70 font-serif mb-4">
            Uncover hidden patterns in student learning data, design adaptive pathways, and make
            evidence-based pedagogical decisions that accelerate concept mastery across K-12 mathematics.
          </p>
          <p className="text-lg text-dark/60 font-serif">
            Built for Alpha School by Sebastian Sarmiento • HS Math DRI
          </p>
        </div>

        {/* Research Process Flow */}
        <div className="mb-12 p-6 border-4 border-dark bg-white">
          <h3 className="text-2xl font-bold text-dark mb-6 text-center">Research-First Workflow</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center border-4 border-dark bg-cool-blue">
                <Microscope size={32} />
              </div>
              <h4 className="font-bold text-dark mb-1">1. Investigate</h4>
              <p className="text-sm text-dark/60">Analyze learning patterns with AI</p>
            </div>
            <ArrowRight size={32} className="text-dark/40 hidden md:block" />
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center border-4 border-dark bg-cool-blue">
                <FileText size={32} />
              </div>
              <h4 className="font-bold text-dark mb-1">2. Document</h4>
              <p className="text-sm text-dark/60">Create immersive evidence reports</p>
            </div>
            <ArrowRight size={32} className="text-dark/40 hidden md:block" />
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center border-4 border-dark bg-cool-blue">
                <Database size={32} />
              </div>
              <h4 className="font-bold text-dark mb-1">3. Decide</h4>
              <p className="text-sm text-dark/60">Make data-backed decisions</p>
            </div>
            <ArrowRight size={32} className="text-dark/40 hidden md:block" />
            <div className="flex-1 text-center">
              <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center border-4 border-dark bg-alert-orange">
                <TrendingUp size={32} />
              </div>
              <h4 className="font-bold text-dark mb-1">4. Impact</h4>
              <p className="text-sm text-dark/60">Track 2x mastery acceleration</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <BrutalCard hoverable>
            <Microscope size={40} className="text-cool-blue mb-4" />
            <h3 className="text-xl font-bold text-dark mb-3">Research Repository</h3>
            <p className="text-dark/70 font-serif mb-4">
              Document learning pattern analysis, content development strategies, and AI-powered
              adaptive pathways with measurable impact metrics.
            </p>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-cool-blue font-bold hover:underline"
            >
              Explore Investigations <ArrowRight size={16} />
            </Link>
          </BrutalCard>

          <BrutalCard hoverable>
            <Database size={40} className="text-cool-blue mb-4" />
            <h3 className="text-xl font-bold text-dark mb-3">Decision Logs</h3>
            <p className="text-dark/70 font-serif mb-4">
              Link pedagogical decisions to research findings. Track adjustments, validate
              hypotheses, and document the evolution of instructional strategies.
            </p>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-cool-blue font-bold hover:underline"
            >
              View Decisions <ArrowRight size={16} />
            </Link>
          </BrutalCard>

          <BrutalCard hoverable>
            <FileText size={40} className="text-cool-blue mb-4" />
            <h3 className="text-xl font-bold text-dark mb-3">Evidence Reports</h3>
            <p className="text-dark/70 font-serif mb-4">
              Interactive scrollytelling narratives that transform complex data analysis
              into compelling visual stories for stakeholders.
            </p>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 text-cool-blue font-bold hover:underline"
            >
              Browse Reports <ArrowRight size={16} />
            </Link>
          </BrutalCard>
        </div>

        {/* Impact Highlight */}
        <BrutalCard className="bg-alert-orange mb-12">
          <div className="text-center">
            <TrendingUp size={48} className="mx-auto mb-4" />
            <h3 className="text-3xl font-bold text-dark mb-2">
              Measurable Impact
            </h3>
            <p className="text-xl text-dark/80 font-serif">
              Our data-driven approach has demonstrated <strong>2x acceleration</strong> in concept mastery
              across multiple mathematical domains and grade levels.
            </p>
          </div>
        </BrutalCard>

        {/* CTA Section */}
        <BrutalCard className="bg-cool-blue">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-dark mb-2">
                Ready to Accelerate Learning?
              </h3>
              <p className="text-dark/80 font-serif">
                Start documenting investigations, uploading evidence, and making data-backed decisions.
              </p>
            </div>
            <Link href="/admin">
              <BrutalButton variant="secondary" className="bg-white whitespace-nowrap">
                Access Admin Panel <ArrowRight size={20} className="inline ml-2" />
              </BrutalButton>
            </Link>
          </div>
        </BrutalCard>

        {/* Info Section */}
        <div className="mt-12 pt-12 border-t-4 border-dark">
          <h3 className="text-2xl font-bold text-dark mb-4">About This Hub</h3>
          <div className="font-serif text-dark/80 space-y-3">
            <p>
              The Alpha Math Research Hub is a specialized platform for documenting and analyzing
              pedagogical innovations in mathematics education. Leveraging AI and advanced data analysis,
              we uncover learning patterns, design adaptive content, and validate instructional strategies
              that demonstrably accelerate student mastery.
            </p>
            <p>
              Built on a <strong>Research-First Architecture</strong>, every pedagogical decision is
              grounded in evidence, tracked over time, and continuously refined based on measurable outcomes.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-4 border-dark text-center">
          <p className="text-sm font-bold text-dark/70">
            Alpha School • High School Mathematics • Sebastian Sarmiento, DRI
          </p>
          <p className="text-xs text-dark/50 mt-2">
            Powered by AI-driven learning pattern analysis and evidence-based pedagogy
          </p>
        </div>
      </main>
    </div>
  );
}
