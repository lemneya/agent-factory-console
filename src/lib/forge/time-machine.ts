/**
 * Forge Version Time Machine
 *
 * Snapshot at every step, fork and revert anytime.
 * Never lose work, always can go back.
 *
 * KILLER FEATURE #5: Zero-risk building
 */

export interface Snapshot {
  id: string;
  buildId: string;
  version: number;
  name: string;
  description?: string;
  timestamp: Date;
  trigger: SnapshotTrigger;
  files: FileSnapshot[];
  metadata: SnapshotMetadata;
  parentId?: string; // For branching
  tags: string[];
}

export type SnapshotTrigger =
  | 'auto'           // Automatic checkpoint
  | 'workstream'     // After workstream completion
  | 'wave'           // After execution wave
  | 'manual'         // User-triggered
  | 'before_deploy'  // Pre-deployment
  | 'merge'          // After merge
  | 'rollback';      // After rollback

export interface FileSnapshot {
  path: string;
  content: string;
  hash: string; // SHA-256 of content
  size: number;
  lastModified: Date;
  createdBy: string; // Agent or user ID
}

export interface SnapshotMetadata {
  workstreamsCompleted: string[];
  agentsInvolved: string[];
  totalFiles: number;
  totalSize: number;
  buildStatus: string;
  executionTime: number; // ms from build start
}

export interface SnapshotDiff {
  fromSnapshot: string;
  toSnapshot: string;
  addedFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
  fileDiffs: FileDiff[];
}

export interface FileDiff {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
}

// ============================================
// TIMELINE
// ============================================

export interface Timeline {
  buildId: string;
  snapshots: Snapshot[];
  currentVersion: number;
  branches: Branch[];
}

export interface Branch {
  id: string;
  name: string;
  parentSnapshotId: string;
  createdAt: Date;
  snapshots: Snapshot[];
  isMerged: boolean;
}

// ============================================
// SNAPSHOT STORAGE
// ============================================

const timelines = new Map<string, Timeline>();

export function createTimeline(buildId: string): Timeline {
  const timeline: Timeline = {
    buildId,
    snapshots: [],
    currentVersion: 0,
    branches: [],
  };

  timelines.set(buildId, timeline);
  return timeline;
}

export function getTimeline(buildId: string): Timeline | undefined {
  return timelines.get(buildId);
}

// ============================================
// SNAPSHOT OPERATIONS
// ============================================

export function createSnapshot(
  buildId: string,
  files: Record<string, string>,
  trigger: SnapshotTrigger,
  options: {
    name?: string;
    description?: string;
    workstreamsCompleted?: string[];
    agentsInvolved?: string[];
    tags?: string[];
  } = {}
): Snapshot {
  const timeline = timelines.get(buildId);
  if (!timeline) {
    throw new Error(`No timeline for build ${buildId}`);
  }

  const version = timeline.snapshots.length + 1;
  const fileSnapshots = createFileSnapshots(files);

  const snapshot: Snapshot = {
    id: `snapshot-${buildId}-v${version}`,
    buildId,
    version,
    name: options.name || `Version ${version}`,
    description: options.description,
    timestamp: new Date(),
    trigger,
    files: fileSnapshots,
    metadata: {
      workstreamsCompleted: options.workstreamsCompleted || [],
      agentsInvolved: options.agentsInvolved || [],
      totalFiles: fileSnapshots.length,
      totalSize: fileSnapshots.reduce((sum, f) => sum + f.size, 0),
      buildStatus: 'in_progress',
      executionTime: Date.now() - timeline.snapshots[0]?.timestamp.getTime() || 0,
    },
    parentId: timeline.snapshots[timeline.snapshots.length - 1]?.id,
    tags: options.tags || [],
  };

  timeline.snapshots.push(snapshot);
  timeline.currentVersion = version;

  return snapshot;
}

function createFileSnapshots(files: Record<string, string>): FileSnapshot[] {
  return Object.entries(files).map(([path, content]) => ({
    path,
    content,
    hash: hashContent(content),
    size: new Blob([content]).size,
    lastModified: new Date(),
    createdBy: 'forge-agent',
  }));
}

function hashContent(content: string): string {
  // Simplified hash (in production, use crypto.subtle.digest)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

// ============================================
// TIME TRAVEL
// ============================================

export function getSnapshot(buildId: string, version: number): Snapshot | undefined {
  const timeline = timelines.get(buildId);
  return timeline?.snapshots.find(s => s.version === version);
}

export function getSnapshotById(buildId: string, snapshotId: string): Snapshot | undefined {
  const timeline = timelines.get(buildId);
  return timeline?.snapshots.find(s => s.id === snapshotId);
}

export function getLatestSnapshot(buildId: string): Snapshot | undefined {
  const timeline = timelines.get(buildId);
  if (!timeline || timeline.snapshots.length === 0) return undefined;
  return timeline.snapshots[timeline.snapshots.length - 1];
}

export function restoreSnapshot(buildId: string, version: number): {
  snapshot: Snapshot;
  files: Record<string, string>;
} {
  const snapshot = getSnapshot(buildId, version);
  if (!snapshot) {
    throw new Error(`Snapshot version ${version} not found`);
  }

  // Create a rollback snapshot before restoring
  const timeline = timelines.get(buildId)!;
  const currentFiles: Record<string, string> = {};
  const latestSnapshot = getLatestSnapshot(buildId);

  if (latestSnapshot) {
    latestSnapshot.files.forEach(f => {
      currentFiles[f.path] = f.content;
    });

    createSnapshot(buildId, currentFiles, 'rollback', {
      name: `Rollback to v${version}`,
      description: `Restored from version ${version}`,
      tags: ['rollback'],
    });
  }

  // Extract files from snapshot
  const files: Record<string, string> = {};
  snapshot.files.forEach(f => {
    files[f.path] = f.content;
  });

  // Update current version pointer
  timeline.currentVersion = version;

  return { snapshot, files };
}

// ============================================
// DIFFING
// ============================================

export function compareSnapshots(
  buildId: string,
  fromVersion: number,
  toVersion: number
): SnapshotDiff {
  const fromSnapshot = getSnapshot(buildId, fromVersion);
  const toSnapshot = getSnapshot(buildId, toVersion);

  if (!fromSnapshot || !toSnapshot) {
    throw new Error('Snapshots not found');
  }

  const fromFiles = new Map(fromSnapshot.files.map(f => [f.path, f]));
  const toFiles = new Map(toSnapshot.files.map(f => [f.path, f]));

  const addedFiles: string[] = [];
  const modifiedFiles: string[] = [];
  const deletedFiles: string[] = [];
  const fileDiffs: FileDiff[] = [];

  // Find added and modified files
  for (const [path, toFile] of toFiles) {
    const fromFile = fromFiles.get(path);
    if (!fromFile) {
      addedFiles.push(path);
      fileDiffs.push({
        path,
        type: 'added',
        additions: toFile.content.split('\n').length,
        deletions: 0,
        hunks: [],
      });
    } else if (fromFile.hash !== toFile.hash) {
      modifiedFiles.push(path);
      fileDiffs.push(computeFileDiff(path, fromFile.content, toFile.content));
    }
  }

  // Find deleted files
  for (const [path] of fromFiles) {
    if (!toFiles.has(path)) {
      deletedFiles.push(path);
      const fromFile = fromFiles.get(path)!;
      fileDiffs.push({
        path,
        type: 'deleted',
        additions: 0,
        deletions: fromFile.content.split('\n').length,
        hunks: [],
      });
    }
  }

  return {
    fromSnapshot: fromSnapshot.id,
    toSnapshot: toSnapshot.id,
    addedFiles,
    modifiedFiles,
    deletedFiles,
    fileDiffs,
  };
}

function computeFileDiff(path: string, oldContent: string, newContent: string): FileDiff {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  // Simplified diff (in production, use diff-match-patch or similar)
  let additions = 0;
  let deletions = 0;

  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    if (oldLines[i] !== newLines[i]) {
      if (i >= oldLines.length) additions++;
      else if (i >= newLines.length) deletions++;
      else {
        additions++;
        deletions++;
      }
    }
  }

  return {
    path,
    type: 'modified',
    additions,
    deletions,
    hunks: [], // Would contain actual diff hunks in production
  };
}

// ============================================
// BRANCHING
// ============================================

export function createBranch(
  buildId: string,
  fromVersion: number,
  branchName: string
): Branch {
  const timeline = timelines.get(buildId);
  if (!timeline) {
    throw new Error(`No timeline for build ${buildId}`);
  }

  const parentSnapshot = getSnapshot(buildId, fromVersion);
  if (!parentSnapshot) {
    throw new Error(`Snapshot version ${fromVersion} not found`);
  }

  const branch: Branch = {
    id: `branch-${buildId}-${branchName}-${Date.now()}`,
    name: branchName,
    parentSnapshotId: parentSnapshot.id,
    createdAt: new Date(),
    snapshots: [],
    isMerged: false,
  };

  timeline.branches.push(branch);
  return branch;
}

export function getBranches(buildId: string): Branch[] {
  const timeline = timelines.get(buildId);
  return timeline?.branches || [];
}

export function mergeBranch(buildId: string, branchId: string): Snapshot {
  const timeline = timelines.get(buildId);
  if (!timeline) {
    throw new Error(`No timeline for build ${buildId}`);
  }

  const branch = timeline.branches.find(b => b.id === branchId);
  if (!branch) {
    throw new Error(`Branch ${branchId} not found`);
  }

  // Get latest snapshot from branch
  const branchLatest = branch.snapshots[branch.snapshots.length - 1];
  if (!branchLatest) {
    throw new Error('Branch has no snapshots');
  }

  // Create merge snapshot on main timeline
  const files: Record<string, string> = {};
  branchLatest.files.forEach(f => {
    files[f.path] = f.content;
  });

  const mergeSnapshot = createSnapshot(buildId, files, 'merge', {
    name: `Merge: ${branch.name}`,
    description: `Merged branch ${branch.name}`,
    tags: ['merge', branch.name],
  });

  branch.isMerged = true;
  return mergeSnapshot;
}

// ============================================
// SEARCH & FILTER
// ============================================

export function searchSnapshots(
  buildId: string,
  query: {
    tags?: string[];
    trigger?: SnapshotTrigger;
    fromDate?: Date;
    toDate?: Date;
    searchText?: string;
  }
): Snapshot[] {
  const timeline = timelines.get(buildId);
  if (!timeline) return [];

  return timeline.snapshots.filter(snapshot => {
    if (query.tags && !query.tags.some(t => snapshot.tags.includes(t))) {
      return false;
    }
    if (query.trigger && snapshot.trigger !== query.trigger) {
      return false;
    }
    if (query.fromDate && snapshot.timestamp < query.fromDate) {
      return false;
    }
    if (query.toDate && snapshot.timestamp > query.toDate) {
      return false;
    }
    if (query.searchText) {
      const text = query.searchText.toLowerCase();
      const nameMatch = snapshot.name.toLowerCase().includes(text);
      const descMatch = snapshot.description?.toLowerCase().includes(text);
      if (!nameMatch && !descMatch) return false;
    }
    return true;
  });
}

// ============================================
// EXPORT & IMPORT
// ============================================

export interface ExportedTimeline {
  version: '1.0';
  buildId: string;
  exportedAt: Date;
  snapshots: Snapshot[];
  branches: Branch[];
}

export function exportTimeline(buildId: string): ExportedTimeline {
  const timeline = timelines.get(buildId);
  if (!timeline) {
    throw new Error(`No timeline for build ${buildId}`);
  }

  return {
    version: '1.0',
    buildId,
    exportedAt: new Date(),
    snapshots: timeline.snapshots,
    branches: timeline.branches,
  };
}

export function importTimeline(data: ExportedTimeline): Timeline {
  const timeline: Timeline = {
    buildId: data.buildId,
    snapshots: data.snapshots,
    currentVersion: data.snapshots.length,
    branches: data.branches,
  };

  timelines.set(data.buildId, timeline);
  return timeline;
}

// ============================================
// STATISTICS
// ============================================

export interface TimelineStats {
  totalSnapshots: number;
  totalBranches: number;
  totalFiles: number;
  totalSize: number;
  averageSnapshotInterval: number; // ms
  mostActiveAgent: string;
  largestSnapshot: { version: number; size: number };
}

export function getTimelineStats(buildId: string): TimelineStats {
  const timeline = timelines.get(buildId);
  if (!timeline || timeline.snapshots.length === 0) {
    return {
      totalSnapshots: 0,
      totalBranches: 0,
      totalFiles: 0,
      totalSize: 0,
      averageSnapshotInterval: 0,
      mostActiveAgent: 'none',
      largestSnapshot: { version: 0, size: 0 },
    };
  }

  const agentActivity: Record<string, number> = {};
  let largestSnapshot = { version: 0, size: 0 };

  for (const snapshot of timeline.snapshots) {
    if (snapshot.metadata.totalSize > largestSnapshot.size) {
      largestSnapshot = {
        version: snapshot.version,
        size: snapshot.metadata.totalSize,
      };
    }

    for (const agent of snapshot.metadata.agentsInvolved) {
      agentActivity[agent] = (agentActivity[agent] || 0) + 1;
    }
  }

  const mostActiveAgent = Object.entries(agentActivity)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';

  // Calculate average interval
  let totalInterval = 0;
  for (let i = 1; i < timeline.snapshots.length; i++) {
    totalInterval += timeline.snapshots[i].timestamp.getTime() -
                     timeline.snapshots[i - 1].timestamp.getTime();
  }

  const latestSnapshot = timeline.snapshots[timeline.snapshots.length - 1];

  return {
    totalSnapshots: timeline.snapshots.length,
    totalBranches: timeline.branches.length,
    totalFiles: latestSnapshot.metadata.totalFiles,
    totalSize: latestSnapshot.metadata.totalSize,
    averageSnapshotInterval: timeline.snapshots.length > 1
      ? totalInterval / (timeline.snapshots.length - 1)
      : 0,
    mostActiveAgent,
    largestSnapshot,
  };
}
