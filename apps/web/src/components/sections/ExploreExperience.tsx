import { EXPERIENCE_SLIDES } from '../../data/experienceSlides';
import { useCarousel } from '../../hooks/useCarousel';
import { ChevronIcon } from '../icons/ChevronIcon';

// "Explore the Experience" — a device-mockup carousel with a heading and blurb
// for each slide, flanked by circular prev/next arrows. Each slide image is a
// full phone mockup exported from the design (see public/experience/).
export function ExploreExperience() {
  const { index, next, prev, goTo } = useCarousel(EXPERIENCE_SLIDES.length);
  const slide = EXPERIENCE_SLIDES[index]!;

  return (
    <section id="experience" className="bg-primary-soft py-20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="text-3xl font-extrabold text-primary md:text-4xl">Explore the Experience</h2>

        <div className="relative mt-10">
          <ArrowButton
            direction="left"
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2"
          />

          <div className="flex h-[460px] items-center justify-center">
            <img
              src={slide.screen}
              alt={slide.title}
              className="h-full w-auto object-contain drop-shadow-2xl"
            />
          </div>

          <ArrowButton
            direction="right"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2"
          />
        </div>

        <h3 className="mt-10 text-2xl font-extrabold text-primary">{slide.title}</h3>
        <p className="mx-auto mt-3 max-w-md text-neutral-variant">{slide.description}</p>

        <div className="mt-6 flex items-center justify-center gap-2">
          {EXPERIENCE_SLIDES.map((s, i) => (
            <button
              key={s.title}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-5 bg-primary' : 'w-2 bg-primary-border'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ArrowButton({
  direction,
  onClick,
  className = '',
}: {
  direction: 'left' | 'right';
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === 'left' ? 'Previous slide' : 'Next slide'}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary-border text-primary transition-colors hover:bg-primary hover:text-primary-foreground ${className}`}
    >
      <ChevronIcon direction={direction} size={18} />
    </button>
  );
}
