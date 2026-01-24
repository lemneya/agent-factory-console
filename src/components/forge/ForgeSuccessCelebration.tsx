'use client';

import { useEffect, useState, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  rotationSpeed: number;
  shape: 'square' | 'circle' | 'triangle';
}

interface ForgeSuccessCelebrationProps {
  show: boolean;
  onComplete?: () => void;
  timeSaved?: string;
  buildTime?: string;
}

const COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f97316', // orange
];

const PARTICLE_COUNT = 80;
const DURATION = 4000;

function createParticlesArray(): Particle[] {
  const newParticles: Particle[] = [];
  const shapes: Particle['shape'][] = ['square', 'circle', 'triangle'];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const angle = (Math.random() * Math.PI * 0.8) + Math.PI * 0.1;
    const velocity = 8 + Math.random() * 12;

    newParticles.push({
      id: i,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 60 + Math.random() * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      speedX: Math.cos(angle) * velocity * (Math.random() > 0.5 ? 1 : -1),
      speedY: -Math.sin(angle) * velocity,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    });
  }

  return newParticles;
}

export default function ForgeSuccessCelebration({
  show,
  onComplete,
  timeSaved,
  buildTime,
}: ForgeSuccessCelebrationProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showStats, setShowStats] = useState(false);

  // Track the previous show value to detect changes
  const prevShowRef = useRef(show);

  // Derive visible directly from show prop
  const visible = show;

  // Handle show prop changes - using deferred state updates for animation
  useEffect(() => {
    // Only run initialization logic when show transitions from false to true
    if (show && !prevShowRef.current) {
      // Initialize particles when show becomes true (deferred to avoid sync setState)
      queueMicrotask(() => {
        setParticles(createParticlesArray());
      });

      // Show stats after initial burst
      const statsTimer = setTimeout(() => {
        setShowStats(true);
      }, 500);

      // Cleanup after animation
      const completeTimer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, DURATION);

      prevShowRef.current = show;

      return () => {
        clearTimeout(statsTimer);
        clearTimeout(completeTimer);
      };
    }

    // When show becomes false, reset state (deferred)
    if (!show && prevShowRef.current) {
      queueMicrotask(() => {
        setShowStats(false);
        setParticles([]);
      });
      prevShowRef.current = show;
    }
  }, [show, onComplete]);

  // Animate particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles(prev =>
        prev.map(p => ({
          ...p,
          x: p.x + p.speedX * 0.1,
          y: p.y + p.speedY * 0.1,
          speedY: p.speedY + 0.3, // Gravity
          rotation: p.rotation + p.rotationSpeed,
        })).filter(p => p.y < 120) // Remove particles that fall off
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles.length]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* Confetti particles */}
      <svg className="absolute inset-0 w-full h-full">
        {particles.map(p => (
          <g
            key={p.id}
            transform={`translate(${p.x}%, ${p.y}%) rotate(${p.rotation})`}
            style={{ transformOrigin: 'center' }}
          >
            {p.shape === 'square' && (
              <rect
                x={-p.size / 2}
                y={-p.size / 2}
                width={p.size}
                height={p.size}
                fill={p.color}
                opacity={0.9}
              />
            )}
            {p.shape === 'circle' && (
              <circle r={p.size / 2} fill={p.color} opacity={0.9} />
            )}
            {p.shape === 'triangle' && (
              <polygon
                points={`0,${-p.size / 2} ${p.size / 2},${p.size / 2} ${-p.size / 2},${p.size / 2}`}
                fill={p.color}
                opacity={0.9}
              />
            )}
          </g>
        ))}
      </svg>

      {/* Success message overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`
            transform transition-all duration-500 ease-out
            ${showStats ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
          `}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 text-center max-w-sm mx-4 pointer-events-auto">
            {/* Success icon with animation */}
            <div className="relative mb-4">
              <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-green-500 animate-bounce"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              {/* Sparkles around icon */}
              <span className="absolute top-0 right-1/4 text-xl animate-ping">✨</span>
              <span className="absolute bottom-0 left-1/4 text-lg animate-ping animation-delay-200">✨</span>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Build Complete!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Your application is ready 🚀
            </p>

            {/* Stats */}
            {(timeSaved || buildTime) && (
              <div className="flex justify-center gap-6 py-4 border-t border-b border-gray-200 dark:border-gray-700">
                {buildTime && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {buildTime}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Build Time
                    </p>
                  </div>
                )}
                {timeSaved && (
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {timeSaved}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Time Saved
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Celebration message */}
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              Forge&apos;s agent swarm worked in parallel to deliver your app faster than ever.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
