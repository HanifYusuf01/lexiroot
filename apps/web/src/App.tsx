import { Header } from './components/sections/Header';
import { Hero } from './components/sections/Hero';
import { ExploreExperience } from './components/sections/ExploreExperience';
import { Faq } from './components/sections/Faq';
import { Footer } from './components/sections/Footer';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { SubscriptionReturn } from './pages/SubscriptionReturn';
import { TermsOfUse } from './pages/TermsOfUse';

export function App() {
  // Lightweight path routing (nginx SPA-falls back to index.html). These are the
  // hosted-checkout return targets the payment provider redirects to.
  const path = window.location.pathname;
  if (path.startsWith('/subscription/success')) return <SubscriptionReturn variant="success" />;
  if (path.startsWith('/subscription/cancel')) return <SubscriptionReturn variant="cancel" />;
  if (path.startsWith('/privacy')) return <PrivacyPolicy />;
  if (path.startsWith('/terms')) return <TermsOfUse />;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <ExploreExperience />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
