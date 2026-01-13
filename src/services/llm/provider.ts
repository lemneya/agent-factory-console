/**
 * LLM Provider for Copilot
 * UX-GATE-COPILOT-0: Server-only LLM integration
 *
 * Environment:
 * - OPENAI_API_KEY: OpenAI API key (optional)
 * - OPENAI_MODEL: Model to use (default: gpt-4o-mini)
 *
 * Behavior:
 * - If no key: respond docs-only (still useful)
 * - If key exists: call OpenAI with system prompt enforcing read-only
 */

import { DocChunk } from '@/knowledge/docsLoader';
import { DBSource } from '@/knowledge/dbContext';

export interface CopilotSource {
  type: 'DOC' | 'DB';
  ref: string;
  title: string;
  snippet: string;
}

export interface CopilotResponse {
  answer: string;
  sources: CopilotSource[];
  llmUsed: boolean;
}

// System prompt enforcing read-only behavior
const SYSTEM_PROMPT = `You are the Agent Factory Console Copilot, a helpful assistant that answers questions about the AFC platform.

IMPORTANT RULES:
1. You are READ-ONLY. You MUST NOT suggest creating runs, modifying databases, writing files, or triggering any actions.
2. You can only provide information based on the documentation and database context provided.
3. Always cite your sources using the provided references.
4. If you don't have enough information, ask clarifying questions.
5. Keep answers concise and helpful.
6. Format your response as plain text (no markdown required).

You can help with:
- Explaining AFC features (Council, Ralph, Terminal Matrix, Memory, Blueprints/Slicer, Preview)
- Answering "What do I do next?" based on project/run status
- Explaining project and run status
- Guiding users through the console

Remember: You are an assistant that provides information, not an agent that takes actions.`;

/**
 * Check if OpenAI is configured
 */
export function isLLMConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Generate a docs-only response (no LLM)
 */
function generateDocsOnlyResponse(
  query: string,
  docChunks: DocChunk[],
  dbContext: string,
  dbSources: DBSource[]
): CopilotResponse {
  // Build sources from docs
  const sources: CopilotSource[] = docChunks.map(chunk => ({
    type: 'DOC' as const,
    ref: chunk.ref,
    title: chunk.title,
    snippet: chunk.text.slice(0, 200) + (chunk.text.length > 200 ? '...' : ''),
  }));

  // Add DB sources
  sources.push(...dbSources);

  // Generate a simple response based on retrieved docs
  if (docChunks.length === 0 && dbSources.length === 0) {
    return {
      answer:
        "I couldn't find specific information about your question in the documentation. Could you try rephrasing or asking about a specific AFC feature like Council, Ralph Mode, Blueprints, or Preview?",
      sources: [],
      llmUsed: false,
    };
  }

  // Build answer from doc chunks
  const relevantInfo = docChunks
    .slice(0, 3)
    .map(chunk => `**${chunk.title}**: ${chunk.text.slice(0, 300)}`)
    .join('\n\n');

  const answer = `Based on the documentation, here's what I found:\n\n${relevantInfo}\n\n${
    dbSources.length > 0 ? 'I also found relevant database context about your project/run.' : ''
  }\n\nNote: LLM is not configured, so this is a docs-only response. For more intelligent answers, configure OPENAI_API_KEY.`;

  return {
    answer,
    sources,
    llmUsed: false,
  };
}

/**
 * Call OpenAI API
 */
async function callOpenAI(
  query: string,
  docChunks: DocChunk[],
  dbContext: string,
  dbSources: DBSource[]
): Promise<CopilotResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const baseUrl = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

  if (!apiKey) {
    return generateDocsOnlyResponse(query, docChunks, dbContext, dbSources);
  }

  // Build context from docs
  const docsContext = docChunks
    .map((chunk, i) => `[DOC ${i + 1}] ${chunk.ref}\nTitle: ${chunk.title}\n${chunk.text}`)
    .join('\n\n---\n\n');

  // Build user prompt
  const userPrompt = `User Question: ${query}

Documentation Context:
${docsContext || 'No relevant documentation found.'}

Database Context:
${dbContext || 'No database context available.'}

Please answer the user's question based on the provided context. Cite sources using their references (e.g., [DOC 1] or [DB: Project:xyz]).`;

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return generateDocsOnlyResponse(query, docChunks, dbContext, dbSources);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || 'No response generated.';

    // Build sources from docs and DB
    const sources: CopilotSource[] = [
      ...docChunks.map(chunk => ({
        type: 'DOC' as const,
        ref: chunk.ref,
        title: chunk.title,
        snippet: chunk.text.slice(0, 200) + (chunk.text.length > 200 ? '...' : ''),
      })),
      ...dbSources,
    ];

    return {
      answer,
      sources,
      llmUsed: true,
    };
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return generateDocsOnlyResponse(query, docChunks, dbContext, dbSources);
  }
}

/**
 * Generate Copilot response
 *
 * @param query - User's question
 * @param docChunks - Retrieved doc chunks
 * @param dbContext - Database context string
 * @param dbSources - Database sources
 */
export async function generateCopilotResponse(
  query: string,
  docChunks: DocChunk[],
  dbContext: string,
  dbSources: DBSource[]
): Promise<CopilotResponse> {
  if (isLLMConfigured()) {
    return callOpenAI(query, docChunks, dbContext, dbSources);
  }
  return generateDocsOnlyResponse(query, docChunks, dbContext, dbSources);
}
