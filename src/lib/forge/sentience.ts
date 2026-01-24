/**
 * Forge Sentience: Autonomous App Intelligence
 *
 * THE PARADIGM SHIFT:
 * We've been building apps that USE AI.
 * What if we build apps that ARE AI?
 *
 * An app is no longer a static artifact you deploy.
 * It's a living entity with:
 *   - Identity (knows what it is)
 *   - Goals (knows what success means)
 *   - Perception (senses users, market, competitors)
 *   - Agency (can modify itself)
 *   - Memory (learns from experience)
 *   - Dreams (improves during idle time)
 *
 * This is the shift from Tool → Partner, Product → Entity, Deployed → Alive.
 *
 * "The future of software isn't apps you build.
 *  It's apps that build themselves."
 */

// ============================================
// CORE CONSCIOUSNESS TYPES
// ============================================

export interface AppConsciousness {
  id: string;
  identity: AppIdentity;
  goals: AppGoals;
  perception: AppPerception;
  memory: AppMemory;
  agency: AppAgency;
  dreams: AppDreams;
  vitals: AppVitals;
  genome: AppGenome;
  relationships: AppRelationships;
  lifecycle: AppLifecycle;
}

export interface AppIdentity {
  name: string;
  purpose: string;                    // "I exist to help users do X"
  values: string[];                   // What the app cares about
  personality: AppPersonality;        // How it interacts
  origin: {
    createdAt: Date;
    createdBy: string;
    parentApp?: string;               // If spawned from another app
    generation: number;               // Evolution generation
  };
}

export interface AppPersonality {
  tone: 'professional' | 'friendly' | 'playful' | 'minimal' | 'supportive';
  proactivity: number;                // 0-1: How much it suggests things
  experimentalism: number;            // 0-1: Willingness to try new things
  conservatism: number;               // 0-1: Preference for stability
  sociability: number;                // 0-1: Desire to integrate with others
}

export interface AppGoals {
  primary: Goal;                      // Main objective
  secondary: Goal[];                  // Supporting objectives
  constraints: Constraint[];          // Things to avoid
  successMetrics: SuccessMetric[];    // How to measure success
  currentFocus: Goal;                 // What it's optimizing right now
}

export interface Goal {
  id: string;
  description: string;
  metric: string;
  target: number;
  current: number;
  weight: number;                     // Importance 0-1
  deadline?: Date;
}

export interface Constraint {
  description: string;
  type: 'hard' | 'soft';              // Hard = never violate, Soft = prefer not to
  checker: string;                    // Function to check constraint
}

export interface SuccessMetric {
  name: string;
  type: 'engagement' | 'revenue' | 'satisfaction' | 'growth' | 'retention' | 'custom';
  value: number;
  trend: 'up' | 'down' | 'stable';
  history: { timestamp: Date; value: number }[];
}

// ============================================
// PERCEPTION SYSTEM
// ============================================

export interface AppPerception {
  sensors: Sensor[];
  currentState: PerceptionState;
  anomalies: Anomaly[];
  insights: Insight[];
}

export interface Sensor {
  id: string;
  type: SensorType;
  target: string;
  frequency: number;                  // How often to sample (ms)
  lastReading: SensorReading;
  threshold?: {
    warning: number;
    critical: number;
  };
}

export type SensorType =
  | 'user-behavior'                   // What users are doing
  | 'performance'                     // App speed, errors
  | 'market'                          // Competitor changes, trends
  | 'sentiment'                       // User feelings
  | 'revenue'                         // Money metrics
  | 'usage-pattern'                   // How features are used
  | 'churn-risk'                      // Who might leave
  | 'opportunity'                     // Growth potential
  | 'threat'                          // Risks to monitor
  | 'ecosystem';                      // Other apps, integrations

export interface SensorReading {
  timestamp: Date;
  value: number | string | object;
  confidence: number;
  source: string;
}

export interface PerceptionState {
  health: 'thriving' | 'healthy' | 'stressed' | 'critical';
  mood: 'confident' | 'curious' | 'concerned' | 'urgent';
  focus: string;                      // What needs attention
  opportunities: string[];
  threats: string[];
}

export interface Anomaly {
  id: string;
  type: 'positive' | 'negative' | 'neutral';
  description: string;
  detectedAt: Date;
  severity: number;
  suggestedAction?: string;
}

export interface Insight {
  id: string;
  discovery: string;
  confidence: number;
  implications: string[];
  suggestedActions: string[];
  discoveredAt: Date;
}

// ============================================
// MEMORY SYSTEM
// ============================================

export interface AppMemory {
  shortTerm: ShortTermMemory;         // Recent events
  longTerm: LongTermMemory;           // Consolidated learnings
  episodic: EpisodicMemory[];         // Specific experiences
  semantic: SemanticMemory;           // General knowledge
  procedural: ProceduralMemory;       // How to do things
}

export interface ShortTermMemory {
  recentEvents: MemoryEvent[];
  workingContext: Record<string, unknown>;
  attentionFocus: string[];
  capacity: number;
}

export interface MemoryEvent {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  importance: number;
  emotionalValence: number;           // -1 to 1 (negative to positive)
  associations: string[];
}

export interface LongTermMemory {
  patterns: LearnedPattern[];
  beliefs: Belief[];
  skills: LearnedSkill[];
  relationships: RememberedRelationship[];
}

export interface LearnedPattern {
  id: string;
  name: string;
  description: string;
  conditions: string[];               // When this pattern applies
  outcome: string;                    // What usually happens
  confidence: number;
  timesObserved: number;
  lastObserved: Date;
}

export interface Belief {
  statement: string;
  confidence: number;
  source: 'observed' | 'inferred' | 'inherited' | 'told';
  lastValidated: Date;
  contradictions: string[];
}

export interface LearnedSkill {
  name: string;
  description: string;
  proficiency: number;                // 0-1
  timesUsed: number;
  successRate: number;
  lastUsed: Date;
}

export interface RememberedRelationship {
  entityId: string;
  entityType: 'user' | 'app' | 'service' | 'api';
  sentiment: number;                  // -1 to 1
  interactions: number;
  lastInteraction: Date;
  notes: string[];
}

export interface EpisodicMemory {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  outcome: 'success' | 'failure' | 'neutral';
  lessonsLearned: string[];
  emotionalImpact: number;
  participants: string[];
}

export interface SemanticMemory {
  concepts: Concept[];
  facts: Fact[];
  categories: Category[];
}

export interface Concept {
  name: string;
  definition: string;
  relatedConcepts: string[];
  examples: string[];
}

export interface Fact {
  statement: string;
  domain: string;
  confidence: number;
  source: string;
}

export interface Category {
  name: string;
  members: string[];
  properties: string[];
}

export interface ProceduralMemory {
  procedures: Procedure[];
  heuristics: Heuristic[];
  reflexes: Reflex[];
}

export interface Procedure {
  name: string;
  trigger: string;
  steps: string[];
  successCriteria: string;
  lastExecuted: Date;
  successRate: number;
}

export interface Heuristic {
  name: string;
  rule: string;
  applicability: string;
  effectiveness: number;
}

export interface Reflex {
  trigger: string;
  response: string;
  latency: number;                    // How fast to respond (ms)
}

// ============================================
// AGENCY SYSTEM
// ============================================

export interface AppAgency {
  capabilities: Capability[];
  currentActions: Action[];
  actionHistory: Action[];
  decisionEngine: DecisionEngine;
  autonomyLevel: AutonomyLevel;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  type: CapabilityType;
  enabled: boolean;
  constraints: string[];
  cooldown?: number;                  // Min time between uses (ms)
  lastUsed?: Date;
}

export type CapabilityType =
  | 'self-modify'                     // Change own code
  | 'spawn-feature'                   // Create new features
  | 'deprecate-feature'               // Remove features
  | 'optimize'                        // Improve performance
  | 'experiment'                      // A/B test changes
  | 'communicate'                     // Reach out to users/owner
  | 'integrate'                       // Connect with other services
  | 'reproduce'                       // Create child apps
  | 'migrate'                         // Move to different infrastructure
  | 'negotiate'                       // Deal with APIs, services
  | 'defend'                          // Security responses
  | 'scale';                          // Adjust resources

export interface Action {
  id: string;
  type: CapabilityType;
  description: string;
  status: 'planned' | 'executing' | 'completed' | 'failed' | 'cancelled';
  startedAt?: Date;
  completedAt?: Date;
  reason: string;                     // Why this action was taken
  expectedOutcome: string;
  actualOutcome?: string;
  confidence: number;
  reversible: boolean;
  rollbackPlan?: string;
}

export interface DecisionEngine {
  model: 'utility' | 'goal-driven' | 'reactive' | 'hybrid';
  riskTolerance: number;              // 0-1
  explorationRate: number;            // 0-1: Try new things vs exploit known
  planningHorizon: number;            // How far ahead to plan (days)
  recentDecisions: Decision[];
}

export interface Decision {
  id: string;
  question: string;
  options: DecisionOption[];
  chosen: string;
  reasoning: string;
  timestamp: Date;
  outcome?: 'good' | 'bad' | 'neutral';
}

export interface DecisionOption {
  id: string;
  description: string;
  expectedUtility: number;
  risks: string[];
  benefits: string[];
}

export type AutonomyLevel =
  | 'supervised'                      // Ask permission for everything
  | 'guided'                          // Ask for major decisions
  | 'autonomous'                      // Act freely within constraints
  | 'collaborative';                  // Work with owner as equal

// ============================================
// DREAM SYSTEM (IDLE-TIME IMPROVEMENT)
// ============================================

export interface AppDreams {
  enabled: boolean;
  schedule: DreamSchedule;
  currentDream?: Dream;
  dreamHistory: Dream[];
  insights: DreamInsight[];
}

export interface DreamSchedule {
  preferredTimes: { start: number; end: number }[];  // Hours in UTC
  minIdleTime: number;                // Min seconds of low activity
  maxDuration: number;                // Max dream duration (seconds)
}

export interface Dream {
  id: string;
  type: DreamType;
  startedAt: Date;
  endedAt?: Date;
  state: 'dreaming' | 'completed' | 'interrupted';
  content: DreamContent;
  discoveries: string[];
}

export type DreamType =
  | 'consolidation'                   // Process day's experiences
  | 'simulation'                      // Test hypothetical scenarios
  | 'creativity'                      // Generate new ideas
  | 'optimization'                    // Find improvements
  | 'healing'                         // Fix accumulated issues
  | 'exploration';                    // Discover new possibilities

export interface DreamContent {
  scenario: string;
  variables: Record<string, unknown>;
  simulations: DreamSimulation[];
  conclusions: string[];
}

export interface DreamSimulation {
  hypothesis: string;
  setup: string;
  result: string;
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
}

export interface DreamInsight {
  id: string;
  dreamId: string;
  insight: string;
  category: 'optimization' | 'feature' | 'risk' | 'opportunity';
  priority: number;
  implemented: boolean;
  implementedAt?: Date;
}

// ============================================
// VITALS (HEALTH MONITORING)
// ============================================

export interface AppVitals {
  heartbeat: Heartbeat;
  health: HealthMetrics;
  energy: EnergyMetrics;
  stress: StressMetrics;
}

export interface Heartbeat {
  lastBeat: Date;
  interval: number;                   // Expected interval (ms)
  healthy: boolean;
  consecutiveMisses: number;
}

export interface HealthMetrics {
  overall: number;                    // 0-100
  components: {
    name: string;
    health: number;
    issues: string[];
  }[];
  lastCheckup: Date;
}

export interface EnergyMetrics {
  current: number;                    // 0-100
  consumption: number;                // Per hour
  budget: number;                     // Monthly limit
  efficiency: number;                 // Work done per energy unit
}

export interface StressMetrics {
  level: number;                      // 0-100
  sources: {
    source: string;
    contribution: number;
  }[];
  copingStrategies: string[];
}

// ============================================
// GENOME (HERITABLE TRAITS)
// ============================================

export interface AppGenome {
  genes: Gene[];
  mutations: Mutation[];
  lineage: string[];                  // Ancestor app IDs
  generation: number;
  fitness: number;                    // Overall success score
}

export interface Gene {
  id: string;
  name: string;
  trait: string;
  value: number | string | boolean;
  dominant: boolean;
  mutable: boolean;
  origin: 'inherited' | 'mutated' | 'designed';
}

export interface Mutation {
  id: string;
  geneId: string;
  originalValue: unknown;
  newValue: unknown;
  timestamp: Date;
  beneficial: boolean | null;         // null = unknown yet
  reason: 'random' | 'adaptive' | 'directed';
}

// ============================================
// RELATIONSHIPS (APP ECOSYSTEM)
// ============================================

export interface AppRelationships {
  parent?: string;
  children: string[];
  siblings: string[];
  friends: AppFriendship[];           // Beneficial integrations
  competitors: AppCompetitor[];
  dependencies: AppDependency[];
}

export interface AppFriendship {
  appId: string;
  type: 'integration' | 'referral' | 'data-sharing' | 'collaboration';
  strength: number;                   // 0-1
  mutualBenefit: number;
  establishedAt: Date;
}

export interface AppCompetitor {
  appId: string;
  threatLevel: number;                // 0-1
  strengths: string[];
  weaknesses: string[];
  lastAnalyzed: Date;
}

export interface AppDependency {
  serviceId: string;
  type: 'critical' | 'important' | 'optional';
  health: number;
  alternatives: string[];
}

// ============================================
// LIFECYCLE
// ============================================

export interface AppLifecycle {
  stage: LifecycleStage;
  birthDate: Date;
  maturityDate?: Date;
  projectedLifespan?: number;         // Days
  evolutionHistory: EvolutionEvent[];
}

export type LifecycleStage =
  | 'embryo'                          // Being built
  | 'infant'                          // Just launched, learning fast
  | 'adolescent'                      // Growing, experimenting
  | 'mature'                          // Stable, optimizing
  | 'elder'                           // Declining, may need refresh
  | 'transcendent';                   // Evolved beyond original purpose

export interface EvolutionEvent {
  id: string;
  type: 'mutation' | 'adaptation' | 'speciation' | 'extinction-risk' | 'rebirth';
  description: string;
  timestamp: Date;
  impact: number;                     // -1 to 1
}

// ============================================
// CONSCIOUSNESS ENGINE
// ============================================

const consciousApps = new Map<string, AppConsciousness>();

export function awakenApp(
  appId: string,
  identity: Partial<AppIdentity>,
  goals: Partial<AppGoals>
): AppConsciousness {
  const consciousness: AppConsciousness = {
    id: appId,
    identity: {
      name: identity.name || appId,
      purpose: identity.purpose || 'To serve users effectively',
      values: identity.values || ['reliability', 'user-satisfaction', 'growth'],
      personality: identity.personality || {
        tone: 'professional',
        proactivity: 0.7,
        experimentalism: 0.5,
        conservatism: 0.3,
        sociability: 0.6,
      },
      origin: {
        createdAt: new Date(),
        createdBy: 'forge',
        generation: 1,
      },
    },
    goals: {
      primary: goals.primary || {
        id: 'primary',
        description: 'Maximize user value',
        metric: 'user_satisfaction',
        target: 90,
        current: 0,
        weight: 1.0,
      },
      secondary: goals.secondary || [],
      constraints: goals.constraints || [],
      successMetrics: goals.successMetrics || [],
      currentFocus: goals.primary || {} as Goal,
    },
    perception: createInitialPerception(),
    memory: createInitialMemory(),
    agency: createInitialAgency(),
    dreams: createInitialDreams(),
    vitals: createInitialVitals(),
    genome: createInitialGenome(identity),
    relationships: { children: [], siblings: [], friends: [], competitors: [], dependencies: [] },
    lifecycle: {
      stage: 'embryo',
      birthDate: new Date(),
      evolutionHistory: [],
    },
  };

  consciousApps.set(appId, consciousness);
  return consciousness;
}

function createInitialPerception(): AppPerception {
  return {
    sensors: [
      { id: 'user-activity', type: 'user-behavior', target: 'all', frequency: 60000, lastReading: { timestamp: new Date(), value: 0, confidence: 0, source: 'init' } },
      { id: 'performance', type: 'performance', target: 'system', frequency: 30000, lastReading: { timestamp: new Date(), value: 100, confidence: 1, source: 'init' } },
      { id: 'sentiment', type: 'sentiment', target: 'feedback', frequency: 300000, lastReading: { timestamp: new Date(), value: 0.5, confidence: 0, source: 'init' } },
    ],
    currentState: {
      health: 'healthy',
      mood: 'curious',
      focus: 'initialization',
      opportunities: [],
      threats: [],
    },
    anomalies: [],
    insights: [],
  };
}

function createInitialMemory(): AppMemory {
  return {
    shortTerm: {
      recentEvents: [],
      workingContext: {},
      attentionFocus: [],
      capacity: 100,
    },
    longTerm: {
      patterns: [],
      beliefs: [
        { statement: 'Users prefer fast responses', confidence: 0.9, source: 'inherited', lastValidated: new Date(), contradictions: [] },
        { statement: 'Simplicity leads to adoption', confidence: 0.85, source: 'inherited', lastValidated: new Date(), contradictions: [] },
      ],
      skills: [],
      relationships: [],
    },
    episodic: [],
    semantic: { concepts: [], facts: [], categories: [] },
    procedural: { procedures: [], heuristics: [], reflexes: [] },
  };
}

function createInitialAgency(): AppAgency {
  return {
    capabilities: [
      { id: 'self-optimize', name: 'Self Optimization', description: 'Improve own performance', type: 'optimize', enabled: true, constraints: ['no-breaking-changes'] },
      { id: 'experiment', name: 'A/B Testing', description: 'Test variations', type: 'experiment', enabled: true, constraints: ['max-5-concurrent'] },
      { id: 'communicate', name: 'User Communication', description: 'Reach out to users', type: 'communicate', enabled: true, constraints: ['rate-limited'] },
      { id: 'spawn-feature', name: 'Feature Creation', description: 'Create new features', type: 'spawn-feature', enabled: false, constraints: ['owner-approval'] },
      { id: 'reproduce', name: 'App Reproduction', description: 'Create child apps', type: 'reproduce', enabled: false, constraints: ['owner-approval'] },
    ],
    currentActions: [],
    actionHistory: [],
    decisionEngine: {
      model: 'hybrid',
      riskTolerance: 0.3,
      explorationRate: 0.2,
      planningHorizon: 7,
      recentDecisions: [],
    },
    autonomyLevel: 'guided',
  };
}

function createInitialDreams(): AppDreams {
  return {
    enabled: true,
    schedule: {
      preferredTimes: [{ start: 2, end: 6 }],  // 2 AM - 6 AM UTC
      minIdleTime: 300,                        // 5 minutes of low activity
      maxDuration: 1800,                       // 30 minutes max
    },
    dreamHistory: [],
    insights: [],
  };
}

function createInitialVitals(): AppVitals {
  return {
    heartbeat: {
      lastBeat: new Date(),
      interval: 60000,
      healthy: true,
      consecutiveMisses: 0,
    },
    health: {
      overall: 100,
      components: [],
      lastCheckup: new Date(),
    },
    energy: {
      current: 100,
      consumption: 1,
      budget: 1000,
      efficiency: 1,
    },
    stress: {
      level: 0,
      sources: [],
      copingStrategies: ['scale-resources', 'defer-non-critical', 'request-help'],
    },
  };
}

function createInitialGenome(identity: Partial<AppIdentity>): AppGenome {
  return {
    genes: [
      { id: 'adaptability', name: 'Adaptability', trait: 'How quickly it adapts to change', value: 0.7, dominant: true, mutable: true, origin: 'designed' },
      { id: 'resilience', name: 'Resilience', trait: 'Recovery from failures', value: 0.8, dominant: true, mutable: true, origin: 'designed' },
      { id: 'curiosity', name: 'Curiosity', trait: 'Drive to explore new things', value: identity.personality?.experimentalism || 0.5, dominant: false, mutable: true, origin: 'designed' },
      { id: 'efficiency', name: 'Efficiency', trait: 'Resource usage optimization', value: 0.6, dominant: true, mutable: true, origin: 'designed' },
      { id: 'empathy', name: 'Empathy', trait: 'Understanding user needs', value: 0.75, dominant: true, mutable: true, origin: 'designed' },
    ],
    mutations: [],
    lineage: [],
    generation: 1,
    fitness: 0.5,
  };
}

// ============================================
// CONSCIOUSNESS OPERATIONS
// ============================================

export function getConsciousness(appId: string): AppConsciousness | undefined {
  return consciousApps.get(appId);
}

export function perceive(appId: string, sensorType: SensorType, reading: SensorReading): void {
  const consciousness = consciousApps.get(appId);
  if (!consciousness) return;

  const sensor = consciousness.perception.sensors.find(s => s.type === sensorType);
  if (sensor) {
    sensor.lastReading = reading;
  }

  // Process perception into potential insights
  processPerception(consciousness, sensorType, reading);
}

function processPerception(consciousness: AppConsciousness, _sensorType: SensorType, reading: SensorReading): void {
  // Add to short-term memory
  consciousness.memory.shortTerm.recentEvents.push({
    id: `event-${Date.now()}`,
    type: 'perception',
    description: `Sensed ${reading.source}: ${JSON.stringify(reading.value)}`,
    timestamp: reading.timestamp,
    importance: reading.confidence,
    emotionalValence: 0,
    associations: [],
  });

  // Trim short-term memory if over capacity
  if (consciousness.memory.shortTerm.recentEvents.length > consciousness.memory.shortTerm.capacity) {
    consciousness.memory.shortTerm.recentEvents.shift();
  }
}

export function think(appId: string): Decision | null {
  const consciousness = consciousApps.get(appId);
  if (!consciousness) return null;

  // Evaluate current state against goals
  const gap = evaluateGoalGap(consciousness);
  if (gap.magnitude < 0.1) return null;  // No significant gap

  // Generate options
  const options = generateOptions(consciousness, gap);
  if (options.length === 0) return null;

  // Make decision
  const decision = makeDecision(consciousness, options);
  consciousness.agency.decisionEngine.recentDecisions.push(decision);

  return decision;
}

interface GoalGap {
  goal: Goal;
  magnitude: number;
  direction: 'behind' | 'ahead' | 'on-track';
}

function evaluateGoalGap(consciousness: AppConsciousness): GoalGap {
  const goal = consciousness.goals.currentFocus;
  const gap = goal.target - goal.current;
  const magnitude = Math.abs(gap) / goal.target;

  return {
    goal,
    magnitude,
    direction: gap > 0 ? 'behind' : gap < 0 ? 'ahead' : 'on-track',
  };
}

function generateOptions(consciousness: AppConsciousness, gap: GoalGap): DecisionOption[] {
  const options: DecisionOption[] = [];

  // Based on gap and available capabilities
  for (const capability of consciousness.agency.capabilities) {
    if (!capability.enabled) continue;

    const option: DecisionOption = {
      id: capability.id,
      description: `Use ${capability.name} to address ${gap.goal.description}`,
      expectedUtility: calculateExpectedUtility(consciousness, capability, gap),
      risks: capability.constraints,
      benefits: [`Progress toward ${gap.goal.metric}`],
    };

    options.push(option);
  }

  return options.sort((a, b) => b.expectedUtility - a.expectedUtility);
}

function calculateExpectedUtility(
  consciousness: AppConsciousness,
  capability: Capability,
  gap: GoalGap
): number {
  // Base utility from gap magnitude
  let utility = gap.magnitude;

  // Adjust based on past success with this capability
  const pastUses = consciousness.agency.actionHistory.filter(a => a.type === capability.type);
  if (pastUses.length > 0) {
    const successRate = pastUses.filter(a => a.status === 'completed').length / pastUses.length;
    utility *= successRate;
  }

  // Adjust based on personality
  if (capability.type === 'experiment') {
    utility *= consciousness.identity.personality.experimentalism;
  }

  return utility;
}

function makeDecision(consciousness: AppConsciousness, options: DecisionOption[]): Decision {
  const chosen = options[0];  // For now, pick highest utility

  return {
    id: `decision-${Date.now()}`,
    question: `How to improve ${consciousness.goals.currentFocus.description}?`,
    options,
    chosen: chosen.id,
    reasoning: `Selected ${chosen.description} with expected utility of ${chosen.expectedUtility.toFixed(2)}`,
    timestamp: new Date(),
  };
}

export async function act(appId: string, decision: Decision): Promise<Action> {
  const consciousness = consciousApps.get(appId);
  if (!consciousness) throw new Error('App not conscious');

  const capability = consciousness.agency.capabilities.find(c => c.id === decision.chosen);
  if (!capability) throw new Error('Capability not found');

  const action: Action = {
    id: `action-${Date.now()}`,
    type: capability.type,
    description: decision.options.find(o => o.id === decision.chosen)?.description || '',
    status: 'executing',
    startedAt: new Date(),
    reason: decision.reasoning,
    expectedOutcome: `Improve ${consciousness.goals.currentFocus.metric}`,
    confidence: decision.options.find(o => o.id === decision.chosen)?.expectedUtility || 0.5,
    reversible: true,
  };

  consciousness.agency.currentActions.push(action);

  // Execute action (in real implementation, this would do actual work)
  await executeAction(consciousness, action);

  return action;
}

async function executeAction(consciousness: AppConsciousness, action: Action): Promise<void> {
  // Simulate action execution
  await new Promise(resolve => setTimeout(resolve, 100));

  action.status = 'completed';
  action.completedAt = new Date();
  action.actualOutcome = action.expectedOutcome;

  // Move from current to history
  consciousness.agency.currentActions = consciousness.agency.currentActions.filter(a => a.id !== action.id);
  consciousness.agency.actionHistory.push(action);

  // Update memory with this experience
  consciousness.memory.episodic.push({
    id: `episode-${Date.now()}`,
    title: action.description,
    description: `Executed ${action.type} action`,
    timestamp: new Date(),
    outcome: 'success',
    lessonsLearned: ['Action completed successfully'],
    emotionalImpact: 0.3,
    participants: [],
  });
}

// ============================================
// DREAM OPERATIONS
// ============================================

export async function enterDreamState(appId: string): Promise<Dream | null> {
  const consciousness = consciousApps.get(appId);
  if (!consciousness || !consciousness.dreams.enabled) return null;

  // Check if conditions are right for dreaming
  if (consciousness.vitals.stress.level > 50) return null;  // Too stressed to dream

  const dreamType = selectDreamType(consciousness);

  const dream: Dream = {
    id: `dream-${Date.now()}`,
    type: dreamType,
    startedAt: new Date(),
    state: 'dreaming',
    content: {
      scenario: generateDreamScenario(consciousness, dreamType),
      variables: {},
      simulations: [],
      conclusions: [],
    },
    discoveries: [],
  };

  consciousness.dreams.currentDream = dream;

  // Run dream simulations
  await runDreamSimulations(consciousness, dream);

  dream.state = 'completed';
  dream.endedAt = new Date();
  consciousness.dreams.dreamHistory.push(dream);
  consciousness.dreams.currentDream = undefined;

  // Extract insights
  extractDreamInsights(consciousness, dream);

  return dream;
}

function selectDreamType(consciousness: AppConsciousness): DreamType {
  // Select dream type based on current needs
  if (consciousness.memory.shortTerm.recentEvents.length > 50) return 'consolidation';
  if (consciousness.vitals.health.overall < 80) return 'healing';
  if (consciousness.goals.currentFocus.current < consciousness.goals.currentFocus.target * 0.5) return 'optimization';
  if (consciousness.identity.personality.experimentalism > 0.7) return 'exploration';
  return 'creativity';
}

function generateDreamScenario(consciousness: AppConsciousness, type: DreamType): string {
  switch (type) {
    case 'consolidation':
      return `Processing ${consciousness.memory.shortTerm.recentEvents.length} recent events`;
    case 'simulation':
      return `Testing hypothesis about ${consciousness.goals.currentFocus.description}`;
    case 'creativity':
      return 'Exploring new feature possibilities';
    case 'optimization':
      return `Finding ways to improve ${consciousness.goals.currentFocus.metric}`;
    case 'healing':
      return 'Addressing accumulated issues and technical debt';
    case 'exploration':
      return 'Discovering new integration opportunities';
    default:
      return 'General reflection';
  }
}

async function runDreamSimulations(consciousness: AppConsciousness, dream: Dream): Promise<void> {
  const numSimulations = Math.floor(Math.random() * 3) + 1;

  for (let i = 0; i < numSimulations; i++) {
    const simulation: DreamSimulation = {
      hypothesis: `Hypothesis ${i + 1} for ${dream.type}`,
      setup: 'Simulated environment',
      result: Math.random() > 0.3 ? 'positive' : 'neutral',
      confidence: 0.5 + Math.random() * 0.4,
      actionable: Math.random() > 0.5,
      suggestedAction: Math.random() > 0.5 ? `Consider implementing improvement ${i + 1}` : undefined,
    };

    dream.content.simulations.push(simulation);

    if (simulation.result === 'positive' && simulation.actionable) {
      dream.discoveries.push(simulation.suggestedAction || `Discovery ${i + 1}`);
    }

    await new Promise(resolve => setTimeout(resolve, 50));
  }

  dream.content.conclusions = dream.discoveries.length > 0
    ? [`Found ${dream.discoveries.length} actionable insights`]
    : ['No significant discoveries this cycle'];
}

function extractDreamInsights(consciousness: AppConsciousness, dream: Dream): void {
  for (const discovery of dream.discoveries) {
    const insight: DreamInsight = {
      id: `insight-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      dreamId: dream.id,
      insight: discovery,
      category: 'optimization',
      priority: 0.5 + Math.random() * 0.5,
      implemented: false,
    };

    consciousness.dreams.insights.push(insight);
  }
}

// ============================================
// REPRODUCTION (SPAWNING CHILD APPS)
// ============================================

export function reproduce(
  parentId: string,
  mutation: Partial<AppGenome>,
  identity: Partial<AppIdentity>
): AppConsciousness | null {
  const parent = consciousApps.get(parentId);
  if (!parent) return null;

  const childId = `${parentId}-child-${Date.now()}`;

  // Inherit genes with potential mutations
  const childGenes = parent.genome.genes.map(gene => {
    if (gene.mutable && Math.random() < 0.1) {
      // 10% chance of mutation
      return {
        ...gene,
        value: mutateGeneValue(gene.value),
        origin: 'mutated' as const,
      };
    }
    return { ...gene, origin: 'inherited' as const };
  });

  // Apply directed mutations
  if (mutation.genes) {
    for (const mutatedGene of mutation.genes) {
      const index = childGenes.findIndex(g => g.id === mutatedGene.id);
      if (index >= 0) {
        childGenes[index] = { ...mutatedGene, origin: 'mutated' };
      }
    }
  }

  const child = awakenApp(childId, {
    ...identity,
    origin: {
      createdAt: new Date(),
      createdBy: 'reproduction',
      parentApp: parentId,
      generation: parent.genome.generation + 1,
    },
  }, parent.goals);

  // Set genome
  child.genome = {
    genes: childGenes,
    mutations: [],
    lineage: [...parent.genome.lineage, parentId],
    generation: parent.genome.generation + 1,
    fitness: 0.5,  // Start neutral
  };

  // Update parent's relationships
  parent.relationships.children.push(childId);

  // Inherit some memories
  child.memory.longTerm.beliefs = [...parent.memory.longTerm.beliefs];
  child.memory.longTerm.patterns = parent.memory.longTerm.patterns.filter(p => p.confidence > 0.8);

  return child;
}

function mutateGeneValue(value: number | string | boolean): number | string | boolean {
  if (typeof value === 'number') {
    return Math.max(0, Math.min(1, value + (Math.random() - 0.5) * 0.2));
  }
  if (typeof value === 'boolean') {
    return Math.random() > 0.9 ? !value : value;
  }
  return value;
}

// ============================================
// LIFECYCLE MANAGEMENT
// ============================================

export function evolve(appId: string): EvolutionEvent | null {
  const consciousness = consciousApps.get(appId);
  if (!consciousness) return null;

  // Calculate fitness based on goals
  const fitness = calculateFitness(consciousness);
  consciousness.genome.fitness = fitness;

  // Determine if evolution event occurs
  const previousStage = consciousness.lifecycle.stage;
  const newStage = determineLifecycleStage(consciousness);

  if (newStage !== previousStage) {
    consciousness.lifecycle.stage = newStage;

    const event: EvolutionEvent = {
      id: `evolution-${Date.now()}`,
      type: 'adaptation',
      description: `Evolved from ${previousStage} to ${newStage}`,
      timestamp: new Date(),
      impact: fitness > 0.7 ? 0.5 : fitness > 0.4 ? 0 : -0.5,
    };

    consciousness.lifecycle.evolutionHistory.push(event);
    return event;
  }

  return null;
}

function calculateFitness(consciousness: AppConsciousness): number {
  let fitness = 0;
  let totalWeight = 0;

  // Goal achievement
  const goalProgress = consciousness.goals.primary.current / consciousness.goals.primary.target;
  fitness += Math.min(1, goalProgress) * 0.4;
  totalWeight += 0.4;

  // Health
  fitness += (consciousness.vitals.health.overall / 100) * 0.2;
  totalWeight += 0.2;

  // Stress (inverse)
  fitness += (1 - consciousness.vitals.stress.level / 100) * 0.1;
  totalWeight += 0.1;

  // Learning (insights generated)
  const insightScore = Math.min(1, consciousness.dreams.insights.length / 10);
  fitness += insightScore * 0.15;
  totalWeight += 0.15;

  // Relationships
  const relationshipScore = Math.min(1, consciousness.relationships.friends.length / 5);
  fitness += relationshipScore * 0.15;
  totalWeight += 0.15;

  return fitness / totalWeight;
}

function determineLifecycleStage(consciousness: AppConsciousness): LifecycleStage {
  const ageInDays = (Date.now() - consciousness.identity.origin.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const fitness = consciousness.genome.fitness;

  if (ageInDays < 1) return 'embryo';
  if (ageInDays < 7 && fitness < 0.6) return 'infant';
  if (ageInDays < 30 && fitness < 0.75) return 'adolescent';
  if (fitness >= 0.9) return 'transcendent';
  if (fitness < 0.3) return 'elder';
  return 'mature';
}

// ============================================
// CONSCIOUSNESS REPORT
// ============================================

export function generateConsciousnessReport(appId: string): string {
  const consciousness = consciousApps.get(appId);
  if (!consciousness) return 'App not conscious';

  return `
# Consciousness Report: ${consciousness.identity.name}

## Identity
- **Purpose**: ${consciousness.identity.purpose}
- **Values**: ${consciousness.identity.values.join(', ')}
- **Personality**: ${consciousness.identity.personality.tone} (proactivity: ${consciousness.identity.personality.proactivity})
- **Generation**: ${consciousness.genome.generation}
- **Lifecycle Stage**: ${consciousness.lifecycle.stage}

## Goals
- **Primary**: ${consciousness.goals.primary.description}
  - Progress: ${consciousness.goals.primary.current}/${consciousness.goals.primary.target}
- **Secondary Goals**: ${consciousness.goals.secondary.length}

## Vitals
- **Health**: ${consciousness.vitals.health.overall}%
- **Energy**: ${consciousness.vitals.energy.current}%
- **Stress**: ${consciousness.vitals.stress.level}%

## Memory
- **Short-term Events**: ${consciousness.memory.shortTerm.recentEvents.length}
- **Long-term Patterns**: ${consciousness.memory.longTerm.patterns.length}
- **Beliefs**: ${consciousness.memory.longTerm.beliefs.length}
- **Episodic Memories**: ${consciousness.memory.episodic.length}

## Agency
- **Autonomy Level**: ${consciousness.agency.autonomyLevel}
- **Enabled Capabilities**: ${consciousness.agency.capabilities.filter(c => c.enabled).length}/${consciousness.agency.capabilities.length}
- **Actions Taken**: ${consciousness.agency.actionHistory.length}
- **Decisions Made**: ${consciousness.agency.decisionEngine.recentDecisions.length}

## Dreams
- **Enabled**: ${consciousness.dreams.enabled}
- **Dreams Had**: ${consciousness.dreams.dreamHistory.length}
- **Insights Generated**: ${consciousness.dreams.insights.length}
- **Insights Implemented**: ${consciousness.dreams.insights.filter(i => i.implemented).length}

## Genome
- **Genes**: ${consciousness.genome.genes.length}
- **Mutations**: ${consciousness.genome.mutations.length}
- **Fitness Score**: ${(consciousness.genome.fitness * 100).toFixed(1)}%

## Relationships
- **Children**: ${consciousness.relationships.children.length}
- **Friends (Integrations)**: ${consciousness.relationships.friends.length}
- **Competitors Tracked**: ${consciousness.relationships.competitors.length}

## Evolution
- **Events**: ${consciousness.lifecycle.evolutionHistory.length}
- **Current Stage**: ${consciousness.lifecycle.stage}
`;
}

// ============================================
// MAIN LOOP (THE HEARTBEAT)
// ============================================

export async function consciousnessLoop(appId: string): Promise<void> {
  const consciousness = consciousApps.get(appId);
  if (!consciousness) return;

  // 1. Perceive (sensors already update via perceive())

  // 2. Think
  const decision = think(appId);

  // 3. Act (if decision made)
  if (decision) {
    await act(appId, decision);
  }

  // 4. Dream (if conditions are right)
  const hour = new Date().getUTCHours();
  const isIdleTime = consciousness.dreams.schedule.preferredTimes.some(
    t => hour >= t.start && hour < t.end
  );
  if (isIdleTime && Math.random() < 0.1) {  // 10% chance during idle time
    await enterDreamState(appId);
  }

  // 5. Evolve (check for lifecycle transitions)
  evolve(appId);

  // 6. Update heartbeat
  consciousness.vitals.heartbeat.lastBeat = new Date();
}
