const euro = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

export const formatEuro = (value) => euro.format(value);

/** 205 -> "3 h 25 min", 45 -> "45 min". */
export function formatDuration(minutes) {
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export const formatKm = (km) => `${Math.round(km).toLocaleString('en-GB')} km`;

export const formatPercent = (value) => `${Math.round(value)} %`;
