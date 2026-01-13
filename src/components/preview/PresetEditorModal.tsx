'use client';

import { useState, useMemo, useCallback } from 'react';
import type { PreviewPreset } from './usePreviewPresets';

interface PresetEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  presets: PreviewPreset[];
  onSave: (presets: PreviewPreset[]) => void;
}

interface EditablePreset extends PreviewPreset {
  nameError?: string;
  urlError?: string;
}

function validateUrl(url: string): string | undefined {
  if (!url) return undefined; // Empty URL is allowed
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'URL must start with http:// or https://';
  }
  return undefined;
}

function validateName(name: string): string | undefined {
  if (!name.trim()) {
    return 'Name is required';
  }
  return undefined;
}

export function PresetEditorModal({ isOpen, onClose, presets, onSave }: PresetEditorModalProps) {
  // Use a key to reset state when modal opens with new presets
  const [resetKey, setResetKey] = useState(0);

  // Initialize editable presets from props using useMemo
  const initialPresets = useMemo(
    () => presets.map(p => ({ ...p })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [presets, resetKey]
  );

  const [editablePresets, setEditablePresets] = useState<EditablePreset[]>(initialPresets);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset state when presets change
  const handleReset = useCallback(() => {
    setEditablePresets(presets.map(p => ({ ...p })));
    setHasChanges(false);
    setResetKey(k => k + 1);
  }, [presets]);

  if (!isOpen) return null;

  const handleNameChange = (id: string, name: string) => {
    setEditablePresets(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              name,
              nameError: validateName(name),
            }
          : p
      )
    );
    setHasChanges(true);
  };

  const handleUrlChange = (id: string, url: string) => {
    setEditablePresets(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              url,
              urlError: validateUrl(url),
            }
          : p
      )
    );
    setHasChanges(true);
  };

  const handleAddPreset = () => {
    const newPreset: EditablePreset = {
      id: `preset-${Date.now()}`,
      name: '',
      url: '',
      nameError: 'Name is required',
    };
    setEditablePresets(prev => [...prev, newPreset]);
    setHasChanges(true);
  };

  const handleDeletePreset = (id: string) => {
    const preset = editablePresets.find(p => p.id === id);
    if (preset?.isEnv) return; // Cannot delete ENV preset

    setEditablePresets(prev => prev.filter(p => p.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate all presets
    let hasErrors = false;
    const validated = editablePresets.map(p => {
      const nameError = validateName(p.name);
      const urlError = validateUrl(p.url);
      if (nameError || urlError) hasErrors = true;
      return { ...p, nameError, urlError };
    });

    if (hasErrors) {
      setEditablePresets(validated);
      return;
    }

    // Save without error fields
    const cleanPresets: PreviewPreset[] = validated.map(p => {
      const { nameError, urlError, ...rest } = p;
      // Suppress unused variable warnings
      void nameError;
      void urlError;
      return rest;
    });
    onSave(cleanPresets);
    onClose();
  };

  const handleCancel = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-gray-800"
        data-testid="preset-editor-modal"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Presets</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            data-testid="close-modal-btn"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {editablePresets.map(preset => (
              <div
                key={preset.id}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                data-testid={`preset-row-${preset.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        Name
                      </label>
                      <input
                        type="text"
                        value={preset.name}
                        onChange={e => handleNameChange(preset.id, e.target.value)}
                        disabled={preset.isEnv}
                        className={`w-full rounded border px-3 py-2 text-sm ${
                          preset.nameError
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                        } disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800`}
                        placeholder="Preset name"
                        data-testid="preset-name-input"
                      />
                      {preset.nameError && (
                        <p className="mt-1 text-xs text-red-500">{preset.nameError}</p>
                      )}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                        URL
                      </label>
                      <input
                        type="text"
                        value={preset.url}
                        onChange={e => handleUrlChange(preset.id, e.target.value)}
                        disabled={preset.isEnv}
                        className={`w-full rounded border px-3 py-2 text-sm ${
                          preset.urlError
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600'
                        } disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800`}
                        placeholder="https://example.com"
                        data-testid="preset-url-input"
                      />
                      {preset.urlError && (
                        <p className="mt-1 text-xs text-red-500">{preset.urlError}</p>
                      )}
                    </div>
                  </div>
                  {!preset.isEnv && (
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="mt-6 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      title="Delete preset"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                  {preset.isEnv && (
                    <span className="mt-6 rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      ENV
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddPreset}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:border-blue-500 hover:text-blue-600 dark:border-gray-600 dark:hover:border-blue-400 dark:hover:text-blue-400"
            data-testid="add-preset-btn"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Preset
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            data-testid="preset-save"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
