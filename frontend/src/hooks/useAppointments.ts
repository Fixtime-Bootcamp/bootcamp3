import { useCallback, useEffect, useState } from 'react';
import {
  cancelAppointment,
  completeAppointment,
  listAppointments,
  type ListAppointmentsFilter,
} from '../api/resources';
import { ApiError, type Appointment } from '../types';

export type AppointmentQueryState = {
  data: Appointment[];
  status: 'loading' | 'success' | 'error';
  error: ApiError | null;
  reload: () => void;
  cancel: (id: number) => Promise<Appointment>;
  complete: (id: number) => Promise<Appointment>;
};

export function useAppointments(filter?: ListAppointmentsFilter): AppointmentQueryState {
  const [data, setData] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  const filterDate = filter?.date;
  const filterTechnicianId = filter?.technicianId;
  const filterStatus = filter?.status;

  const reload = useCallback(() => {
    setReloadCount((c) => c + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');

    const activeFilter: ListAppointmentsFilter = {};
    if (filterDate) activeFilter.date = filterDate;
    if (filterTechnicianId) activeFilter.technicianId = filterTechnicianId;
    if (filterStatus) activeFilter.status = filterStatus;

    listAppointments(activeFilter, { signal: controller.signal })
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
  }, [filterDate, filterTechnicianId, filterStatus, reloadCount]);

  const cancel = useCallback(async (id: number): Promise<Appointment> => {
    try {
      const updated = await cancelAppointment(id);
      setData((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      return updated;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('UNKNOWN_ERROR', 'Falha ao cancelar o agendamento.');
    }
  }, []);

  const complete = useCallback(async (id: number): Promise<Appointment> => {
    try {
      const updated = await completeAppointment(id);
      setData((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
      return updated;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError('UNKNOWN_ERROR', 'Falha ao concluir o agendamento.');
    }
  }, []);

  return { data, status, error, reload, cancel, complete };
}
