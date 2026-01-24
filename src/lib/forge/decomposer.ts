/**
 * ForgeAI - Spec Decomposer
 * Breaks down a spec into parallel workstreams using Claude
 * Now enhanced with Feature Inventory for 80% common patterns
 */

import type { DecomposedSpec, TechStack, Workstream, IntegrationPoint, AgentRole } from './types';
import {
  matchFeaturesFromSpec,
  getRequiredPackages,
  getRequiredEnvVars,
  type FeatureTemplate,
} from './inventory';
import {
  matchStartersFromSpec,
  calculateTimeSavings,
  type StarterTemplate,
} from './starters';

/**
 * Build context from matched inventory templates
 */
function buildInventoryContext(features: FeatureTemplate[]): string {
  if (features.length === 0) return '';

  const grouped = features.reduce((acc, f) => {
    acc[f.category] = acc[f.category] || [];
    acc[f.category].push(f);
    return acc;
  }, {} as Record<string, FeatureTemplate[]>);

  let context = '\n\n## Available Templates from Inventory\n';
  context += 'Use these pre-built templates instead of generating from scratch:\n\n';

  for (const [category, categoryFeatures] of Object.entries(grouped)) {
    context += `### ${category.toUpperCase()}\n`;
    for (const f of categoryFeatures) {
      context += `- **${f.name}** (${f.id}): ${f.description}\n`;
      if (f.files.length > 0) {
        context += `  Files: ${f.files.map(file => file.path).join(', ')}\n`;
      }
    }
    context += '\n';
  }

  return context;
}

/**
 * Inject template code into workstream prompts
 */
function injectTemplates(workstream: Workstream, features: FeatureTemplate[]): Workstream {
  // Find relevant templates for this workstream's agent role
  const relevantFeatures = features.filter(f => {
    const categoryToRole: Record<string, AgentRole> = {
      auth: 'auth',
      users: 'auth',
      crud: 'api',
      api: 'api',
      forms: 'ui',
      tables: 'ui',
      ui: 'ui',
      dashboard: 'ui',
      uploads: 'api',
      payments: 'integrations',
      notifications: 'integrations',
      realtime: 'api',
      search: 'api',
    };
    return categoryToRole[f.category] === workstream.agent;
  });

  if (relevantFeatures.length === 0) return workstream;

  // Build template injection
  let templateCode = '\n\n---\n## Pre-built Templates (USE THESE):\n\n';

  for (const feature of relevantFeatures) {
    if (feature.files.length === 0) continue;

    templateCode += `### ${feature.name}\n`;
    for (const file of feature.files) {
      templateCode += `\`${file.path}\`:\n\`\`\`typescript\n${file.template}\n\`\`\`\n\n`;
    }
  }

  templateCode += '---\nAdapt these templates to match the spec. Replace {{placeholders}} with actual values.\n';

  return {
    ...workstream,
    prompt: workstream.prompt + templateCode,
  };
}

/**
 * Create a clone-based execution plan for starter templates
 * This is the fastest path - clone and customize
 */
function createCloneBasedPlan(
  spec: string,
  starter: StarterTemplate,
  timeSavedPercent: number
): DecomposedSpec {
  const workstreams: Workstream[] = [];
  const integrationPoints: IntegrationPoint[] = [];

  // Wave 1: Clone the repository
  workstreams.push({
    id: 'clone-starter',
    name: `Clone ${starter.name}`,
    agent: 'data' as AgentRole,
    priority: 1,
    owns: ['*'],
    produces: ['Cloned repository'],
    blockedBy: [],
    estimatedMinutes: 2,
    prompt: `Clone the starter template from: ${starter.repoUrl}

This is a ${starter.category} template with the following features already built:
${starter.features.map(f => `- ${f}`).join('\n')}

Tech stack:
- Framework: ${starter.techStack.framework}
- Database: ${starter.techStack.database || 'N/A'}
- Auth: ${starter.techStack.auth || 'N/A'}
- Styling: ${starter.techStack.styling}
${starter.techStack.payments ? `- Payments: ${starter.techStack.payments}` : ''}

Run: git clone ${starter.repoUrl} . && npm install`,
  });

  // Wave 2: Customization workstreams based on customization points
  let priority = 2;
  for (const point of starter.customizationPoints) {
    const agent = getAgentForCustomization(point.area);
    workstreams.push({
      id: `customize-${point.area.toLowerCase().replace(/\s+/g, '-')}`,
      name: `Customize ${point.area}`,
      agent,
      priority,
      owns: point.files,
      produces: [`Customized ${point.area}`],
      blockedBy: ['clone-starter'],
      estimatedMinutes: point.effort === 'trivial' ? 5 : point.effort === 'easy' ? 10 : 20,
      prompt: `Customize the ${point.area} for this specific app:

${point.description}

Files to modify:
${point.files.map(f => `- ${f}`).join('\n')}

Original spec requirements:
${spec}

Keep the existing structure but adapt to match the spec.`,
    });
    priority++;
  }

  // Wave 3: Environment setup
  workstreams.push({
    id: 'env-setup',
    name: 'Environment Setup',
    agent: 'integrations' as AgentRole,
    priority: priority,
    owns: ['.env.example', '.env.local'],
    produces: ['Environment configuration'],
    blockedBy: ['clone-starter'],
    estimatedMinutes: 5,
    prompt: `Set up environment variables for the app.

Required variables:
${starter.envVarsRequired.map(v => `- ${v}`).join('\n')}

Create .env.example with placeholder values and document each variable.`,
  });

  // Wave 4: Final verification
  workstreams.push({
    id: 'verify-build',
    name: 'Verify & Test',
    agent: 'qa' as AgentRole,
    priority: priority + 1,
    owns: [],
    produces: ['Verified build'],
    blockedBy: workstreams.filter(w => w.id !== 'verify-build').map(w => w.id),
    estimatedMinutes: 5,
    prompt: `Verify the customized app works:

1. Run npm run build
2. Run npm run lint
3. Run npm test (if tests exist)
4. Verify all customizations are applied
5. Check for any TypeScript errors`,
  });

  // Build execution waves
  const executionWaves = buildExecutionWaves(workstreams);

  return {
    originalSpec: spec,
    workstreams,
    integrationPoints,
    executionWaves,
    estimatedTotalMinutes: starter.estimatedCustomizationMinutes,
    requiredEnvVars: starter.envVarsRequired,
    requiredPackages: [],
    inventoryUsed: [],
    starterTemplate: {
      id: starter.id,
      name: starter.name,
      repoUrl: starter.repoUrl,
      customizationMinutes: starter.estimatedCustomizationMinutes,
      timeSavedPercent,
    },
    strategy: 'clone-and-customize',
  };
}

/**
 * Map customization area to agent role
 */
function getAgentForCustomization(area: string): AgentRole {
  const areaLower = area.toLowerCase();
  if (areaLower.includes('brand') || areaLower.includes('ui') || areaLower.includes('design')) {
    return 'ui';
  }
  if (areaLower.includes('data') || areaLower.includes('model') || areaLower.includes('schema')) {
    return 'data';
  }
  if (areaLower.includes('api') || areaLower.includes('backend') || areaLower.includes('route')) {
    return 'api';
  }
  if (areaLower.includes('auth')) {
    return 'auth';
  }
  if (areaLower.includes('payment') || areaLower.includes('email') || areaLower.includes('integration')) {
    return 'integrations';
  }
  return 'ui'; // Default to UI for content/branding changes
}

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
6. IMPORTANT: Use templates from the Feature Inventory when available (listed below)

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
      "prompt": "Create the Prisma schema with User, Project, and Task models...",
      "useTemplates": ["users-model"]
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
{{INVENTORY_CONTEXT}}

Specification:
{{SPEC}}`;

export async function decomposeSpec(
  spec: string,
  techStack?: Partial<TechStack>
): Promise<DecomposedSpec> {
  // TIER 1: Check for clonable starter templates (90-100% done)
  const matchedStarters = matchStartersFromSpec(spec);
  const bestStarter = matchedStarters.length > 0 ? matchedStarters[0] : null;

  if (bestStarter) {
    console.log(`[Forge] 🚀 Found starter template: ${bestStarter.name}`);
    console.log(`[Forge] Clone from: ${bestStarter.repoUrl}`);
    console.log(`[Forge] Customization time: ${bestStarter.estimatedCustomizationMinutes} min`);

    const { savedPercent } = calculateTimeSavings(bestStarter.estimatedCustomizationMinutes);
    return createCloneBasedPlan(spec, bestStarter, savedPercent);
  }

  // TIER 2: Use feature inventory (80% patterns)
  const matchedFeatures = matchFeaturesFromSpec(spec);
  const requiredPackages = getRequiredPackages(matchedFeatures.map(f => f.id));
  const requiredEnvVars = getRequiredEnvVars(matchedFeatures.map(f => f.id));

  console.log(`[Forge] Matched ${matchedFeatures.length} features from inventory`);
  console.log(`[Forge] Required packages: ${requiredPackages.join(', ')}`);
  console.log(`[Forge] Required env vars: ${requiredEnvVars.join(', ')}`);

  // Use Claude API if available, otherwise use mock decomposition
  const useMock = !process.env.ANTHROPIC_API_KEY;

  if (useMock) {
    return mockDecomposition(spec, techStack, matchedFeatures);
  }

  try {
    const inventoryContext = buildInventoryContext(matchedFeatures);
    const prompt = DECOMPOSITION_PROMPT
      .replace('{{TECH_STACK}}', JSON.stringify(techStack || {}, null, 2))
      .replace('{{INVENTORY_CONTEXT}}', inventoryContext)
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

    // Inject inventory templates into workstream prompts
    const enhancedWorkstreams = parsed.workstreams.map(ws =>
      injectTemplates(ws, matchedFeatures)
    );

    // Build execution waves from dependencies
    const executionWaves = buildExecutionWaves(enhancedWorkstreams);

    // Calculate total time (reduced by ~30% due to template reuse)
    const baseTime = Math.max(
      ...executionWaves.map((wave) =>
        wave.reduce((sum, wsId) => {
          const ws = enhancedWorkstreams.find((w) => w.id === wsId);
          return sum + (ws?.estimatedMinutes || 0);
        }, 0)
      )
    );
    const templateBonus = matchedFeatures.length > 0 ? 0.7 : 1.0; // 30% faster with templates
    const estimatedTotalMinutes = Math.round(baseTime * templateBonus);

    return {
      originalSpec: spec,
      workstreams: enhancedWorkstreams,
      integrationPoints: parsed.integrationPoints,
      executionWaves,
      estimatedTotalMinutes,
      // Include inventory metadata
      inventoryUsed: matchedFeatures.map(f => f.id),
      requiredPackages,
      requiredEnvVars,
      strategy: matchedFeatures.length > 0 ? 'with-inventory' : 'from-scratch',
    };
  } catch (error) {
    console.error('Decomposition error:', error);
    // Fall back to mock
    return mockDecomposition(spec, techStack, matchedFeatures);
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
  techStack?: Partial<TechStack>,
  matchedFeatures: FeatureTemplate[] = []
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

  // Inject inventory templates into workstream prompts
  const enhancedWorkstreams = workstreams.map(ws =>
    injectTemplates(ws, matchedFeatures)
  );

  // Build execution waves
  const executionWaves = buildExecutionWaves(enhancedWorkstreams);

  // Calculate parallel execution time (reduced by 30% when using templates)
  const baseTime = executionWaves.reduce((total, wave) => {
    const waveTime = Math.max(
      ...wave.map((wsId) => {
        const ws = enhancedWorkstreams.find((w) => w.id === wsId);
        return ws?.estimatedMinutes || 0;
      })
    );
    return total + waveTime;
  }, 0);
  const templateBonus = matchedFeatures.length > 0 ? 0.7 : 1.0;
  const estimatedTotalMinutes = Math.round(baseTime * templateBonus);

  return {
    originalSpec: spec,
    workstreams: enhancedWorkstreams,
    integrationPoints,
    executionWaves,
    estimatedTotalMinutes,
    // Include inventory metadata
    inventoryUsed: matchedFeatures.map(f => f.id),
    requiredPackages: getRequiredPackages(matchedFeatures.map(f => f.id)),
    requiredEnvVars: getRequiredEnvVars(matchedFeatures.map(f => f.id)),
    strategy: matchedFeatures.length > 0 ? 'with-inventory' : 'from-scratch',
  };
}
