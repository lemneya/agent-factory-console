'use client';

import { useState, useEffect, useCallback } from 'react';
import QuestionCard, { HITLQuestion } from './QuestionCard';
import PatchViewer, { HITLPatch } from './PatchViewer';

interface HITLData {
  questions?: HITLQuestion[];
  patches?: HITLPatch[];
}

interface BlockedTask {
  id: string;
  title: string;
  status: string;
  blockedReason: string | null;
  hitl: HITLData | null;
}

interface CopilotHITLPanelProps {
  runId: string;
  onTaskUnblocked?: () => void;
}

export default function CopilotHITLPanel({ runId, onTaskUnblocked }: CopilotHITLPanelProps) {
  const [blockedTasks, setBlockedTasks] = useState<BlockedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const fetchBlockedTasks = useCallback(async () => {
    try {
      // Get all tasks for the run and filter blocked ones
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) throw new Error('Failed to fetch run');

      const run = await res.json();
      const blocked = run.tasks?.filter(
        (task: { status: string }) => task.status === 'BLOCKED'
      ) || [];

      // Fetch HITL data for each blocked task
      const tasksWithHitl = await Promise.all(
        blocked.map(async (task: { id: string; title: string; status: string }) => {
          try {
            const hitlRes = await fetch(`/api/tasks/${task.id}/hitl`);
            if (hitlRes.ok) {
              const hitlData = await hitlRes.json();
              return {
                id: task.id,
                title: task.title,
                status: task.status,
                blockedReason: hitlData.blockedReason,
                hitl: hitlData.hitl,
              };
            }
          } catch {
            // Ignore errors fetching HITL data
          }
          return {
            id: task.id,
            title: task.title,
            status: task.status,
            blockedReason: null,
            hitl: null,
          };
        })
      );

      setBlockedTasks(tasksWithHitl);
      if (tasksWithHitl.length > 0 && !expandedTaskId) {
        setExpandedTaskId(tasksWithHitl[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [runId, expandedTaskId]);

  useEffect(() => {
    fetchBlockedTasks();
  }, [fetchBlockedTasks]);

  async function handleAnswerSubmit(taskId: string, questionId: string, answer: string) {
    const res = await fetch(`/api/tasks/${taskId}/hitl/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, answer }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to submit answer');
    }

    // Refresh the task data
    await fetchBlockedTasks();
  }

  async function handlePatchAction(taskId: string, patchId: string, action: 'approve' | 'reject') {
    const res = await fetch(`/api/tasks/${taskId}/hitl/patch/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patchId, action }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to process patch');
    }

    // Refresh the task data
    await fetchBlockedTasks();
  }

  async function handleUnblock(taskId: string) {
    const res = await fetch(`/api/tasks/${taskId}/hitl/unblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to unblock task');
    }

    // Refresh and notify parent
    await fetchBlockedTasks();
    onTaskUnblocked?.();
  }

  function canUnblock(task: BlockedTask): boolean {
    if (!task.hitl) return true;

    const questions = task.hitl.questions || [];
    const patches = task.hitl.patches || [];

    const allQuestionsAnswered = questions.every((q) => q.answer !== undefined);
    const allPatchesReviewed = patches.every((p) => p.status !== 'pending');

    return allQuestionsAnswered && allPatchesReviewed;
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-900/20">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          <span className="text-sm text-amber-700 dark:text-amber-300">Loading HITL requests...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (blockedTasks.length === 0) {
    return null; // Don't show panel if no blocked tasks
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-amber-200 px-4 py-3 dark:border-amber-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800">
            <svg
              className="h-4 w-4 text-amber-700 dark:text-amber-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Human Input Required
            </h3>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {blockedTasks.length} task{blockedTasks.length !== 1 ? 's' : ''} waiting for your input
            </p>
          </div>
        </div>
        <button
          onClick={fetchBlockedTasks}
          className="rounded-lg p-2 text-amber-600 hover:bg-amber-200 dark:text-amber-400 dark:hover:bg-amber-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
        </button>
      </div>

      {/* Task list */}
      <div className="divide-y divide-amber-200 dark:divide-amber-800">
        {blockedTasks.map((task) => (
          <div key={task.id} className="p-4">
            {/* Task header */}
            <button
              onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`h-4 w-4 text-amber-600 transition-transform dark:text-amber-400 ${
                    expandedTaskId === task.id ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {task.title}
                </span>
              </div>
              {canUnblock(task) && (
                <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-800 dark:text-green-200">
                  Ready to unblock
                </span>
              )}
            </button>

            {/* Blocked reason */}
            {task.blockedReason && (
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                {task.blockedReason}
              </p>
            )}

            {/* Expanded content */}
            {expandedTaskId === task.id && (
              <div className="mt-4 space-y-4">
                {/* Questions */}
                {task.hitl?.questions && task.hitl.questions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Questions
                    </h4>
                    {task.hitl.questions.map((question) => (
                      <QuestionCard
                        key={question.id}
                        question={question}
                        onAnswerSubmit={(qId, answer) => handleAnswerSubmit(task.id, qId, answer)}
                      />
                    ))}
                  </div>
                )}

                {/* Patches */}
                {task.hitl?.patches && task.hitl.patches.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Patches to Review
                    </h4>
                    {task.hitl.patches.map((patch) => (
                      <PatchViewer
                        key={patch.id}
                        patch={patch}
                        onPatchAction={(pId, action) => handlePatchAction(task.id, pId, action)}
                      />
                    ))}
                  </div>
                )}

                {/* Unblock button */}
                {canUnblock(task) && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleUnblock(task.id)}
                      className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Unblock Task
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
