/*
 * Small wrapper around fetch for our FastAPI backend.
 *
 * In production CloudFront sends /api/* to the EC2 backend, and in
 * development Vite proxies /api to localhost:8000, so the frontend always
 * calls relative URLs and never needs to know where the backend lives.
 */

export class ApiError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

// FastAPI returns errors as {"detail": "..."} or, for validation errors,
// {"detail": [{"msg": "..."}, ...]}. Turn both into one readable sentence.
function messageFrom(body, status) {
  const detail = body?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((item) => item.msg).join('; ');
  }
  return `Request failed (${status})`;
}

export async function request(path, { method = 'GET', body, signal } = {}) {
  const options = { method, signal, headers: { Accept: 'application/json' } };
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('Could not reach the server. Check your connection.', 0);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(messageFrom(data, response.status), response.status, data?.detail);
  }
  return data;
}

export const api = {
  health: (options) => request('/health', options),
  models: (options) => request('/models', options),
  paints: (options) => request('/paints', options),
  eras: (options) => request('/eras', options),
  evModels: (options) => request('/ev-models', options),
  geocode: (query, options) =>
    request(`/geocode?q=${encodeURIComponent(query)}`, options),
  trips: (limit = 20, options) => request(`/trips?limit=${limit}`, options),
  trip: (id, options) => request(`/trips/${id}`, options),
  planTrip: (payload, options) =>
    request('/trips', { ...options, method: 'POST', body: payload }),
  options: (options) => request('/options', options),
  quote: (payload, options) =>
    request('/quote', { ...options, method: 'POST', body: payload }),
  contact: (payload, options) =>
    request('/contact', { ...options, method: 'POST', body: payload }),
};
