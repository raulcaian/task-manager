import { useEffect } from 'react';
import Footer from './components/Footer';
import { useI18n } from './i18n/context';
import Header from './components/Header';
import BuildSequence from './sections/BuildSequence';
import Contact from './sections/Contact';
import Garage from './sections/Garage';
import Hero from './sections/Hero';
import Timeline from './sections/Timeline';
import TripPlanner from './sections/TripPlanner';
import './App.css';

// The sections are drawn by React, so they do not exist yet when the browser
// tries to jump to a link like /#trip-planner. Jump once they are there.
function useInitialHashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target) return undefined;
    const frame = requestAnimationFrame(() => target.scrollIntoView({ behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
  }, []);
}

function App() {
  const { t } = useI18n();
  useInitialHashScroll();
  return (
    <>
      <a className="skip-link" href="#main">
        {t('header.skip')}
      </a>
      <Header />

      <main id="main" tabIndex={-1}>
        <Hero />
        <BuildSequence />
        <Timeline />
        <Garage />
        <TripPlanner />
        <Contact />
      </main>

      <Footer />
    </>
  );
}

export default App;
