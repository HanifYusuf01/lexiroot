interface ChevronIconProps {
  /** Which way the chevron points. */
  direction?: 'up' | 'down' | 'left' | 'right';
  size?: number;
  className?: string;
}

const ROTATION: Record<NonNullable<ChevronIconProps['direction']>, number> = {
  down: 0,
  up: 180,
  left: 90,
  right: -90,
};

// Single-stroke chevron used by the FAQ accordion and the carousel arrows.
export function ChevronIcon({ direction = 'down', size = 20, className }: ChevronIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ transform: `rotate(${ROTATION[direction]}deg)` }}
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
