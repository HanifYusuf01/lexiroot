import { AppStoreBadge } from '../icons/AppStoreBadge';
import { GooglePlayBadge } from '../icons/GooglePlayBadge';

interface StoreBadgesProps {
  className?: string;
}

// The App Store + Google Play badge pair, links pointing at the stores. Used in
// the hero and footer.
export function StoreBadges({ className = '' }: StoreBadgesProps) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href="https://apps.apple.com"
        target="_blank"
        rel="noreferrer"
        aria-label="Download LexiRoot on the App Store"
        className="transition-transform hover:-translate-y-0.5"
      >
        <AppStoreBadge className="h-12 w-auto" />
      </a>
      <a
        href="https://play.google.com"
        target="_blank"
        rel="noreferrer"
        aria-label="Get LexiRoot on Google Play"
        className="transition-transform hover:-translate-y-0.5"
      >
        <GooglePlayBadge className="h-12 w-auto" />
      </a>
    </div>
  );
}
