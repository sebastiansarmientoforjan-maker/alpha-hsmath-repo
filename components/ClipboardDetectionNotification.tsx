'use client';

import { useClipboardDetection } from '@/hooks/useClipboardDetection';
import { Sparkles, X, ArrowRight } from 'lucide-react';

export function ClipboardDetectionNotification() {
  const { detectedResults, processDetectedResults, dismissDetectedResults } = useClipboardDetection();

  if (!detectedResults) return null;

  return (
    <div className="fixed top-20 right-6 z-[9999] animate-slide-in max-w-md">
      <div className="border-4 border-cool-blue bg-cool-blue shadow-[8px_8px_0px_0px_rgba(18,18,18,1)]">
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-white border-2 border-dark">
              <Sparkles size={24} className="text-dark" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-dark mb-1 text-lg">Research Results Detected!</h3>
              <p className="text-sm text-dark/90">
                Looks like you copied results from Gemini or Perplexity. Process them now?
              </p>
            </div>
            <button
              onClick={dismissDetectedResults}
              className="p-1 hover:bg-white/20 transition-colors"
            >
              <X size={20} className="text-dark" />
            </button>
          </div>

          <button
            onClick={processDetectedResults}
            className="w-full px-4 py-3 border-2 border-dark bg-white hover:bg-dark hover:text-white transition-all font-bold flex items-center justify-center gap-2"
          >
            Process Results
            <ArrowRight size={20} />
          </button>

          <div className="mt-3 p-2 bg-white/20 border-2 border-dark/30">
            <p className="text-xs text-dark/80">
              📋 {(detectedResults.length / 1000).toFixed(1)}K characters detected
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
