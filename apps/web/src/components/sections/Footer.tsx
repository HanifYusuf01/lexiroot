import { FooterMascotIcon } from '../icons/FooterMascotIcon';
import { StoreBadges } from '../ui/StoreBadges';

const PRODUCT_LINKS = ['Lessons', 'Practice', 'Leaderboard', 'Offline Access', 'FAQs'];
const APP_LINKS = ['LexiRoot for iOS', 'LexiRoot for Android'];

// Site footer: link columns, centered mascot wordmark, and the download CTA
// with store badges, sitting above the copyright line. Orange top border per design.
export function Footer() {
  return (
    <footer id="download" className="border-t-4 border-primary bg-primary-soft">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-6 py-14 md:grid-cols-3">
        <div className="flex gap-12">
          <FooterColumn title="PRODUCT" links={PRODUCT_LINKS} />
          <FooterColumn title="APPS" links={APP_LINKS} />
        </div>

        <div className="flex flex-col items-center justify-start text-center">
          <FooterMascotIcon size={96} />
          <span className="mt-2 text-2xl font-extrabold text-primary">LexiRoot</span>
        </div>

        <div className="md:justify-self-end">
          <h4 className="text-sm font-extrabold uppercase tracking-wide text-primary">
            Download the app
          </h4>
          <p className="mt-2 text-sm text-neutral-variant">
            Learn Nigerian languages on the go. Available on Android and iOS.
          </p>
          <StoreBadges className="mt-3" />
        </div>
      </div>

      <p className="border-t border-primary-border/40 py-5 text-center text-sm text-neutral-variant">
        © 2026 LexiRoot. All Rights Reserved.
      </p>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 className="text-sm font-extrabold uppercase tracking-wide text-primary">{title}</h4>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link}>
            <a href="#top" className="text-sm text-neutral-variant transition-colors hover:text-primary">
              {link}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
