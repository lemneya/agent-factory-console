/**
 * Docs Allowlist Loader for Copilot
 * UX-GATE-COPILOT-0: Read-only knowledge retrieval from allowed docs
 */

import fs from 'fs';
import path from 'path';

export interface DocChunk {
  ref: string; // <path>#<heading-slug>
  title: string; // heading text
  text: string; // chunk body (capped at ~1200 chars)
  path: string; // file path
}

// Allowlist of docs that Copilot can read
const DOCS_ALLOWLIST = [
  'README.md',
  'docs/gate-policy.md',
  'coordination/DECISIONS.md',
  'coordination/AGENT_STATUS.md',
  'evidence/**/SUMMARY.md',
  'evidence/UX-GATE-*/*.md',
];

// Maximum chunk size in characters
const MAX_CHUNK_SIZE = 1200;

/**
 * Convert heading text to URL-safe slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Split markdown content into chunks by headings
 */
export function splitByHeadings(content: string, filePath: string): DocChunk[] {
  const chunks: DocChunk[] = [];
  const lines = content.split('\n');

  let currentHeading = 'Introduction';
  let currentText: string[] = [];

  for (const line of lines) {
    // Check for heading (# or ##)
    const headingMatch = line.match(/^(#{1,2})\s+(.+)$/);

    if (headingMatch) {
      // Save previous chunk if it has content
      if (currentText.length > 0) {
        const text = currentText.join('\n').trim();
        if (text.length > 0) {
          chunks.push({
            ref: `${filePath}#${slugify(currentHeading)}`,
            title: currentHeading,
            text: text.slice(0, MAX_CHUNK_SIZE),
            path: filePath,
          });
        }
      }

      // Start new chunk
      currentHeading = headingMatch[2].trim();
      currentText = [];
    } else {
      currentText.push(line);
    }
  }

  // Save last chunk
  if (currentText.length > 0) {
    const text = currentText.join('\n').trim();
    if (text.length > 0) {
      chunks.push({
        ref: `${filePath}#${slugify(currentHeading)}`,
        title: currentHeading,
        text: text.slice(0, MAX_CHUNK_SIZE),
        path: filePath,
      });
    }
  }

  return chunks;
}

/**
 * Check if a file path matches the allowlist patterns
 */
function matchesAllowlist(filePath: string): boolean {
  for (const pattern of DOCS_ALLOWLIST) {
    // Convert glob pattern to regex
    const regexPattern = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(filePath)) {
      return true;
    }
  }
  return false;
}

/**
 * Find all allowed doc files in the project
 */
function findAllowedDocs(baseDir: string): string[] {
  const allowedFiles: string[] = [];

  function scanDir(dir: string, relativePath: string = '') {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and .git
          if (entry.name !== 'node_modules' && entry.name !== '.git') {
            scanDir(fullPath, relPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          if (matchesAllowlist(relPath)) {
            allowedFiles.push(relPath);
          }
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  scanDir(baseDir);
  return allowedFiles;
}

/**
 * Load all allowed docs and split into chunks
 */
export function loadAllDocs(baseDir: string = process.cwd()): DocChunk[] {
  const allChunks: DocChunk[] = [];
  const allowedFiles = findAllowedDocs(baseDir);

  for (const filePath of allowedFiles) {
    try {
      const fullPath = path.join(baseDir, filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const chunks = splitByHeadings(content, filePath);
      allChunks.push(...chunks);
    } catch {
      // File doesn't exist or can't be read
      console.warn(`Could not read doc file: ${filePath}`);
    }
  }

  return allChunks;
}

/**
 * Simple keyword-based retrieval scoring
 * Returns score based on keyword overlap (lowercase token match)
 */
function scoreChunk(chunk: DocChunk, query: string): number {
  const queryTokens = query
    .toLowerCase()
    .split(/\s+/)
    .filter(t => t.length > 2);

  const chunkText = `${chunk.title} ${chunk.text}`.toLowerCase();

  let score = 0;
  for (const token of queryTokens) {
    if (chunkText.includes(token)) {
      score += 1;
      // Bonus for title match
      if (chunk.title.toLowerCase().includes(token)) {
        score += 0.5;
      }
    }
  }

  return score;
}

/**
 * Retrieve top-k chunks for a query
 */
export function retrieveChunks(chunks: DocChunk[], query: string, topK: number = 5): DocChunk[] {
  const scored = chunks.map(chunk => ({
    chunk,
    score: scoreChunk(chunk, query),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return top-k with score > 0
  return scored
    .filter(s => s.score > 0)
    .slice(0, topK)
    .map(s => s.chunk);
}

/**
 * Main function to retrieve relevant docs for a query
 */
export function retrieveDocs(
  query: string,
  baseDir: string = process.cwd(),
  topK: number = 5
): DocChunk[] {
  const chunks = loadAllDocs(baseDir);
  return retrieveChunks(chunks, query, topK);
}

/**
 * Convert chunks to sources format for API response
 */
export function chunksToSources(
  chunks: DocChunk[]
): Array<{ type: 'DOC'; ref: string; title: string; snippet: string }> {
  return chunks.map(chunk => ({
    type: 'DOC' as const,
    ref: chunk.ref,
    title: chunk.title,
    snippet: chunk.text.slice(0, 200) + (chunk.text.length > 200 ? '...' : ''),
  }));
}
