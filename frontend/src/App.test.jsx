import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';

function mockFetchResponse(data, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(data),
  });
}

beforeEach(() => {
  global.fetch = vi.fn();
});

describe('App', () => {
  it('arată starea de loading, apoi lista de task-uri primită de la API', async () => {
    global.fetch.mockReturnValueOnce(
      mockFetchResponse([
        { id: 1, title: 'Cumpără lapte', status: 'pending' },
      ])
    );

    render(<App />);

    expect(screen.getByText(/se încarcă/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Cumpără lapte')).toBeInTheDocument();
    });
  });

  it('arată un mesaj când lista de task-uri e goală', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse([]));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/nu ai niciun task/i)).toBeInTheDocument();
    });
  });

  it('adaugă un task nou și îl afișează în listă', async () => {
    global.fetch.mockReturnValueOnce(mockFetchResponse([]));
    render(<App />);
    await waitFor(() => screen.getByText(/nu ai niciun task/i));

    global.fetch.mockReturnValueOnce(
      mockFetchResponse({ id: 123, title: 'Task nou', status: 'pending' })
    );

    fireEvent.change(screen.getByPlaceholderText(/titlu task nou/i), {
      target: { value: 'Task nou' },
    });
    fireEvent.click(screen.getByText('Adaugă'));

    await waitFor(() => {
      expect(screen.getByText('Task nou')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('șterge un task din listă', async () => {
    global.fetch.mockReturnValueOnce(
      mockFetchResponse([{ id: 1, title: 'De șters', status: 'pending' }])
    );
    render(<App />);
    await waitFor(() => screen.getByText('De șters'));

    global.fetch.mockReturnValueOnce(mockFetchResponse({}));

    fireEvent.click(screen.getByText('Șterge'));

    await waitFor(() => {
      expect(screen.queryByText('De șters')).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks/1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
