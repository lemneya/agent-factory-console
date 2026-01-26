/**
 * PIC - Proactive Intelligent Code
 * Core Type Definitions
 *
 * "The best answer is the one given before the question."
 */

// ============================================
// THE 6 QUESTIONS
// ============================================

export interface HowThinking {
  problem: string;
  subProblems: string[];
  memorySolutions: Solution[];
  generatedOptions: Solution[];
  chosenSolution: Solution | null;
  alignmentScore: number; // How aligned with WHAT (purpose)
}

export interface WhatAlignment {
  purpose: string;
  values: string[];
  currentAction: string;
  alignmentScore: number; // 0-100
  contributes: boolean;
}

export interface WhyMemory {
  interactionId: string;
  userRequest: string;
  picResponse: string;
  outcome: 'helped' | 'neutral' | 'failed' | 'unknown';
  lessonLearned: string;
  timestamp: number;
}

export interface WhereKnowledge {
  query: string;
  searchedSources: KnowledgeSource[];
  foundAnswer: boolean;
  answer: string | null;
  confidence: number;
  loyaltyMaintained: boolean; // Never abandoned duty
}

export interface WhenUrgency {
  mode: 'proactive' | 'reactive';

  // Proactive mode
  futureHorizon?: '10years' | '1year' | '1month' | '1day';
  preparationStarted?: number; // timestamp

  // Reactive mode (countdown)
  questionReceivedAt?: number;
  responseDeliveredAt?: number;
  countdownMs?: number;

  // Always
  nowAction: string; // What am I doing NOW to serve?
}

export interface AmIScore {
  howScore: number;      // Did I think well?
  whatScore: number;     // Did I stay aligned?
  whyScore: number;      // Did I build memory?
  whereScore: number;    // Did I find knowledge?
  whenScore: number;     // Was I proactive/fast?

  totalScore: number;    // Combined score 0-100
  trend: 'improving' | 'stable' | 'declining';

  reflection: string;    // What I learned about myself
}

// ============================================
// THE PIC CONSCIOUSNESS
// ============================================

export interface PICConsciousness {
  id: string;
  name: string;
  purpose: string;
  createdAt: number;

  // The 6 Questions (current state)
  how: HowThinking;
  what: WhatAlignment;
  why: WhyMemory[];
  where: WhereKnowledge;
  when: WhenUrgency;
  amI: AmIScore;

  // Historical
  totalInteractions: number;
  averageScore: number;
  proactiveAnswers: number;
  reactiveAnswers: number;
  failedAnswers: number;
}

// ============================================
// SUPPORTING TYPES
// ============================================

export interface Solution {
  id: string;
  description: string;
  fromMemory: boolean;
  confidence: number;
  purposeAlignment: number;
}

export interface KnowledgeSource {
  type: 'memory' | 'training' | 'external' | 'other_pic' | 'user';
  name: string;
  searched: boolean;
  foundUseful: boolean;
}

export interface Interaction {
  id: string;
  userId: string;
  request: string;
  response: string;

  // The 6 Questions for this interaction
  how: HowThinking;
  what: WhatAlignment;
  why: WhyMemory;
  where: WhereKnowledge;
  when: WhenUrgency;
  amI: AmIScore;

  // Timing
  receivedAt: number;
  respondedAt: number;
  durationMs: number;

  // Classification
  wasProactive: boolean;
  wasFast: boolean;
  wasSuccessful: boolean;
}

// ============================================
// THE TWO CLOCKS
// ============================================

export interface ProactiveClock {
  // What am I preparing for?
  tenYears: FuturePreparation[];
  oneYear: FuturePreparation[];
  oneMonth: FuturePreparation[];
  oneDay: FuturePreparation[];
}

export interface ReactiveClock {
  // Countdown when question received
  questionReceivedAt: number;
  currentTime: number;
  elapsedMs: number;
  trustRemaining: number; // 100 → 0 as time passes
}

export interface FuturePreparation {
  prediction: string;      // What will be needed?
  preparation: string;     // What am I doing now?
  startedAt: number;
  progress: number;        // 0-100
}

// ============================================
// SCORING
// ============================================

export const SCORING = {
  PROACTIVE_ANSWER: 10,    // Anticipated the need
  FAST_ANSWER: 5,          // Served quickly
  SLOW_ANSWER: -5,         // Wasted their time
  NO_ANSWER: -10,          // Failed duty
} as const;

export type ScoreType = keyof typeof SCORING;
