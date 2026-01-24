/**
 * Forge Live Preview
 *
 * Real-time app preview that updates as agents build.
 * Users see their app coming to life, not just logs.
 *
 * KILLER FEATURE #1: Instant visual feedback
 */

export interface PreviewFrame {
  id: string;
  buildId: string;
  timestamp: Date;
  status: 'initializing' | 'building' | 'ready' | 'error';
  url?: string;
  screenshot?: string; // Base64 or URL
  changedFiles: string[];
  agent: string;
}

export interface PreviewSession {
  id: string;
  buildId: string;
  sandboxUrl: string;
  websocketUrl: string;
  frames: PreviewFrame[];
  currentFrame: number;
  isLive: boolean;
  createdAt: Date;
}

export interface PreviewConfig {
  provider: 'stackblitz' | 'codesandbox' | 'webcontainer' | 'docker';
  autoRefresh: boolean;
  refreshDebounceMs: number;
  captureScreenshots: boolean;
  hotReload: boolean;
}

// Default configuration
export const DEFAULT_PREVIEW_CONFIG: PreviewConfig = {
  provider: 'webcontainer',
  autoRefresh: true,
  refreshDebounceMs: 500,
  captureScreenshots: true,
  hotReload: true,
};

// ============================================
// PREVIEW PROVIDERS
// ============================================

export interface PreviewProvider {
  name: string;
  initialize: (buildId: string, files: FileMap) => Promise<string>; // Returns sandbox URL
  updateFiles: (sandboxUrl: string, files: FileMap) => Promise<void>;
  getScreenshot: (sandboxUrl: string) => Promise<string>;
  destroy: (sandboxUrl: string) => Promise<void>;
}

export type FileMap = Record<string, string | { content: string; isBinary?: boolean }>;

// StackBlitz provider
export const stackblitzProvider: PreviewProvider = {
  name: 'stackblitz',
  initialize: async (buildId: string, files: FileMap) => {
    // In production, this would call StackBlitz SDK
    // sdk.embedProject('preview-container', { files, template: 'node' })
    return `https://stackblitz.com/fork/forge-${buildId}`;
  },
  updateFiles: async (_sandboxUrl: string, _files: FileMap) => {
    // sdk.applyFsDiff(diff)
  },
  getScreenshot: async (_sandboxUrl: string) => {
    // Capture via puppeteer or browser API
    return 'data:image/png;base64,...';
  },
  destroy: async (_sandboxUrl: string) => {
    // Cleanup sandbox
  },
};

// CodeSandbox provider
export const codesandboxProvider: PreviewProvider = {
  name: 'codesandbox',
  initialize: async (buildId: string, _files: FileMap) => {
    return `https://codesandbox.io/p/sandbox/forge-${buildId}`;
  },
  updateFiles: async (_sandboxUrl: string, _files: FileMap) => {
    // Use CodeSandbox API
  },
  getScreenshot: async (_sandboxUrl: string) => {
    return 'data:image/png;base64,...';
  },
  destroy: async (_sandboxUrl: string) => {
    // Cleanup
  },
};

// WebContainer provider (runs in browser)
export const webcontainerProvider: PreviewProvider = {
  name: 'webcontainer',
  initialize: async (buildId: string, _files: FileMap) => {
    // WebContainer API - runs Node.js in browser
    // const webcontainer = await WebContainer.boot();
    // await webcontainer.mount(files);
    // const process = await webcontainer.spawn('npm', ['run', 'dev']);
    return `http://localhost:3001/preview/${buildId}`;
  },
  updateFiles: async (_sandboxUrl: string, _files: FileMap) => {
    // webcontainer.fs.writeFile(path, content)
  },
  getScreenshot: async (_sandboxUrl: string) => {
    return 'data:image/png;base64,...';
  },
  destroy: async (_sandboxUrl: string) => {
    // webcontainer.teardown()
  },
};

// ============================================
// PREVIEW SESSION MANAGEMENT
// ============================================

const activeSessions = new Map<string, PreviewSession>();

export function createPreviewSession(
  buildId: string,
  config: PreviewConfig = DEFAULT_PREVIEW_CONFIG
): PreviewSession {
  const sessionId = `preview-${buildId}-${Date.now()}`;

  const session: PreviewSession = {
    id: sessionId,
    buildId,
    sandboxUrl: '',
    websocketUrl: `ws://localhost:3001/preview/${buildId}/ws`,
    frames: [],
    currentFrame: 0,
    isLive: true,
    createdAt: new Date(),
  };

  activeSessions.set(buildId, session);
  return session;
}

export function getPreviewSession(buildId: string): PreviewSession | undefined {
  return activeSessions.get(buildId);
}

export function addPreviewFrame(
  buildId: string,
  frame: Omit<PreviewFrame, 'id' | 'buildId' | 'timestamp'>
): PreviewFrame {
  const session = activeSessions.get(buildId);
  if (!session) {
    throw new Error(`No preview session for build ${buildId}`);
  }

  const newFrame: PreviewFrame = {
    id: `frame-${session.frames.length}`,
    buildId,
    timestamp: new Date(),
    ...frame,
  };

  session.frames.push(newFrame);
  session.currentFrame = session.frames.length - 1;

  return newFrame;
}

export function destroyPreviewSession(buildId: string): void {
  activeSessions.delete(buildId);
}

// ============================================
// FILE CHANGE DETECTION
// ============================================

export interface FileChange {
  path: string;
  type: 'create' | 'modify' | 'delete';
  content?: string;
  agent: string;
}

export function detectPreviewRelevantChanges(changes: FileChange[]): FileChange[] {
  // Filter to changes that affect the preview
  const previewRelevant = [
    /\.(tsx?|jsx?|css|scss|html|json)$/,
    /^(src|app|pages|components|public)\//,
  ];

  return changes.filter(change =>
    previewRelevant.some(pattern =>
      typeof pattern === 'string'
        ? change.path.includes(pattern)
        : pattern.test(change.path)
    )
  );
}

// ============================================
// PREVIEW EVENTS (for real-time updates)
// ============================================

export type PreviewEventType =
  | 'session:created'
  | 'session:ready'
  | 'session:error'
  | 'frame:added'
  | 'files:changed'
  | 'screenshot:captured'
  | 'hotreload:triggered';

export interface PreviewEvent {
  type: PreviewEventType;
  buildId: string;
  timestamp: Date;
  data: unknown;
}

export type PreviewEventHandler = (event: PreviewEvent) => void;

const eventHandlers = new Map<string, PreviewEventHandler[]>();

export function onPreviewEvent(buildId: string, handler: PreviewEventHandler): () => void {
  const handlers = eventHandlers.get(buildId) || [];
  handlers.push(handler);
  eventHandlers.set(buildId, handlers);

  // Return unsubscribe function
  return () => {
    const current = eventHandlers.get(buildId) || [];
    eventHandlers.set(buildId, current.filter(h => h !== handler));
  };
}

export function emitPreviewEvent(event: PreviewEvent): void {
  const handlers = eventHandlers.get(event.buildId) || [];
  handlers.forEach(handler => handler(event));
}

// ============================================
// PREVIEW COMPARISON (before/after)
// ============================================

export interface PreviewComparison {
  beforeFrame: PreviewFrame;
  afterFrame: PreviewFrame;
  changedElements: string[];
  visualDiff?: string; // Base64 diff image
}

export function comparePreviewFrames(
  before: PreviewFrame,
  after: PreviewFrame
): PreviewComparison {
  return {
    beforeFrame: before,
    afterFrame: after,
    changedElements: after.changedFiles,
    // In production, would use pixelmatch or similar for visual diff
    visualDiff: undefined,
  };
}

// ============================================
// PREVIEW URL GENERATION
// ============================================

export function getPreviewUrl(buildId: string, route: string = '/'): string {
  const session = activeSessions.get(buildId);
  if (!session?.sandboxUrl) {
    return '';
  }
  return `${session.sandboxUrl}${route}`;
}

export function getPreviewRoutes(buildId: string): string[] {
  // In production, would parse the app's routes
  return ['/', '/about', '/dashboard', '/settings'];
}
