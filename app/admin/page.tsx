import { BrutalCard } from '@/components/ui';
import { FileText, Database, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-dark mb-2">Admin Dashboard</h1>
      <p className="text-dark/70 mb-8">
        HS Math Documentation & Analysis Hub - Content Management System
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <BrutalCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-dark/60 font-bold mb-1">
                Total Reports
              </p>
              <p className="text-3xl font-bold text-dark">0</p>
            </div>
            <FileText size={32} className="text-cool-blue" />
          </div>
        </BrutalCard>

        <BrutalCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-dark/60 font-bold mb-1">
                Decision Logs
              </p>
              <p className="text-3xl font-bold text-dark">0</p>
            </div>
            <Database size={32} className="text-cool-blue" />
          </div>
        </BrutalCard>

        <BrutalCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-dark/60 font-bold mb-1">
                Active Debates
              </p>
              <p className="text-3xl font-bold text-dark">0</p>
            </div>
            <TrendingUp size={32} className="text-alert-orange" />
          </div>
        </BrutalCard>
      </div>

      <BrutalCard>
        <h2 className="text-xl font-bold text-dark mb-4">Quick Start Guide</h2>
        <div className="space-y-3 font-serif text-dark/80">
          <p>
            <strong className="text-dark">1. Configure Firebase:</strong> Copy{' '}
            <code className="bg-bg-light px-2 py-1 border-2 border-dark">
              .env.local.example
            </code>{' '}
            to{' '}
            <code className="bg-bg-light px-2 py-1 border-2 border-dark">
              .env.local
            </code>{' '}
            and add your Firebase credentials.
          </p>
          <p>
            <strong className="text-dark">2. Upload Reports:</strong> Use the Scrollytelling
            Reports section to upload HTML files containing your research narratives.
          </p>
          <p>
            <strong className="text-dark">3. Document Decisions:</strong> Track pedagogical
            decisions and experimental results in the Decision Logs section.
          </p>
          <p>
            <strong className="text-dark">4. Share Results:</strong> Published reports will
            appear in the public Gallery view for your team and stakeholders.
          </p>
        </div>
      </BrutalCard>
    </div>
  );
}
