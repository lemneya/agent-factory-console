/**
 * Forge Chat Agent
 *
 * Allows users to have conversations about their build
 * and make targeted modifications through natural language.
 *
 * Examples:
 * - "Change the primary color to blue"
 * - "Make the header sticky"
 * - "Add a dark mode toggle"
 * - "Remove the testimonials section"
 */

import type { DecomposedSpec, Workstream } from './types';

// ============================================
// TYPES
// ============================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: ChatIntent;
    affectedFiles?: string[];
    workstreamId?: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
  };
}

export interface ChatIntent {
  type:
    | 'modify'      // Change existing code/feature
    | 'add'         // Add new feature/component
    | 'remove'      // Remove feature/component
    | 'style'       // Change styling/appearance
    | 'explain'     // Explain how something works
    | 'question'    // General question about the build
    | 'undo'        // Revert a change
    | 'status';     // Check build status
  confidence: number;
  target?: string;        // What they want to modify
  description?: string;   // What they want to do
  parameters?: Record<string, string>;
}

export interface ChatContext {
  buildId: string;
  decomposition: DecomposedSpec;
  completedWorkstreams: string[];
  generatedFiles: FileContext[];
  previousMessages: ChatMessage[];
}

export interface FileContext {
  path: string;
  workstreamId: string;
  type: 'component' | 'page' | 'api' | 'lib' | 'style' | 'config' | 'other';
  description?: string;
}

export interface ChatAgentResponse {
  message: string;
  intent: ChatIntent;
  action?: ChatAction;
  suggestions?: string[];
}

export interface ChatAction {
  type: 'code_change' | 'new_workstream' | 'explanation' | 'none';
  payload?: {
    files?: Array<{
      path: string;
      operation: 'create' | 'modify' | 'delete';
      changes?: string;
    }>;
    workstream?: Partial<Workstream>;
    explanation?: string;
  };
}

// ============================================
// INTENT DETECTION
// ============================================

const INTENT_PATTERNS: Array<{
  pattern: RegExp;
  type: ChatIntent['type'];
  extractTarget?: (match: RegExpMatchArray) => string;
}> = [
  // Modify patterns
  { pattern: /change\s+(?:the\s+)?(.+?)\s+(?:to|into)\s+(.+)/i, type: 'modify', extractTarget: m => m[1] },
  { pattern: /make\s+(?:the\s+)?(.+?)\s+(.+)/i, type: 'modify', extractTarget: m => m[1] },
  { pattern: /update\s+(?:the\s+)?(.+)/i, type: 'modify', extractTarget: m => m[1] },
  { pattern: /modify\s+(?:the\s+)?(.+)/i, type: 'modify', extractTarget: m => m[1] },
  { pattern: /set\s+(?:the\s+)?(.+?)\s+to\s+(.+)/i, type: 'modify', extractTarget: m => m[1] },

  // Add patterns
  { pattern: /add\s+(?:a\s+)?(.+)/i, type: 'add', extractTarget: m => m[1] },
  { pattern: /include\s+(?:a\s+)?(.+)/i, type: 'add', extractTarget: m => m[1] },
  { pattern: /create\s+(?:a\s+)?(.+)/i, type: 'add', extractTarget: m => m[1] },
  { pattern: /insert\s+(?:a\s+)?(.+)/i, type: 'add', extractTarget: m => m[1] },

  // Remove patterns
  { pattern: /remove\s+(?:the\s+)?(.+)/i, type: 'remove', extractTarget: m => m[1] },
  { pattern: /delete\s+(?:the\s+)?(.+)/i, type: 'remove', extractTarget: m => m[1] },
  { pattern: /hide\s+(?:the\s+)?(.+)/i, type: 'remove', extractTarget: m => m[1] },
  { pattern: /get rid of\s+(?:the\s+)?(.+)/i, type: 'remove', extractTarget: m => m[1] },

  // Style patterns
  { pattern: /(?:change|set|make)\s+(?:the\s+)?(?:color|colour)\s+(?:of\s+)?(.+?)\s+(?:to\s+)?(.+)/i, type: 'style', extractTarget: m => m[1] },
  { pattern: /(?:make|set)\s+(?:the\s+)?(.+?)\s+(?:color|colour)\s+(.+)/i, type: 'style', extractTarget: m => m[1] },
  { pattern: /(?:change|update)\s+(?:the\s+)?(?:font|typography)/i, type: 'style' },
  { pattern: /(?:add|enable)\s+dark\s+mode/i, type: 'style' },
  { pattern: /(?:make|set)\s+(?:it\s+)?(?:responsive|mobile)/i, type: 'style' },

  // Explain patterns
  { pattern: /(?:explain|how does)\s+(?:the\s+)?(.+?)(?:\s+work)?/i, type: 'explain', extractTarget: m => m[1] },
  { pattern: /what\s+(?:is|does)\s+(?:the\s+)?(.+)/i, type: 'explain', extractTarget: m => m[1] },
  { pattern: /tell me about\s+(?:the\s+)?(.+)/i, type: 'explain', extractTarget: m => m[1] },

  // Question patterns
  { pattern: /(?:can|could)\s+(?:you|i)\s+(.+)/i, type: 'question' },
  { pattern: /(?:is|are)\s+(?:there|it)\s+(.+)/i, type: 'question' },
  { pattern: /(?:where|how)\s+(?:is|do|can)\s+(.+)/i, type: 'question' },

  // Undo patterns
  { pattern: /undo\s+(?:the\s+)?(?:last\s+)?(?:change|modification)/i, type: 'undo' },
  { pattern: /revert\s+(?:the\s+)?(?:last\s+)?(?:change|modification)/i, type: 'undo' },
  { pattern: /go back/i, type: 'undo' },

  // Status patterns
  { pattern: /(?:what(?:'s| is)|show)\s+(?:the\s+)?(?:status|progress)/i, type: 'status' },
  { pattern: /(?:is it|are we)\s+(?:done|finished|complete)/i, type: 'status' },
];

export function detectIntent(message: string): ChatIntent {
  const messageLower = message.toLowerCase().trim();

  for (const { pattern, type, extractTarget } of INTENT_PATTERNS) {
    const match = messageLower.match(pattern);
    if (match) {
      return {
        type,
        confidence: 0.85,
        target: extractTarget ? extractTarget(match) : undefined,
        description: message,
      };
    }
  }

  // Default to question if no pattern matches
  return {
    type: 'question',
    confidence: 0.5,
    description: message,
  };
}

// ============================================
// TARGET RESOLUTION
// ============================================

const TARGET_MAPPINGS: Record<string, string[]> = {
  // Components
  header: ['header', 'navbar', 'navigation', 'nav', 'top bar'],
  footer: ['footer', 'bottom', 'foot'],
  sidebar: ['sidebar', 'side bar', 'side menu', 'side nav'],
  hero: ['hero', 'hero section', 'banner', 'main banner', 'landing'],
  button: ['button', 'buttons', 'cta', 'call to action'],
  form: ['form', 'forms', 'input', 'inputs'],
  card: ['card', 'cards', 'tile', 'tiles'],
  modal: ['modal', 'popup', 'dialog', 'overlay'],
  table: ['table', 'tables', 'data table', 'grid'],

  // Pages
  home: ['home', 'homepage', 'main page', 'landing page'],
  about: ['about', 'about us', 'about page'],
  contact: ['contact', 'contact us', 'contact page', 'contact form'],
  pricing: ['pricing', 'prices', 'plans', 'pricing page'],
  login: ['login', 'signin', 'sign in', 'authentication'],
  signup: ['signup', 'sign up', 'register', 'registration'],
  dashboard: ['dashboard', 'admin', 'panel'],
  settings: ['settings', 'preferences', 'options'],
  profile: ['profile', 'account', 'user profile'],

  // Styling
  color: ['color', 'colour', 'colors', 'colours', 'theme'],
  font: ['font', 'fonts', 'typography', 'text'],
  spacing: ['spacing', 'padding', 'margin', 'gaps'],
  layout: ['layout', 'grid', 'structure'],

  // Features
  authentication: ['auth', 'authentication', 'login system', 'user auth'],
  database: ['database', 'db', 'data', 'storage'],
  api: ['api', 'apis', 'endpoints', 'backend'],
  search: ['search', 'search bar', 'search function'],
  notifications: ['notifications', 'alerts', 'toasts'],
};

export function resolveTarget(target: string, context: ChatContext): {
  resolved: string;
  files: string[];
  workstreamId?: string;
} {
  const targetLower = target.toLowerCase();

  // Find matching target category
  let resolvedTarget = target;
  for (const [key, aliases] of Object.entries(TARGET_MAPPINGS)) {
    if (aliases.some(alias => targetLower.includes(alias))) {
      resolvedTarget = key;
      break;
    }
  }

  // Find relevant files from context
  const relevantFiles = context.generatedFiles.filter(file => {
    const pathLower = file.path.toLowerCase();
    const descLower = (file.description || '').toLowerCase();
    return pathLower.includes(resolvedTarget) || descLower.includes(resolvedTarget);
  });

  // Find relevant workstream
  const relevantWorkstream = context.decomposition.workstreams.find(ws => {
    const nameLower = ws.name.toLowerCase();
    const promptLower = ws.prompt.toLowerCase();
    return nameLower.includes(resolvedTarget) || promptLower.includes(resolvedTarget);
  });

  return {
    resolved: resolvedTarget,
    files: relevantFiles.map(f => f.path),
    workstreamId: relevantWorkstream?.id,
  };
}

// ============================================
// RESPONSE GENERATION
// ============================================

export function generateResponse(
  intent: ChatIntent,
  context: ChatContext
): ChatAgentResponse {
  const { type, target } = intent;

  // Resolve target if present
  const targetInfo = target ? resolveTarget(target, context) : null;

  switch (type) {
    case 'modify':
      return generateModifyResponse(intent, targetInfo, context);
    case 'add':
      return generateAddResponse(intent, context);
    case 'remove':
      return generateRemoveResponse(intent, targetInfo, context);
    case 'style':
      return generateStyleResponse(intent, targetInfo, context);
    case 'explain':
      return generateExplainResponse(intent, targetInfo, context);
    case 'question':
      return generateQuestionResponse(intent, context);
    case 'undo':
      return generateUndoResponse(context);
    case 'status':
      return generateStatusResponse(context);
    default:
      return {
        message: "I'm not sure what you'd like me to do. Could you rephrase that?",
        intent,
        suggestions: [
          'Change the primary color to blue',
          'Add a contact form',
          'Make the header sticky',
          'Explain how authentication works',
        ],
      };
  }
}

function generateModifyResponse(
  intent: ChatIntent,
  targetInfo: ReturnType<typeof resolveTarget> | null,
  _context: ChatContext
): ChatAgentResponse {
  if (!targetInfo || targetInfo.files.length === 0) {
    return {
      message: `I couldn't find files related to "${intent.target}". Could you be more specific about what you want to modify?`,
      intent,
      suggestions: [
        'Change the header background color',
        'Modify the button styles',
        'Update the footer links',
      ],
    };
  }

  return {
    message: `I'll modify the ${targetInfo.resolved}. This will affect ${targetInfo.files.length} file(s):\n\n${targetInfo.files.map(f => `- \`${f}\``).join('\n')}\n\nShould I proceed with: "${intent.description}"?`,
    intent,
    action: {
      type: 'code_change',
      payload: {
        files: targetInfo.files.map(path => ({
          path,
          operation: 'modify' as const,
        })),
      },
    },
    suggestions: [
      'Yes, proceed',
      'Show me a preview first',
      'Cancel',
    ],
  };
}

function generateAddResponse(
  intent: ChatIntent,
  context: ChatContext
): ChatAgentResponse {
  const feature = intent.target || 'feature';

  return {
    message: `I'll add a ${feature} to your project. This will create a new workstream to implement it.\n\nBased on your current build, I'll integrate it with:\n- Tech stack: ${context.decomposition.workstreams[0]?.agent || 'Next.js'}\n- Styling: consistent with existing components\n\nShould I proceed?`,
    intent,
    action: {
      type: 'new_workstream',
      payload: {
        workstream: {
          name: `Add ${feature}`,
          prompt: `Add a ${feature} component/feature that integrates with the existing codebase. ${intent.description}`,
          agent: 'ui', // Use UI agent for feature additions
          estimatedMinutes: 15,
        },
      },
    },
    suggestions: [
      'Yes, add it',
      'Tell me more about what it will include',
      'Cancel',
    ],
  };
}

function generateRemoveResponse(
  intent: ChatIntent,
  targetInfo: ReturnType<typeof resolveTarget> | null,
  _context: ChatContext
): ChatAgentResponse {
  if (!targetInfo || targetInfo.files.length === 0) {
    return {
      message: `I couldn't find "${intent.target}" in your project. What would you like to remove?`,
      intent,
      suggestions: [
        'Remove the testimonials section',
        'Hide the pricing page',
        'Delete the newsletter signup',
      ],
    };
  }

  return {
    message: `I'll remove the ${targetInfo.resolved}. This will modify/delete:\n\n${targetInfo.files.map(f => `- \`${f}\``).join('\n')}\n\nThis action can be undone. Should I proceed?`,
    intent,
    action: {
      type: 'code_change',
      payload: {
        files: targetInfo.files.map(path => ({
          path,
          operation: 'delete' as const,
        })),
      },
    },
    suggestions: [
      'Yes, remove it',
      'Just hide it instead',
      'Cancel',
    ],
  };
}

function generateStyleResponse(
  intent: ChatIntent,
  targetInfo: ReturnType<typeof resolveTarget> | null,
  _context: ChatContext
): ChatAgentResponse {
  const styleFiles = [
    'tailwind.config.ts',
    'app/globals.css',
    ...(targetInfo?.files || []),
  ];

  return {
    message: `I'll update the styling for ${targetInfo?.resolved || 'your project'}.\n\nFiles that may be affected:\n${styleFiles.map(f => `- \`${f}\``).join('\n')}\n\nChange: "${intent.description}"`,
    intent,
    action: {
      type: 'code_change',
      payload: {
        files: styleFiles.map(path => ({
          path,
          operation: 'modify' as const,
        })),
      },
    },
    suggestions: [
      'Yes, apply the style change',
      'Show me a preview',
      'Try a different approach',
    ],
  };
}

function generateExplainResponse(
  intent: ChatIntent,
  targetInfo: ReturnType<typeof resolveTarget> | null,
  context: ChatContext
): ChatAgentResponse {
  const topic = targetInfo?.resolved || intent.target || 'your build';

  // Find relevant workstream for explanation
  const workstream = targetInfo?.workstreamId
    ? context.decomposition.workstreams.find(ws => ws.id === targetInfo.workstreamId)
    : null;

  let explanation = `Here's how the ${topic} works in your project:\n\n`;

  if (workstream) {
    explanation += `**Workstream:** ${workstream.name}\n`;
    explanation += `**Purpose:** ${workstream.prompt}\n`;
    explanation += `**Files:** ${workstream.owns.join(', ')}\n`;
  }

  if (targetInfo?.files.length) {
    explanation += `\n**Related files:**\n${targetInfo.files.map(f => `- \`${f}\``).join('\n')}`;
  }

  return {
    message: explanation,
    intent,
    action: {
      type: 'explanation',
      payload: {
        explanation,
      },
    },
    suggestions: [
      'How can I modify this?',
      'Show me the code',
      'What depends on this?',
    ],
  };
}

function generateQuestionResponse(
  intent: ChatIntent,
  context: ChatContext
): ChatAgentResponse {
  return {
    message: `I can help you with your project. Here's what I can do:\n\n- **Modify** existing components or pages\n- **Add** new features or sections\n- **Remove** unwanted elements\n- **Style** changes (colors, fonts, layout)\n- **Explain** how parts of your app work\n\nWhat would you like to do?`,
    intent,
    suggestions: [
      'Change the color scheme',
      'Add a new page',
      'Explain the authentication flow',
      'Show build status',
    ],
  };
}

function generateUndoResponse(context: ChatContext): ChatAgentResponse {
  const lastChange = context.previousMessages
    .filter(m => m.metadata?.status === 'completed')
    .pop();

  if (!lastChange) {
    return {
      message: "There's nothing to undo yet.",
      intent: { type: 'undo', confidence: 1 },
    };
  }

  return {
    message: `I can undo the last change: "${lastChange.content}"\n\nThis will restore the previous version of the affected files. Should I proceed?`,
    intent: { type: 'undo', confidence: 1 },
    action: {
      type: 'code_change',
      payload: {
        files: lastChange.metadata?.affectedFiles?.map(path => ({
          path,
          operation: 'modify' as const,
          changes: 'Restore previous version',
        })),
      },
    },
    suggestions: [
      'Yes, undo it',
      'No, keep the change',
    ],
  };
}

function generateStatusResponse(context: ChatContext): ChatAgentResponse {
  const total = context.decomposition.workstreams.length;
  const completed = context.completedWorkstreams.length;
  const percent = Math.round((completed / total) * 100);

  return {
    message: `**Build Status**\n\n- Progress: ${completed}/${total} workstreams (${percent}%)\n- Strategy: ${context.decomposition.strategy}\n- Files generated: ${context.generatedFiles.length}\n\n${completed === total ? '✅ Build complete!' : '🔄 Build in progress...'}`,
    intent: { type: 'status', confidence: 1 },
    suggestions: completed === total
      ? ['Make a modification', 'Explain the architecture', 'Deploy']
      : ['Show workstream details', 'Pause build'],
  };
}

// ============================================
// CHAT SESSION
// ============================================

export interface ChatSession {
  id: string;
  buildId: string;
  messages: ChatMessage[];
  context: ChatContext;
  createdAt: Date;
  updatedAt: Date;
}

export function createChatSession(
  buildId: string,
  decomposition: DecomposedSpec
): ChatSession {
  const sessionId = `chat-${buildId}-${Date.now()}`;

  return {
    id: sessionId,
    buildId,
    messages: [
      {
        id: `${sessionId}-welcome`,
        role: 'assistant',
        content: `Hi! I'm your build assistant. Your app is being built with ${decomposition.workstreams.length} workstreams.\n\nYou can ask me to:\n- Modify any component or page\n- Add new features\n- Change colors and styling\n- Explain how things work\n\nWhat would you like to do?`,
        timestamp: new Date(),
      },
    ],
    context: {
      buildId,
      decomposition,
      completedWorkstreams: [],
      generatedFiles: [],
      previousMessages: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function processMessage(
  session: ChatSession,
  userMessage: string
): { session: ChatSession; response: ChatAgentResponse } {
  const messageId = `${session.id}-${Date.now()}`;

  // Add user message
  const userMsg: ChatMessage = {
    id: messageId,
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  };

  // Detect intent
  const intent = detectIntent(userMessage);

  // Generate response
  const response = generateResponse(intent, session.context);

  // Add assistant message
  const assistantMsg: ChatMessage = {
    id: `${messageId}-response`,
    role: 'assistant',
    content: response.message,
    timestamp: new Date(),
    metadata: {
      intent,
      affectedFiles: response.action?.payload?.files?.map(f => f.path),
      status: response.action ? 'pending' : undefined,
    },
  };

  // Update session
  const updatedSession: ChatSession = {
    ...session,
    messages: [...session.messages, userMsg, assistantMsg],
    context: {
      ...session.context,
      previousMessages: [...session.context.previousMessages, userMsg],
    },
    updatedAt: new Date(),
  };

  return { session: updatedSession, response };
}

// ============================================
// QUICK ACTIONS
// ============================================

export const QUICK_ACTIONS = [
  {
    id: 'change-color',
    label: 'Change color scheme',
    icon: '🎨',
    prompt: 'Change the primary color to',
  },
  {
    id: 'add-page',
    label: 'Add a page',
    icon: '📄',
    prompt: 'Add a new page for',
  },
  {
    id: 'make-sticky',
    label: 'Make header sticky',
    icon: '📌',
    prompt: 'Make the header sticky',
  },
  {
    id: 'add-dark-mode',
    label: 'Add dark mode',
    icon: '🌙',
    prompt: 'Add dark mode toggle',
  },
  {
    id: 'add-animation',
    label: 'Add animations',
    icon: '✨',
    prompt: 'Add subtle animations to',
  },
  {
    id: 'improve-mobile',
    label: 'Improve mobile UX',
    icon: '📱',
    prompt: 'Improve the mobile experience for',
  },
];
