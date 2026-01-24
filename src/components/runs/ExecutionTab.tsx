'use client';

import { useState } from 'react';
import RalphModePanel from '@/components/ralph/RalphModePanel';
import { MemoryPanel } from '@/components/memory';

interface Task {
  id: string;
  title: string;
  status: string;
  assignee: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Run {
  id: string;
  name: string;
  status: string;
  ralphMode: boolean;
  project: {
    id: string;
  };
}

const COLUMNS = [
  {
    id: 'TODO',
    label: 'TODO',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    textColor: 'text-gray-700 dark:text-gray-300',
    badgeBg: 'bg-gray-200 dark:bg-gray-700',
    borderColor: 'border-gray-300 dark:border-gray-600',
  },
  {
    id: 'DOING',
    label: 'DOING',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-200 dark:bg-blue-800',
    borderColor: 'border-blue-300 dark:border-blue-700',
  },
  {
    id: 'BLOCKED',
    label: 'BLOCKED',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-300',
    badgeBg: 'bg-red-200 dark:bg-red-800',
    borderColor: 'border-red-300 dark:border-red-700',
  },
  {
    id: 'DONE',
    label: 'DONE',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    badgeBg: 'bg-green-200 dark:bg-green-800',
    borderColor: 'border-green-300 dark:border-green-700',
  },
];

interface ExecutionTabProps {
  run: Run;
  tasks: Task[];
  onMoveTask: (taskId: string, newStatus: string) => void;
  onDeleteTask: (taskId: string) => void;
  onRefresh: () => void;
}

export default function ExecutionTab({
  run,
  tasks,
  onMoveTask,
  onDeleteTask,
  onRefresh,
}: ExecutionTabProps) {
  function getTasksByStatus(status: string): Task[] {
    return tasks.filter((task) => task.status === status) || [];
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
            <svg
              className="h-5 w-5 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Execution
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Task progress, worker status, and evidence
            </p>
          </div>
        </div>
      </div>

      {/* Ralph Mode Panel */}
      <RalphModePanel
        runId={run.id}
        ralphMode={run.ralphMode}
        runStatus={run.status}
        onRefresh={onRefresh}
      />

      {/* Memory Panel */}
      <MemoryPanel runId={run.id} projectId={run.project.id} />

      {/* Kanban Board */}
      <div className="grid gap-6 md:grid-cols-4">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <div key={column.id} className={`rounded-xl p-4 ${column.bgColor}`}>
              <h3 className={`mb-4 flex items-center font-semibold ${column.textColor}`}>
                {column.label}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${column.badgeBg}`}>
                  {columnTasks.length}
                </span>
              </h3>
              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div
                    className={`rounded-lg border border-dashed p-4 text-center text-sm ${column.borderColor} ${column.textColor} opacity-60`}
                  >
                    No tasks
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      currentStatus={column.id}
                      onMove={onMoveTask}
                      onDelete={onDeleteTask}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  currentStatus: string;
  onMove: (taskId: string, newStatus: string) => void;
  onDelete: (taskId: string) => void;
}

function TaskCard({ task, currentStatus, onMove, onDelete }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const availableMoves = COLUMNS.filter((col) => col.id !== currentStatus);

  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-700">
      <div className="flex items-start justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{task.title}</h4>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded p-1 text-gray-400 opacity-0 hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100 dark:hover:bg-gray-600 dark:hover:text-gray-300"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
              />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 z-10 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
              <div className="border-b border-gray-100 px-3 py-2 text-xs font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Move to
              </div>
              {availableMoves.map((col) => (
                <button
                  key={col.id}
                  onClick={() => {
                    onMove(task.id, col.id);
                    setShowMenu(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {col.label}
                </button>
              ))}
              <div className="border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => {
                    onDelete(task.id);
                    setShowMenu(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {task.assignee && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <svg
            className="h-3 w-3"
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
          {task.assignee}
        </div>
      )}
    </div>
  );
}
