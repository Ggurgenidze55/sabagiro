'use client';

import { useId } from 'react';

type FieryManIconProps = {
  className?: string;
  title?: string;
};

/** Minimal fiery-man mark for Tsverebiani Kaci credit. */
export function FieryManIcon({ className, title = 'Tsverebiani Kaci' }: FieryManIconProps) {
  const gradId = useId().replace(/:/g, '');

  return (
    <svg
      className={className}
      viewBox="0 0 28 36"
      width={28}
      height={36}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ff0044" />
          <stop offset="45%" stopColor="#ff6a00" />
          <stop offset="100%" stopColor="#c8ff00" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradId})`}
        opacity="0.85"
        d="M14 2c-2 4-5 5-5 9 0 2 1 3 2 4-3 1-5 4-5 7 0 4 3 7 7 8 1 3 3 5 5 6v2H4v-2c2-1 4-3 5-6 4-1 7-4 7-8 0-3-2-6-5-7 1-1 2-2 2-4 0-4-3-5-5-9z"
      />
      <ellipse cx="14" cy="11" rx="4.5" ry="5" fill="#0a0a0a" />
      <path
        fill="#d4ccc4"
        d="M14 7.5c2.2 0 3.8 1.6 3.8 3.6 0 1.2-.5 2.2-1.3 2.9-.4.8-1.2 1.4-2.5 1.4s-2.1-.6-2.5-1.4c-.8-.7-1.3-1.7-1.3-2.9 0-2 1.6-3.6 3.8-3.6z"
      />
      <path fill="#0a0a0a" d="M11.2 10.2c.6-.9 1.6-1.4 2.8-1.4 1.2 0 2.2.5 2.8 1.4-.7.3-1.5.5-2.8.5s-2.1-.2-2.8-.5z" />
      <path
        fill="none"
        stroke="#c8ff00"
        strokeWidth="0.6"
        opacity="0.5"
        d="M8 18c2 2 4 2.5 6 2.5s4-.5 6-2.5M10 22h8"
      />
    </svg>
  );
}
