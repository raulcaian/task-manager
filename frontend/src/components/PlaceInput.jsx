import { useEffect, useId, useState } from 'react';
import { api } from '../lib/api';

/*
 * Text field with place suggestions from /api/geocode, following the
 * WAI-ARIA combobox pattern: arrow keys move through the list, Enter picks,
 * Escape closes, and screen readers hear which option is active.
 */
export default function PlaceInput({ label, value, onChange, placeholder }) {
  const id = useId();
  const listId = `${id}-list`;
  const [text, setText] = useState(value?.label ?? '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState(null);

  const query = text.trim();
  const shouldSearch = open && query.length >= 2 && query !== value?.label;

  useEffect(() => {
    if (!shouldSearch) return undefined;
    const controller = new AbortController();
    // Wait until typing pauses, so we don't call the API on every key.
    const timer = setTimeout(() => {
      api
        .geocode(query, { signal: controller.signal })
        .then((places) => {
          setSuggestions(places);
          setActive(-1);
          setError(null);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') setError(err.message);
        });
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, shouldSearch]);

  const choose = (place) => {
    onChange(place);
    setText(place.label);
    setOpen(false);
    setSuggestions([]);
  };

  const onKeyDown = (event) => {
    if (!open || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === 'Enter' && active >= 0) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const showList = open && shouldSearch && suggestions.length > 0;

  return (
    <div className="field place-input">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        type="text"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && active >= 0 ? `${id}-option-${active}` : undefined}
        placeholder={placeholder}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setOpen(true);
          if (value) onChange(null);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      <ul id={listId} role="listbox" className="place-input__list" hidden={!showList}>
        {suggestions.map((place, index) => (
          <li
            key={`${place.lat},${place.lon}`}
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={index === active}
            className="place-input__option"
            onMouseDown={(event) => {
              event.preventDefault(); // keep focus in the input
              choose(place);
            }}
          >
            {place.label}
          </li>
        ))}
      </ul>
      {error && <span className="field__hint status--error">{error}</span>}
    </div>
  );
}
