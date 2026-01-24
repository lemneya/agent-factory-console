/**
 * Forge Collaborative Building
 *
 * Multiple users can watch and participate in the same build.
 * Real-time collaboration for teams.
 *
 * KILLER FEATURE #4: Team building in real-time
 */

export type UserRole = 'owner' | 'admin' | 'developer' | 'designer' | 'viewer';

export interface CollaboratorPermissions {
  canModify: boolean;       // Can use chat to modify code
  canApproveHITL: boolean;  // Can approve human-in-the-loop decisions
  canDeploy: boolean;       // Can trigger deployments
  canInvite: boolean;       // Can invite others
  canComment: boolean;      // Can leave comments
  canViewCode: boolean;     // Can see generated code
}

export const ROLE_PERMISSIONS: Record<UserRole, CollaboratorPermissions> = {
  owner: {
    canModify: true,
    canApproveHITL: true,
    canDeploy: true,
    canInvite: true,
    canComment: true,
    canViewCode: true,
  },
  admin: {
    canModify: true,
    canApproveHITL: true,
    canDeploy: true,
    canInvite: true,
    canComment: true,
    canViewCode: true,
  },
  developer: {
    canModify: true,
    canApproveHITL: true,
    canDeploy: false,
    canInvite: false,
    canComment: true,
    canViewCode: true,
  },
  designer: {
    canModify: true,
    canApproveHITL: false,
    canDeploy: false,
    canInvite: false,
    canComment: true,
    canViewCode: false,
  },
  viewer: {
    canModify: false,
    canApproveHITL: false,
    canDeploy: false,
    canInvite: false,
    canComment: true,
    canViewCode: false,
  },
};

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  isOnline: boolean;
  lastSeen: Date;
  cursor?: CursorPosition;
  focusedFile?: string;
}

export interface CursorPosition {
  file: string;
  line: number;
  column: number;
}

export interface CollaborationSession {
  id: string;
  buildId: string;
  owner: Collaborator;
  collaborators: Collaborator[];
  isPublic: boolean;
  shareLink?: string;
  createdAt: Date;
  settings: CollaborationSettings;
  activity: ActivityEvent[];
}

export interface CollaborationSettings {
  allowAnonymousViewers: boolean;
  requireApprovalToJoin: boolean;
  autoSharePreview: boolean;
  notifyOnChanges: boolean;
  chatEnabled: boolean;
  voiceEnabled: boolean;
}

// ============================================
// ACTIVITY TRACKING
// ============================================

export type ActivityType =
  | 'join'
  | 'leave'
  | 'comment'
  | 'modify'
  | 'approve'
  | 'deploy'
  | 'cursor_move'
  | 'file_focus'
  | 'chat_message';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  userId: string;
  userName: string;
  timestamp: Date;
  data?: Record<string, unknown>;
}

// ============================================
// COMMENTS & ANNOTATIONS
// ============================================

export interface Comment {
  id: string;
  buildId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  resolved: boolean;
  replies: Comment[];
  anchor?: CommentAnchor;
}

export interface CommentAnchor {
  type: 'file' | 'component' | 'preview' | 'general';
  file?: string;
  line?: number;
  componentName?: string;
  previewCoordinates?: { x: number; y: number };
}

// ============================================
// REAL-TIME SYNC
// ============================================

export type SyncEventType =
  | 'collaborator:join'
  | 'collaborator:leave'
  | 'collaborator:cursor'
  | 'build:update'
  | 'code:change'
  | 'chat:message'
  | 'comment:add'
  | 'hitl:pending'
  | 'hitl:resolved'
  | 'deploy:started'
  | 'deploy:completed';

export interface SyncEvent {
  type: SyncEventType;
  sessionId: string;
  userId: string;
  timestamp: Date;
  payload: unknown;
}

export type SyncEventHandler = (event: SyncEvent) => void;

// ============================================
// SESSION MANAGEMENT
// ============================================

const activeSessions = new Map<string, CollaborationSession>();
const eventHandlers = new Map<string, SyncEventHandler[]>();

export function createCollaborationSession(
  buildId: string,
  owner: Omit<Collaborator, 'isOnline' | 'lastSeen'>
): CollaborationSession {
  const sessionId = `collab-${buildId}-${Date.now()}`;

  const session: CollaborationSession = {
    id: sessionId,
    buildId,
    owner: {
      ...owner,
      isOnline: true,
      lastSeen: new Date(),
    },
    collaborators: [],
    isPublic: false,
    createdAt: new Date(),
    settings: {
      allowAnonymousViewers: false,
      requireApprovalToJoin: true,
      autoSharePreview: true,
      notifyOnChanges: true,
      chatEnabled: true,
      voiceEnabled: false,
    },
    activity: [{
      id: `activity-${Date.now()}`,
      type: 'join',
      userId: owner.id,
      userName: owner.name,
      timestamp: new Date(),
    }],
  };

  activeSessions.set(buildId, session);
  return session;
}

export function getCollaborationSession(buildId: string): CollaborationSession | undefined {
  return activeSessions.get(buildId);
}

export function joinSession(
  buildId: string,
  user: Omit<Collaborator, 'isOnline' | 'lastSeen'>
): CollaborationSession | null {
  const session = activeSessions.get(buildId);
  if (!session) return null;

  // Check if already in session
  const existing = session.collaborators.find(c => c.id === user.id);
  if (existing) {
    existing.isOnline = true;
    existing.lastSeen = new Date();
    return session;
  }

  // Add new collaborator
  const collaborator: Collaborator = {
    ...user,
    isOnline: true,
    lastSeen: new Date(),
  };

  session.collaborators.push(collaborator);

  // Track activity
  session.activity.push({
    id: `activity-${Date.now()}`,
    type: 'join',
    userId: user.id,
    userName: user.name,
    timestamp: new Date(),
  });

  // Emit event
  emitSyncEvent({
    type: 'collaborator:join',
    sessionId: session.id,
    userId: user.id,
    timestamp: new Date(),
    payload: collaborator,
  });

  return session;
}

export function leaveSession(buildId: string, userId: string): void {
  const session = activeSessions.get(buildId);
  if (!session) return;

  const collaborator = session.collaborators.find(c => c.id === userId);
  if (collaborator) {
    collaborator.isOnline = false;
    collaborator.lastSeen = new Date();

    session.activity.push({
      id: `activity-${Date.now()}`,
      type: 'leave',
      userId,
      userName: collaborator.name,
      timestamp: new Date(),
    });

    emitSyncEvent({
      type: 'collaborator:leave',
      sessionId: session.id,
      userId,
      timestamp: new Date(),
      payload: { userId },
    });
  }
}

// ============================================
// CURSOR SHARING
// ============================================

export function updateCursor(
  buildId: string,
  userId: string,
  cursor: CursorPosition
): void {
  const session = activeSessions.get(buildId);
  if (!session) return;

  const collaborator = session.collaborators.find(c => c.id === userId) ||
    (session.owner.id === userId ? session.owner : null);

  if (collaborator) {
    collaborator.cursor = cursor;
    collaborator.focusedFile = cursor.file;

    emitSyncEvent({
      type: 'collaborator:cursor',
      sessionId: session.id,
      userId,
      timestamp: new Date(),
      payload: cursor,
    });
  }
}

// ============================================
// COMMENTS
// ============================================

const sessionComments = new Map<string, Comment[]>();

export function addComment(
  buildId: string,
  comment: Omit<Comment, 'id' | 'timestamp' | 'resolved' | 'replies'>
): Comment {
  const comments = sessionComments.get(buildId) || [];

  const newComment: Comment = {
    ...comment,
    id: `comment-${Date.now()}`,
    timestamp: new Date(),
    resolved: false,
    replies: [],
  };

  comments.push(newComment);
  sessionComments.set(buildId, comments);

  // Track activity
  const session = activeSessions.get(buildId);
  if (session) {
    session.activity.push({
      id: `activity-${Date.now()}`,
      type: 'comment',
      userId: comment.userId,
      userName: comment.userName,
      timestamp: new Date(),
      data: { commentId: newComment.id },
    });
  }

  emitSyncEvent({
    type: 'comment:add',
    sessionId: session?.id || buildId,
    userId: comment.userId,
    timestamp: new Date(),
    payload: newComment,
  });

  return newComment;
}

export function getComments(buildId: string): Comment[] {
  return sessionComments.get(buildId) || [];
}

export function resolveComment(buildId: string, commentId: string): void {
  const comments = sessionComments.get(buildId) || [];
  const comment = comments.find(c => c.id === commentId);
  if (comment) {
    comment.resolved = true;
  }
}

// ============================================
// SHARE LINKS
// ============================================

export function generateShareLink(
  buildId: string,
  options: { role: UserRole; expiresIn?: number }
): string {
  const session = activeSessions.get(buildId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Generate a unique token
  const token = generateToken();
  const expiresAt = options.expiresIn
    ? Date.now() + options.expiresIn
    : undefined;

  // Store share link (in production, would be in database)
  session.shareLink = `https://forge.ai/join/${buildId}?token=${token}&role=${options.role}`;

  return session.shareLink;
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ============================================
// PRESENCE INDICATORS
// ============================================

export function getOnlineCollaborators(buildId: string): Collaborator[] {
  const session = activeSessions.get(buildId);
  if (!session) return [];

  const all = [session.owner, ...session.collaborators];
  return all.filter(c => c.isOnline);
}

export function getCollaboratorsByFile(
  buildId: string,
  filePath: string
): Collaborator[] {
  const session = activeSessions.get(buildId);
  if (!session) return [];

  const all = [session.owner, ...session.collaborators];
  return all.filter(c => c.isOnline && c.focusedFile === filePath);
}

// ============================================
// EVENT SYSTEM
// ============================================

export function onSyncEvent(buildId: string, handler: SyncEventHandler): () => void {
  const handlers = eventHandlers.get(buildId) || [];
  handlers.push(handler);
  eventHandlers.set(buildId, handlers);

  return () => {
    const current = eventHandlers.get(buildId) || [];
    eventHandlers.set(buildId, current.filter(h => h !== handler));
  };
}

function emitSyncEvent(event: SyncEvent): void {
  const buildId = event.sessionId.replace('collab-', '').split('-')[0];
  const handlers = eventHandlers.get(buildId) || [];
  handlers.forEach(handler => handler(event));
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface CollabNotification {
  id: string;
  buildId: string;
  type: 'mention' | 'comment' | 'approval_needed' | 'deploy_complete' | 'invited';
  title: string;
  message: string;
  userId: string;
  read: boolean;
  timestamp: Date;
  actionUrl?: string;
}

const notifications = new Map<string, CollabNotification[]>();

export function sendNotification(
  userId: string,
  notification: Omit<CollabNotification, 'id' | 'read' | 'timestamp'>
): void {
  const userNotifications = notifications.get(userId) || [];

  userNotifications.push({
    ...notification,
    id: `notif-${Date.now()}`,
    read: false,
    timestamp: new Date(),
  });

  notifications.set(userId, userNotifications);
}

export function getUserNotifications(userId: string): CollabNotification[] {
  return notifications.get(userId) || [];
}

export function markNotificationRead(userId: string, notificationId: string): void {
  const userNotifications = notifications.get(userId) || [];
  const notification = userNotifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
  }
}
