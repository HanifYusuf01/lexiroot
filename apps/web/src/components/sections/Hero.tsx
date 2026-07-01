import { Button } from '../ui/Button';
import { StoreBadges } from '../ui/StoreBadges';

const FEATURES = ['Designed for all learners', 'Beginner to Advanced', 'Offline Access'];

export function Hero() {
  return (
    <section id="top" className="mx-auto max-w-6xl px-6 pb-10 pt-12 md:pt-20">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.1] text-neutral md:text-6xl">
            Learn African Languages from <span className="text-primary">the roots.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-neutral-variant md:text-lg">
            The fun and effective way to speak African languages with confidence anytime, anywhere.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              onClick={() => document.getElementById('download')?.scrollIntoView()}
            >
              Get Started
            </Button>
          </div>
          <StoreBadges className="mt-6" />
        </div>

        <div className="hero-device-stage" aria-label="LexiRoot mobile app preview">
          <svg
            className="hero-device-blob"
            viewBox="0 0 520 410"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M137 13C91 19 55 39 50 78C45 112 61 137 53 177C45 218 18 254 1 289C-21 334 12 371 60 361C90 355 111 354 139 359C176 366 207 390 251 397C296 405 332 375 366 364C402 352 438 358 455 326C466 304 464 272 470 245L512 100C523 62 499 30 461 27C424 23 402 40 365 40C330 40 307 23 272 15C229 5 179 7 137 13Z"
              fill="currentColor"
            />
          </svg>
          <img
            src="/hero/app-screen.png"
            alt="LexiRoot app onboarding screen"
            className="hero-device-image"
          />
          <span className="hero-device-line" aria-hidden="true" />
        </div>
      </div>

      <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm font-semibold text-neutral-variant">
        {FEATURES.map((feature, i) => (
          <li key={feature} className="flex items-center gap-3">
            {i > 0 && <span className="h-1 w-1 rounded-full bg-primary" aria-hidden />}
            <span className="rounded-full border border-border px-4 py-1.5">{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
