/*
 * Client-side helpers for the configurator. They only make the UI friendly
 * (hide what can't be ordered, keep one wheel choice). The backend's
 * /api/quote is the source of truth and reports every broken rule.
 */

export const WHEELS = 'wheels';
export const DEFAULT_WHEELS = 'wheels-standard';

export const isAvailable = (option, modelSlug) =>
  option.available_for === null || option.available_for.includes(modelSlug);

/** Select or unselect an option. Wheels behave like radio buttons. */
export function toggleOption(selected, option, options) {
  if (option.category === WHEELS) {
    const others = options.filter((o) => o.category === WHEELS).map((o) => o.code);
    return [...selected.filter((code) => !others.includes(code)), option.code];
  }
  return selected.includes(option.code)
    ? selected.filter((code) => code !== option.code)
    : [...selected, option.code];
}

/** After switching model, drop options the new model can't have. */
export function selectionForModel(selected, options, modelSlug) {
  const byCode = new Map(options.map((o) => [o.code, o]));
  const kept = selected.filter((code) => {
    const option = byCode.get(code);
    return option && isAvailable(option, modelSlug);
  });
  const hasWheels = kept.some((code) => byCode.get(code).category === WHEELS);
  return hasWheels ? kept : [DEFAULT_WHEELS, ...kept];
}

/** Human hint shown under an option, e.g. "Requires 21-inch sport wheels". */
export function ruleHint(option, options) {
  const names = (codes) =>
    codes.map((code) => options.find((o) => o.code === code)?.name ?? code).join(', ');
  const hints = [];
  if (option.requires.length) hints.push(`Requires ${names(option.requires)}`);
  if (option.excludes.length) hints.push(`Not with ${names(option.excludes)}`);
  return hints.join(' · ');
}

export const CATEGORY_LABELS = {
  wheels: 'Wheels',
  performance: 'Performance',
  interior: 'Interior',
  practical: 'Practical',
};

/** The body mask used to recolour a car photo: 911-carrera.webp -> 911-carrera-mask.webp */
export const maskUrl = (imageUrl) => imageUrl.replace(/\.webp$/, '-mask.webp');
