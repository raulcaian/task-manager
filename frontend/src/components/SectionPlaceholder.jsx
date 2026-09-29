import './SectionPlaceholder.css';

/** Temporary section shell; each one is replaced by the real feature later. */
export default function SectionPlaceholder({ id, eyebrow, title, children }) {
  const titleId = `${id}-title`;
  return (
    <section id={id} className="placeholder" aria-labelledby={titleId}>
      <div className="container">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={titleId} className="placeholder__title">
          {title}
        </h2>
        <p className="placeholder__text">{children}</p>
      </div>
    </section>
  );
}
