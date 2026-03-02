'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { WorkflowManager } from '@/lib/workflow-context';
import { ArrowRight, X, Zap } from 'lucide-react';

export function FloatingActionBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [nextAction, setNextAction] = useState<ReturnType<typeof WorkflowManager.getNextAction>>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const action = WorkflowManager.getNextAction();
    setNextAction(action);

    // Show if there's a next action and we're not already on that page
    if (action && pathname !== action.href && !dismissed) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [pathname, dismissed]);

  if (!visible || !nextAction) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-slide-up">
      <div className="border-4 border-dark bg-cool-blue shadow-[8px_8px_0px_0px_rgba(18,18,18,1)] max-w-sm">
        <div className="p-4 flex items-start gap-3">
          <div className="p-2 bg-white border-2 border-dark">
            <Zap size={24} className="text-dark" />
          </div>

          <div className="flex-1">
            <h3 className="font-bold text-dark mb-1">Next Step</h3>
            <p className="text-sm text-dark/80 mb-3">{nextAction.description}</p>

            <button
              onClick={() => router.push(nextAction.href)}
              className="w-full px-4 py-2 border-2 border-dark bg-white hover:bg-dark hover:text-white transition-all flex items-center justify-center gap-2 font-bold"
            >
              {nextAction.text}
              <ArrowRight size={18} />
            </button>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-white/20 transition-colors"
            title="Dismiss"
          >
            <X size={20} className="text-dark" />
          </button>
        </div>
      </div>
    </div>
  );
}
