import { useCallback, useEffect, useState } from 'react';
import { listAppointments } from '../api/resources';
import { ApiError, type Appointment } from '../types';

export type AppointmentQueryState = {
  data: Appointment[];
  status: 'loading' | 'success' | 'error';
  error: ApiError | null;
  reload: () => void;
};

export function useAppointments(): AppointmentQueryState {
  const [data, setData] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const reload = useCallback(() => {
    setReloadCount((c) => c + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    listAppointments({ signal: controller.signal })
      .then((items) => {
        setData(items);
        setStatus('success');
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError('UNKNOWN_ERROR', 'Não foi possível carregar os agendamentos.');
        setData([]);
        setStatus('error');
        setError(apiError);
      });

    return () => controller.abort();
  }, [reloadCount]);

  return { data, status, error, reload };
}

