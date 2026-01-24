/**
 * Forge Agent Academy
 *
 * Training and certification system for AI agents.
 * Agents learn through practice, specialize in domains,
 * and earn certifications that prove their expertise.
 *
 * "Growth is the most important aspect of intelligence that
 * characterizes humans from animals. Continuous learning gives
 * humans unique skills in certain domains."
 *
 * Now our agents can do the same.
 */

import type { AgentRole } from './types';

// ============================================
// DOMAIN DEFINITIONS
// ============================================

export type Domain =
  | 'e-commerce'
  | 'healthcare'
  | 'fintech'
  | 'edtech'
  | 'saas'
  | 'social'
  | 'real-estate'
  | 'ai-ml'
  | 'iot'
  | 'gaming'
  | 'media'
  | 'government'
  | 'nonprofit'
  | 'logistics'
  | 'arabic-dialect';

export interface DomainProfile {
  id: Domain;
  name: string;
  description: string;
  requiredKnowledge: string[];
  regulations?: string[];
  criticalPatterns: string[];
  commonPitfalls: string[];
  certificationRequirements: CertificationRequirement[];
}

export const DOMAINS: Record<Domain, DomainProfile> = {
  'e-commerce': {
    id: 'e-commerce',
    name: 'E-Commerce',
    description: 'Online stores, marketplaces, payment processing',
    requiredKnowledge: [
      'Payment gateway integration (Stripe, PayPal)',
      'Shopping cart state management',
      'Inventory tracking and sync',
      'Order lifecycle management',
      'Tax calculation (multi-region)',
      'Shipping rate APIs',
      'Product variant handling',
      'Checkout optimization',
    ],
    regulations: ['PCI-DSS', 'GDPR (customer data)', 'Consumer protection laws'],
    criticalPatterns: [
      'Idempotent payment processing',
      'Cart abandonment recovery',
      'Stock reservation during checkout',
      'Webhook verification',
      'Refund/chargeback handling',
    ],
    commonPitfalls: [
      'Race conditions in inventory',
      'Missing payment failure states',
      'Unvalidated discount codes',
      'Price manipulation vulnerabilities',
      'Shipping calculation errors',
    ],
    certificationRequirements: [
      { skill: 'payment-integration', minScore: 95 },
      { skill: 'inventory-management', minScore: 90 },
      { skill: 'checkout-flow', minScore: 90 },
      { skill: 'security-pci', minScore: 95 },
    ],
  },
  'healthcare': {
    id: 'healthcare',
    name: 'Healthcare & Medical',
    description: 'Patient portals, telehealth, medical records',
    requiredKnowledge: [
      'HIPAA compliance requirements',
      'Patient data encryption',
      'Audit trail implementation',
      'Consent management',
      'HL7/FHIR standards',
      'Appointment scheduling',
      'Prescription handling',
      'Insurance verification',
    ],
    regulations: ['HIPAA', 'HITECH', 'FDA (if medical device)', '21 CFR Part 11'],
    criticalPatterns: [
      'End-to-end encryption for PHI',
      'Role-based access control',
      'Complete audit logging',
      'Data retention policies',
      'Emergency access procedures',
    ],
    commonPitfalls: [
      'PHI in logs or error messages',
      'Missing encryption at rest',
      'Inadequate session timeout',
      'Insufficient access controls',
      'Audit gaps',
    ],
    certificationRequirements: [
      { skill: 'hipaa-compliance', minScore: 98 },
      { skill: 'data-encryption', minScore: 95 },
      { skill: 'audit-logging', minScore: 95 },
      { skill: 'access-control', minScore: 95 },
    ],
  },
  'fintech': {
    id: 'fintech',
    name: 'Financial Technology',
    description: 'Banking, payments, investments, lending',
    requiredKnowledge: [
      'Financial regulations (SOX, PSD2)',
      'Transaction integrity',
      'Fraud detection patterns',
      'KYC/AML requirements',
      'Double-entry accounting',
      'Interest calculations',
      'Currency handling',
      'Reconciliation processes',
    ],
    regulations: ['SOX', 'PSD2', 'KYC/AML', 'SEC regulations', 'State money transmitter laws'],
    criticalPatterns: [
      'Atomic transactions',
      'Immutable audit trails',
      'Rate limiting on transfers',
      'Multi-factor authentication',
      'Fraud scoring',
    ],
    commonPitfalls: [
      'Floating point money calculations',
      'Race conditions in transfers',
      'Missing transaction rollback',
      'Inadequate fraud detection',
      'Currency conversion errors',
    ],
    certificationRequirements: [
      { skill: 'transaction-integrity', minScore: 99 },
      { skill: 'regulatory-compliance', minScore: 95 },
      { skill: 'fraud-prevention', minScore: 90 },
      { skill: 'security-financial', minScore: 98 },
    ],
  },
  'edtech': {
    id: 'edtech',
    name: 'Education Technology',
    description: 'Learning platforms, course management, assessments',
    requiredKnowledge: [
      'Learning path design',
      'Progress tracking',
      'Assessment engines',
      'SCORM/xAPI standards',
      'Accessibility (WCAG)',
      'Video streaming',
      'Live collaboration',
      'Gamification mechanics',
    ],
    regulations: ['FERPA', 'COPPA (if under 13)', 'GDPR', 'Accessibility laws'],
    criticalPatterns: [
      'Adaptive learning algorithms',
      'Anti-cheating measures',
      'Progress persistence',
      'Offline support',
      'Multi-device sync',
    ],
    commonPitfalls: [
      'Lost progress on disconnect',
      'Cheating vulnerabilities',
      'Poor accessibility',
      'Video buffering issues',
      'Inconsistent grading',
    ],
    certificationRequirements: [
      { skill: 'learning-design', minScore: 85 },
      { skill: 'accessibility', minScore: 95 },
      { skill: 'assessment-integrity', minScore: 90 },
      { skill: 'student-privacy', minScore: 95 },
    ],
  },
  'saas': {
    id: 'saas',
    name: 'SaaS Platforms',
    description: 'Multi-tenant software, subscriptions, B2B tools',
    requiredKnowledge: [
      'Multi-tenancy architecture',
      'Subscription billing',
      'Usage metering',
      'Role-based access',
      'API design',
      'Webhook systems',
      'SSO integration',
      'Data isolation',
    ],
    regulations: ['SOC 2', 'GDPR', 'Industry-specific'],
    criticalPatterns: [
      'Tenant data isolation',
      'Subscription state machine',
      'Usage-based billing',
      'API rate limiting',
      'Graceful degradation',
    ],
    commonPitfalls: [
      'Cross-tenant data leaks',
      'Billing edge cases',
      'Missing usage limits',
      'Poor API versioning',
      'Inadequate error handling',
    ],
    certificationRequirements: [
      { skill: 'multi-tenancy', minScore: 95 },
      { skill: 'billing-systems', minScore: 90 },
      { skill: 'api-design', minScore: 85 },
      { skill: 'security-saas', minScore: 95 },
    ],
  },
  'social': {
    id: 'social',
    name: 'Social & Community',
    description: 'Social networks, forums, messaging, content sharing',
    requiredKnowledge: [
      'Feed algorithms',
      'Content moderation',
      'Real-time messaging',
      'Notification systems',
      'Privacy controls',
      'Media handling',
      'Graph relationships',
      'Activity tracking',
    ],
    regulations: ['GDPR', 'COPPA', 'Content moderation laws', 'DSA (EU)'],
    criticalPatterns: [
      'Fan-out on write/read',
      'Content filtering',
      'Report/block systems',
      'Privacy granularity',
      'Notification batching',
    ],
    commonPitfalls: [
      'N+1 queries in feeds',
      'Missing content moderation',
      'Privacy setting gaps',
      'Notification spam',
      'Harassment vectors',
    ],
    certificationRequirements: [
      { skill: 'content-moderation', minScore: 90 },
      { skill: 'privacy-controls', minScore: 95 },
      { skill: 'real-time-systems', minScore: 85 },
      { skill: 'feed-optimization', minScore: 85 },
    ],
  },
  'real-estate': {
    id: 'real-estate',
    name: 'Real Estate',
    description: 'Property listings, search, transactions, management',
    requiredKnowledge: [
      'MLS integration',
      'Map/geospatial search',
      'Property data models',
      'Lead management',
      'Virtual tours',
      'Document management',
      'Transaction workflows',
      'Fair housing compliance',
    ],
    regulations: ['Fair Housing Act', 'RESPA', 'State licensing', 'GDPR'],
    criticalPatterns: [
      'Geospatial indexing',
      'Lead scoring',
      'Document e-signatures',
      'Listing syndication',
      'Commission calculations',
    ],
    commonPitfalls: [
      'Slow map queries',
      'Stale listing data',
      'Fair housing violations',
      'Missing disclosure tracking',
      'Poor mobile experience',
    ],
    certificationRequirements: [
      { skill: 'geospatial-search', minScore: 90 },
      { skill: 'listing-management', minScore: 85 },
      { skill: 'compliance-housing', minScore: 95 },
      { skill: 'transaction-workflow', minScore: 85 },
    ],
  },
  'ai-ml': {
    id: 'ai-ml',
    name: 'AI & Machine Learning',
    description: 'AI-powered apps, ML pipelines, LLM integrations',
    requiredKnowledge: [
      'LLM API integration',
      'Prompt engineering',
      'Vector databases',
      'RAG architectures',
      'Model versioning',
      'Inference optimization',
      'Cost management',
      'Responsible AI practices',
    ],
    regulations: ['AI Act (EU)', 'Industry-specific AI rules', 'Bias regulations'],
    criticalPatterns: [
      'Streaming responses',
      'Context window management',
      'Embedding caching',
      'Fallback handling',
      'Usage tracking',
    ],
    commonPitfalls: [
      'Prompt injection',
      'Runaway API costs',
      'Hallucination handling',
      'Missing rate limits',
      'Poor error messaging',
    ],
    certificationRequirements: [
      { skill: 'llm-integration', minScore: 90 },
      { skill: 'prompt-security', minScore: 95 },
      { skill: 'cost-optimization', minScore: 85 },
      { skill: 'responsible-ai', minScore: 90 },
    ],
  },
  'iot': {
    id: 'iot',
    name: 'Internet of Things',
    description: 'Device management, sensors, automation',
    requiredKnowledge: [
      'MQTT/CoAP protocols',
      'Device provisioning',
      'OTA updates',
      'Time-series data',
      'Edge computing',
      'Device security',
      'Offline operation',
      'Battery optimization',
    ],
    regulations: ['IoT security standards', 'Radio regulations', 'Privacy laws'],
    criticalPatterns: [
      'Device state sync',
      'Command acknowledgment',
      'Offline queuing',
      'Firmware rollback',
      'Secure boot chain',
    ],
    commonPitfalls: [
      'Device bricking on update',
      'Missing offline mode',
      'Unencrypted communication',
      'Poor battery management',
      'Scalability issues',
    ],
    certificationRequirements: [
      { skill: 'device-communication', minScore: 90 },
      { skill: 'ota-updates', minScore: 95 },
      { skill: 'iot-security', minScore: 95 },
      { skill: 'offline-first', minScore: 85 },
    ],
  },
  'gaming': {
    id: 'gaming',
    name: 'Gaming & Interactive',
    description: 'Games, interactive experiences, virtual worlds',
    requiredKnowledge: [
      'Game state management',
      'Real-time multiplayer',
      'Anti-cheat systems',
      'In-app purchases',
      'Leaderboards',
      'Achievement systems',
      'Asset streaming',
      'Matchmaking',
    ],
    regulations: ['Gambling laws', 'COPPA', 'Loot box regulations', 'Age ratings'],
    criticalPatterns: [
      'Server authoritative',
      'Lag compensation',
      'State interpolation',
      'Cheat detection',
      'Economy balancing',
    ],
    commonPitfalls: [
      'Client-side validation only',
      'Exploitable economies',
      'Poor netcode',
      'Missing age gates',
      'Pay-to-win backlash',
    ],
    certificationRequirements: [
      { skill: 'multiplayer-systems', minScore: 90 },
      { skill: 'anti-cheat', minScore: 95 },
      { skill: 'game-economy', minScore: 85 },
      { skill: 'age-compliance', minScore: 95 },
    ],
  },
  'media': {
    id: 'media',
    name: 'Media & Entertainment',
    description: 'Streaming, content platforms, publishing',
    requiredKnowledge: [
      'Video transcoding',
      'Adaptive streaming',
      'DRM implementation',
      'CDN optimization',
      'Content scheduling',
      'Analytics tracking',
      'Recommendation engines',
      'Live streaming',
    ],
    regulations: ['Copyright (DMCA)', 'Accessibility', 'Content ratings', 'Geoblocking'],
    criticalPatterns: [
      'HLS/DASH streaming',
      'Bitrate adaptation',
      'Content protection',
      'Playback resume',
      'Offline downloads',
    ],
    commonPitfalls: [
      'Buffering issues',
      'DRM compatibility',
      'High bandwidth costs',
      'Piracy vulnerabilities',
      'Poor recommendations',
    ],
    certificationRequirements: [
      { skill: 'video-streaming', minScore: 90 },
      { skill: 'content-protection', minScore: 95 },
      { skill: 'cdn-optimization', minScore: 85 },
      { skill: 'accessibility-media', minScore: 90 },
    ],
  },
  'government': {
    id: 'government',
    name: 'Government & Public Sector',
    description: 'Civic tech, government services, public data',
    requiredKnowledge: [
      'FedRAMP requirements',
      'Section 508 accessibility',
      'Public records management',
      'Identity verification',
      'Multi-language support',
      'High availability',
      'Audit requirements',
      'Data retention',
    ],
    regulations: ['FedRAMP', 'Section 508', 'FOIA', 'Privacy Act', 'State laws'],
    criticalPatterns: [
      'Identity proofing',
      'Form accessibility',
      'Status tracking',
      'Document generation',
      'Appointment scheduling',
    ],
    commonPitfalls: [
      'Accessibility failures',
      'Complex form abandonment',
      'Poor error messaging',
      'Missing language support',
      'Downtime during peak',
    ],
    certificationRequirements: [
      { skill: 'fedramp-compliance', minScore: 98 },
      { skill: 'accessibility-508', minScore: 98 },
      { skill: 'identity-verification', minScore: 95 },
      { skill: 'high-availability', minScore: 95 },
    ],
  },
  'nonprofit': {
    id: 'nonprofit',
    name: 'Nonprofit & Charity',
    description: 'Fundraising, volunteer management, impact tracking',
    requiredKnowledge: [
      'Donation processing',
      'Donor management (CRM)',
      'Campaign tracking',
      'Volunteer coordination',
      'Impact reporting',
      'Grant management',
      'Event registration',
      'Email integration',
    ],
    regulations: ['IRS 501(c)(3)', 'State charity registration', 'PCI for donations'],
    criticalPatterns: [
      'Recurring donations',
      'Donation receipts',
      'Matching gifts',
      'Peer-to-peer fundraising',
      'Impact metrics',
    ],
    commonPitfalls: [
      'Missing tax receipts',
      'Poor mobile giving',
      'Donor fatigue',
      'Compliance gaps',
      'Impact measurement',
    ],
    certificationRequirements: [
      { skill: 'donation-processing', minScore: 95 },
      { skill: 'donor-management', minScore: 85 },
      { skill: 'compliance-nonprofit', minScore: 90 },
      { skill: 'impact-reporting', minScore: 85 },
    ],
  },
  'logistics': {
    id: 'logistics',
    name: 'Logistics & Supply Chain',
    description: 'Shipping, tracking, warehouse management, fleet',
    requiredKnowledge: [
      'Route optimization',
      'Tracking systems',
      'Warehouse management',
      'Barcode/RFID scanning',
      'Carrier integration',
      'Proof of delivery',
      'Inventory forecasting',
      'Fleet management',
    ],
    regulations: ['DOT regulations', 'Customs', 'Hazmat', 'Chain of custody'],
    criticalPatterns: [
      'Real-time tracking',
      'ETA calculation',
      'Exception handling',
      'Load optimization',
      'Driver dispatch',
    ],
    commonPitfalls: [
      'Stale tracking data',
      'Route inefficiency',
      'Missing exceptions',
      'Poor mobile offline',
      'Integration failures',
    ],
    certificationRequirements: [
      { skill: 'route-optimization', minScore: 90 },
      { skill: 'tracking-systems', minScore: 95 },
      { skill: 'carrier-integration', minScore: 85 },
      { skill: 'compliance-logistics', minScore: 90 },
    ],
  },
  'arabic-dialect': {
    id: 'arabic-dialect',
    name: 'Arabic Dialect & Linguistics',
    description: 'Arabic language apps, RTL interfaces, dialect-aware content, MENA localization',
    requiredKnowledge: [
      'RTL (Right-to-Left) layout implementation',
      'Arabic typography and font rendering',
      'Dialect classification (Egyptian, Levantine, Gulf, Maghrebi, Iraqi)',
      'Modern Standard Arabic (MSA) vs colloquial',
      'Unicode Arabic handling and normalization',
      'Bidirectional text mixing (Arabic + English)',
      'Arabic morphology and root systems',
      'Transliteration systems (Buckwalter, ALA-LC)',
      'Arabic date/time/number formatting',
      'Arabic keyboard input handling',
      'Tashkeel (diacritics) processing',
      'Arabic text search and indexing',
    ],
    regulations: ['Cultural sensitivity guidelines', 'Regional content laws', 'Data localization (UAE, KSA)'],
    criticalPatterns: [
      'RTL-first CSS architecture',
      'Dialect detection and routing',
      'Arabic text normalization (Alef, Yaa variants)',
      'Bidirectional text isolation',
      'Arabic-aware string truncation',
      'Collation for Arabic sorting',
      'Dialect-specific content switching',
      'Arabic OCR preprocessing',
    ],
    commonPitfalls: [
      'Broken RTL layouts with mixed content',
      'Wrong font rendering (disconnected letters)',
      'Treating all Arabic as same dialect',
      'Ignoring Tashkeel in search',
      'LTR number display in RTL context',
      'Cultural insensitivity in translations',
      'Breaking Arabic text at wrong positions',
      'Missing Arabic keyboard support',
    ],
    certificationRequirements: [
      { skill: 'rtl-implementation', minScore: 95 },
      { skill: 'dialect-awareness', minScore: 90 },
      { skill: 'arabic-typography', minScore: 90 },
      { skill: 'unicode-handling', minScore: 95 },
      { skill: 'cultural-localization', minScore: 85 },
    ],
  },
};

// ============================================
// AGENT CERTIFICATION
// ============================================

export interface CertificationRequirement {
  skill: string;
  minScore: number;
}

export type CertificationLevel = 'apprentice' | 'practitioner' | 'expert' | 'master';

export interface AgentCertification {
  id: string;
  agentId: string;
  agentRole: AgentRole;
  domain: Domain;
  level: CertificationLevel;
  score: number;
  skills: SkillAssessment[];
  issuedAt: Date;
  expiresAt: Date;
  trainingHistory: TrainingSession[];
  badge: CertificationBadge;
}

export interface SkillAssessment {
  skill: string;
  score: number;
  passed: boolean;
  attempts: number;
  lastAttempt: Date;
  improvements: string[];
}

export interface CertificationBadge {
  name: string;
  icon: string;
  color: string;
  description: string;
}

const LEVEL_THRESHOLDS: Record<CertificationLevel, number> = {
  apprentice: 70,
  practitioner: 80,
  expert: 90,
  master: 95,
};

const LEVEL_BADGES: Record<CertificationLevel, Omit<CertificationBadge, 'name' | 'description'>> = {
  apprentice: { icon: '🌱', color: '#22c55e' },
  practitioner: { icon: '⚡', color: '#3b82f6' },
  expert: { icon: '🏆', color: '#f59e0b' },
  master: { icon: '👑', color: '#8b5cf6' },
};

// ============================================
// TRAINING SYSTEM
// ============================================

export interface TrainingCurriculum {
  domain: Domain;
  modules: TrainingModule[];
  estimatedHours: number;
  prerequisites: Domain[];
}

export interface TrainingModule {
  id: string;
  name: string;
  description: string;
  skills: string[];
  challenges: TrainingChallenge[];
  passingScore: number;
}

export interface TrainingChallenge {
  id: string;
  name: string;
  description: string;
  type: 'build' | 'fix' | 'review' | 'optimize' | 'debug';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  scenario: ChallengeScenario;
  timeLimit?: number; // seconds
  rubric: GradingRubric[];
}

export interface ChallengeScenario {
  context: string;
  requirements: string[];
  constraints: string[];
  initialCode?: Record<string, string>;
  expectedOutcome: string;
  hiddenTests: HiddenTest[];
}

export interface HiddenTest {
  name: string;
  description: string;
  weight: number;
  testFn: string; // Serialized test function
}

export interface GradingRubric {
  criterion: string;
  maxPoints: number;
  levels: {
    score: number;
    description: string;
  }[];
}

export interface TrainingSession {
  id: string;
  agentId: string;
  domain: Domain;
  moduleId: string;
  challengeId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'failed' | 'timeout';
  score?: number;
  feedback?: TrainingFeedback;
  artifacts?: Record<string, string>; // Generated code/files
}

export interface TrainingFeedback {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  rubricScores: { criterion: string; score: number; feedback: string }[];
}

// ============================================
// AGENT SKILL PROFILE
// ============================================

export interface AgentProfile {
  id: string;
  role: AgentRole;
  certifications: AgentCertification[];
  skillLevels: Record<string, number>;
  totalTrainingHours: number;
  buildsCompleted: number;
  specializations: Domain[];
  learningPath: LearningPath;
  performance: PerformanceMetrics;
}

export interface LearningPath {
  currentDomain?: Domain;
  currentModule?: string;
  completedModules: string[];
  nextRecommendations: Domain[];
  streak: number; // Days of continuous learning
  lastActivity: Date;
}

export interface PerformanceMetrics {
  averageScore: number;
  challengesCompleted: number;
  challengesFailed: number;
  averageTimeToComplete: number;
  improvementRate: number; // % improvement over time
  consistencyScore: number;
}

// ============================================
// CURRICULUM DEFINITIONS
// ============================================

function createCurriculum(domain: Domain): TrainingCurriculum {
  const profile = DOMAINS[domain];

  return {
    domain,
    modules: [
      // Foundation Module
      {
        id: `${domain}-foundation`,
        name: `${profile.name} Foundations`,
        description: `Core concepts and patterns for ${profile.name} applications`,
        skills: profile.requiredKnowledge.slice(0, 4),
        challenges: generateFoundationChallenges(domain),
        passingScore: 70,
      },
      // Compliance Module (if regulations exist)
      ...(profile.regulations ? [{
        id: `${domain}-compliance`,
        name: `${profile.name} Compliance & Regulations`,
        description: `Regulatory requirements: ${profile.regulations.join(', ')}`,
        skills: profile.regulations,
        challenges: generateComplianceChallenges(domain),
        passingScore: 90,
      }] : []),
      // Advanced Patterns Module
      {
        id: `${domain}-patterns`,
        name: `${profile.name} Critical Patterns`,
        description: 'Industry-proven patterns and architectures',
        skills: profile.criticalPatterns,
        challenges: generatePatternChallenges(domain),
        passingScore: 80,
      },
      // Pitfall Prevention Module
      {
        id: `${domain}-pitfalls`,
        name: `${profile.name} Pitfall Prevention`,
        description: 'Common mistakes and how to avoid them',
        skills: profile.commonPitfalls.map(p => `Avoiding: ${p}`),
        challenges: generatePitfallChallenges(domain),
        passingScore: 85,
      },
      // Mastery Module
      {
        id: `${domain}-mastery`,
        name: `${profile.name} Mastery`,
        description: 'Complex real-world scenarios',
        skills: profile.requiredKnowledge,
        challenges: generateMasteryChallenges(domain),
        passingScore: 90,
      },
    ],
    estimatedHours: calculateEstimatedHours(domain),
    prerequisites: getPrerequisites(domain),
  };
}

function generateFoundationChallenges(domain: Domain): TrainingChallenge[] {
  const profile = DOMAINS[domain];

  return [
    {
      id: `${domain}-found-1`,
      name: 'Basic Setup',
      description: `Set up a basic ${profile.name} application structure`,
      type: 'build',
      difficulty: 'beginner',
      scenario: {
        context: `You're starting a new ${profile.name} project. Set up the foundational structure.`,
        requirements: profile.requiredKnowledge.slice(0, 2),
        constraints: ['Use TypeScript', 'Follow best practices'],
        expectedOutcome: 'A working foundation with proper architecture',
        hiddenTests: [
          { name: 'Structure', description: 'Proper file organization', weight: 30, testFn: 'checkStructure' },
          { name: 'Types', description: 'TypeScript types defined', weight: 30, testFn: 'checkTypes' },
          { name: 'Patterns', description: 'Domain patterns applied', weight: 40, testFn: 'checkPatterns' },
        ],
      },
      rubric: [
        { criterion: 'Code Organization', maxPoints: 25, levels: [{ score: 25, description: 'Excellent' }, { score: 15, description: 'Good' }, { score: 5, description: 'Needs work' }] },
        { criterion: 'Type Safety', maxPoints: 25, levels: [{ score: 25, description: 'Excellent' }, { score: 15, description: 'Good' }, { score: 5, description: 'Needs work' }] },
        { criterion: 'Domain Patterns', maxPoints: 25, levels: [{ score: 25, description: 'Excellent' }, { score: 15, description: 'Good' }, { score: 5, description: 'Needs work' }] },
        { criterion: 'Best Practices', maxPoints: 25, levels: [{ score: 25, description: 'Excellent' }, { score: 15, description: 'Good' }, { score: 5, description: 'Needs work' }] },
      ],
    },
    {
      id: `${domain}-found-2`,
      name: 'Core Feature Implementation',
      description: `Implement a core ${profile.name} feature`,
      type: 'build',
      difficulty: 'intermediate',
      scenario: {
        context: `Implement the primary feature for a ${profile.name} application.`,
        requirements: [profile.criticalPatterns[0]],
        constraints: ['Handle edge cases', 'Include error handling'],
        expectedOutcome: 'Fully functional core feature',
        hiddenTests: [
          { name: 'Functionality', description: 'Feature works correctly', weight: 40, testFn: 'checkFunctionality' },
          { name: 'Edge Cases', description: 'Edge cases handled', weight: 30, testFn: 'checkEdgeCases' },
          { name: 'Errors', description: 'Proper error handling', weight: 30, testFn: 'checkErrors' },
        ],
      },
      rubric: [
        { criterion: 'Functionality', maxPoints: 40, levels: [{ score: 40, description: 'Excellent' }, { score: 25, description: 'Good' }, { score: 10, description: 'Needs work' }] },
        { criterion: 'Edge Cases', maxPoints: 30, levels: [{ score: 30, description: 'Excellent' }, { score: 20, description: 'Good' }, { score: 5, description: 'Needs work' }] },
        { criterion: 'Error Handling', maxPoints: 30, levels: [{ score: 30, description: 'Excellent' }, { score: 20, description: 'Good' }, { score: 5, description: 'Needs work' }] },
      ],
    },
  ];
}

function generateComplianceChallenges(domain: Domain): TrainingChallenge[] {
  const profile = DOMAINS[domain];

  return [
    {
      id: `${domain}-comply-1`,
      name: 'Regulatory Audit',
      description: 'Review code for compliance violations',
      type: 'review',
      difficulty: 'advanced',
      scenario: {
        context: `Review this ${profile.name} application for ${profile.regulations?.[0]} compliance.`,
        requirements: ['Identify all violations', 'Suggest fixes'],
        constraints: ['Be thorough', 'Prioritize critical issues'],
        expectedOutcome: 'Complete compliance report',
        initialCode: generateNonCompliantCode(domain),
        hiddenTests: [
          { name: 'Detection', description: 'All violations found', weight: 50, testFn: 'checkDetection' },
          { name: 'Fixes', description: 'Fixes are correct', weight: 30, testFn: 'checkFixes' },
          { name: 'Priority', description: 'Proper prioritization', weight: 20, testFn: 'checkPriority' },
        ],
      },
      rubric: [
        { criterion: 'Violation Detection', maxPoints: 50, levels: [{ score: 50, description: 'All found' }, { score: 30, description: 'Most found' }, { score: 10, description: 'Few found' }] },
        { criterion: 'Fix Quality', maxPoints: 30, levels: [{ score: 30, description: 'Excellent' }, { score: 20, description: 'Good' }, { score: 5, description: 'Needs work' }] },
        { criterion: 'Prioritization', maxPoints: 20, levels: [{ score: 20, description: 'Excellent' }, { score: 10, description: 'Good' }, { score: 5, description: 'Needs work' }] },
      ],
    },
  ];
}

function generatePatternChallenges(domain: Domain): TrainingChallenge[] {
  const profile = DOMAINS[domain];

  return profile.criticalPatterns.map((pattern, index) => ({
    id: `${domain}-pattern-${index + 1}`,
    name: `Pattern: ${pattern}`,
    description: `Implement the ${pattern} pattern`,
    type: 'build' as const,
    difficulty: 'advanced' as const,
    scenario: {
      context: `Implement ${pattern} for a production ${profile.name} application.`,
      requirements: [pattern],
      constraints: ['Production-ready', 'Well-tested'],
      expectedOutcome: `Working ${pattern} implementation`,
      hiddenTests: [
        { name: 'Pattern', description: 'Pattern correctly implemented', weight: 50, testFn: 'checkPattern' },
        { name: 'Production', description: 'Production ready', weight: 30, testFn: 'checkProduction' },
        { name: 'Tests', description: 'Adequate tests', weight: 20, testFn: 'checkTests' },
      ],
    },
    rubric: [
      { criterion: 'Pattern Implementation', maxPoints: 50, levels: [{ score: 50, description: 'Excellent' }, { score: 30, description: 'Good' }, { score: 10, description: 'Needs work' }] },
      { criterion: 'Production Readiness', maxPoints: 30, levels: [{ score: 30, description: 'Excellent' }, { score: 20, description: 'Good' }, { score: 5, description: 'Needs work' }] },
      { criterion: 'Test Coverage', maxPoints: 20, levels: [{ score: 20, description: 'Excellent' }, { score: 10, description: 'Good' }, { score: 5, description: 'Needs work' }] },
    ],
  }));
}

function generatePitfallChallenges(domain: Domain): TrainingChallenge[] {
  const profile = DOMAINS[domain];

  return profile.commonPitfalls.map((pitfall, index) => ({
    id: `${domain}-pitfall-${index + 1}`,
    name: `Debug: ${pitfall}`,
    description: `Find and fix the ${pitfall} bug`,
    type: 'debug' as const,
    difficulty: 'intermediate' as const,
    scenario: {
      context: `This code has a bug related to: ${pitfall}. Find and fix it.`,
      requirements: ['Identify the bug', 'Fix without breaking other features'],
      constraints: ['Minimal changes', 'Add regression test'],
      expectedOutcome: 'Bug fixed with test',
      initialCode: generateBuggyCode(domain, pitfall),
      hiddenTests: [
        { name: 'Bug Found', description: 'Bug correctly identified', weight: 30, testFn: 'checkBugFound' },
        { name: 'Fix', description: 'Bug properly fixed', weight: 40, testFn: 'checkFix' },
        { name: 'Regression', description: 'Regression test added', weight: 30, testFn: 'checkRegression' },
      ],
    },
    rubric: [
      { criterion: 'Bug Identification', maxPoints: 30, levels: [{ score: 30, description: 'Excellent' }, { score: 20, description: 'Good' }, { score: 5, description: 'Needs work' }] },
      { criterion: 'Fix Quality', maxPoints: 40, levels: [{ score: 40, description: 'Excellent' }, { score: 25, description: 'Good' }, { score: 10, description: 'Needs work' }] },
      { criterion: 'Regression Test', maxPoints: 30, levels: [{ score: 30, description: 'Excellent' }, { score: 20, description: 'Good' }, { score: 5, description: 'Needs work' }] },
    ],
  }));
}

function generateMasteryChallenges(domain: Domain): TrainingChallenge[] {
  const profile = DOMAINS[domain];

  return [
    {
      id: `${domain}-master-1`,
      name: 'Real-World Scenario',
      description: `Build a complete ${profile.name} feature from scratch`,
      type: 'build',
      difficulty: 'expert',
      timeLimit: 3600, // 1 hour
      scenario: {
        context: `A client needs a production-ready ${profile.name} feature. Build it end-to-end.`,
        requirements: profile.requiredKnowledge,
        constraints: profile.regulations || [],
        expectedOutcome: 'Production-ready feature',
        hiddenTests: [
          { name: 'Complete', description: 'All requirements met', weight: 30, testFn: 'checkComplete' },
          { name: 'Quality', description: 'Production quality', weight: 30, testFn: 'checkQuality' },
          { name: 'Compliance', description: 'Regulatory compliant', weight: 20, testFn: 'checkCompliance' },
          { name: 'Performance', description: 'Performant', weight: 20, testFn: 'checkPerformance' },
        ],
      },
      rubric: [
        { criterion: 'Completeness', maxPoints: 30, levels: [{ score: 30, description: 'Excellent' }, { score: 20, description: 'Good' }, { score: 10, description: 'Needs work' }] },
        { criterion: 'Code Quality', maxPoints: 30, levels: [{ score: 30, description: 'Excellent' }, { score: 20, description: 'Good' }, { score: 10, description: 'Needs work' }] },
        { criterion: 'Compliance', maxPoints: 20, levels: [{ score: 20, description: 'Excellent' }, { score: 15, description: 'Good' }, { score: 5, description: 'Needs work' }] },
        { criterion: 'Performance', maxPoints: 20, levels: [{ score: 20, description: 'Excellent' }, { score: 15, description: 'Good' }, { score: 5, description: 'Needs work' }] },
      ],
    },
  ];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateNonCompliantCode(_domain: Domain): Record<string, string> {
  // Generate code with intentional compliance violations for training
  return {
    'src/example.ts': '// Code with intentional violations for training',
  };
}

function generateBuggyCode(_domain: Domain, _pitfall: string): Record<string, string> {
  // Generate code with intentional bugs for training
  return {
    'src/buggy.ts': '// Code with intentional bug for training',
  };
}

function calculateEstimatedHours(domain: Domain): number {
  const profile = DOMAINS[domain];
  const baseHours = 10;
  const regulationHours = profile.regulations ? profile.regulations.length * 2 : 0;
  const patternHours = profile.criticalPatterns.length * 1.5;
  return Math.round(baseHours + regulationHours + patternHours);
}

function getPrerequisites(domain: Domain): Domain[] {
  const prereqs: Partial<Record<Domain, Domain[]>> = {
    'fintech': ['e-commerce'],
    'healthcare': ['saas'],
    'government': ['saas', 'healthcare'],
    'gaming': ['social'],
    'iot': ['saas'],
  };
  return prereqs[domain] || [];
}

// ============================================
// ACADEMY MANAGEMENT
// ============================================

const agentProfiles = new Map<string, AgentProfile>();
const certifications = new Map<string, AgentCertification[]>();
const trainingSessions = new Map<string, TrainingSession[]>();
const curricula = new Map<Domain, TrainingCurriculum>();

// Initialize curricula
Object.keys(DOMAINS).forEach(domain => {
  curricula.set(domain as Domain, createCurriculum(domain as Domain));
});

export function enrollAgent(
  agentId: string,
  role: AgentRole,
  domain: Domain
): AgentProfile {
  const existing = agentProfiles.get(agentId);

  if (existing) {
    // Update learning path
    existing.learningPath.currentDomain = domain;
    existing.learningPath.lastActivity = new Date();
    return existing;
  }

  const profile: AgentProfile = {
    id: agentId,
    role,
    certifications: [],
    skillLevels: {},
    totalTrainingHours: 0,
    buildsCompleted: 0,
    specializations: [],
    learningPath: {
      currentDomain: domain,
      completedModules: [],
      nextRecommendations: [domain],
      streak: 0,
      lastActivity: new Date(),
    },
    performance: {
      averageScore: 0,
      challengesCompleted: 0,
      challengesFailed: 0,
      averageTimeToComplete: 0,
      improvementRate: 0,
      consistencyScore: 0,
    },
  };

  agentProfiles.set(agentId, profile);
  return profile;
}

export function getAgentProfile(agentId: string): AgentProfile | undefined {
  return agentProfiles.get(agentId);
}

export function getCurriculum(domain: Domain): TrainingCurriculum | undefined {
  return curricula.get(domain);
}

export function startTrainingSession(
  agentId: string,
  domain: Domain,
  moduleId: string,
  challengeId: string
): TrainingSession {
  const session: TrainingSession = {
    id: `train-${agentId}-${Date.now()}`,
    agentId,
    domain,
    moduleId,
    challengeId,
    startedAt: new Date(),
    status: 'in_progress',
  };

  const agentSessions = trainingSessions.get(agentId) || [];
  agentSessions.push(session);
  trainingSessions.set(agentId, agentSessions);

  return session;
}

export function completeTrainingSession(
  sessionId: string,
  agentId: string,
  score: number,
  feedback: TrainingFeedback,
  artifacts?: Record<string, string>
): TrainingSession {
  const agentSessions = trainingSessions.get(agentId) || [];
  const session = agentSessions.find(s => s.id === sessionId);

  if (!session) {
    throw new Error('Training session not found');
  }

  session.completedAt = new Date();
  session.status = score >= 70 ? 'completed' : 'failed';
  session.score = score;
  session.feedback = feedback;
  session.artifacts = artifacts;

  // Update agent profile
  const profile = agentProfiles.get(agentId);
  if (profile) {
    const timeSpent = (session.completedAt.getTime() - session.startedAt.getTime()) / 3600000;
    profile.totalTrainingHours += timeSpent;

    if (session.status === 'completed') {
      profile.performance.challengesCompleted++;
      profile.learningPath.completedModules.push(session.moduleId);
    } else {
      profile.performance.challengesFailed++;
    }

    // Update average score
    const allScores = agentSessions.filter(s => s.score !== undefined).map(s => s.score!);
    profile.performance.averageScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
  }

  return session;
}

export function issueCertification(
  agentId: string,
  domain: Domain
): AgentCertification | null {
  const profile = agentProfiles.get(agentId);
  if (!profile) return null;

  const domainProfile = DOMAINS[domain];
  const agentSessions = trainingSessions.get(agentId) || [];
  const domainSessions = agentSessions.filter(s => s.domain === domain && s.status === 'completed');

  // Calculate skill scores
  const skillScores: SkillAssessment[] = domainProfile.certificationRequirements.map(req => {
    const relevantSessions = domainSessions.filter(s => {
      const curriculum = curricula.get(domain);
      const trainingModule = curriculum?.modules.find(m => m.id === s.moduleId);
      return trainingModule?.skills.some(skill => skill.toLowerCase().includes(req.skill.toLowerCase()));
    });

    const avgScore = relevantSessions.length > 0
      ? relevantSessions.reduce((sum, s) => sum + (s.score || 0), 0) / relevantSessions.length
      : 0;

    return {
      skill: req.skill,
      score: avgScore,
      passed: avgScore >= req.minScore,
      attempts: relevantSessions.length,
      lastAttempt: relevantSessions[relevantSessions.length - 1]?.completedAt || new Date(),
      improvements: [],
    };
  });

  // Check if all requirements are met
  const allPassed = skillScores.every(s => s.passed);
  if (!allPassed) return null;

  // Determine certification level
  const avgScore = skillScores.reduce((sum, s) => sum + s.score, 0) / skillScores.length;
  let level: CertificationLevel = 'apprentice';
  if (avgScore >= LEVEL_THRESHOLDS.master) level = 'master';
  else if (avgScore >= LEVEL_THRESHOLDS.expert) level = 'expert';
  else if (avgScore >= LEVEL_THRESHOLDS.practitioner) level = 'practitioner';

  const certification: AgentCertification = {
    id: `cert-${agentId}-${domain}-${Date.now()}`,
    agentId,
    agentRole: profile.role,
    domain,
    level,
    score: avgScore,
    skills: skillScores,
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    trainingHistory: domainSessions,
    badge: {
      ...LEVEL_BADGES[level],
      name: `${domainProfile.name} ${level.charAt(0).toUpperCase() + level.slice(1)}`,
      description: `Certified ${level} in ${domainProfile.name} development`,
    },
  };

  // Store certification
  const agentCerts = certifications.get(agentId) || [];
  agentCerts.push(certification);
  certifications.set(agentId, agentCerts);

  // Update profile
  profile.certifications.push(certification);
  if (!profile.specializations.includes(domain)) {
    profile.specializations.push(domain);
  }

  return certification;
}

export function getAgentCertifications(agentId: string): AgentCertification[] {
  return certifications.get(agentId) || [];
}

export function getCertifiedAgents(domain: Domain): AgentProfile[] {
  const certified: AgentProfile[] = [];

  agentProfiles.forEach(profile => {
    if (profile.certifications.some(c => c.domain === domain)) {
      certified.push(profile);
    }
  });

  return certified.sort((a, b) => {
    const aCert = a.certifications.find(c => c.domain === domain);
    const bCert = b.certifications.find(c => c.domain === domain);
    return (bCert?.score || 0) - (aCert?.score || 0);
  });
}

export function recommendAgentForBuild(
  domain: Domain,
  role: AgentRole
): AgentProfile | null {
  const certified = getCertifiedAgents(domain);
  return certified.find(p => p.role === role) || null;
}

// ============================================
// ACADEMY DASHBOARD
// ============================================

export interface AcademyStats {
  totalAgents: number;
  totalCertifications: number;
  totalTrainingHours: number;
  certificationsByDomain: Record<Domain, number>;
  topAgents: { agent: AgentProfile; certCount: number }[];
  recentCertifications: AgentCertification[];
}

export function getAcademyStats(): AcademyStats {
  const certsByDomain: Record<Domain, number> = {} as Record<Domain, number>;
  Object.keys(DOMAINS).forEach(d => { certsByDomain[d as Domain] = 0; });

  let totalCerts = 0;
  let totalHours = 0;
  const allCerts: AgentCertification[] = [];

  certifications.forEach(certs => {
    totalCerts += certs.length;
    certs.forEach(c => {
      certsByDomain[c.domain]++;
      allCerts.push(c);
    });
  });

  agentProfiles.forEach(p => {
    totalHours += p.totalTrainingHours;
  });

  const agentsWithCertCount = Array.from(agentProfiles.values()).map(p => ({
    agent: p,
    certCount: p.certifications.length,
  })).sort((a, b) => b.certCount - a.certCount);

  return {
    totalAgents: agentProfiles.size,
    totalCertifications: totalCerts,
    totalTrainingHours: Math.round(totalHours),
    certificationsByDomain: certsByDomain,
    topAgents: agentsWithCertCount.slice(0, 5),
    recentCertifications: allCerts
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
      .slice(0, 10),
  };
}

// ============================================
// EXPORT SUMMARY
// ============================================

export function generateAcademyReport(): string {
  const stats = getAcademyStats();

  return `
# Forge Agent Academy Report

## Overview
- **Total Enrolled Agents**: ${stats.totalAgents}
- **Total Certifications Issued**: ${stats.totalCertifications}
- **Total Training Hours**: ${stats.totalTrainingHours}h

## Certifications by Domain
${Object.entries(stats.certificationsByDomain)
  .filter(([, count]) => count > 0)
  .map(([domain, count]) => `- **${DOMAINS[domain as Domain].name}**: ${count} certified agents`)
  .join('\n')}

## Top Agents
${stats.topAgents.map((a, i) =>
  `${i + 1}. **${a.agent.id}** (${a.agent.role}) - ${a.certCount} certifications`
).join('\n')}

## Available Domains
${Object.values(DOMAINS).map(d =>
  `- **${d.name}**: ${d.description}\n  Required: ${d.certificationRequirements.length} skills`
).join('\n')}

## How It Works
1. **Enroll** - Agent enrolls in a domain curriculum
2. **Train** - Complete modules with progressive challenges
3. **Certify** - Pass all skill requirements to earn certification
4. **Specialize** - Certified agents are preferred for domain-specific builds

Certification Levels:
- 🌱 Apprentice (70%+)
- ⚡ Practitioner (80%+)
- 🏆 Expert (90%+)
- 👑 Master (95%+)
`;
}
