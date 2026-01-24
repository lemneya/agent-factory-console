'use client';

import { useState } from 'react';
import { STARTER_TEMPLATES, calculateTimeSavings, type StarterTemplate } from '@/lib/forge';

interface ForgeStarterGalleryProps {
  onSelectStarter: (starter: StarterTemplate) => void;
  onCustomBuild: () => void;
}

const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  saas: { icon: '🚀', label: 'SaaS', color: 'from-violet-500 to-purple-600' },
  ecommerce: { icon: '🛒', label: 'E-commerce', color: 'from-emerald-500 to-green-600' },
  dashboard: { icon: '📊', label: 'Dashboard', color: 'from-blue-500 to-cyan-600' },
  blog: { icon: '📝', label: 'Blog', color: 'from-orange-500 to-amber-600' },
  landing: { icon: '🎯', label: 'Landing', color: 'from-pink-500 to-rose-600' },
  ai: { icon: '🤖', label: 'AI App', color: 'from-indigo-500 to-blue-600' },
  marketplace: { icon: '🏪', label: 'Marketplace', color: 'from-teal-500 to-emerald-600' },
  community: { icon: '👥', label: 'Community', color: 'from-fuchsia-500 to-pink-600' },
  api: { icon: '⚡', label: 'API', color: 'from-yellow-500 to-orange-600' },
  mobile: { icon: '📱', label: 'Mobile', color: 'from-cyan-500 to-blue-600' },
};

export default function ForgeStarterGallery({ onSelectStarter, onCustomBuild }: ForgeStarterGalleryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Group starters by category
  const categories = [...new Set(STARTER_TEMPLATES.map(s => s.category))];

  // Filter starters by selected category
  const filteredStarters = selectedCategory
    ? STARTER_TEMPLATES.filter(s => s.category === selectedCategory)
    : STARTER_TEMPLATES;

  // Sort by stars (popularity)
  const sortedStarters = [...filteredStarters].sort((a, b) => (b.stars || 0) - (a.stars || 0));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Start with a Template
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            One click to start • 90%+ time saved
          </p>
        </div>
        <button
          onClick={onCustomBuild}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          or describe your own →
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
            selectedCategory === null
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {categories.map(cat => {
          const config = CATEGORY_CONFIG[cat] || { icon: '📦', label: cat, color: 'from-gray-500 to-gray-600' };
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                selectedCategory === cat
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {config.icon} {config.label}
            </button>
          );
        })}
      </div>

      {/* Starter Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sortedStarters.slice(0, 9).map(starter => {
          const config = CATEGORY_CONFIG[starter.category] || { icon: '📦', label: starter.category, color: 'from-gray-500 to-gray-600' };
          const savings = calculateTimeSavings(starter.estimatedCustomizationMinutes);
          const isHovered = hoveredId === starter.id;

          return (
            <div
              key={starter.id}
              className="relative group"
              onMouseEnter={() => setHoveredId(starter.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                onClick={() => onSelectStarter(starter)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  isHovered
                    ? 'border-blue-500 shadow-lg scale-[1.02]'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                } bg-white dark:bg-gray-900`}
              >
                {/* Category Badge */}
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${config.color}`}>
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </div>

                {/* Template Name */}
                <h4 className="mt-2 font-semibold text-gray-900 dark:text-white truncate">
                  {starter.name}
                </h4>

                {/* Description */}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                  {starter.description}
                </p>

                {/* Stats */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {starter.stars && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ⭐ {(starter.stars / 1000).toFixed(0)}k
                      </span>
                    )}
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {starter.estimatedCustomizationMinutes}min
                    </span>
                  </div>
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">
                    {savings.savedPercent}% ⚡
                  </span>
                </div>

                {/* Hover overlay with features */}
                {isHovered && (
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-gray-900/95 via-gray-900/80 to-transparent p-4 flex flex-col justify-end">
                    <p className="text-xs font-medium text-white mb-2">Includes:</p>
                    <div className="flex flex-wrap gap-1">
                      {starter.features.slice(0, 4).map((feature, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs rounded-full bg-white/20 text-white"
                        >
                          {feature.length > 20 ? feature.slice(0, 20) + '...' : feature}
                        </span>
                      ))}
                      {starter.features.length > 4 && (
                        <span className="px-2 py-0.5 text-xs text-white/70">
                          +{starter.features.length - 4} more
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-white/70">
                        {starter.techStack.framework}
                      </span>
                      <span className="text-xs font-bold text-green-400">
                        Click to start →
                      </span>
                    </div>
                  </div>
                )}
              </button>
            </div>
          );
        })}

        {/* Custom Build Card */}
        <button
          onClick={onCustomBuild}
          className="p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-colors bg-gray-50 dark:bg-gray-800/50 text-left group"
        >
          <div className="flex items-center justify-center h-full min-h-[120px]">
            <div className="text-center">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">✨</div>
              <p className="font-medium text-gray-700 dark:text-gray-300">Custom Build</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Describe your app
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* View All Link */}
      {filteredStarters.length > 9 && (
        <div className="text-center">
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View all {filteredStarters.length} templates →
          </button>
        </div>
      )}
    </div>
  );
}
