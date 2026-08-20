import type { ReactNode } from 'react';

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

// Shared layout for the Privacy Policy and Terms of Use pages: same header,
// same prose styling, so the two documents read as one consistent pair.
export function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b-4 border-primary bg-primary-soft px-6 py-10 text-center">
        <a href="/" className="text-2xl font-extrabold text-primary">
          LexiRoot
        </a>
        <h1 className="mt-4 text-3xl font-extrabold text-neutral">{title}</h1>
        <p className="mt-1 text-sm text-neutral-variant">Last updated: {lastUpdated}</p>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12 text-neutral">{children}</main>
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 text-xl font-extrabold text-primary first:mt-0">{children}</h2>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 text-base font-bold text-neutral">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-neutral-variant">{children}</p>;
}

export function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-neutral-variant">
      {children}
    </ul>
  );
}
