import { useEffect, useState } from 'react';
import { listCustomers, listServices, listTechnicians } from '../api/resources';
import { ApiError, type Customer, type Service, type Technician } from '../types';

export type AppointmentResourcesState = {
  customers: Customer[];
  technicians: Technician[];
  services: Service[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: ApiError | null;
  reload: () => void;
};

export function useAppointmentResources(enabled: boolean = true): AppointmentResourcesState {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }

    const controller = new AbortController();
    setStatus('loading');

    Promise.all([
      listCustomers({ signal: controller.signal }),
      listTechnicians({ signal: controller.signal }),
      listServices({ signal: controller.signal }),
    ])
      .then(([customersData, techniciansData, servicesData]) => {
        setCustomers(customersData);
        setTechnicians(techniciansData);
        setServices(servicesData);
        setStatus('success');
        setError(null);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const apiError =
          err instanceof ApiError
            ? err
            : new ApiError('UNKNOWN_ERROR', 'Não foi possível carregar os dados para agendamento.');
        setStatus('error');
        setError(apiError);
      });

    return () => controller.abort();
  }, [enabled, reloadKey]);

  return { customers, technicians, services, status, error, reload };
}
