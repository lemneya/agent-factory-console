/**
 * ForgeAI - Spec Decomposer
 * Uses Claude to break down a spec into parallel workstreams
 */

import {
  DecomposedSpec,
  Workstream,
  IntegrationPoint,
  TechStack,
  AgentRole,
} from './types';

// Default tech stack
const DEFAULT_TECH_STACK: TechStack = {
  frontend: 'nextjs',
  backend: 'nextjs-api',
  database: 'postgres',
  auth: 'nextauth',
  styling: 'tailwind',
  deployment: 'vercel',
};

// Agent role configurations
const AGENT_CONFIGS: Record<AgentRole, { owns: string[]; produces: string[] }> = {
  data: {
    owns: ['prisma/', 'src/lib/db/', 'scripts/seed.ts'],
    produces: ['schema.prisma', 'prisma client', 'seed data'],
  },
  auth: {
    owns: ['src/lib/auth/', 'src/app/api/auth/', 'src/app/(auth)/'],
    produces: ['session helpers', 'auth routes', 'protected layouts'],
  },
  api: {
    owns: ['src/app/api/', 'src/lib/services/', 'src/lib/validations/'],
    produces: ['API routes', 'business logic', 'validation schemas'],
  },
  ui: {
    owns: ['src/components/', 'src/app/(dashboard)/', 'src/hooks/'],
    produces: ['React components', 'pages', 'custom hooks'],
  },
  integrations: {
    owns: ['src/lib/integrations/', 'src/app/api/webhooks/'],
    produces: ['third-party integrations', 'webhook handlers'],
  },
  qa: {
    owns: ['__tests__/', 'e2e/', 'playwright.config.ts', 'jest.config.js'],
    produces: ['unit tests', 'e2e tests', 'test utilities'],
  },
};

// The decomposer system prompt
const DECOMPOSER_SYSTEM_PROMPT = `You are a senior software architect. Your job is to break down a product specification into parallel workstreams that can be executed by independent AI coding agents.

RULES:
1. Maximum 6 parallel workstreams (agents work best in small teams)
2. Each workstream must be INDEPENDENT - no circular dependencies
3. Define clear FILE OWNERSHIP - each agent owns specific directories
4. Identify INTEGRATION POINTS - where agents' code connects
5. Order by DEPENDENCY GRAPH - data/auth typically first

AGENT ROLES:
- data: Database schema, Prisma models, migrations, seed data
- auth: Authentication, sessions, RBAC, protected routes
- api: API routes, business logic, validation
- ui: React components, pages, forms, hooks
- integrations: Third-party services (Stripe, email, etc.)
- qa: Tests (unit, e2e), type checking, linting

OUTPUT JSON FORMAT:
{
  "workstreams": [
    {
      "id": "unique-id",
      "name": "Human readable name",
      "agent": "data|auth|api|ui|integrations|qa",
      "priority": 1,
      "owns": ["prisma/", "src/lib/db/"],
      "produces": ["schema.prisma", "db utilities"],
      "blockedBy": [],
      "estimatedMinutes": 5,
      "prompt": "Detailed instructions for the agent..."
    }
  ],
  "integrationPoints": [
    {
      "from": "data",
      "to": "api",
      "contract": "Prisma client import",
      "files": ["src/lib/db/client.ts"]
    }
  ],
  "executionWaves": [
    ["data", "auth"],
    ["api", "ui"],
    ["integrations"],
    ["qa"]
  ]
}

Be specific in agent prompts. Include exact file paths, function names, and implementation details.`;

/**
 * Decompose a spec into parallel workstreams
 */
export async function decomposeSpec(
  spec: string,
  techStack: Partial<TechStack> = {}
): Promise<DecomposedSpec> {
  const stack = { ...DEFAULT_TECH_STACK, ...techStack };

  // Build the user prompt
  const userPrompt = `
TECH STACK:
- Frontend: ${stack.frontend}
- Backend: ${stack.backend}
- Database: ${stack.database}
- Auth: ${stack.auth}
- Styling: ${stack.styling}
- Deployment: ${stack.deployment}

SPECIFICATION:
${spec}

Break this down into parallel workstreams. Return ONLY valid JSON.`;

  // Call Claude API (placeholder - would use actual Anthropic SDK)
  const response = await callClaudeAPI(DECOMPOSER_SYSTEM_PROMPT, userPrompt);

  // Parse the response
  const parsed = JSON.parse(response);

  // Enrich workstreams with default ownership
  const workstreams: Workstream[] = parsed.workstreams.map((ws: Workstream) => ({
    ...ws,
    owns: ws.owns || AGENT_CONFIGS[ws.agent]?.owns || [],
    produces: ws.produces || AGENT_CONFIGS[ws.agent]?.produces || [],
  }));

  // Calculate estimated total time
  const waves = parsed.executionWaves as string[][];
  let estimatedTotalMinutes = 0;
  for (const wave of waves) {
    const waveMax = Math.max(
      ...wave.map((id) => {
        const ws = workstreams.find((w) => w.id === id);
        return ws?.estimatedMinutes || 5;
      })
    );
    estimatedTotalMinutes += waveMax;
  }

  return {
    originalSpec: spec,
    workstreams,
    integrationPoints: parsed.integrationPoints || [],
    executionWaves: waves,
    estimatedTotalMinutes,
  };
}

/**
 * Placeholder for Claude API call
 * In production, use @anthropic-ai/sdk
 */
async function callClaudeAPI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Return mock response for development
    return JSON.stringify(getMockDecomposition());
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content[0];

  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Extract JSON from response (may be wrapped in markdown)
  const jsonMatch = content.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON found in Claude response');
  }

  return jsonMatch[0];
}

/**
 * Mock decomposition for development/testing
 */
function getMockDecomposition() {
  return {
    workstreams: [
      {
        id: 'data',
        name: 'Data Layer',
        agent: 'data',
        priority: 1,
        owns: ['prisma/', 'src/lib/db/'],
        produces: ['schema.prisma', 'prisma client', 'db utilities'],
        blockedBy: [],
        estimatedMinutes: 5,
        prompt: `Create the database schema and Prisma setup:
1. Initialize Prisma with PostgreSQL
2. Create models for User, Project, Task
3. Add proper indexes and relations
4. Create a seed script with sample data
5. Export typed Prisma client`,
      },
      {
        id: 'auth',
        name: 'Authentication',
        agent: 'auth',
        priority: 1,
        owns: ['src/lib/auth/', 'src/app/api/auth/', 'src/app/(auth)/'],
        produces: ['session helpers', 'auth routes', 'login/signup pages'],
        blockedBy: [],
        estimatedMinutes: 8,
        prompt: `Set up NextAuth authentication:
1. Configure NextAuth with GitHub OAuth provider
2. Create auth utility functions (getSession, requireAuth)
3. Build login and signup pages
4. Add protected route middleware
5. Create user profile dropdown component`,
      },
      {
        id: 'api',
        name: 'API Routes',
        agent: 'api',
        priority: 2,
        owns: ['src/app/api/', 'src/lib/services/'],
        produces: ['REST API routes', 'business logic'],
        blockedBy: ['data', 'auth'],
        estimatedMinutes: 10,
        prompt: `Create the API layer:
1. CRUD routes for Projects (/api/projects)
2. CRUD routes for Tasks (/api/tasks)
3. Input validation with Zod
4. Error handling middleware
5. Rate limiting for public endpoints`,
      },
      {
        id: 'ui',
        name: 'UI Components',
        agent: 'ui',
        priority: 2,
        owns: ['src/components/', 'src/app/(dashboard)/'],
        produces: ['React components', 'dashboard pages'],
        blockedBy: ['data', 'auth'],
        estimatedMinutes: 12,
        prompt: `Build the frontend UI:
1. Dashboard layout with sidebar navigation
2. Project list and detail pages
3. Task board with drag-and-drop (Kanban)
4. Forms for creating/editing projects and tasks
5. Loading states and error boundaries`,
      },
      {
        id: 'integrations',
        name: 'Third-party Integrations',
        agent: 'integrations',
        priority: 3,
        owns: ['src/lib/integrations/', 'src/app/api/webhooks/'],
        produces: ['GitHub integration', 'webhook handlers'],
        blockedBy: ['api'],
        estimatedMinutes: 5,
        prompt: `Add third-party integrations:
1. GitHub webhook receiver for push events
2. Email notifications (optional: Resend/SendGrid)
3. Webhook signature verification
4. Event logging to database`,
      },
      {
        id: 'qa',
        name: 'Testing & QA',
        agent: 'qa',
        priority: 4,
        owns: ['__tests__/', 'e2e/', 'playwright.config.ts'],
        produces: ['unit tests', 'e2e tests'],
        blockedBy: ['api', 'ui'],
        estimatedMinutes: 8,
        prompt: `Set up testing infrastructure:
1. Jest configuration for unit tests
2. Playwright for E2E tests
3. Test utilities and fixtures
4. API route tests
5. Critical user flow E2E tests (login, create project, manage tasks)`,
      },
    ],
    integrationPoints: [
      {
        from: 'data',
        to: 'api',
        contract: 'Prisma client import',
        files: ['src/lib/db/client.ts'],
      },
      {
        from: 'data',
        to: 'auth',
        contract: 'User model for session',
        files: ['prisma/schema.prisma'],
      },
      {
        from: 'auth',
        to: 'api',
        contract: 'requireAuth middleware',
        files: ['src/lib/auth/index.ts'],
      },
      {
        from: 'api',
        to: 'ui',
        contract: 'API response types',
        files: ['src/types/api.ts'],
      },
    ],
    executionWaves: [
      ['data', 'auth'],
      ['api', 'ui'],
      ['integrations'],
      ['qa'],
    ],
  };
}

/**
 * Validate a decomposed spec
 */
export function validateDecomposition(spec: DecomposedSpec): string[] {
  const errors: string[] = [];

  // Check for circular dependencies
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function hasCycle(id: string): boolean {
    if (inStack.has(id)) return true;
    if (visited.has(id)) return false;

    visited.add(id);
    inStack.add(id);

    const ws = spec.workstreams.find((w) => w.id === id);
    if (ws) {
      for (const dep of ws.blockedBy) {
        if (hasCycle(dep)) return true;
      }
    }

    inStack.delete(id);
    return false;
  }

  for (const ws of spec.workstreams) {
    if (hasCycle(ws.id)) {
      errors.push(`Circular dependency detected involving workstream: ${ws.id}`);
    }
  }

  // Check that all blockedBy references exist
  const wsIds = new Set(spec.workstreams.map((w) => w.id));
  for (const ws of spec.workstreams) {
    for (const dep of ws.blockedBy) {
      if (!wsIds.has(dep)) {
        errors.push(`Workstream ${ws.id} depends on non-existent workstream: ${dep}`);
      }
    }
  }

  // Check execution waves contain valid IDs
  for (const wave of spec.executionWaves) {
    for (const id of wave) {
      if (!wsIds.has(id)) {
        errors.push(`Execution wave contains non-existent workstream: ${id}`);
      }
    }
  }

  // Check that waves respect dependencies
  const completedBefore: Set<string> = new Set();
  for (const wave of spec.executionWaves) {
    for (const id of wave) {
      const ws = spec.workstreams.find((w) => w.id === id);
      if (ws) {
        for (const dep of ws.blockedBy) {
          if (!completedBefore.has(dep) && !wave.includes(dep)) {
            errors.push(
              `Workstream ${id} runs in same/earlier wave as dependency ${dep}`
            );
          }
        }
      }
    }
    // After wave completes, all its workstreams are done
    for (const id of wave) {
      completedBefore.add(id);
    }
  }

  return errors;
}
