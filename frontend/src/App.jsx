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

function App() {
  const { t } = useI18n();
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
