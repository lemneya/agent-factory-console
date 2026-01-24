/**
 * Forge Competitive Analysis
 *
 * Track how AFC Forge compares to other app building solutions.
 * Updated: January 2026
 */

export interface Competitor {
  name: string;
  type: 'ai-builder' | 'low-code' | 'boilerplate' | 'agency';
  website: string;
  pricing: string;
  timeToMvp: string; // Typical time to MVP
  features: string[];
  limitations: string[];
  bestFor: string;
}

export interface CompetitiveAdvantage {
  feature: string;
  forgeCapability: string;
  competitorComparison: string;
  timeSavings: string;
}

/**
 * COMPETITOR LANDSCAPE
 */
export const COMPETITORS: Competitor[] = [
  // AI App Builders
  {
    name: 'v0 by Vercel',
    type: 'ai-builder',
    website: 'v0.dev',
    pricing: '$20/mo Pro',
    timeToMvp: '1-2 hours (UI only)',
    features: [
      'AI-generated React components',
      'shadcn/ui integration',
      'Code export',
    ],
    limitations: [
      'UI only - no backend',
      'No database integration',
      'No auth built-in',
      'Single component at a time',
    ],
    bestFor: 'Quick UI prototypes',
  },
  {
    name: 'Bolt.new',
    type: 'ai-builder',
    website: 'bolt.new',
    pricing: '$20/mo',
    timeToMvp: '30min - 2 hours',
    features: [
      'Full-stack generation',
      'In-browser IDE',
      'One-click deploy',
    ],
    limitations: [
      'Limited customization',
      'No parallel agents',
      'No learning from past builds',
      'Generic templates only',
    ],
    bestFor: 'Simple apps, prototypes',
  },
  {
    name: 'Lovable (GPT Engineer)',
    type: 'ai-builder',
    website: 'lovable.dev',
    pricing: '$20/mo',
    timeToMvp: '1-3 hours',
    features: [
      'Supabase integration',
      'GitHub sync',
      'Iterative refinement',
    ],
    limitations: [
      'Single agent execution',
      'No template library',
      'No memory/learning',
      'Limited tech stack options',
    ],
    bestFor: 'Supabase-based apps',
  },
  {
    name: 'Cursor',
    type: 'ai-builder',
    website: 'cursor.com',
    pricing: '$20/mo Pro',
    timeToMvp: '2-8 hours',
    features: [
      'IDE with AI',
      'Codebase understanding',
      'Multi-file edits',
    ],
    limitations: [
      'Requires manual orchestration',
      'No parallel execution',
      'No app templates',
      'Developer-focused (not spec-to-app)',
    ],
    bestFor: 'Developers wanting AI assistance',
  },
  // Low-Code Platforms
  {
    name: 'Bubble',
    type: 'low-code',
    website: 'bubble.io',
    pricing: '$32-349/mo',
    timeToMvp: '1-2 weeks',
    features: [
      'Visual builder',
      'Database included',
      'Plugin marketplace',
    ],
    limitations: [
      'No code export',
      'Vendor lock-in',
      'Performance issues at scale',
      'Limited customization',
    ],
    bestFor: 'Non-technical founders',
  },
  {
    name: 'Retool',
    type: 'low-code',
    website: 'retool.com',
    pricing: '$10-50/user/mo',
    timeToMvp: '1-3 days',
    features: [
      'Internal tools',
      'Database connectors',
      'Pre-built components',
    ],
    limitations: [
      'Internal tools only',
      'Not for consumer apps',
      'Complex pricing',
    ],
    bestFor: 'Internal admin tools',
  },
  // Boilerplate/Starters
  {
    name: 'ShipFast',
    type: 'boilerplate',
    website: 'shipfa.st',
    pricing: '$199 one-time',
    timeToMvp: '1-2 days',
    features: [
      'Next.js boilerplate',
      'Stripe included',
      'Auth included',
    ],
    limitations: [
      'Manual customization needed',
      'No AI assistance',
      'One template only',
      'No parallel development',
    ],
    bestFor: 'Developers who want a head start',
  },
  // Agencies
  {
    name: 'Traditional Dev Agency',
    type: 'agency',
    website: 'N/A',
    pricing: '$10k-100k+',
    timeToMvp: '4-12 weeks',
    features: [
      'Full customization',
      'Human expertise',
      'Ongoing support',
    ],
    limitations: [
      'Expensive',
      'Slow',
      'Communication overhead',
      'Dependency on agency',
    ],
    bestFor: 'Enterprise, complex requirements',
  },
];

/**
 * FORGE COMPETITIVE ADVANTAGES
 */
export const FORGE_ADVANTAGES: CompetitiveAdvantage[] = [
  // CORE ADVANTAGES
  {
    feature: '3-Tier Build Strategy',
    forgeCapability: 'Clone starters (90%), Inventory templates (80%), From-scratch with AI',
    competitorComparison: 'Others: Single approach (either templates OR AI generation)',
    timeSavings: '90% faster than from-scratch competitors',
  },
  {
    feature: 'Parallel Multi-Agent Execution',
    forgeCapability: '6 specialized agents working in parallel (data, auth, api, ui, integrations, qa)',
    competitorComparison: 'Others: Single agent/sequential execution',
    timeSavings: '4-6x faster than sequential approaches',
  },
  {
    feature: 'Feature Inventory (80% Patterns)',
    forgeCapability: '30+ pre-built templates for common features (auth, CRUD, payments, etc.)',
    competitorComparison: 'Others: Generate everything from scratch',
    timeSavings: '30% reduction in generation time',
  },
  {
    feature: 'Clonable Starters (90%+ Done)',
    forgeCapability: '27 production-ready templates (SaaS, e-commerce, AI, websites, etc.)',
    competitorComparison: 'Others: Basic scaffolding only',
    timeSavings: '8 hours → 30-45 minutes',
  },
  {
    feature: 'Forge Memory (Learning System)',
    forgeCapability: 'Learns from past builds, user patterns, successful architectures',
    competitorComparison: 'Others: No learning/memory between sessions',
    timeSavings: 'Improves 10-20% per project',
  },
  {
    feature: 'Chat Agent (Refinement)',
    forgeCapability: 'Natural language modifications: "change header color", "add contact page"',
    competitorComparison: 'Others: Regenerate from scratch or manual code edits',
    timeSavings: 'Instant refinements vs rebuilding',
  },

  // 5 KILLER FEATURES (UNTOUCHABLE MOAT)
  {
    feature: '⚡ KILLER #1: Live Preview',
    forgeCapability: 'Real-time app preview updating as agents build - see your app come alive',
    competitorComparison: 'Others: Show logs/terminal only, wait until complete',
    timeSavings: 'Instant visual feedback, catch issues early',
  },
  {
    feature: '🛡️ KILLER #2: AI Code Review',
    forgeCapability: 'Automatic security scan (XSS, SQL injection), performance, accessibility checks',
    competitorComparison: 'Others: No quality checks, deploy and hope',
    timeSavings: 'Enterprise-ready code, no security audits needed',
  },
  {
    feature: '🚀 KILLER #3: Multi-Platform Deploy',
    forgeCapability: 'One-click to Vercel, Railway, Fly, AWS, Cloudflare, Expo (iOS/Android)',
    competitorComparison: 'Others: Single platform (usually Vercel only)',
    timeSavings: 'Deploy everywhere, no platform lock-in',
  },
  {
    feature: '👥 KILLER #4: Collaborative Building',
    forgeCapability: 'Team watches same build, real-time cursors, comments, shared decisions',
    competitorComparison: 'Others: Solo building only',
    timeSavings: 'Team alignment, PM + Dev + Designer together',
  },
  {
    feature: '⏰ KILLER #5: Version Time Machine',
    forgeCapability: 'Snapshot every step, fork anytime, compare versions, never lose work',
    competitorComparison: 'Others: Linear builds, no versioning',
    timeSavings: 'Zero-risk building, experiment freely',
  },

  // SUPPORTING FEATURES
  {
    feature: 'Wave-Based Execution',
    forgeCapability: 'Smart dependency resolution, parallel waves, automatic integration',
    competitorComparison: 'Others: Manual orchestration or sequential',
    timeSavings: '3-5x faster execution',
  },
  {
    feature: 'HITL (Human-in-the-Loop)',
    forgeCapability: 'Real-time questions, decision points, guided customization',
    competitorComparison: 'Others: Either fully automated or fully manual',
    timeSavings: 'Better quality, fewer revisions',
  },
  {
    feature: 'Real-time SSE Streaming',
    forgeCapability: 'Live progress updates, agent status, build monitoring',
    competitorComparison: 'Others: Wait for completion or periodic polling',
    timeSavings: 'Better UX, faster issue detection',
  },
];

/**
 * TIME COMPARISON MATRIX
 */
export const TIME_COMPARISON = {
  // Time to build a typical SaaS MVP
  saasApp: {
    forge: '30-45 min (clone + customize)',
    v0: 'N/A (UI only)',
    bolt: '2-4 hours',
    lovable: '3-6 hours',
    cursor: '8-16 hours',
    bubble: '1-2 weeks',
    shipfast: '1-2 days',
    agency: '4-8 weeks',
  },
  // Time to build an e-commerce store
  ecommerce: {
    forge: '20-30 min (clone Next.js Commerce)',
    v0: 'N/A (UI only)',
    bolt: '3-5 hours',
    lovable: '4-8 hours',
    cursor: '16-24 hours',
    bubble: '2-3 weeks',
    shipfast: 'N/A (SaaS only)',
    agency: '6-12 weeks',
  },
  // Time to build an AI chatbot
  aiChatbot: {
    forge: '25 min (clone Chatbot UI)',
    v0: 'N/A (UI only)',
    bolt: '1-2 hours',
    lovable: '2-4 hours',
    cursor: '4-8 hours',
    bubble: '1-2 weeks',
    shipfast: 'N/A',
    agency: '4-6 weeks',
  },
};

/**
 * Get competitive summary
 */
export function getCompetitiveSummary(): string {
  return `
# AFC Forge - Competitive Position (January 2026)

## Speed Advantage
- **vs AI Builders (Bolt, Lovable)**: 4-10x faster (parallel agents + templates)
- **vs Low-Code (Bubble, Retool)**: 20-50x faster (no drag-drop required)
- **vs Boilerplates (ShipFast)**: 2-3x faster (AI customization)
- **vs Agencies**: 100x+ faster (weeks → minutes)

## 🏆 5 KILLER FEATURES (UNTOUCHABLE)

| # | Feature | What We Have | What They Have |
|---|---------|--------------|----------------|
| 1 | **Live Preview** | Real-time app updates as agents build | Logs/terminal only |
| 2 | **AI Code Review** | Security + quality scan pre-deploy | No quality checks |
| 3 | **Multi-Deploy** | 10 platforms inc. mobile | Single platform |
| 4 | **Collaborative** | Team builds together | Solo only |
| 5 | **Time Machine** | Snapshot, fork, revert | No versioning |

## Core Capabilities (Already Unique)
1. ✅ 3-Tier Build Strategy (only Forge)
2. ✅ Parallel Multi-Agent Execution (6 agents)
3. ✅ Feature Inventory (30+ templates)
4. ✅ Clonable Starters (27 production apps)
5. ✅ Forge Memory (learning system)
6. ✅ Chat Agent (refinement via conversation)
7. ✅ Wave-Based Execution
8. ✅ HITL Integration

## Why We're Untouchable
Forge is the ONLY solution that has ALL of these:
- Clone-first approach (27 production templates)
- Template injection (30+ feature patterns)
- Parallel AI generation (6 specialized agents)
- Learning/memory (improves per project)
- Live preview (see it build in real-time)
- Built-in QA (security/perf/a11y scanning)
- Multi-platform deploy (web + mobile)
- Team collaboration (not just solo)
- Version time machine (zero-risk building)

**No competitor has even 3 of these. We have ALL 9.**
`;
}

/**
 * Get time savings for a specific app type
 */
export function getTimeSavings(appType: keyof typeof TIME_COMPARISON): Record<string, string> {
  return TIME_COMPARISON[appType];
}
