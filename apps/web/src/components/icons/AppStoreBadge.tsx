interface StoreBadgeProps {
  className?: string;
}

// "Download on the App Store" badge. Self-contained black pill with the Apple
// mark + two-line label, sized to match the Google Play badge alongside it.
export function AppStoreBadge({ className }: StoreBadgeProps) {
  return (
    <svg
      viewBox="0 0 160 52"
      className={className}
      role="img"
      aria-label="Download on the App Store"
    >
      <rect width="160" height="52" rx="9" fill="#000000" />
      <rect x="0.5" y="0.5" width="159" height="51" rx="8.5" fill="none" stroke="#A6A6A6" />
      <path
        d="M37.9 26.5c0-3 2.5-4.5 2.6-4.6-1.4-2.1-3.6-2.4-4.4-2.4-1.9-.2-3.6 1.1-4.6 1.1-.9 0-2.4-1.1-3.9-1-2 0-3.9 1.2-4.9 3-2.1 3.6-.5 9 1.5 11.9 1 1.4 2.2 3 3.7 2.9 1.5-.1 2-1 3.8-1 1.8 0 2.3 1 3.9.9 1.6 0 2.6-1.4 3.6-2.9 1.1-1.6 1.6-3.2 1.6-3.3-.1 0-3-1.2-3-4.5zm-3-8.4c.8-1 1.4-2.4 1.2-3.8-1.2 0-2.7.8-3.5 1.8-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.7-.7 3.6-1.7z"
        fill="#ffffff"
      />
      <text x="50" y="20" fill="#ffffff" fontFamily="Nunito, sans-serif" fontSize="8">
        Download on the
      </text>
      <text
        x="50"
        y="38"
        fill="#ffffff"
        fontFamily="Nunito, sans-serif"
        fontSize="18"
        fontWeight="600"
      >
        App Store
      </text>
    </svg>
  );
}
