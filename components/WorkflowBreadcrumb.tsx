'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, Wand2, Microscope, ArrowRight, Home } from 'lucide-react';

interface Step {
  name: string;
  href: string | null;
  icon: any;
  description: string;
}

const steps: Step[] = [
  {
    name: 'Generate Prompt',
    href: '/admin/gem-generator',
    icon: Sparkles,
    description: 'Create optimized research prompts',
  },
  {
    name: 'Run Research',
    href: null, // External step
    icon: null,
    description: 'Execute in Gemini/Perplexity',
  },
  {
    name: 'Process Results',
    href: '/admin/process-results',
    icon: Wand2,
    description: 'Transform with Claude AI',
  },
  {
    name: 'View Research',
    href: '/admin/research',
    icon: Microscope,
    description: 'Browse investigations',
  },
];

export function WorkflowBreadcrumb() {
  const pathname = usePathname();

  // Determine current step
  const currentStepIndex = steps.findIndex(step => step.href === pathname);

  return (
    <div className="mb-6 border-4 border-dark bg-white p-4 shadow-[4px_4px_0px_0px_rgba(18,18,18,1)]">
      {/* Home link */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-dark/60 hover:text-dark font-medium mb-3 transition-colors"
      >
        <Home size={16} />
        Admin Dashboard
      </Link>

      {/* Workflow steps */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {steps.map((step, idx) => {
          const isActive = idx === currentStepIndex;
          const isCompleted = idx < currentStepIndex;
          const isClickable = step.href !== null;

          const StepContent = (
            <div
              className={`
                flex items-center gap-2 px-4 py-2 border-2 transition-all whitespace-nowrap
                ${isActive ? 'bg-cool-blue border-dark scale-105 shadow-[2px_2px_0px_0px_rgba(18,18,18,1)]' : ''}
                ${isCompleted ? 'bg-cool-blue/30 border-dark/40' : ''}
                ${!isActive && !isCompleted ? 'bg-white border-dark/30' : ''}
                ${isClickable && !isActive ? 'hover:bg-cool-blue/20 hover:border-dark cursor-pointer' : ''}
                ${!isClickable ? 'opacity-60' : ''}
              `}
              title={step.description}
            >
              {step.icon && <step.icon size={18} className="text-dark" />}
              <span className={`text-sm font-bold ${isActive ? 'text-dark' : 'text-dark/70'}`}>
                {step.name}
              </span>
              {isCompleted && <span className="text-xs text-dark/60">✓</span>}
            </div>
          );

          return (
            <div key={idx} className="flex items-center gap-2">
              {isClickable && !isActive && step.href ? (
                <Link href={step.href}>{StepContent}</Link>
              ) : (
                StepContent
              )}

              {idx < steps.length - 1 && (
                <ArrowRight
                  size={20}
                  className={`flex-shrink-0 ${isCompleted ? 'text-dark' : 'text-dark/30'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current step description */}
      {currentStepIndex >= 0 && (
        <p className="mt-3 text-xs text-dark/60 font-medium">
          📍 {steps[currentStepIndex].description}
        </p>
      )}
    </div>
  );
}
