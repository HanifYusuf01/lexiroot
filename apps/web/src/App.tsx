import { Header } from './components/sections/Header';
import { Hero } from './components/sections/Hero';
import { ExploreExperience } from './components/sections/ExploreExperience';
import { Faq } from './components/sections/Faq';
import { Footer } from './components/sections/Footer';

export function App() {
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
