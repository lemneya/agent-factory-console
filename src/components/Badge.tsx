import { ProjectStatus, RunStatus, NotificationType } from '../types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-dark-700 text-dark-200',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  error: 'bg-red-500/10 text-red-400 border border-red-500/20',
  info: 'bg-primary-500/10 text-primary-400 border border-primary-500/20',
  neutral: 'bg-dark-600 text-dark-300 border border-dark-500',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-dark-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  error: 'bg-red-400',
  info: 'bg-primary-400',
  neutral: 'bg-dark-400',
};

export function Badge({ variant = 'default', children, dot, pulse }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${variantStyles[variant]}`}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotStyles[variant]}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotStyles[variant]}`} />
        </span>
      )}
      {children}
    </span>
  );
}

export function getProjectStatusVariant(status: ProjectStatus): BadgeVariant {
  switch (status) {
    case 'active':
      return 'success';
    case 'paused':
      return 'warning';
    case 'completed':
      return 'info';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
}

export function getRunStatusVariant(status: RunStatus): BadgeVariant {
  switch (status) {
    case 'running':
      return 'success';
    case 'pending':
      return 'warning';
    case 'completed':
      return 'info';
    case 'failed':
      return 'error';
    case 'cancelled':
      return 'neutral';
    default:
      return 'default';
  }
}

export function getNotificationVariant(type: NotificationType): BadgeVariant {
  switch (type) {
    case 'success':
      return 'success';
    case 'warning':
      return 'warning';
    case 'error':
      return 'error';
    case 'info':
      return 'info';
    default:
      return 'default';
  }
}
