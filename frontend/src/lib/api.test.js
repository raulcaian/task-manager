import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from './api';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls relative /api URLs and returns the JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([{ slug: 'taycan' }]));
    vi.stubGlobal('fetch', fetchMock);

    const models = await api.evModels();

    expect(fetchMock).toHaveBeenCalledWith('/api/ev-models', expect.anything());
    expect(models).toEqual([{ slug: 'taycan' }]);
  });

  it('encodes the geocode query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    await api.geocode('Cluj-Napoca & Stuttgart');

    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/geocode?q=Cluj-Napoca%20%26%20Stuttgart'
    );
  });

  it('sends POST bodies as JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 1 }, 201));
    vi.stubGlobal('fetch', fetchMock);

    await api.planTrip({ ev_model: 'taycan' });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(options.body)).toEqual({ ev_model: 'taycan' });
  });

  it('turns FastAPI error details into an ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ detail: 'Trip not found' }, 404)));

    const error = await api.trip(99).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toBe('Trip not found');
  });

  it('joins validation error messages', async () => {
    const body = { detail: [{ msg: 'too short' }, { msg: 'out of range' }] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(body, 422)));

    await expect(api.geocode('x')).rejects.toThrow('too short; out of range');
  });

  it('reports network failures with a friendly message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const error = await api.health().catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
  });
});
