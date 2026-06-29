interface StoreBadgeProps {
  className?: string;
}

// "Get it on Google Play" badge. Self-contained black pill with the colored
// Play triangle + two-line label, matched in size to the App Store badge.
export function GooglePlayBadge({ className }: StoreBadgeProps) {
  return (
    <svg
      viewBox="0 0 160 52"
      className={className}
      role="img"
      aria-label="Get it on Google Play"
    >
      <rect width="160" height="52" rx="9" fill="#000000" />
      <rect x="0.5" y="0.5" width="159" height="51" rx="8.5" fill="none" stroke="#A6A6A6" />
      <g transform="translate(22 16)">
        <path d="M0 .6v18.8c0 .6.4.9.8.6L13 13 0 .6z" fill="#00D3FF" />
        <path d="M.8.6 13 13l3.6-3.6L3.1 1.5C2.1.9 1.3.4.8.6z" fill="#00F076" />
        <path d="M13 13l3.6 3.6 3.6-2.1c1.1-.7 1.1-1.8 0-2.4l-3.6-2.1L13 13z" fill="#FFC900" />
        <path d="M.8 19.4c.5.2 1.3-.3 2.3-.9l13.5-7.9L13 13 .8 19.4z" fill="#FF3946" />
      </g>
      <text x="50" y="20" fill="#ffffff" fontFamily="Nunito, sans-serif" fontSize="8">
        GET IT ON
      </text>
      <text
        x="50"
        y="38"
        fill="#ffffff"
        fontFamily="Nunito, sans-serif"
        fontSize="18"
        fontWeight="600"
      >
        Google Play
      </text>
    </svg>
  );
}
