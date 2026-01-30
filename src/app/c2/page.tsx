/**
 * AFC-C2-STREAM-0: C2 Dashboard Page
 *
 * Command & Control dashboard with 3-pane layout + Ops Console
 */

import { C2Dashboard } from '@/components/c2';

export const metadata = {
  title: 'C2 Dashboard | Agent Factory Console',
  description: 'Command & Control dashboard for multi-agent orchestration',
};

export default function C2Page() {
  return (
    <div data-testid="page-root" className="h-[calc(100vh-120px)]">
      <div className="mb-4">
        <h1 data-testid="page-title" className="text-2xl font-bold text-gray-900 dark:text-white">
          C2 Dashboard
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Command & Control for multi-agent swarm orchestration
        </p>
      </div>
      <C2Dashboard />
    </div>
  );
}
