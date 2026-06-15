interface LexiRootLogoProps {
  /** Rendered height in px; width scales to preserve the artwork ratio. */
  size?: number;
  className?: string;
}

// LexiRoot brandmark (the stylised "L"). Artwork viewBox is 0 0 97 88 and is
// rendered with the path filled by currentColor so it inherits text color.
export function LexiRootLogo({ size = 40, className }: LexiRootLogoProps) {
  const width = (size * 97) / 88;
  return (
    <svg
      width={width}
      height={size}
      viewBox="0 0 97 88"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M52.9729 0H76.8582L44.6392 70.6116C43.9056 72.2194 45.0807 74.0472 46.8479 74.0472H87.1762C92.5396 74.0472 96.8874 78.395 96.8874 83.7583V87.4H3.64181C1.54523 87.4 -0.118331 85.6342 0.00661498 83.5413L0.153875 81.0747C0.396309 77.0139 3.76017 73.8449 7.82817 73.8449H10.8923C14.7158 73.8449 18.1834 71.6014 19.7504 68.1139L49.282 2.38794C49.9349 0.934791 51.3798 0 52.9729 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
