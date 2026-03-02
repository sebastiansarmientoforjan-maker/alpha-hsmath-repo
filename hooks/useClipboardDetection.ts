import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

export function useClipboardDetection() {
  const router = useRouter();
  const toast = useToast();
  const [detectedResults, setDetectedResults] = useState<string | null>(null);

  useEffect(() => {
    // Check if Clipboard API is supported
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      return;
    }

    let lastCheckTime = 0;
    const CHECK_INTERVAL = 2000; // Check every 2 seconds

    const checkClipboard = async () => {
      const now = Date.now();
      if (now - lastCheckTime < CHECK_INTERVAL) return;
      lastCheckTime = now;

      try {
        const text = await navigator.clipboard.readText();

        // Heuristics to detect if this is research results from Gemini/Perplexity
        if (text.length < 500) return; // Too short

        const indicators = [
          // Gemini indicators
          /gemini|google ai|deep research/i,
          /source reliability matrix/i,
          /research phase/i,

          // Perplexity indicators
          /perplexity/i,
          /sources:/i,
          /\[\d+\]/g, // Citation markers like [1], [2]

          // General research indicators
          /abstract|methodology|conclusion|findings/i,
          /http[s]?:\/\//gi, // Multiple URLs
          /doi:|arxiv:|scholar\.google/i,
        ];

        const matchCount = indicators.filter(regex => regex.test(text)).length;

        // If at least 3 indicators match, it's likely research results
        if (matchCount >= 3) {
          setDetectedResults(text);

          // Show toast notification
          toast.showSuccess(
            '🔍 Research results detected in clipboard! Click to process.',
            8000
          );
        }
      } catch (error) {
        // User denied clipboard access or browser doesn't support it
        // Silently fail - this is a convenience feature
      }
    };

    // Check on focus (when user comes back to the tab)
    const handleFocus = () => {
      checkClipboard();
    };

    // Check periodically when page is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkClipboard();
      }
    }, CHECK_INTERVAL);

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [router, toast]);

  const processDetectedResults = () => {
    if (detectedResults) {
      // Store in localStorage for Process Results page to pick up
      localStorage.setItem('pending-research-results', detectedResults);
      router.push('/admin/process-results');
      setDetectedResults(null);
    }
  };

  const dismissDetectedResults = () => {
    setDetectedResults(null);
  };

  return {
    detectedResults,
    processDetectedResults,
    dismissDetectedResults,
  };
}
