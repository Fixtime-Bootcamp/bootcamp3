import type {
  Appointment,
  AppointmentStatus,
  AvailabilitySlot,
  CreateAppointmentInput,
  CreateCustomerInput,
  CreateServiceInput,
  CreateTechnicianInput,
  Customer,
  Service,
  Technician,
} from '../types';
import { request } from './client';

export type ListAppointmentsFilter = {
  date?: string;
  technicianId?: number;
  status?: AppointmentStatus;
};

export const listCustomers = (init?: RequestInit) => request<Customer[]>('/customers', init);
export const listTechnicians = (init?: RequestInit) => request<Technician[]>('/technicians', init);
export const listServices = (init?: RequestInit) => request<Service[]>('/services', init);

export const createCustomer = (input: CreateCustomerInput) =>
  request<Customer>('/customers', { method: 'POST', body: JSON.stringify(input) });

export const toggleCustomerActive = (id: number) =>
  request<Customer>(`/customers/${id}/toggle-active`, { method: 'PATCH' });

export const createTechnician = (input: CreateTechnicianInput) =>
  request<Technician>('/technicians', { method: 'POST', body: JSON.stringify(input) });

export const toggleTechnicianActive = (id: number) =>
  request<Technician>(`/technicians/${id}/toggle-active`, { method: 'PATCH' });

export const createService = (input: CreateServiceInput) =>
  request<Service>('/services', { method: 'POST', body: JSON.stringify(input) });

export const toggleServiceActive = (id: number) =>
  request<Service>(`/services/${id}/toggle-active`, { method: 'PATCH' });

export const listAppointments = (
  filterOrInit?: ListAppointmentsFilter | RequestInit,
  init?: RequestInit,
) => {
  let queryParams = '';
  let requestInit = init;

  if (filterOrInit && ('date' in filterOrInit || 'technicianId' in filterOrInit || 'status' in filterOrInit)) {
    const params = new URLSearchParams();
    if (filterOrInit.date) params.set('date', filterOrInit.date);
    if (filterOrInit.technicianId) params.set('technicianId', String(filterOrInit.technicianId));
    if (filterOrInit.status) params.set('status', filterOrInit.status);
    const queryString = params.toString();
    if (queryString) {
      queryParams = `?${queryString}`;
    }
  } else if (filterOrInit && !('date' in filterOrInit) && !requestInit) {
    requestInit = filterOrInit as RequestInit;
  }

  return request<Appointment[]>(`/appointments${queryParams}`, requestInit);
};

export const getTechnicianAvailability = (
  technicianId: number,
  date: string,
  init?: RequestInit,
) => request<AvailabilitySlot[]>(`/technicians/${technicianId}/availability?date=${encodeURIComponent(date)}`, init);

export const createAppointment = (input: CreateAppointmentInput) =>
  request<Appointment>('/appointments', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const cancelAppointment = (id: number, init?: RequestInit) =>
  request<Appointment>(`/appointments/${id}/cancel`, {
    method: 'PATCH',
    ...init,
  });

export const completeAppointment = (id: number, init?: RequestInit) =>
  request<Appointment>(`/appointments/${id}/complete`, {
    method: 'PATCH',
    ...init,
  });
