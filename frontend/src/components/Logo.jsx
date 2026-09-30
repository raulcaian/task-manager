import './Logo.css';

/*
 * "Lights on": the wordmark starts in the dark, a ceiling light flickers on
 * and a beam sweeps across the letters, like the bays in the garage.
 * It plays once on page load; with reduced motion it is simply lit.
 */
export default function Logo() {
  return (
    <span className="logo" role="img" aria-label="Porsche Showroom">
      <span className="logo__tube" aria-hidden="true" />
      <span className="logo__small" aria-hidden="true">
        Porsche
      </span>
      <span className="logo__word" data-text="Showroom" aria-hidden="true">
        Showroom
      </span>
    </span>
  );
}
