import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  CATEGORY_LABELS,
  DEFAULT_WHEELS,
  isAvailable,
  maskUrl,
  ruleHint,
  selectionForModel,
  toggleOption,
} from '../lib/configurator';
import { formatEuro } from '../lib/format';
import { useApi } from '../hooks/useApi';
import './Garage.css';

// Defined outside the component so useApi gets the same function every render.
const loadCatalogue = async ({ signal }) => {
  const [models, paints, options] = await Promise.all([
    api.models({ signal }),
    api.paints({ signal }),
    api.options({ signal }),
  ]);
  return { models, paints, options };
};

export default function Garage() {
  const { data, error, loading } = useApi(loadCatalogue);

  return (
    <section id="garage" className="section garage" aria-labelledby="garage-title">
      <div className="container">
        <header className="section-header">
          <p className="eyebrow">02 · Garage</p>
          <h2 id="garage-title" className="section-title">
            Configure your Porsche
          </h2>
          <p className="section-lead">
            Every price and rule comes from the database and is checked by the FastAPI
            backend. Prices are illustrative, VAT included.
          </p>
        </header>

        {loading && <p className="status">Loading the garage…</p>}
        {error && (
          <p className="status status--error" role="alert">
            The garage could not be loaded: {error.message}
          </p>
        )}
        {data && <Configurator {...data} />}
      </div>
    </section>
  );
}

function Configurator({ models, paints, options }) {
  const [modelSlug, setModelSlug] = useState(models[0]?.slug);
  const [paintId, setPaintId] = useState(paints[0]?.id);
  const [selected, setSelected] = useState([DEFAULT_WHEELS]);
  const [quote, setQuote] = useState({ result: null, errors: [], pending: true });

  const model = models.find((m) => m.slug === modelSlug);
  const paint = paints.find((p) => p.id === paintId);
  const available = options.filter((option) => isAvailable(option, modelSlug));
  const categories = [...new Set(available.map((option) => option.category))];

  // Ask the backend for a price whenever the configuration changes.
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      api
        .quote({ model: modelSlug, paint_id: paintId, options: selected }, { signal: controller.signal })
        .then((result) => setQuote({ result, errors: [], pending: false }))
        .catch((err) => {
          if (err.name === 'AbortError') return;
          const errors = Array.isArray(err.detail) ? err.detail.map((d) => d.msg) : [err.message];
          setQuote({ result: null, errors, pending: false });
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [modelSlug, paintId, selected]);

  const chooseModel = (slug) => {
    setModelSlug(slug);
    setSelected((current) => selectionForModel(current, options, slug));
  };

  return (
    <div className="configurator">
      <div className="configurator__preview">
        <div className="model-tabs" role="radiogroup" aria-label="Model">
          {models.map((m) => (
            <button
              key={m.slug}
              type="button"
              role="radio"
              aria-checked={m.slug === modelSlug}
              className="model-tab"
              onClick={() => chooseModel(m.slug)}
            >
              <span className="model-tab__name">{m.name}</span>
              <span className="model-tab__price">from {formatEuro(m.base_price_eur)}</span>
            </button>
          ))}
        </div>

        <PaintedCar model={model} paint={paint} />

        <p className="configurator__tagline">{model.tagline}</p>
        <dl className="specs">
          {model.specs.map((spec) => (
            <div key={spec.label}>
              <dt>{spec.label}</dt>
              <dd>{spec.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="configurator__panel">
        <fieldset className="option-group">
          <legend>Paint</legend>
          <div className="swatches">
            {paints.map((p) => (
              <label key={p.id} className="swatch" title={p.name}>
                <input
                  type="radio"
                  name="paint"
                  value={p.id}
                  checked={p.id === paintId}
                  onChange={() => setPaintId(p.id)}
                />
                <span className="swatch__color" style={{ background: p.swatch_hex }} />
                <span className="swatch__label">
                  {p.name}
                  <small>{p.price_eur ? `+${formatEuro(p.price_eur)}` : 'Included'}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {categories.map((category) => (
          <fieldset key={category} className="option-group">
            <legend>{CATEGORY_LABELS[category] ?? category}</legend>
            {available
              .filter((option) => option.category === category)
              .map((option) => {
                const hint = ruleHint(option, options);
                const isWheels = category === 'wheels';
                return (
                  <label key={option.code} className="option">
                    <input
                      type={isWheels ? 'radio' : 'checkbox'}
                      name={isWheels ? 'wheels' : option.code}
                      checked={selected.includes(option.code)}
                      onChange={() => setSelected((current) => toggleOption(current, option, options))}
                    />
                    <span className="option__body">
                      <span className="option__name">{option.name}</span>
                      <span className="option__description">{option.description}</span>
                      {hint && <span className="option__rule">{hint}</span>}
                    </span>
                    <span className="option__price">
                      {option.price_eur ? formatEuro(option.price_eur) : 'Included'}
                    </span>
                  </label>
                );
              })}
          </fieldset>
        ))}

        <QuoteSummary quote={quote} />
      </div>
    </div>
  );
}

/*
 * The photo is recoloured in the browser: two layers clipped by a mask of the
 * car body (made from the photo, without the floor shadow). "multiply" pulls
 * light cars (white, yellow) towards the paint, then "color" sets the hue
 * while keeping the photo's reflections and shading.
 */
function PaintedCar({ model, paint }) {
  const url = `url(${maskUrl(model.image_url)})`;
  const mask = { WebkitMaskImage: url, maskImage: url };
  return (
    <div className="painted-car">
      <img src={model.image_url} alt={`${model.name} in ${paint?.name ?? 'factory'} paint`} />
      {paint && (
        <>
          <span className="painted-car__tint painted-car__tint--multiply" style={{ ...mask, background: paint.swatch_hex }} />
          <span className="painted-car__tint painted-car__tint--color" style={{ ...mask, background: paint.swatch_hex }} />
        </>
      )}
    </div>
  );
}

function QuoteSummary({ quote }) {
  return (
    <div className="quote" aria-live="polite">
      <h3 className="quote__title">Your configuration</h3>
      {quote.errors.length > 0 && (
        <ul className="quote__errors">
          {quote.errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
      {quote.result && (
        <>
          <ul className="quote__items">
            {quote.result.items.map((item) => (
              <li key={`${item.kind}-${item.code}`}>
                <span>{item.name}</span>
                <span>{item.price_eur ? formatEuro(item.price_eur) : 'Included'}</span>
              </li>
            ))}
          </ul>
          <p className="quote__total">
            <span>Total</span>
            <strong>{formatEuro(quote.result.total_eur)}</strong>
          </p>
          <p className="quote__vat">incl. {formatEuro(quote.result.vat_included_eur)} VAT (19 %)</p>
        </>
      )}
      {quote.pending && !quote.result && quote.errors.length === 0 && (
        <p className="status">Calculating…</p>
      )}
    </div>
  );
}
