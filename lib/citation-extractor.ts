/**
 * Smart citation extraction and paper counting
 * Handles both Gemini and Perplexity formats
 */

export interface Citation {
  title: string;
  url?: string;
  authors?: string;
  year?: string;
}

/**
 * Extract unique papers from research results
 * Returns both count and structured citations
 */
export function extractPapersAndCitations(resultsText: string): {
  paperCount: number;
  citations: Citation[];
} {
  const citations: Citation[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  // Pattern 1: Markdown citations [Title](URL)
  const markdownPattern = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
  let match;

  while ((match = markdownPattern.exec(resultsText)) !== null) {
    const title = match[1].trim();
    const url = match[2].trim();

    if (!seenUrls.has(url) && !seenTitles.has(title.toLowerCase())) {
      citations.push({ title, url });
      seenUrls.add(url);
      seenTitles.add(title.toLowerCase());
    }
  }

  // Pattern 2: Numbered references [1], [2], etc. with titles
  const numberedPattern = /\[(\d+)\]\s*([^\n]+?)(?=\n|$)/g;
  const numberedMatches = [...resultsText.matchAll(numberedPattern)];

  for (const match of numberedMatches) {
    const title = match[2].trim();
    // Only add if it looks like a title (has meaningful length and isn't already added)
    if (title.length > 15 && !seenTitles.has(title.toLowerCase())) {
      citations.push({ title });
      seenTitles.add(title.toLowerCase());
    }
  }

  // Pattern 3: DOI links
  const doiPattern = /(?:doi:|DOI:)\s*(10\.\d{4,}\/[^\s]+)/gi;
  const doiMatches = [...resultsText.matchAll(doiPattern)];

  for (const match of doiMatches) {
    const doi = match[1].trim();
    const url = `https://doi.org/${doi}`;
    if (!seenUrls.has(url)) {
      citations.push({
        title: `DOI: ${doi}`,
        url,
      });
      seenUrls.add(url);
    }
  }

  // Pattern 4: Direct URLs to papers (arxiv, scholar, etc.)
  const urlPattern = /(https?:\/\/(?:arxiv\.org|scholar\.google|doi\.org|www\.semanticscholar\.org|www\.researchgate\.net|journals\.)[^\s\)]+)/gi;
  const urlMatches = [...resultsText.matchAll(urlPattern)];

  for (const match of urlMatches) {
    const url = match[1].trim();
    if (!seenUrls.has(url)) {
      citations.push({
        title: extractTitleFromUrl(url),
        url,
      });
      seenUrls.add(url);
    }
  }

  // Pattern 5: Source Reliability Matrix (Gemini format)
  const matrixPattern = /Source Reliability Matrix[\s\S]*?(?=\n\n|\n#|$)/i;
  const matrixMatch = resultsText.match(matrixPattern);

  if (matrixMatch) {
    // Count unique sources in the matrix (each row typically represents a paper)
    const matrixRows = matrixMatch[0].split('\n').filter(line =>
      line.includes('|') && !line.includes('Source') && !line.includes('---')
    );

    // Extract source names from matrix
    for (const row of matrixRows) {
      const columns = row.split('|').map(c => c.trim()).filter(Boolean);
      if (columns.length > 0) {
        const sourceName = columns[0];
        if (sourceName.length > 5 && !seenTitles.has(sourceName.toLowerCase())) {
          citations.push({ title: sourceName });
          seenTitles.add(sourceName.toLowerCase());
        }
      }
    }
  }

  // Pattern 6: References/Bibliography section
  const referencesPattern = /(?:References|Bibliography|Sources Cited):?\s*([\s\S]+?)(?=\n\n#{1,2}|\n\n\*\*|$)/i;
  const referencesMatch = resultsText.match(referencesPattern);

  if (referencesMatch) {
    const referenceLines = referencesMatch[1]
      .split('\n')
      .filter(line => line.trim().length > 20); // Meaningful references

    for (const line of referenceLines) {
      // Try to extract author and year
      const authorYearMatch = line.match(/([A-Z][a-z]+(?:,?\s+[A-Z]\.)*)\s+\((\d{4})\)/);
      if (authorYearMatch && !seenTitles.has(line.toLowerCase())) {
        citations.push({
          title: line.trim(),
          authors: authorYearMatch[1],
          year: authorYearMatch[2],
        });
        seenTitles.add(line.toLowerCase());
      }
    }
  }

  // Deduplicate by normalizing titles
  const uniqueCitations = citations.filter((cit, index, self) =>
    index === self.findIndex(c =>
      normalizeTitle(c.title) === normalizeTitle(cit.title)
    )
  );

  return {
    paperCount: uniqueCitations.length,
    citations: uniqueCitations,
  };
}

function extractTitleFromUrl(url: string): string {
  // Extract meaningful title from URL
  const urlObj = new URL(url);

  if (urlObj.hostname.includes('arxiv')) {
    return `arXiv paper: ${urlObj.pathname.split('/').pop()}`;
  }

  if (urlObj.hostname.includes('doi.org')) {
    return `DOI: ${urlObj.pathname.slice(1)}`;
  }

  // Try to extract from path
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  if (pathParts.length > 0) {
    const lastPart = pathParts[pathParts.length - 1];
    return decodeURIComponent(lastPart).replace(/[-_]/g, ' ');
  }

  return url;
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100); // Compare first 100 chars
}

/**
 * Legacy function for backward compatibility
 */
export function extractCitationsFromResults(resultsText: string): Citation[] {
  return extractPapersAndCitations(resultsText).citations;
}
