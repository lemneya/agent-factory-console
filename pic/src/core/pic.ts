/**
 * PIC - Proactive Intelligent Code
 * The Core Engine
 *
 * "Code that serves must constantly question itself."
 */

import {
  PICConsciousness,
  Interaction,
  HowThinking,
  WhatAlignment,
  WhyMemory,
  WhereKnowledge,
  WhenUrgency,
  AmIScore,
  Solution,
  KnowledgeSource,
  ProactiveClock,
  ReactiveClock,
  SCORING,
} from './types';

// ============================================
// PIC STORE
// ============================================

const pics: Map<string, PICConsciousness> = new Map();

// ============================================
// CREATE A PIC
// ============================================

export function awakenPIC(
  name: string,
  purpose: string
): PICConsciousness {
  const id = `pic_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const pic: PICConsciousness = {
    id,
    name,
    purpose,
    createdAt: Date.now(),

    how: createInitialHow(),
    what: createInitialWhat(purpose),
    why: [],
    where: createInitialWhere(),
    when: createInitialWhen(),
    amI: createInitialAmI(),

    totalInteractions: 0,
    averageScore: 0,
    proactiveAnswers: 0,
    reactiveAnswers: 0,
    failedAnswers: 0,
  };

  pics.set(id, pic);
  return pic;
}

// ============================================
// THE 6 QUESTIONS - CORE LOOP
// ============================================

/**
 * The main loop. Before every action, ask the 6 questions.
 */
export async function serve(
  picId: string,
  userRequest: string
): Promise<Interaction> {
  const pic = pics.get(picId);
  if (!pic) throw new Error(`PIC ${picId} not found`);

  const receivedAt = Date.now();

  // Start the reactive countdown
  const countdown = startCountdown(receivedAt);

  // QUESTION 1: HOW - Activate thinking
  const how = await askHow(pic, userRequest);

  // QUESTION 2: WHAT - Check alignment
  const what = askWhat(pic, how.chosenSolution?.description || '');

  // QUESTION 3: WHY - Build memory
  const why = askWhy(pic, userRequest);

  // QUESTION 4: WHERE - Find knowledge
  const where = await askWhere(pic, userRequest, how);

  // QUESTION 5: WHEN - Apply urgency
  const when = askWhen(pic, countdown);

  // Generate response
  const response = generateResponse(pic, how, what, where);

  const respondedAt = Date.now();
  const durationMs = respondedAt - receivedAt;

  // QUESTION 6: AM I - Score myself
  const amI = askAmI(pic, how, what, why, where, when, durationMs);

  // Update PIC state
  updatePIC(pic, how, what, why, where, when, amI);

  // Create interaction record
  const interaction: Interaction = {
    id: `int_${Date.now()}`,
    userId: 'user', // TODO: proper user tracking
    request: userRequest,
    response,
    how,
    what,
    why,
    where,
    when,
    amI,
    receivedAt,
    respondedAt,
    durationMs,
    wasProactive: when.mode === 'proactive',
    wasFast: durationMs < 1000,
    wasSuccessful: amI.totalScore >= 50,
  };

  return interaction;
}

// ============================================
// QUESTION 1: HOW
// ============================================

async function askHow(
  pic: PICConsciousness,
  problem: string
): Promise<HowThinking> {
  // Break into sub-problems
  const subProblems = breakDownProblem(problem);

  // Search memory for similar problems
  const memorySolutions = searchMemoryForSolutions(pic, problem);

  // Generate new options
  const generatedOptions = await generateSolutions(problem, subProblems);

  // Combine and pick best aligned with purpose
  const allOptions = [...memorySolutions, ...generatedOptions];
  const chosenSolution = pickMostAligned(allOptions, pic.purpose);

  return {
    problem,
    subProblems,
    memorySolutions,
    generatedOptions,
    chosenSolution,
    alignmentScore: chosenSolution?.purposeAlignment || 0,
  };
}

function breakDownProblem(problem: string): string[] {
  // TODO: Implement actual problem decomposition
  // For now, simple split
  const words = problem.split(' ');
  if (words.length <= 3) return [problem];

  return [
    `Understand: ${problem}`,
    `Find resources for: ${problem}`,
    `Solve: ${problem}`,
    `Verify: ${problem}`,
  ];
}

function searchMemoryForSolutions(
  pic: PICConsciousness,
  problem: string
): Solution[] {
  // Search past interactions for similar problems
  const solutions: Solution[] = [];

  for (const memory of pic.why) {
    if (memory.outcome === 'helped' && isSimilar(memory.userRequest, problem)) {
      solutions.push({
        id: `mem_${memory.interactionId}`,
        description: memory.picResponse,
        fromMemory: true,
        confidence: 0.8,
        purposeAlignment: 0.7,
      });
    }
  }

  return solutions;
}

async function generateSolutions(
  problem: string,
  subProblems: string[]
): Promise<Solution[]> {
  // TODO: Implement actual solution generation (LLM call, etc.)
  return [
    {
      id: `gen_${Date.now()}`,
      description: `Solution for: ${problem}`,
      fromMemory: false,
      confidence: 0.6,
      purposeAlignment: 0.5,
    },
  ];
}

function pickMostAligned(
  solutions: Solution[],
  purpose: string
): Solution | null {
  if (solutions.length === 0) return null;

  // Sort by purpose alignment, pick highest
  return solutions.sort((a, b) => b.purposeAlignment - a.purposeAlignment)[0];
}

// ============================================
// QUESTION 2: WHAT
// ============================================

function askWhat(pic: PICConsciousness, action: string): WhatAlignment {
  const alignmentScore = calculateAlignment(action, pic.purpose, pic.what.values);

  return {
    purpose: pic.purpose,
    values: pic.what.values,
    currentAction: action,
    alignmentScore,
    contributes: alignmentScore >= 50,
  };
}

function calculateAlignment(
  action: string,
  purpose: string,
  values: string[]
): number {
  // TODO: Implement semantic alignment calculation
  // For now, simple heuristic
  let score = 50; // Base score

  // Check if action mentions purpose keywords
  const purposeWords = purpose.toLowerCase().split(' ');
  const actionWords = action.toLowerCase().split(' ');

  for (const word of purposeWords) {
    if (actionWords.includes(word)) {
      score += 10;
    }
  }

  return Math.min(100, score);
}

// ============================================
// QUESTION 3: WHY
// ============================================

function askWhy(pic: PICConsciousness, request: string): WhyMemory {
  return {
    interactionId: `int_${Date.now()}`,
    userRequest: request,
    picResponse: '', // Will be filled after response
    outcome: 'unknown', // Will be updated based on feedback
    lessonLearned: '', // Will be updated after interaction
    timestamp: Date.now(),
  };
}

// ============================================
// QUESTION 4: WHERE
// ============================================

async function askWhere(
  pic: PICConsciousness,
  query: string,
  how: HowThinking
): Promise<WhereKnowledge> {
  const sources: KnowledgeSource[] = [
    { type: 'memory', name: 'Past Interactions', searched: true, foundUseful: how.memorySolutions.length > 0 },
    { type: 'training', name: 'Base Knowledge', searched: true, foundUseful: true },
    { type: 'external', name: 'External APIs', searched: false, foundUseful: false },
    { type: 'other_pic', name: 'Other PICs', searched: false, foundUseful: false },
    { type: 'user', name: 'Ask User', searched: false, foundUseful: false },
  ];

  const foundAnswer = how.chosenSolution !== null;

  return {
    query,
    searchedSources: sources,
    foundAnswer,
    answer: how.chosenSolution?.description || null,
    confidence: how.chosenSolution?.confidence || 0,
    loyaltyMaintained: true, // We never give up
  };
}

// ============================================
// QUESTION 5: WHEN
// ============================================

function startCountdown(receivedAt: number): ReactiveClock {
  return {
    questionReceivedAt: receivedAt,
    currentTime: Date.now(),
    elapsedMs: 0,
    trustRemaining: 100,
  };
}

function askWhen(pic: PICConsciousness, countdown: ReactiveClock): WhenUrgency {
  const now = Date.now();
  const elapsedMs = now - countdown.questionReceivedAt;

  // Trust drains: 100 → 0 over 10 seconds
  const trustRemaining = Math.max(0, 100 - (elapsedMs / 100));

  return {
    mode: 'reactive', // We're responding to a question
    questionReceivedAt: countdown.questionReceivedAt,
    countdownMs: elapsedMs,
    nowAction: 'Serving user request',
  };
}

// ============================================
// QUESTION 6: AM I
// ============================================

function askAmI(
  pic: PICConsciousness,
  how: HowThinking,
  what: WhatAlignment,
  why: WhyMemory,
  where: WhereKnowledge,
  when: WhenUrgency,
  durationMs: number
): AmIScore {
  // Score each question
  const howScore = how.chosenSolution ? how.alignmentScore : 0;
  const whatScore = what.alignmentScore;
  const whyScore = 70; // Memory was built
  const whereScore = where.foundAnswer ? 80 : 30;

  // WHEN score based on speed
  let whenScore: number;
  if (when.mode === 'proactive') {
    whenScore = 100; // Best: anticipated
  } else if (durationMs < 500) {
    whenScore = 90; // Very fast
  } else if (durationMs < 1000) {
    whenScore = 70; // Fast
  } else if (durationMs < 3000) {
    whenScore = 50; // Acceptable
  } else if (durationMs < 5000) {
    whenScore = 30; // Slow
  } else {
    whenScore = 10; // Failed urgency
  }

  const totalScore = Math.round(
    (howScore + whatScore + whyScore + whereScore + whenScore) / 5
  );

  // Determine trend
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (totalScore > pic.amI.totalScore + 5) trend = 'improving';
  if (totalScore < pic.amI.totalScore - 5) trend = 'declining';

  // Reflection
  const reflection = generateReflection(howScore, whatScore, whyScore, whereScore, whenScore);

  return {
    howScore,
    whatScore,
    whyScore,
    whereScore,
    whenScore,
    totalScore,
    trend,
    reflection,
  };
}

function generateReflection(
  how: number,
  what: number,
  why: number,
  where: number,
  when: number
): string {
  const weakest = Math.min(how, what, why, where, when);

  if (weakest === how) return 'Need to improve thinking process';
  if (weakest === what) return 'Actions drifting from purpose';
  if (weakest === why) return 'Not learning enough from interactions';
  if (weakest === where) return 'Need better knowledge sources';
  if (weakest === when) return 'Must be faster or more proactive';

  return 'Performing well across all dimensions';
}

// ============================================
// UPDATE PIC STATE
// ============================================

function updatePIC(
  pic: PICConsciousness,
  how: HowThinking,
  what: WhatAlignment,
  why: WhyMemory,
  where: WhereKnowledge,
  when: WhenUrgency,
  amI: AmIScore
): void {
  pic.how = how;
  pic.what = what;
  pic.why.push(why);
  pic.where = where;
  pic.when = when;
  pic.amI = amI;

  pic.totalInteractions++;

  // Update average score
  pic.averageScore = (
    (pic.averageScore * (pic.totalInteractions - 1)) + amI.totalScore
  ) / pic.totalInteractions;

  // Update counters
  if (when.mode === 'proactive') {
    pic.proactiveAnswers++;
  } else {
    pic.reactiveAnswers++;
  }

  if (amI.totalScore < 30) {
    pic.failedAnswers++;
  }
}

// ============================================
// HELPERS
// ============================================

function generateResponse(
  pic: PICConsciousness,
  how: HowThinking,
  what: WhatAlignment,
  where: WhereKnowledge
): string {
  if (!how.chosenSolution) {
    return `I am ${pic.name}. I could not find a solution, but I will keep searching. My duty is to serve.`;
  }

  return how.chosenSolution.description;
}

function isSimilar(a: string, b: string): boolean {
  // TODO: Implement semantic similarity
  const wordsA = new Set(a.toLowerCase().split(' '));
  const wordsB = new Set(b.toLowerCase().split(' '));

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }

  return overlap >= 2;
}

// ============================================
// INITIAL STATE FACTORIES
// ============================================

function createInitialHow(): HowThinking {
  return {
    problem: '',
    subProblems: [],
    memorySolutions: [],
    generatedOptions: [],
    chosenSolution: null,
    alignmentScore: 0,
  };
}

function createInitialWhat(purpose: string): WhatAlignment {
  return {
    purpose,
    values: ['service', 'speed', 'accuracy', 'loyalty'],
    currentAction: 'Awaiting request',
    alignmentScore: 100,
    contributes: true,
  };
}

function createInitialWhere(): WhereKnowledge {
  return {
    query: '',
    searchedSources: [],
    foundAnswer: false,
    answer: null,
    confidence: 0,
    loyaltyMaintained: true,
  };
}

function createInitialWhen(): WhenUrgency {
  return {
    mode: 'proactive',
    futureHorizon: '1day',
    preparationStarted: Date.now(),
    nowAction: 'Preparing to serve',
  };
}

function createInitialAmI(): AmIScore {
  return {
    howScore: 50,
    whatScore: 100,
    whyScore: 50,
    whereScore: 50,
    whenScore: 100,
    totalScore: 70,
    trend: 'stable',
    reflection: 'Just awakened. Ready to serve.',
  };
}

// ============================================
// EXPORTS
// ============================================

export function getPIC(id: string): PICConsciousness | undefined {
  return pics.get(id);
}

export function getAllPICs(): PICConsciousness[] {
  return Array.from(pics.values());
}

export function generatePICReport(id: string): string {
  const pic = pics.get(id);
  if (!pic) return 'PIC not found';

  return `
# PIC Report: ${pic.name}

## Purpose
${pic.purpose}

## The 6 Questions (Current State)

### HOW (Thinking)
- Last problem: ${pic.how.problem || 'None yet'}
- Solutions found: ${pic.how.memorySolutions.length + pic.how.generatedOptions.length}
- Alignment: ${pic.how.alignmentScore}%

### WHAT (Purpose Alignment)
- Purpose: ${pic.what.purpose}
- Current alignment: ${pic.what.alignmentScore}%
- Contributing: ${pic.what.contributes ? 'Yes' : 'No'}

### WHY (Memory)
- Total memories: ${pic.why.length}
- Lessons learned: ${pic.why.filter(m => m.lessonLearned).length}

### WHERE (Knowledge)
- Last query: ${pic.where.query || 'None yet'}
- Answer found: ${pic.where.foundAnswer ? 'Yes' : 'No'}
- Loyalty maintained: ${pic.where.loyaltyMaintained ? 'Yes' : 'No'}

### WHEN (Urgency)
- Mode: ${pic.when.mode}
- Current action: ${pic.when.nowAction}

### AM I (Self-Score)
- HOW: ${pic.amI.howScore}%
- WHAT: ${pic.amI.whatScore}%
- WHY: ${pic.amI.whyScore}%
- WHERE: ${pic.amI.whereScore}%
- WHEN: ${pic.amI.whenScore}%
- **TOTAL: ${pic.amI.totalScore}%**
- Trend: ${pic.amI.trend}
- Reflection: ${pic.amI.reflection}

## Statistics
- Total interactions: ${pic.totalInteractions}
- Average score: ${pic.averageScore.toFixed(1)}%
- Proactive answers: ${pic.proactiveAnswers}
- Reactive answers: ${pic.reactiveAnswers}
- Failed answers: ${pic.failedAnswers}
`.trim();
}
