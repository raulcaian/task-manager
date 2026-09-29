import Header from './components/Header';
import SectionPlaceholder from './components/SectionPlaceholder';
import Hero from './sections/Hero';
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

        <SectionPlaceholder id="build" eyebrow="01 · Build" title="Built in four steps">
          Sketch, clay, paint and finish: the car comes together as you scroll.
        </SectionPlaceholder>
        <SectionPlaceholder id="garage" eyebrow="02 · Garage" title="Configure your Porsche">
          Pick a model and a paint, and see the price update against real configuration
          rules.
        </SectionPlaceholder>
        <SectionPlaceholder id="timeline" eyebrow="03 · Heritage" title="Nine decades of engineering">
          From a design office in Stuttgart in 1931 to the software-defined car.
        </SectionPlaceholder>
        <SectionPlaceholder id="trip-planner" eyebrow="04 · EV Trip Planner" title="Plan an electric road trip">
          Choose a start, a destination and a car. The backend models the energy use and
          plans the charging stops.
        </SectionPlaceholder>
        <SectionPlaceholder id="contact" eyebrow="05 · Contact" title="Get in touch">
          A contact form backed by FastAPI and AWS SES.
        </SectionPlaceholder>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>
            Portfolio project by Raul Caian. Not affiliated with Porsche AG. Car names and
            photos belong to their respective owners.
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;
