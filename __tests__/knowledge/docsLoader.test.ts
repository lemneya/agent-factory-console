/**
 * Unit tests for docsLoader
 * UX-GATE-COPILOT-0: Test docs chunking and retrieval
 */

import { splitByHeadings, retrieveChunks, DocChunk } from '@/knowledge/docsLoader';

describe('docsLoader', () => {
  describe('splitByHeadings', () => {
    it('should split content by # headings', () => {
      const content = `# Introduction
This is the intro.

# Getting Started
This is getting started.

# Advanced
This is advanced.`;

      const chunks = splitByHeadings(content, 'test.md');

      expect(chunks).toHaveLength(3);
      expect(chunks[0].title).toBe('Introduction');
      expect(chunks[0].text).toContain('This is the intro');
      expect(chunks[1].title).toBe('Getting Started');
      expect(chunks[2].title).toBe('Advanced');
    });

    it('should split content by ## headings', () => {
      const content = `## Section One
Content one.

## Section Two
Content two.`;

      const chunks = splitByHeadings(content, 'test.md');

      expect(chunks).toHaveLength(2);
      expect(chunks[0].title).toBe('Section One');
      expect(chunks[1].title).toBe('Section Two');
    });

    it('should include file path in ref', () => {
      const content = `# Test Heading
Test content.`;

      const chunks = splitByHeadings(content, 'docs/test.md');

      expect(chunks[0].ref).toBe('docs/test.md#test-heading');
      expect(chunks[0].path).toBe('docs/test.md');
    });

    it('should handle content before first heading', () => {
      const content = `Some intro text before headings.

# First Heading
First content.`;

      const chunks = splitByHeadings(content, 'test.md');

      expect(chunks).toHaveLength(2);
      expect(chunks[0].title).toBe('Introduction');
      expect(chunks[0].text).toContain('Some intro text');
    });

    it('should truncate long chunks', () => {
      const longContent = 'A'.repeat(2000);
      const content = `# Long Section
${longContent}`;

      const chunks = splitByHeadings(content, 'test.md');

      expect(chunks[0].text.length).toBeLessThanOrEqual(1200);
    });

    it('should handle empty content', () => {
      const chunks = splitByHeadings('', 'test.md');
      expect(chunks).toHaveLength(0);
    });

    it('should slugify heading for ref', () => {
      const content = `# Council Gate Policy
Content here.`;

      const chunks = splitByHeadings(content, 'test.md');

      expect(chunks[0].ref).toBe('test.md#council-gate-policy');
    });
  });

  describe('retrieveChunks', () => {
    const testChunks: DocChunk[] = [
      {
        ref: 'docs/council.md#overview',
        title: 'Council Overview',
        text: 'The Council is a multi-agent decision system.',
        path: 'docs/council.md',
      },
      {
        ref: 'docs/ralph.md#overview',
        title: 'Ralph Mode Overview',
        text: 'Ralph Mode enables iterative agent loops.',
        path: 'docs/ralph.md',
      },
      {
        ref: 'docs/blueprints.md#overview',
        title: 'Blueprints Overview',
        text: 'Blueprints define workflow templates.',
        path: 'docs/blueprints.md',
      },
      {
        ref: 'docs/preview.md#overview',
        title: 'Preview Overview',
        text: 'Preview shows live application state.',
        path: 'docs/preview.md',
      },
    ];

    it('should return chunks matching query keywords', () => {
      const results = retrieveChunks(testChunks, 'council decision', 5);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBe('Council Overview');
    });

    it('should return top-k results', () => {
      const results = retrieveChunks(testChunks, 'overview', 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should prioritize title matches', () => {
      const results = retrieveChunks(testChunks, 'ralph', 5);

      expect(results[0].title).toBe('Ralph Mode Overview');
    });

    it('should return empty array for no matches', () => {
      const results = retrieveChunks(testChunks, 'xyznonexistent', 5);

      expect(results).toHaveLength(0);
    });

    it('should be case insensitive', () => {
      const results = retrieveChunks(testChunks, 'COUNCIL', 5);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBe('Council Overview');
    });

    it('should handle multi-word queries', () => {
      const results = retrieveChunks(testChunks, 'agent decision system', 5);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBe('Council Overview');
    });
  });
});
