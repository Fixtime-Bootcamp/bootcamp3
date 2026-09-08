import type {
  Appointment,
  AvailabilitySlot,
  CreateAppointmentInput,
  Customer,
  Service,
  Technician,
} from '../types';
import { request } from './client';

export const listCustomers = (init?: RequestInit) => request<Customer[]>('/customers', init);
export const listTechnicians = (init?: RequestInit) => request<Technician[]>('/technicians', init);
export const listServices = (init?: RequestInit) => request<Service[]>('/services', init);
export const listAppointments = (init?: RequestInit) => request<Appointment[]>('/appointments', init);

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
