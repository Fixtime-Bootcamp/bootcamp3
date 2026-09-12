import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../types';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function useEntityList<T>(fetcher: (signal: AbortSignal) => Promise<T[]>) {
  const [data, setData] = useState<T[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<ApiError | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError(null);
    fetcherRef
      .current(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
          setStatus('success');
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            err instanceof ApiError
              ? err
              : new ApiError('UNKNOWN_ERROR', 'Erro inesperado ao carregar dados.'),
          );
          setStatus('error');
        }
      });
    return () => controller.abort();
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { data, setData, status, error, reload };
}
