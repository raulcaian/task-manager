import Footer from './components/Footer';
import Header from './components/Header';
import BuildSequence from './sections/BuildSequence';
import Contact from './sections/Contact';
import Garage from './sections/Garage';
import Hero from './sections/Hero';
import Timeline from './sections/Timeline';
import TripPlanner from './sections/TripPlanner';
import './App.css';

function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
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
