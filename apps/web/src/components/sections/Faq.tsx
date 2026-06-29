import { useState } from 'react';
import { FAQS } from '../../data/faqs';
import { ChevronIcon } from '../icons/ChevronIcon';

// "Frequently Asked Questions" — single-open accordion.
export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faqs" className="mx-auto max-w-3xl px-6 py-20">
      <h2 className="text-center text-3xl font-extrabold text-primary md:text-4xl">
        Frequently Asked Questions
      </h2>

      <div className="mt-10 space-y-3">
        {FAQS.map((faq, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={faq.question}
              className="overflow-hidden rounded-lg border border-faq-border"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-bold text-neutral">{faq.question}</span>
                <ChevronIcon
                  direction={isOpen ? 'up' : 'down'}
                  size={20}
                  className="shrink-0 text-primary"
                />
              </button>
              {isOpen && (
                <p className="px-5 pb-5 text-sm leading-relaxed text-neutral-variant">
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
