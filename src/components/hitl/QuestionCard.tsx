'use client';

import { useState } from 'react';

export interface HITLQuestion {
  id: string;
  question: string;
  type: 'text' | 'choice' | 'confirm';
  options?: string[];
  answer?: string;
  answeredAt?: string;
}

interface QuestionCardProps {
  question: HITLQuestion;
  onAnswerSubmit: (questionId: string, answer: string) => Promise<void>;
  disabled?: boolean;
}

export default function QuestionCard({
  question,
  onAnswerSubmit,
  disabled = false,
}: QuestionCardProps) {
  const [answer, setAnswer] = useState(question.answer || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAnswered = question.answer !== undefined;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim() || disabled || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onAnswerSubmit(question.id, answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChoiceSelect(choice: string) {
    if (disabled || isSubmitting || isAnswered) return;

    setAnswer(choice);
    setIsSubmitting(true);
    setError(null);

    try {
      await onAnswerSubmit(question.id, choice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleConfirm(confirmed: boolean) {
    if (disabled || isSubmitting || isAnswered) return;

    const confirmAnswer = confirmed ? 'yes' : 'no';
    setAnswer(confirmAnswer);
    setIsSubmitting(true);
    setError(null);

    try {
      await onAnswerSubmit(question.id, confirmAnswer);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        isAnswered
          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
          : 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isAnswered
              ? 'bg-green-200 dark:bg-green-800'
              : 'bg-amber-200 dark:bg-amber-800'
          }`}
        >
          {isAnswered ? (
            <svg
              className="h-4 w-4 text-green-700 dark:text-green-300"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
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
          )}
        </div>
        <div className="flex-1">
          <p
            className={`text-sm font-medium ${
              isAnswered
                ? 'text-green-800 dark:text-green-200'
                : 'text-amber-800 dark:text-amber-200'
            }`}
          >
            {question.question}
          </p>

          {error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}

          {isAnswered ? (
            <div className="mt-3">
              <p className="text-xs text-green-600 dark:text-green-400">
                Answered: <span className="font-medium">{question.answer}</span>
              </p>
              {question.answeredAt && (
                <p className="mt-1 text-xs text-green-500 dark:text-green-500">
                  {new Date(question.answeredAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : question.type === 'text' ? (
            <form onSubmit={handleSubmit} className="mt-3">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-amber-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500"
                rows={2}
                disabled={disabled || isSubmitting}
              />
              <button
                type="submit"
                disabled={!answer.trim() || disabled || isSubmitting}
                className="mt-2 rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            </form>
          ) : question.type === 'choice' && question.options ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {question.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleChoiceSelect(option)}
                  disabled={disabled || isSubmitting}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-700 dark:bg-gray-800 dark:text-amber-300 dark:hover:bg-amber-900/30"
                >
                  {option}
                </button>
              ))}
            </div>
          ) : question.type === 'confirm' ? (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => handleConfirm(true)}
                disabled={disabled || isSubmitting}
                className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Yes
              </button>
              <button
                onClick={() => handleConfirm(false)}
                disabled={disabled || isSubmitting}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                No
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
