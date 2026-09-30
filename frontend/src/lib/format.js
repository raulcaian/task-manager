const euroFormatters = new Map();

/** €125,900 in English, 125.900 € in German and Romanian. */
export function formatEuro(value, locale = 'en-IE') {
  if (!euroFormatters.has(locale)) {
    euroFormatters.set(
      locale,
      new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
    );
  }
  return euroFormatters.get(locale).format(value);
}

/** 205 -> "3 h 25 min", 45 -> "45 min". */
export function formatDuration(minutes) {
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export const formatKm = (km, locale = 'en-GB') =>
  `${Math.round(km).toLocaleString(locale === 'en-IE' ? 'en-GB' : locale)} km`;

export const formatPercent = (value) => `${Math.round(value)} %`;

export const formatNumber = (value, decimals, locale = 'en-IE') =>
  value.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
