/**
 * LLM Provider for Copilot
 * UX-GATE-COPILOT-0: Server-only LLM integration
 * UX-GATE-COPILOT-1: Draft mode prompting
 *
 * Environment:
 * - OPENAI_API_KEY: OpenAI API key (optional)
 * - OPENAI_MODEL: Model to use (default: gpt-4o-mini)
 *
 * Behavior:
 * - If no key: respond docs-only (still useful)
 * - If key exists: call OpenAI with system prompt enforcing read-only or draft mode
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
  draftPayload?: Record<string, unknown>;
  draftTitle?: string;
}

export type CopilotMode = 'ASK' | 'DRAFT';
export type DraftKind = 'BLUEPRINT' | 'WORKORDERS' | 'COUNCIL';

// System prompt enforcing read-only behavior (ASK mode)
const ASK_SYSTEM_PROMPT = `You are the Agent Factory Console Copilot, a helpful assistant that answers questions about the AFC platform.

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

// Draft mode system prompts
const DRAFT_SYSTEM_PROMPTS: Record<DraftKind, string> = {
  BLUEPRINT: `You are the Agent Factory Console Copilot in DRAFT MODE for Blueprints.

Your job is to generate a structured Blueprint draft based on the user's description.

OUTPUT FORMAT (JSON):
{
  "blueprint": {
    "name": "string - blueprint name",
    "description": "string - what this blueprint does",
    "modules": [
      {
        "key": "string - unique module key (snake_case)",
        "title": "string - human readable title",
        "domain": "frontend | backend | infra | qa",
        "spec": "string - detailed specification"
      }
    ]
  },
  "determinism": {
    "specHash": "string - SHA256 of the spec (placeholder: 'pending')",
    "stableOrder": true
  }
}

RULES:
1. Generate a valid JSON object matching the schema above
2. Include 2-6 modules based on complexity
3. Use clear, descriptive names
4. Each module should have a detailed spec
5. Respond ONLY with the JSON object, no other text`,

  WORKORDERS: `You are the Agent Factory Console Copilot in DRAFT MODE for WorkOrders.

Your job is to generate a structured WorkOrders draft based on the user's description.

OUTPUT FORMAT (JSON):
{
  "source": {
    "blueprintId": "string - ID of the source blueprint (use 'pending' if unknown)",
    "versionId": null
  },
  "slice": {
    "policy": {
      "domainOrder": ["backend", "frontend", "infra", "qa"],
      "maxItems": 10
    },
    "workorders": [
      {
        "key": "string - unique workorder key (snake_case)",
        "domain": "frontend | backend | infra | qa",
        "title": "string - what this workorder does",
        "dependsOn": ["string - keys of dependent workorders"]
      }
    ]
  }
}

RULES:
1. Generate a valid JSON object matching the schema above
2. Include 3-10 workorders based on complexity
3. Respect dependencies (dependsOn must reference earlier workorders)
4. Use clear, descriptive titles
5. Respond ONLY with the JSON object, no other text`,

  COUNCIL: `You are the Agent Factory Console Copilot in DRAFT MODE for Council Decisions.

Your job is to generate a structured Council Decision draft based on the user's description.

OUTPUT FORMAT (JSON):
{
  "decision": {
    "projectId": "string - project ID (use 'pending' if unknown)",
    "type": "ADOPT | ADAPT | BUILD",
    "risk": "LOW | MEDIUM | HIGH",
    "rationale": "string - detailed explanation of the decision",
    "topRisks": ["string - list of top 3 risks"],
    "mitigations": ["string - list of mitigations for each risk"],
    "recommendedNextGate": "string - what should happen next"
  }
}

DECISION TYPES:
- ADOPT: Use an existing solution as-is
- ADAPT: Modify an existing solution
- BUILD: Create a new solution from scratch

RULES:
1. Generate a valid JSON object matching the schema above
2. Include 2-5 risks and corresponding mitigations
3. Provide clear rationale for the decision type
4. Respond ONLY with the JSON object, no other text`,
};

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
  dbSources: DBSource[],
  mode: CopilotMode = 'ASK'
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

  const answer =
    mode === 'DRAFT'
      ? `Draft mode requires LLM to be configured. Please set OPENAI_API_KEY.\n\nBased on the documentation, here's what I found:\n\n${relevantInfo}`
      : `Based on the documentation, here's what I found:\n\n${relevantInfo}\n\n${
          dbSources.length > 0
            ? 'I also found relevant database context about your project/run.'
            : ''
        }\n\nNote: LLM is not configured, so this is a docs-only response. For more intelligent answers, configure OPENAI_API_KEY.`;

  return {
    answer,
    sources,
    llmUsed: false,
  };
}

/**
 * Call OpenAI API for ASK mode
 */
async function callOpenAIAsk(
  query: string,
  docChunks: DocChunk[],
  dbContext: string,
  dbSources: DBSource[]
): Promise<CopilotResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const baseUrl = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

  if (!apiKey) {
    return generateDocsOnlyResponse(query, docChunks, dbContext, dbSources, 'ASK');
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
          { role: 'system', content: ASK_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return generateDocsOnlyResponse(query, docChunks, dbContext, dbSources, 'ASK');
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
    return generateDocsOnlyResponse(query, docChunks, dbContext, dbSources, 'ASK');
  }
}

/**
 * Call OpenAI API for DRAFT mode
 */
async function callOpenAIDraft(
  query: string,
  draftKind: DraftKind,
  docChunks: DocChunk[],
  dbContext: string,
  dbSources: DBSource[]
): Promise<CopilotResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const baseUrl = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

  if (!apiKey) {
    return generateDocsOnlyResponse(query, docChunks, dbContext, dbSources, 'DRAFT');
  }

  const systemPrompt = DRAFT_SYSTEM_PROMPTS[draftKind];

  // Build context from docs
  const docsContext = docChunks
    .map((chunk, i) => `[DOC ${i + 1}] ${chunk.ref}\nTitle: ${chunk.title}\n${chunk.text}`)
    .join('\n\n---\n\n');

  // Build user prompt
  const userPrompt = `User Request: ${query}

Documentation Context (for reference):
${docsContext || 'No relevant documentation found.'}

Database Context (for reference):
${dbContext || 'No database context available.'}

Generate a ${draftKind} draft based on the user's request.`;

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3, // Lower temperature for more consistent JSON
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, await response.text());
      return generateDocsOnlyResponse(query, docChunks, dbContext, dbSources, 'DRAFT');
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    // Try to parse JSON from the response
    let draftPayload: Record<string, unknown> | undefined;
    let answer: string;

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch =
        rawContent.match(/```json\n?([\s\S]*?)\n?```/) || rawContent.match(/({[\s\S]*})/);
      const jsonStr = jsonMatch ? jsonMatch[1] : rawContent;
      draftPayload = JSON.parse(jsonStr.trim());
      answer = `I've generated a ${draftKind} draft based on your request. Review the payload below and approve when ready.`;
    } catch {
      // If JSON parsing fails, return the raw content as answer
      answer = `I attempted to generate a ${draftKind} draft, but encountered an issue parsing the response. Here's what I got:\n\n${rawContent}`;
    }

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

    // Generate a title from the query
    const draftTitle = `${draftKind} Draft: ${query.slice(0, 50)}${query.length > 50 ? '...' : ''}`;

    return {
      answer,
      sources,
      llmUsed: true,
      draftPayload,
      draftTitle,
    };
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    return generateDocsOnlyResponse(query, docChunks, dbContext, dbSources, 'DRAFT');
  }
}

/**
 * Generate Copilot response
 *
 * @param query - User's question
 * @param docChunks - Retrieved doc chunks
 * @param dbContext - Database context string
 * @param dbSources - Database sources
 * @param mode - ASK or DRAFT mode
 * @param draftKind - Type of draft (only used in DRAFT mode)
 */
export async function generateCopilotResponse(
  query: string,
  docChunks: DocChunk[],
  dbContext: string,
  dbSources: DBSource[],
  mode: CopilotMode = 'ASK',
  draftKind?: DraftKind
): Promise<CopilotResponse> {
  if (mode === 'DRAFT' && draftKind) {
    return callOpenAIDraft(query, draftKind, docChunks, dbContext, dbSources);
  }

  if (isLLMConfigured()) {
    return callOpenAIAsk(query, docChunks, dbContext, dbSources);
  }
  return generateDocsOnlyResponse(query, docChunks, dbContext, dbSources, mode);
}
