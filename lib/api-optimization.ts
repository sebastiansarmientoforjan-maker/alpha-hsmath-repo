import { createHash } from 'crypto';

/**
 * API Optimization Layer
 * Intelligent caching and deduplication to optimize token usage
 * without strict rate limiting (company internal tool)
 */

interface CachedResult {
  data: any;
  timestamp: number;
  hash: string;
}

// In-memory cache (resets on page refresh, which is fine for optimization)
const processingCache = new Map<string, CachedResult>();

// Cache duration: 30 minutes (results don't change that quickly)
const CACHE_DURATION_MS = 30 * 60 * 1000;

/**
 * Generate hash of content to detect duplicates
 */
export function generateContentHash(content: string): string {
  // Use first 5000 chars to generate hash (enough to identify uniqueness)
  const normalized = content.trim().toLowerCase().substring(0, 5000);

  // Simple hash for browser (no crypto module needed)
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Check if content was recently processed (avoid duplicate API calls)
 */
export function checkCache(resultsText: string, searchQuery: string): any | null {
  const cacheKey = `${generateContentHash(resultsText)}-${searchQuery}`;
  const cached = processingCache.get(cacheKey);

  if (cached) {
    const age = Date.now() - cached.timestamp;
    if (age < CACHE_DURATION_MS) {
      console.log('✅ Cache hit - Using cached result (saved API call)');
      return cached.data;
    } else {
      // Expired, remove from cache
      processingCache.delete(cacheKey);
    }
  }

  return null;
}

/**
 * Store result in cache
 */
export function cacheResult(resultsText: string, searchQuery: string, data: any): void {
  const cacheKey = `${generateContentHash(resultsText)}-${searchQuery}`;
  processingCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    hash: cacheKey,
  });

  // Cleanup old entries (keep cache size reasonable)
  if (processingCache.size > 50) {
    const entries = Array.from(processingCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    // Remove oldest 10 entries
    entries.slice(0, 10).forEach(([key]) => processingCache.delete(key));
  }
}

/**
 * Validate input before sending to API (prevent unnecessary calls)
 */
export function validateBeforeProcessing(resultsText: string): {
  valid: boolean;
  reason?: string;
  suggestion?: string;
} {
  const trimmed = resultsText.trim();

  // Too short - likely not real results
  if (trimmed.length < 100) {
    return {
      valid: false,
      reason: 'Content too short',
      suggestion: 'Research results should be at least 100 characters. Please paste complete results from Gemini or Perplexity.',
    };
  }

  // Too long - might hit token limits
  if (trimmed.length > 200000) {
    return {
      valid: false,
      reason: 'Content too large',
      suggestion: 'Results are very large (>200KB). Consider splitting into multiple investigations or removing unnecessary sections.',
    };
  }

  // Check for obvious test content
  const testPatterns = [
    /^test$/i,
    /^testing$/i,
    /^hello world$/i,
    /^asdf+$/i,
    /^123+$/i,
  ];

  if (testPatterns.some(pattern => pattern.test(trimmed))) {
    return {
      valid: false,
      reason: 'Test content detected',
      suggestion: 'Please paste actual research results, not test content.',
    };
  }

  // Check if it contains some research-related keywords
  const hasResearchIndicators =
    /research|study|paper|citation|source|finding|methodology|result|analysis|data|evidence/i.test(trimmed) ||
    /http|doi|arxiv|scholar|journal/i.test(trimmed) ||
    trimmed.length > 1000; // If long enough, probably legitimate

  if (!hasResearchIndicators && trimmed.length < 500) {
    return {
      valid: false,
      reason: 'Does not appear to be research content',
      suggestion: 'Content should include research findings, sources, or analysis. If this is valid research, you can proceed anyway.',
    };
  }

  return { valid: true };
}

/**
 * Get cache statistics (for debugging/monitoring)
 */
export function getCacheStats() {
  return {
    size: processingCache.size,
    entries: Array.from(processingCache.values()).map(entry => ({
      age: Date.now() - entry.timestamp,
      ageMinutes: Math.round((Date.now() - entry.timestamp) / 60000),
    })),
  };
}

/**
 * Clear cache manually (useful for testing)
 */
export function clearCache(): void {
  processingCache.clear();
  console.log('✅ Cache cleared');
}

/**
 * Estimate token usage (rough estimate for monitoring)
 */
export function estimateTokenUsage(text: string): {
  estimatedTokens: number;
  estimatedCost: number;
  warning?: string;
} {
  // Rough estimate: 1 token ≈ 4 characters for English text
  const estimatedTokens = Math.ceil(text.length / 4);

  // AWS Bedrock Claude Sonnet pricing (as of 2024)
  // Input: $0.003 per 1K tokens
  // Output: $0.015 per 1K tokens
  // Estimate output as 1/3 of input
  const inputCost = (estimatedTokens / 1000) * 0.003;
  const outputCost = ((estimatedTokens / 3) / 1000) * 0.015;
  const estimatedCost = inputCost + outputCost;

  const result = {
    estimatedTokens,
    estimatedCost: Math.round(estimatedCost * 1000) / 1000, // Round to 3 decimals
  };

  // Warnings for large requests
  if (estimatedTokens > 50000) {
    return {
      ...result,
      warning: 'This is a large request (>50K tokens). Consider splitting into smaller chunks.',
    };
  }

  if (estimatedTokens > 100000) {
    return {
      ...result,
      warning: 'This request is very large (>100K tokens) and may fail or be slow. Consider splitting.',
    };
  }

  return result;
}
