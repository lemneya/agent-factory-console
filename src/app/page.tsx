import Link from 'next/link';
import { NAV_ITEMS } from '@/config/nav';

// Color mapping for visual variety in dashboard cards
const colorMap: Record<string, { border: string; bg: string; text: string; hover: string }> = {
  dashboard: { border: 'border-gray-300', bg: 'bg-gray-50', text: 'text-gray-600', hover: 'hover:border-gray-400' },
  projects: { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-600', hover: 'hover:border-blue-400' },
  runs: { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-600', hover: 'hover:border-green-400' },
  blueprints: { border: 'border-indigo-300', bg: 'bg-indigo-50', text: 'text-indigo-600', hover: 'hover:border-indigo-400' },
  workorders: { border: 'border-cyan-300', bg: 'bg-cyan-50', text: 'text-cyan-600', hover: 'hover:border-cyan-400' },
  assets: { border: 'border-amber-300', bg: 'bg-amber-50', text: 'text-amber-600', hover: 'hover:border-amber-400' },
  council: { border: 'border-rose-300', bg: 'bg-rose-50', text: 'text-rose-600', hover: 'hover:border-rose-400' },
  memory: { border: 'border-violet-300', bg: 'bg-violet-50', text: 'text-violet-600', hover: 'hover:border-violet-400' },
  audit: { border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-600', hover: 'hover:border-slate-400' },
  notifications: { border: 'border-purple-300', bg: 'bg-purple-50', text: 'text-purple-600', hover: 'hover:border-purple-400' },
};

// Filter out dashboard from quick links (we're already on it)
const quickLinkItems = NAV_ITEMS.filter(item => item.key !== 'dashboard');

export default function Home() {
  return (
    <div data-testid="page-root">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="page-title">
          Dashboard
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Single pane of glass for multi-agent AI development
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quickLinkItems.map(item => {
          const colors = colorMap[item.key] || colorMap.projects;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              data-testid={`quick-link-${item.key}`}
              className={`group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all ${colors.hover} hover:shadow-md dark:border-gray-700 dark:bg-gray-800`}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg ${colors.bg} ${colors.text} dark:bg-opacity-20`}>
                <Icon className="h-6 w-6" />
              </div>
              <h2 className={`text-lg font-semibold text-gray-900 group-hover:${colors.text} dark:text-white`}>
                {item.label}
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {item.description}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
