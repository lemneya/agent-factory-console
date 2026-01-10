interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, max, className = '', showLabel = false, size = 'md' }: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);
  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={className}>
      <div className={`w-full bg-dark-700 rounded-full ${heightClass} overflow-hidden`}>
        <div
          className={`${heightClass} bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5 text-xs text-dark-400">
          <span>{value} / {max} tasks</span>
          <span>{percentage}%</span>
        </div>
      )}
    </div>
  );
}
