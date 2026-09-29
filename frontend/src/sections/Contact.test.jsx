import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Contact from './Contact';

describe('Contact', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends the form and shows a confirmation', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'received' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<Contact />);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello there, nice site!' } });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/your message has been sent/i)).toBeInTheDocument();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/contact');
    expect(JSON.parse(options.body)).toMatchObject({ name: 'Ada', website: '' });
    await waitFor(() => expect(screen.getByLabelText('Name')).toHaveValue(''));
  });

  it('shows the server error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'Too many requests, try again in a minute' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    render(<Contact />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada@example.com' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello there, nice site!' } });
    fireEvent.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/too many requests/i)).toBeInTheDocument();
  });
});
