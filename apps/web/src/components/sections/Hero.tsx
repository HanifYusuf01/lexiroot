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

        <div className="relative flex justify-center">
          {/* Organic brand blob sitting behind the device. */}
          <div
            className="absolute h-80 w-80 bg-primary/90"
            style={{ borderRadius: '42% 58% 63% 37% / 47% 42% 58% 53%' }}
            aria-hidden
          />
          <img
            src="/hero/app-screen.png"
            alt="LexiRoot app onboarding screen"
            className="relative h-[460px] w-auto object-contain drop-shadow-2xl"
          />
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
