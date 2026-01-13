'use client';

import { useState, useCallback, useMemo } from 'react';

export interface PreviewPreset {
  id: string;
  name: string;
  url: string;
  isEnv?: boolean;
}

const STORAGE_KEYS = {
  PRESETS: 'afc_preview_presets',
  ACTIVE_PRESET_ID: 'afc_preview_active_preset_id',
  PATH: 'afc_preview_path',
};

const DEFAULT_PRESETS: PreviewPreset[] = [
  { id: 'local', name: 'Local', url: 'http://localhost:3000' },
  { id: 'manus', name: 'Manus', url: '' },
  { id: 'staging', name: 'Staging', url: '' },
];

function getEnvPreset(): PreviewPreset | null {
  if (typeof window === 'undefined') return null;
  const envUrl = process.env.NEXT_PUBLIC_PREVIEW_URL;
  if (envUrl) {
    return { id: 'env', name: 'ENV', url: envUrl, isEnv: true };
  }
  return null;
}

function getStoredPresets(): PreviewPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (stored) {
      return JSON.parse(stored) as PreviewPreset[];
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function initializePresets(): PreviewPreset[] {
  if (typeof window === 'undefined') return DEFAULT_PRESETS;

  const envPreset = getEnvPreset();
  const storedPresets = getStoredPresets();

  if (storedPresets.length > 0) {
    // If we have stored presets, add ENV preset at the beginning if it exists
    if (envPreset && !storedPresets.some(p => p.id === 'env')) {
      return [envPreset, ...storedPresets];
    }
    return storedPresets;
  }

  // Initialize with defaults
  const presets = envPreset ? [envPreset, ...DEFAULT_PRESETS] : [...DEFAULT_PRESETS];
  localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets.filter(p => !p.isEnv)));
  return presets;
}

function getInitialActivePresetId(presets: PreviewPreset[]): string {
  if (typeof window === 'undefined') return presets[0]?.id || '';

  const storedActiveId = localStorage.getItem(STORAGE_KEYS.ACTIVE_PRESET_ID);
  const validPreset = presets.find(p => p.id === storedActiveId);
  if (validPreset) {
    return validPreset.id;
  }

  // Default to first preset with a URL
  const firstWithUrl = presets.find(p => p.url) || presets[0];
  if (firstWithUrl) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET_ID, firstWithUrl.id);
    return firstWithUrl.id;
  }

  return '';
}

function getInitialPath(): string {
  if (typeof window === 'undefined') return '/';
  return localStorage.getItem(STORAGE_KEYS.PATH) || '/';
}

export function usePreviewPresets() {
  // Use lazy initialization to avoid setState in effect
  const [presets, setPresets] = useState<PreviewPreset[]>(() => initializePresets());
  const [activePresetId, setActivePresetId] = useState<string>(() =>
    getInitialActivePresetId(initializePresets())
  );
  const [currentPath, setCurrentPath] = useState<string>(() => getInitialPath());

  // Always initialized since we use lazy initialization
  const isInitialized = true;

  // Get active preset object
  const activePreset = useMemo(
    () => presets.find(p => p.id === activePresetId) || null,
    [presets, activePresetId]
  );

  // Get full preview URL
  const getPreviewUrl = useCallback(
    (path?: string) => {
      if (!activePreset || !activePreset.url) return '';
      const targetPath = path ?? currentPath;
      return `${activePreset.url}${targetPath}`;
    },
    [activePreset, currentPath]
  );

  // Select a preset
  const selectPreset = useCallback((presetId: string) => {
    setActivePresetId(presetId);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PRESET_ID, presetId);
  }, []);

  // Set current path
  const setPath = useCallback((path: string) => {
    setCurrentPath(path);
    localStorage.setItem(STORAGE_KEYS.PATH, path);
  }, []);

  // Save presets to localStorage
  const savePresets = useCallback((newPresets: PreviewPreset[]) => {
    // Filter out ENV preset before saving (it's dynamically added)
    const presetsToSave = newPresets.filter(p => !p.isEnv);
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presetsToSave));

    // Re-add ENV preset if it exists
    const envPreset = getEnvPreset();
    const finalPresets = envPreset
      ? [envPreset, ...presetsToSave.filter(p => p.id !== 'env')]
      : presetsToSave;
    setPresets(finalPresets);
  }, []);

  // Add a new preset
  const addPreset = useCallback(
    (preset: Omit<PreviewPreset, 'id'>) => {
      const newPreset: PreviewPreset = {
        ...preset,
        id: `preset-${Date.now()}`,
      };
      const newPresets = [...presets.filter(p => !p.isEnv), newPreset];
      savePresets(newPresets);
      return newPreset;
    },
    [presets, savePresets]
  );

  // Update a preset
  const updatePreset = useCallback(
    (id: string, updates: Partial<PreviewPreset>) => {
      const newPresets = presets.map(p => (p.id === id && !p.isEnv ? { ...p, ...updates } : p));
      savePresets(newPresets);
    },
    [presets, savePresets]
  );

  // Delete a preset
  const deletePreset = useCallback(
    (id: string) => {
      const preset = presets.find(p => p.id === id);
      if (preset?.isEnv) return; // Cannot delete ENV preset

      const newPresets = presets.filter(p => p.id !== id);
      savePresets(newPresets);

      // If we deleted the active preset, select another
      if (activePresetId === id && newPresets.length > 0) {
        selectPreset(newPresets[0].id);
      }
    },
    [presets, activePresetId, savePresets, selectPreset]
  );

  return {
    presets,
    activePreset,
    activePresetId,
    currentPath,
    isInitialized,
    getPreviewUrl,
    selectPreset,
    setPath,
    addPreset,
    updatePreset,
    deletePreset,
    savePresets,
  };
}
