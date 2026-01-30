/**
 * AFC-ROUTER-INVENTORY-OSS-0: OSS "Sniff" Engine
 *
 * Provides metadata-only OSS candidate matching.
 * This is NOT a full crawler - no GitHub tokens, no repo cloning.
 *
 * Uses a config-driven list of vetted OSS projects.
 *
 * INTERNAL USE ONLY - Does not affect client pricing.
 */

import type { AppType, EstimateScope } from './inventory-matcher';

// ============================================================================
// Types
// ============================================================================

export interface OSSCandidate {
  name: string;
  repoUrl: string;
  license: string;
  stack: string[];
  coverageEstimate: number;
  lastActivity: string; // ISO date
  features: string[];
}

export interface OSSSniffResult {
  candidates: OSSCandidate[];
  bestMatch: OSSCandidate | null;
  totalCoverage: number;
  rejectedForLicense: string[];
}

// ============================================================================
// License Rules
// ============================================================================

const REJECTED_LICENSES = ['GPL', 'GPL-2.0', 'GPL-3.0', 'AGPL', 'AGPL-3.0'];

const PREFERRED_LICENSES = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'];

function isLicenseAcceptable(license: string): boolean {
  const upper = license.toUpperCase();
  return !REJECTED_LICENSES.some(rejected => upper.includes(rejected.toUpperCase()));
}

// ============================================================================
// Static OSS Catalog (Config-Driven)
// ============================================================================

/**
 * Vetted OSS projects that can be used for bootstrapping.
 * This is a static list that can be extended via config later.
 */
const OSS_CATALOG: OSSCandidate[] = [
  {
    name: 'Next.js SaaS Starter',
    repoUrl: 'https://github.com/vercel/nextjs-subscription-payments',
    license: 'MIT',
    stack: ['nextjs', 'react', 'typescript', 'stripe', 'supabase'],
    coverageEstimate: 0.75,
    lastActivity: '2025-12-01',
    features: ['auth', 'billing', 'dashboard', 'settings'],
  },
  {
    name: 'Shadcn Admin Dashboard',
    repoUrl: 'https://github.com/shadcn-ui/ui',
    license: 'MIT',
    stack: ['nextjs', 'react', 'typescript', 'tailwind'],
    coverageEstimate: 0.65,
    lastActivity: '2026-01-15',
    features: ['dashboard', 'admin', 'settings', 'analytics'],
  },
  {
    name: 'NextAuth.js',
    repoUrl: 'https://github.com/nextauthjs/next-auth',
    license: 'ISC',
    stack: ['nextjs', 'react', 'typescript'],
    coverageEstimate: 0.4,
    lastActivity: '2026-01-20',
    features: ['auth'],
  },
  {
    name: 'Prisma CRUD Generator',
    repoUrl: 'https://github.com/prisma/prisma',
    license: 'Apache-2.0',
    stack: ['nodejs', 'typescript', 'prisma'],
    coverageEstimate: 0.5,
    lastActivity: '2026-01-25',
    features: ['api', 'admin'],
  },
  {
    name: 'React Native Starter',
    repoUrl: 'https://github.com/infinitered/ignite',
    license: 'MIT',
    stack: ['react-native', 'typescript', 'mobx'],
    coverageEstimate: 0.7,
    lastActivity: '2025-11-15',
    features: ['auth', 'settings', 'notifications'],
  },
  {
    name: 'NestJS Backend Boilerplate',
    repoUrl: 'https://github.com/nestjs/nest',
    license: 'MIT',
    stack: ['nodejs', 'typescript', 'nestjs'],
    coverageEstimate: 0.6,
    lastActivity: '2026-01-18',
    features: ['api', 'auth', 'notifications'],
  },
  {
    name: 'Docusaurus',
    repoUrl: 'https://github.com/facebook/docusaurus',
    license: 'MIT',
    stack: ['react', 'typescript'],
    coverageEstimate: 0.3,
    lastActivity: '2026-01-10',
    features: ['search', 'export'],
  },
  // Example of a GPL project (will be rejected)
  {
    name: 'WordPress Plugin Framework',
    repoUrl: 'https://github.com/example/wp-plugin',
    license: 'GPL-2.0',
    stack: ['php', 'wordpress'],
    coverageEstimate: 0.8,
    lastActivity: '2025-10-01',
    features: ['admin', 'settings', 'dashboard'],
  },
];

// ============================================================================
// Stack Compatibility
// ============================================================================

const APP_TYPE_STACKS: Record<AppType, string[]> = {
  web: ['nextjs', 'react', 'vue', 'angular', 'typescript', 'tailwind'],
  mobile: ['react-native', 'flutter', 'expo', 'typescript'],
  backend: ['nodejs', 'typescript', 'nestjs', 'express', 'fastapi', 'prisma'],
};

function isStackCompatible(appType: AppType, candidateStack: string[]): boolean {
  const compatibleStacks = APP_TYPE_STACKS[appType];
  return candidateStack.some(stack => compatibleStacks.includes(stack.toLowerCase()));
}

// ============================================================================
// Sniffing Logic
// ============================================================================

/**
 * Sniff OSS candidates that match the requested scope.
 *
 * Rules:
 * - Reject GPL / AGPL licenses
 * - Prefer MIT / Apache / BSD
 * - Only consider coverageEstimate >= 0.6 for best match
 * - Filter by stack compatibility
 */
export function sniffOSS(scope: EstimateScope): OSSSniffResult {
  const { appType, features } = scope;

  const candidates: OSSCandidate[] = [];
  const rejectedForLicense: string[] = [];

  for (const candidate of OSS_CATALOG) {
    // Check license first
    if (!isLicenseAcceptable(candidate.license)) {
      rejectedForLicense.push(candidate.name);
      continue;
    }

    // Check stack compatibility
    if (!isStackCompatible(appType, candidate.stack)) {
      continue;
    }

    // Calculate feature overlap
    const candidateFeatures = new Set(candidate.features.map(f => f.toLowerCase()));
    const overlap = features.filter(f => candidateFeatures.has(f.toLowerCase()));

    if (overlap.length > 0) {
      // Adjust coverage estimate based on feature overlap
      const overlapRatio = overlap.length / features.length;
      const adjustedCoverage = Math.min(candidate.coverageEstimate, overlapRatio);

      candidates.push({
        ...candidate,
        coverageEstimate: adjustedCoverage,
      });
    }
  }

  // Sort by coverage estimate descending
  candidates.sort((a, b) => b.coverageEstimate - a.coverageEstimate);

  // Best match must have coverage >= 0.6
  const bestMatch =
    candidates.length > 0 && candidates[0].coverageEstimate >= 0.6 ? candidates[0] : null;

  // Total coverage is the best match's coverage (or 0 if none)
  const totalCoverage = bestMatch?.coverageEstimate ?? 0;

  return {
    candidates,
    bestMatch,
    totalCoverage,
    rejectedForLicense,
  };
}

/**
 * Check if a specific license is acceptable for use.
 */
export function checkLicense(license: string): {
  acceptable: boolean;
  preferred: boolean;
  reason?: string;
} {
  if (!isLicenseAcceptable(license)) {
    return {
      acceptable: false,
      preferred: false,
      reason: `License ${license} is copyleft and requires derivative works to use the same license`,
    };
  }

  const preferred = PREFERRED_LICENSES.some(p => p.toLowerCase() === license.toLowerCase());

  return {
    acceptable: true,
    preferred,
    reason: preferred ? undefined : 'License is acceptable but not preferred',
  };
}
