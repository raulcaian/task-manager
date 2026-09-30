import { useCallback, useEffect, useRef, useState } from 'react';
import Showroom from '../components/Showroom';
import { useI18n } from '../i18n/context';
import { api, errorMessage } from '../lib/api';
import {
  DEFAULT_WHEELS,
  isAvailable,
  ORIGINAL_PAINT,
  paintedImageUrl,
  ruleHint,
  selectionForModel,
  toggleOption,
} from '../lib/configurator';
import { formatEuro } from '../lib/format';
import { useApi } from '../hooks/useApi';
import './Garage.css';

export default function Garage() {
  const { t, lang } = useI18n();
  // Reloads the catalogue (names, descriptions, specs) when the language changes.
  const loadCatalogue = useCallback(
    async ({ signal }) => {
      const [models, paints, options] = await Promise.all([
        api.models({ signal, lang }),
        api.paints({ signal, lang }),
        api.options({ signal, lang }),
      ]);
      return { models, paints, options };
    },
    [lang]
  );
  const { data, error, loading } = useApi(loadCatalogue);

  return (
    <section id="garage" className="section garage" aria-labelledby="garage-title">
      <div className="container">
        <header className="section-header">
          <p className="eyebrow">{t('garage.eyebrow')}</p>
          <h2 id="garage-title" className="section-title">
            {t('garage.title')}
          </h2>
          <p className="section-lead">{t('garage.lead')}</p>
        </header>

        {loading && <p className="status">{t('garage.loading')}</p>}
        {error && (
          <p className="status status--error" role="alert">
            {t('garage.error', { message: errorMessage(error, t) })}
          </p>
        )}
        {data && <GarageContent {...data} />}
      </div>
    </section>
  );
}

function GarageContent({ models, paints, options }) {
  const { t } = useI18n();
  const [modelSlug, setModelSlug] = useState(models[0]?.slug);
  const configuratorRef = useRef(null);

  // Choosing a car in the showroom opens it in the configurator below.
  const choose = (slug) => {
    setModelSlug(slug);
    configuratorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Showroom models={models} onChoose={choose} />
      <div ref={configuratorRef} id="configurator" className="configurator-anchor">
        <h3 className="configurator-title">{t('garage.configurator')}</h3>
        <Configurator
          models={models}
          paints={paints}
          options={options}
          modelSlug={modelSlug}
          onModelChange={setModelSlug}
        />
      </div>
    </>
  );
}

function Configurator({ models, paints, options, modelSlug, onModelChange }) {
  const { t, lang, locale } = useI18n();
  const euro = (value) => formatEuro(value, locale);
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
        .quote({ model: modelSlug, paint_id: paintId, options: selected }, { signal: controller.signal, lang })
        .then((result) => setQuote({ result, errors: [], pending: false }))
        .catch((err) => {
          if (err.name === 'AbortError') return;
          const errors = Array.isArray(err.detail) ? err.detail.map((d) => d.msg) : [errorMessage(err, t)];
          setQuote({ result: null, errors, pending: false });
        });
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [modelSlug, paintId, selected, lang, t]);

  // Keep only the options the chosen model can have (also when the model
  // was picked in the showroom above).
  const [optionsModel, setOptionsModel] = useState(modelSlug);
  if (optionsModel !== modelSlug) {
    setOptionsModel(modelSlug);
    setSelected((current) => selectionForModel(current, options, modelSlug));
  }

  const chooseModel = (slug) => onModelChange(slug);

  return (
    <div className="configurator">
      <div className="configurator__preview">
        <div className="model-tabs" role="radiogroup" aria-label={t('garage.model')}>
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
              <span className="model-tab__price">{t('common.from', { price: euro(m.base_price_eur) })}</span>
            </button>
          ))}
        </div>

        <PaintedCar model={model} paints={paints} paint={paint} />

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
          <legend>{t('garage.paint')}</legend>
          <div className="swatches">
            {paints.map((p) => (
              <label key={p.id} className="swatch" title={p.label || p.name}>
                <input
                  type="radio"
                  name="paint"
                  value={p.id}
                  checked={p.id === paintId}
                  onChange={() => setPaintId(p.id)}
                />
                <span
                  className={`swatch__color${p.name === ORIGINAL_PAINT ? ' swatch__color--original' : ''}`}
                  style={p.name === ORIGINAL_PAINT ? { backgroundImage: `url(${model.image_url})` } : { background: p.swatch_hex }}
                />
                <span className="swatch__label">
                  {p.label || p.name}
                  <small>{p.price_eur ? `+${euro(p.price_eur)}` : t('common.included')}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {categories.map((category) => (
          <fieldset key={category} className="option-group">
            <legend>{t(`garage.categories.${category}`)}</legend>
            {available
              .filter((option) => option.category === category)
              .map((option) => {
                const hint = ruleHint(option, options, t);
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
                      {option.price_eur ? euro(option.price_eur) : t('common.included')}
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
 * Every paint is a pre-rendered photo (scripts/make_paint_variants.py repaints
 * only the body, keeping glass, tyres and rims). All of them are stacked and
 * the chosen one fades in, so switching colour is instant and smooth.
 */
function PaintedCar({ model, paints, paint }) {
  const { t } = useI18n();
  const label =
    !paint || paint.name === ORIGINAL_PAINT
      ? t('garage.originalPaint')
      : t('garage.paintNamed', { paint: paint.label || paint.name });
  return (
    <div className="painted-car" role="img" aria-label={t('garage.carIn', { model: model.name, paint: label })}>
      {paints.map((p) => (
        <img
          key={p.id}
          src={paintedImageUrl(model.image_url, p.name)}
          alt=""
          className={`painted-car__layer${p.id === paint?.id ? ' is-shown' : ''}`}
        />
      ))}
    </div>
  );
}

function QuoteSummary({ quote }) {
  const { t, locale } = useI18n();
  const euro = (value) => formatEuro(value, locale);
  return (
    <div className="quote" aria-live="polite">
      <h3 className="quote__title">{t('garage.yourConfiguration')}</h3>
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
                <span>{item.price_eur ? euro(item.price_eur) : t('common.included')}</span>
              </li>
            ))}
          </ul>
          <p className="quote__total">
            <span>{t('garage.total')}</span>
            <strong>{euro(quote.result.total_eur)}</strong>
          </p>
          <p className="quote__vat">{t('garage.vat', { vat: euro(quote.result.vat_included_eur) })}</p>
        </>
      )}
      {quote.pending && !quote.result && quote.errors.length === 0 && (
        <p className="status">{t('garage.calculating')}</p>
      )}
    </div>
  );
}
