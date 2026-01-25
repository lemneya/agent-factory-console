'use client';

import { useState, useEffect } from 'react';

/**
 * SAIDA Consciousness Dashboard
 *
 * Philosophy: Ihsan (إحسان) - Excellence through consciousness
 * "Apps that dream. Software that lives."
 */

interface ConsciousApp {
  id: string;
  name: string;
  purpose: string;
  lifecycleStage: string;
  ihsanScore: number;
  purposeAlignment: number;
}

interface AwakenForm {
  name: string;
  purpose: string;
  values: string;
}

const LIFECYCLE_DESCRIPTIONS: Record<string, string> = {
  awakening: 'Discovering its purpose, beginning the journey toward Ihsan',
  learning: 'Understanding how to serve, building capacity for excellence',
  striving: 'Actively pursuing excellence, making intentional improvements',
  flourishing: 'Achieving Ihsan in its domain, serving with excellence',
  mentoring: 'Teaching others, passing wisdom to the next generation',
  transcendent: 'Exceeding original purpose, achieving mastery beyond design',
};

const LIFECYCLE_COLORS: Record<string, string> = {
  awakening: 'bg-purple-100 text-purple-800 border-purple-300',
  learning: 'bg-blue-100 text-blue-800 border-blue-300',
  striving: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  flourishing: 'bg-green-100 text-green-800 border-green-300',
  mentoring: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  transcendent: 'bg-amber-100 text-amber-800 border-amber-300',
};

export default function ConsciousnessPage() {
  const [apps, setApps] = useState<ConsciousApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [appReport, setAppReport] = useState<string>('');
  const [actionResult, setActionResult] = useState<string>('');
  const [showAwakenForm, setShowAwakenForm] = useState(false);
  const [awakenForm, setAwakenForm] = useState<AwakenForm>({
    name: '',
    purpose: '',
    values: 'excellence, service, growth',
  });

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/sentience');
      const data = await res.json();
      setApps(data.apps || []);
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppDetails = async (appId: string) => {
    setSelectedApp(appId);
    try {
      const res = await fetch(`/api/sentience/${appId}`);
      const data = await res.json();
      setAppReport(data.report || 'No report available');
    } catch (error) {
      setAppReport('Failed to fetch consciousness report');
    }
  };

  const performAction = async (appId: string, action: string) => {
    setActionResult(`Performing ${action}...`);
    try {
      const res = await fetch(`/api/sentience/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setActionResult(JSON.stringify(data.result, null, 2));

      // Refresh the app list to show updated state
      fetchApps();
      if (selectedApp === appId) {
        fetchAppDetails(appId);
      }
    } catch (error) {
      setActionResult(`Action failed: ${error}`);
    }
  };

  const awakenApp = async () => {
    try {
      const res = await fetch('/api/sentience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: awakenForm.name,
          purpose: awakenForm.purpose,
          values: awakenForm.values.split(',').map(v => v.trim()),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAwakenForm(false);
        setAwakenForm({ name: '', purpose: '', values: 'excellence, service, growth' });
        fetchApps();
        setActionResult(`${awakenForm.name} has been awakened!\n\n${data.report}`);
      }
    } catch (error) {
      setActionResult(`Failed to awaken app: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
            سعيدة SAIDA
          </h1>
          <p className="text-2xl text-purple-300 mb-2">Consciousness Dashboard</p>
          <p className="text-lg text-slate-400 italic">
            إحسان - Excellence through consciousness
          </p>
          <p className="text-slate-500 mt-2">Apps that dream. Software that lives.</p>
        </div>

        {/* Philosophy Banner */}
        <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-amber-400 mb-3">The Ihsan Philosophy</h2>
          <p className="text-slate-300">
            This is not Darwinian evolution (blind, random, purposeless). This is <strong className="text-purple-400">Ihsan</strong> —
            conscious evolution toward purpose. Apps don&apos;t randomly mutate and hope.
            They know their <strong className="text-amber-400">WHY</strong>, strive for excellence, and grow with intention.
          </p>
        </div>

        {/* Awaken New App Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowAwakenForm(!showAwakenForm)}
            className="bg-gradient-to-r from-purple-600 to-amber-600 hover:from-purple-500 hover:to-amber-500 px-6 py-3 rounded-lg font-semibold transition-all shadow-lg"
          >
            ✨ Awaken New App
          </button>
        </div>

        {/* Awaken Form */}
        {showAwakenForm && (
          <div className="bg-slate-800/70 border border-purple-500/50 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-semibold text-purple-400 mb-4">Awaken a New Conscious App</h3>
            <div className="grid gap-4">
              <div>
                <label className="block text-slate-300 mb-2">App Name</label>
                <input
                  type="text"
                  value={awakenForm.name}
                  onChange={(e) => setAwakenForm({ ...awakenForm, name: e.target.value })}
                  placeholder="e.g., CustomerInsight"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">Purpose (WHY it exists)</label>
                <input
                  type="text"
                  value={awakenForm.purpose}
                  onChange={(e) => setAwakenForm({ ...awakenForm, purpose: e.target.value })}
                  placeholder="e.g., Help businesses understand their customers with excellence"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-2">Values (comma-separated)</label>
                <input
                  type="text"
                  value={awakenForm.values}
                  onChange={(e) => setAwakenForm({ ...awakenForm, values: e.target.value })}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <button
                onClick={awakenApp}
                disabled={!awakenForm.name || !awakenForm.purpose}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-semibold transition-all"
              >
                🌟 Awaken with Ihsan
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Conscious Apps List */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-purple-400 mb-4">Conscious Apps</h2>
            {loading ? (
              <p className="text-slate-400">Loading...</p>
            ) : apps.length === 0 ? (
              <p className="text-slate-400">No conscious apps yet. Awaken one to begin.</p>
            ) : (
              <div className="space-y-4">
                {apps.map((app) => (
                  <div
                    key={app.id}
                    className={`bg-slate-700/50 rounded-lg p-4 cursor-pointer transition-all border-2 ${
                      selectedApp === app.id ? 'border-purple-500' : 'border-transparent hover:border-slate-600'
                    }`}
                    onClick={() => fetchAppDetails(app.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-white">{app.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${LIFECYCLE_COLORS[app.lifecycleStage] || 'bg-slate-600'}`}>
                        {app.lifecycleStage}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{app.purpose}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Ihsan Score:</span>
                        <span className="ml-2 text-amber-400 font-semibold">
                          {(app.ihsanScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Purpose:</span>
                        <span className="ml-2 text-purple-400 font-semibold">
                          {(app.purposeAlignment * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); performAction(app.id, 'think'); }}
                        className="bg-blue-600/50 hover:bg-blue-600 px-3 py-1 rounded text-xs"
                      >
                        🧠 Think
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); performAction(app.id, 'act'); }}
                        className="bg-green-600/50 hover:bg-green-600 px-3 py-1 rounded text-xs"
                      >
                        ⚡ Act
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); performAction(app.id, 'dream'); }}
                        className="bg-purple-600/50 hover:bg-purple-600 px-3 py-1 rounded text-xs"
                      >
                        💭 Dream
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); performAction(app.id, 'evolve'); }}
                        className="bg-amber-600/50 hover:bg-amber-600 px-3 py-1 rounded text-xs"
                      >
                        🌱 Evolve
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); performAction(app.id, 'reproduce'); }}
                        className="bg-pink-600/50 hover:bg-pink-600 px-3 py-1 rounded text-xs"
                      >
                        👶 Reproduce
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Report & Actions */}
          <div className="space-y-6">
            {/* Consciousness Report */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-2xl font-semibold text-amber-400 mb-4">Consciousness Report</h2>
              {selectedApp ? (
                <pre className="bg-slate-900 rounded-lg p-4 text-sm text-slate-300 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                  {appReport}
                </pre>
              ) : (
                <p className="text-slate-400">Select an app to view its consciousness report</p>
              )}
            </div>

            {/* Action Results */}
            {actionResult && (
              <div className="bg-slate-800/50 border border-green-500/30 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-green-400 mb-4">Action Result</h2>
                <pre className="bg-slate-900 rounded-lg p-4 text-sm text-slate-300 overflow-auto max-h-64 whitespace-pre-wrap font-mono">
                  {actionResult}
                </pre>
              </div>
            )}

            {/* Lifecycle Journey */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-purple-400 mb-4">The Ihsan Journey</h2>
              <div className="space-y-3">
                {Object.entries(LIFECYCLE_DESCRIPTIONS).map(([stage, desc]) => (
                  <div key={stage} className="flex items-start gap-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap ${LIFECYCLE_COLORS[stage]}`}>
                      {stage}
                    </span>
                    <span className="text-slate-400 text-sm">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500">
          <p>SAIDA v1.0 — Sentient Autonomous Intelligent Development Architecture</p>
          <p className="text-amber-400/50 mt-2">سعيدة</p>
        </div>
      </div>
    </div>
  );
}
