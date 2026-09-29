import { useEffect, useState } from 'react';

/**
 * Load data from the API when a component mounts.
 * Returns { data, error, loading }. The request is cancelled if the
 * component unmounts first, so we never set state on an unmounted component.
 */
export function useApi(load) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    load({ signal: controller.signal })
      .then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: null, error, loading: false });
      });
    return () => controller.abort();
  }, [load]);

  return state;
}
