'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, Search, Wand2, Microscope, Database, FileText, Check } from 'lucide-react';

interface WorkflowStep {
  id: string;
  label: string;
  icon: any;
  href: string;
  description: string;
}

const steps: WorkflowStep[] = [
  {
    id: 'prompt',
    label: 'Prompt',
    icon: Sparkles,
    href: '/admin/gem-generator',
    description: 'Generate research prompts',
  },
  {
    id: 'research',
    label: 'Research',
    icon: Search,
    href: null as any, // External step
    description: 'Run in Gemini/Perplexity',
  },
  {
    id: 'process',
    label: 'Process',
    icon: Wand2,
    href: '/admin/process-results',
    description: 'Mix with Claude AI',
  },
  {
    id: 'investigate',
    label: 'Investigate',
    icon: Microscope,
    href: '/admin/research',
    description: 'View research repository',
  },
  {
    id: 'decide',
    label: 'Decide',
    icon: Database,
    href: '/admin/decision-logs',
    description: 'Document decisions',
  },
  {
    id: 'present',
    label: 'Present',
    icon: FileText,
    href: '/admin/scrollytelling',
    description: 'Create visual reports',
  },
];

export function WorkflowProgressBar() {
  const pathname = usePathname();
  const router = useRouter();

  // Determine current step based on pathname
  const getCurrentStepIndex = () => {
    if (pathname?.includes('gem-generator')) return 0;
    if (pathname?.includes('process-results')) return 2;
    if (pathname?.includes('research')) return 3;
    if (pathname?.includes('decision-logs')) return 4;
    if (pathname?.includes('scrollytelling')) return 5;
    return -1;
  };

  const currentStepIndex = getCurrentStepIndex();

  const handleStepClick = (step: WorkflowStep, index: number) => {
    if (!step.href) return; // External step
    if (index === currentStepIndex) return; // Already here
    router.push(step.href);
  };

  return (
    <div className="border-4 border-dark bg-white shadow-[4px_4px_0px_0px_rgba(18,18,18,1)] mb-6">
      <div className="p-4">
        {/* Desktop: Horizontal */}
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isClickable = step.href && index !== currentStepIndex;
            const isExternal = !step.href;

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step */}
                <button
                  onClick={() => handleStepClick(step, index)}
                  disabled={!isClickable}
                  className={`
                    flex flex-col items-center gap-1 px-4 py-2 transition-all
                    ${isClickable ? 'cursor-pointer hover:scale-105' : ''}
                    ${isExternal ? 'opacity-60 cursor-not-allowed' : ''}
                  `}
                  title={step.description}
                >
                  {/* Icon Circle */}
                  <div
                    className={`
                      w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all
                      ${isActive ? 'bg-cool-blue border-dark scale-110 shadow-[2px_2px_0px_0px_rgba(18,18,18,1)]' : ''}
                      ${isCompleted ? 'bg-cool-blue border-cool-blue' : ''}
                      ${!isActive && !isCompleted ? 'bg-white border-dark/30' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <Check size={24} className="text-white" />
                    ) : (
                      <Icon size={24} className={isActive ? 'text-dark' : 'text-dark/60'} />
                    )}
                  </div>

                  {/* Label */}
                  <span
                    className={`
                      text-xs font-bold whitespace-nowrap
                      ${isActive ? 'text-dark' : 'text-dark/60'}
                    `}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                      h-1 flex-1 mx-2 transition-all
                      ${isCompleted ? 'bg-cool-blue' : 'bg-dark/20'}
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: Vertical Compact */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${isActive ? 'bg-cool-blue border-dark' : ''}
                    ${isCompleted ? 'bg-cool-blue border-cool-blue' : ''}
                    ${!isActive && !isCompleted ? 'bg-white border-dark/30' : ''}
                  `}
                >
                  {isCompleted ? (
                    <Check size={16} className="text-white" />
                  ) : (
                    <Icon size={16} className={isActive ? 'text-dark' : 'text-dark/60'} />
                  )}
                </div>
                {index < steps.length - 1 && <div className="w-4 h-0.5 bg-dark/20" />}
              </div>
            );
          })}
        </div>

        {/* Current Step Description */}
        {currentStepIndex >= 0 && (
          <div className="mt-3 pt-3 border-t-2 border-dark/10">
            <p className="text-xs text-dark/70 font-medium flex items-center gap-2">
              <span className="text-cool-blue">→</span>
              {steps[currentStepIndex].description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
