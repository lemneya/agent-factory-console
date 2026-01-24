/**
 * ForgeAI - Spec Decomposer
 * Breaks down a spec into parallel workstreams using Claude
 */

import type { DecomposedSpec, TechStack, Workstream, IntegrationPoint, AgentRole } from './types';

const DECOMPOSITION_PROMPT = `You are a software architect. Analyze the following application specification and break it down into parallel workstreams for a multi-agent build system.

The workstreams should be assigned to these agent roles:
- data: Database schema, migrations, seeds
- auth: Authentication, authorization, sessions
- api: API routes, validation, business logic
- ui: Pages, components, forms, styling
- integrations: Third-party services (Stripe, email, etc.)
- qa: Tests, type checking, linting

Rules:
1. Minimize dependencies between workstreams
2. Group related features into the same workstream
3. Each workstream should own specific file paths (no overlap)
4. Estimate realistic completion times (5-30 minutes typically)
5. Create integration points where workstreams must coordinate

Respond with a JSON object matching this schema:
{
  "workstreams": [
    {
      "id": "data-schema",
      "name": "Database Schema",
      "agent": "data",
      "priority": 1,
      "owns": ["prisma/schema.prisma", "prisma/migrations/**"],
      "produces": ["User", "Project", "Task"],
      "blockedBy": [],
      "estimatedMinutes": 10,
      "prompt": "Create the Prisma schema with User, Project, and Task models..."
    }
  ],
  "integrationPoints": [
    {
      "from": "data-schema",
      "to": "api-routes",
      "contract": "Prisma client types for User, Project, Task",
      "files": ["prisma/schema.prisma", "src/app/api/**"]
    }
  ]
}

Tech Stack:
{{TECH_STACK}}

Specification:
{{SPEC}}`;

export async function decomposeSpec(
  spec: string,
  techStack?: Partial<TechStack>
): Promise<DecomposedSpec> {
  // Use Claude API if available, otherwise use mock decomposition
  const useMock = !process.env.ANTHROPIC_API_KEY;

  if (useMock) {
    return mockDecomposition(spec, techStack);
  }

  try {
    const prompt = DECOMPOSITION_PROMPT
      .replace('{{TECH_STACK}}', JSON.stringify(techStack || {}, null, 2))
      .replace('{{SPEC}}', spec);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;

    if (!content) {
      throw new Error('No response from Claude');
    }

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      workstreams: Workstream[];
      integrationPoints: IntegrationPoint[];
    };

    // Build execution waves from dependencies
    const executionWaves = buildExecutionWaves(parsed.workstreams);

    // Calculate total time
    const estimatedTotalMinutes = Math.max(
      ...executionWaves.map((wave) =>
        wave.reduce((sum, wsId) => {
          const ws = parsed.workstreams.find((w) => w.id === wsId);
          return sum + (ws?.estimatedMinutes || 0);
        }, 0)
      )
    );

    return {
      originalSpec: spec,
      workstreams: parsed.workstreams,
      integrationPoints: parsed.integrationPoints,
      executionWaves,
      estimatedTotalMinutes,
    };
  } catch (error) {
    console.error('Decomposition error:', error);
    // Fall back to mock
    return mockDecomposition(spec, techStack);
  }
}

function buildExecutionWaves(workstreams: Workstream[]): string[][] {
  const waves: string[][] = [];
  const completed = new Set<string>();

  while (completed.size < workstreams.length) {
    const wave: string[] = [];

    for (const ws of workstreams) {
      if (completed.has(ws.id)) continue;

      // Check if all dependencies are complete
      const depsComplete = ws.blockedBy.every((dep) => completed.has(dep));
      if (depsComplete) {
        wave.push(ws.id);
      }
    }

    if (wave.length === 0) {
      // Circular dependency - break it
      const remaining = workstreams.filter((ws) => !completed.has(ws.id));
      if (remaining.length > 0) {
        wave.push(remaining[0].id);
      }
    }

    waves.push(wave);
    wave.forEach((id) => completed.add(id));
  }

  return waves;
}

function mockDecomposition(
  spec: string,
  techStack?: Partial<TechStack>
): DecomposedSpec {
  // Analyze spec for keywords to determine workstreams
  const hasAuth = /auth|login|user|account|session/i.test(spec);
  const hasPayments = /stripe|payment|billing|subscription/i.test(spec);
  // Reserved for future workstream expansion
  const _hasDashboard = /dashboard|analytics|chart|report/i.test(spec);
  const _hasCrud = /crud|list|create|update|delete|manage/i.test(spec);
  void _hasDashboard;
  void _hasCrud;
  const hasNotifications = /notification|email|alert/i.test(spec);

  const workstreams: Workstream[] = [];
  const integrationPoints: IntegrationPoint[] = [];

  // Always need data layer
  workstreams.push({
    id: 'data-schema',
    name: 'Database Schema',
    agent: 'data' as AgentRole,
    priority: 1,
    owns: ['prisma/schema.prisma', 'prisma/migrations/**', 'prisma/seed.ts'],
    produces: ['Prisma schema', 'Database migrations'],
    blockedBy: [],
    estimatedMinutes: 10,
    prompt: `Create the Prisma schema based on the spec: ${spec.slice(0, 500)}...

Tech stack: ${JSON.stringify(techStack || {})}

Include appropriate models, relations, and indexes.`,
  });

  if (hasAuth) {
    workstreams.push({
      id: 'auth-setup',
      name: 'Authentication',
      agent: 'auth' as AgentRole,
      priority: 2,
      owns: ['src/lib/auth.ts', 'src/app/api/auth/**', 'src/middleware.ts'],
      produces: ['Auth configuration', 'Session handling'],
      blockedBy: ['data-schema'],
      estimatedMinutes: 15,
      prompt: `Set up authentication using ${techStack?.auth || 'nextauth'}.

Include:
- User registration and login
- Session management
- Protected route middleware`,
    });

    integrationPoints.push({
      from: 'data-schema',
      to: 'auth-setup',
      contract: 'User model with email, password fields',
      files: ['prisma/schema.prisma', 'src/lib/auth.ts'],
    });
  }

  // API routes
  workstreams.push({
    id: 'api-routes',
    name: 'API Routes',
    agent: 'api' as AgentRole,
    priority: 3,
    owns: ['src/app/api/**'],
    produces: ['REST/tRPC endpoints'],
    blockedBy: ['data-schema', ...(hasAuth ? ['auth-setup'] : [])],
    estimatedMinutes: 20,
    prompt: `Create API routes for the application features:
${spec.slice(0, 500)}...

Use ${techStack?.backend || 'nextjs-api'} for the backend.
Include proper validation and error handling.`,
  });

  integrationPoints.push({
    from: 'data-schema',
    to: 'api-routes',
    contract: 'Prisma client for database operations',
    files: ['prisma/schema.prisma', 'src/app/api/**'],
  });

  // UI components
  workstreams.push({
    id: 'ui-components',
    name: 'UI Components',
    agent: 'ui' as AgentRole,
    priority: 3,
    owns: ['src/components/**', 'src/app/(pages)/**'],
    produces: ['React components', 'Page layouts'],
    blockedBy: hasAuth ? ['auth-setup'] : ['data-schema'],
    estimatedMinutes: 25,
    prompt: `Create UI components and pages for:
${spec.slice(0, 500)}...

Use ${techStack?.styling || 'tailwind'} for styling.
Include responsive design and dark mode support.`,
  });

  integrationPoints.push({
    from: 'api-routes',
    to: 'ui-components',
    contract: 'API endpoints for data fetching',
    files: ['src/app/api/**', 'src/components/**'],
  });

  if (hasPayments) {
    workstreams.push({
      id: 'stripe-integration',
      name: 'Stripe Integration',
      agent: 'integrations' as AgentRole,
      priority: 4,
      owns: ['src/lib/stripe.ts', 'src/app/api/stripe/**', 'src/app/api/webhooks/stripe/**'],
      produces: ['Stripe configuration', 'Webhook handlers'],
      blockedBy: ['data-schema', 'api-routes'],
      estimatedMinutes: 15,
      prompt: `Set up Stripe integration for payments and subscriptions.

Include:
- Stripe client configuration
- Checkout session creation
- Webhook handling for payment events
- Subscription management`,
    });

    integrationPoints.push({
      from: 'stripe-integration',
      to: 'api-routes',
      contract: 'Payment endpoints and subscription status',
      files: ['src/lib/stripe.ts', 'src/app/api/**'],
    });
  }

  if (hasNotifications) {
    workstreams.push({
      id: 'notifications',
      name: 'Notifications',
      agent: 'integrations' as AgentRole,
      priority: 4,
      owns: ['src/lib/email.ts', 'src/lib/notifications.ts'],
      produces: ['Email templates', 'Notification service'],
      blockedBy: ['data-schema'],
      estimatedMinutes: 10,
      prompt: `Set up notification system including:
- Email sending with templates
- In-app notifications
- Notification preferences`,
    });
  }

  // QA workstream
  workstreams.push({
    id: 'qa-tests',
    name: 'Testing & QA',
    agent: 'qa' as AgentRole,
    priority: 5,
    owns: ['__tests__/**', 'cypress/**', 'jest.config.js'],
    produces: ['Unit tests', 'E2E tests'],
    blockedBy: workstreams.filter((w) => w.agent !== 'qa').map((w) => w.id),
    estimatedMinutes: 15,
    prompt: `Create tests for the application:
- Unit tests for key functions
- Integration tests for API routes
- E2E tests for critical user flows`,
  });

  // Build execution waves
  const executionWaves = buildExecutionWaves(workstreams);

  // Calculate parallel execution time
  const estimatedTotalMinutes = executionWaves.reduce((total, wave) => {
    const waveTime = Math.max(
      ...wave.map((wsId) => {
        const ws = workstreams.find((w) => w.id === wsId);
        return ws?.estimatedMinutes || 0;
      })
    );
    return total + waveTime;
  }, 0);

  return {
    originalSpec: spec,
    workstreams,
    integrationPoints,
    executionWaves,
    estimatedTotalMinutes,
  };
}
