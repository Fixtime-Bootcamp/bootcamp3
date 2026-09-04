import type {
  Appointment,
  CreateAppointmentInput,
  Customer,
  Service,
  Technician,
} from '../types';
import { request } from './client';

export const listCustomers = () => request<Customer[]>('/customers');
export const listTechnicians = () => request<Technician[]>('/technicians');
export const listServices = () => request<Service[]>('/services');
export const listAppointments = (init?: RequestInit) => request<Appointment[]>('/appointments', init);

export const createAppointment = (input: CreateAppointmentInput) =>
  request<Appointment>('/appointments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
