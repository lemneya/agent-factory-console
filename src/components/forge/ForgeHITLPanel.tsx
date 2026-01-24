'use client';

import { useState } from 'react';

export interface ForgeHITLQuestion {
  id: string;
  workstreamId: string;
  question: string;
  type: 'text' | 'choice' | 'confirm';
  options?: string[];
  answer?: string;
  answeredAt?: Date;
}

interface ForgeHITLPanelProps {
  questions: ForgeHITLQuestion[];
  onAnswer: (questionId: string, answer: string) => Promise<void>;
}

export default function ForgeHITLPanel({ questions, onAnswer }: ForgeHITLPanelProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const pendingQuestions = questions.filter((q) => !q.answer);
  const answeredQuestions = questions.filter((q) => q.answer);

  const handleSubmit = async (questionId: string, answer: string) => {
    setSubmitting(questionId);
    try {
      await onAnswer(questionId, answer);
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setSubmitting(null);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Human-in-the-Loop
        </h3>
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <div className="text-3xl mb-2">👍</div>
          <p className="text-sm">No questions from agents</p>
          <p className="text-xs mt-1">Agents will ask when they need human guidance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Human-in-the-Loop
        </h3>
        {pendingQuestions.length > 0 && (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            {pendingQuestions.length} pending
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Pending questions */}
        {pendingQuestions.map((question) => (
          <div
            key={question.id}
            className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800">
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
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                  From: {question.workstreamId}
                </p>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  {question.question}
                </p>

                {/* Answer input based on type */}
                {question.type === 'text' && (
                  <div className="mt-3">
                    <textarea
                      value={answers[question.id] || ''}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                      }
                      placeholder="Type your answer..."
                      className="w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                      rows={2}
                      disabled={submitting === question.id}
                    />
                    <button
                      onClick={() => handleSubmit(question.id, answers[question.id] || '')}
                      disabled={!answers[question.id]?.trim() || submitting === question.id}
                      className="mt-2 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {submitting === question.id ? 'Sending...' : 'Submit'}
                    </button>
                  </div>
                )}

                {question.type === 'choice' && question.options && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {question.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleSubmit(question.id, option)}
                        disabled={submitting === question.id}
                        className="rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 disabled:opacity-50"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {question.type === 'confirm' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleSubmit(question.id, 'yes')}
                      disabled={submitting === question.id}
                      className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleSubmit(question.id, 'no')}
                      disabled={submitting === question.id}
                      className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Answered questions (collapsed) */}
        {answeredQuestions.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Previously Answered ({answeredQuestions.length})
            </p>
            <div className="space-y-2">
              {answeredQuestions.slice(0, 3).map((question) => (
                <div
                  key={question.id}
                  className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs"
                >
                  <p className="text-gray-600 dark:text-gray-400 truncate">
                    Q: {question.question}
                  </p>
                  <p className="text-green-600 dark:text-green-400">
                    A: {question.answer}
                  </p>
                </div>
              ))}
              {answeredQuestions.length > 3 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  +{answeredQuestions.length - 3} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
