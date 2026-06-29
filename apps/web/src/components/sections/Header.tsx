import { LexiRootLogo } from '../icons/LexiRootLogo';
import { Button } from '../ui/Button';

// Sticky top navigation: brandmark on the left, single "Start Learning" CTA on
// the right, matching the landing design.
export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2 text-primary" aria-label="LexiRoot home">
          <LexiRootLogo size={28} />
          <span className="text-xl font-extrabold text-neutral">LexiRoot</span>
        </a>
        <Button onClick={() => document.getElementById('download')?.scrollIntoView()}>
          Start Learning
        </Button>
      </div>
    </header>
  );
}
