import { useEffect, useState } from 'react';
import { listAppointments } from '../api/resources';
import { ApiError, type Appointment } from '../types';

export type AppointmentQueryState = {
  data: Appointment[];
  status: 'loading' | 'success' | 'error';
  error: ApiError | null;
};

export function useAppointments(): AppointmentQueryState {
  const [state, setState] = useState<AppointmentQueryState>({
    data: [],
    status: 'loading',
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    listAppointments({ signal: controller.signal })
      .then((data) => setState({ data, status: 'success', error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        const apiError = error instanceof ApiError
          ? error
          : new ApiError('UNKNOWN_ERROR', 'Não foi possível carregar os agendamentos.');
        setState({ data: [], status: 'error', error: apiError });
      });

    return () => controller.abort();
  }, []);

  return state;
}
