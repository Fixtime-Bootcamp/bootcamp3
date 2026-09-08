import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Appointment, Customer, Service, Technician } from '../types';
import { AppointmentCard } from './AppointmentCard';

describe('AppointmentCard', () => {
  const mockCustomer: Customer = { id: 1, name: 'Ana Paula', email: 'ana@example.com', phone: '11999990001', active: true };
  const mockTechnician: Technician = { id: 10, name: 'Roberto Santos', email: 'roberto@example.com', phone: '11988880001', active: true };
  const mockService: Service = { id: 100, name: 'Troca de compressor', description: 'Troca do compressor', durationMinutes: 90, price: 350, active: true };

  const baseAppointment: Appointment = {
    id: 42,
    customerId: 1,
    technicianId: 10,
    serviceId: 100,
    startsAt: '2026-09-08T14:00:00',
    endsAt: '2026-09-08T15:30:00',
    status: 'SCHEDULED',
  };

  it('renders customer, technician, service names, and formatted time', () => {
    render(
      <AppointmentCard
        appointment={baseAppointment}
        customer={mockCustomer}
        technician={mockTechnician}
        service={mockService}
        onCancel={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText('Ana Paula')).toBeInTheDocument();
    expect(screen.getByText('Roberto Santos')).toBeInTheDocument();
    expect(screen.getByText('Troca de compressor')).toBeInTheDocument();
    expect(screen.getByText('14:00')).toBeInTheDocument();
    expect(screen.getByText('15:30')).toBeInTheDocument();
    expect(screen.getByText('SCHEDULED')).toBeInTheDocument();
  });

  it('enables cancel and disables complete when more than 2h before visit', () => {
    const now = new Date('2026-09-08T11:00:00'); // 3 hours before start
    render(
      <AppointmentCard
        appointment={baseAppointment}
        customer={mockCustomer}
        technician={mockTechnician}
        service={mockService}
        now={now}
        onCancel={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancelar agendamento #42' });
    const completeButton = screen.getByRole('button', { name: 'Concluir agendamento #42' });

    expect(cancelButton).not.toBeDisabled();
    expect(completeButton).toBeDisabled();
  });

  it('disables cancel when less than 2h before start time', () => {
    const now = new Date('2026-09-08T13:00:00'); // 1 hour before start
    render(
      <AppointmentCard
        appointment={baseAppointment}
        customer={mockCustomer}
        technician={mockTechnician}
        service={mockService}
        now={now}
        onCancel={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancelar agendamento #42' });
    expect(cancelButton).toBeDisabled();
    expect(cancelButton).toHaveAttribute('title', expect.stringContaining('2 horas de antecedência'));
  });

  it('enables complete and disables cancel after visit end time', () => {
    const now = new Date('2026-09-08T16:00:00'); // after 15:30
    render(
      <AppointmentCard
        appointment={baseAppointment}
        customer={mockCustomer}
        technician={mockTechnician}
        service={mockService}
        now={now}
        onCancel={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancelar agendamento #42' });
    const completeButton = screen.getByRole('button', { name: 'Concluir agendamento #42' });

    expect(cancelButton).toBeDisabled();
    expect(completeButton).not.toBeDisabled();
  });

  it('triggers onCancel when clicking Cancelar button', async () => {
    const now = new Date('2026-09-08T11:00:00');
    const handleCancel = vi.fn().mockResolvedValue(undefined);

    render(
      <AppointmentCard
        appointment={baseAppointment}
        customer={mockCustomer}
        technician={mockTechnician}
        service={mockService}
        now={now}
        onCancel={handleCancel}
        onComplete={vi.fn()}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancelar agendamento #42' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(handleCancel).toHaveBeenCalledWith(42);
    });
  });

  it('triggers onComplete when clicking Concluir button', async () => {
    const now = new Date('2026-09-08T16:00:00');
    const handleComplete = vi.fn().mockResolvedValue(undefined);

    render(
      <AppointmentCard
        appointment={baseAppointment}
        customer={mockCustomer}
        technician={mockTechnician}
        service={mockService}
        now={now}
        onCancel={vi.fn()}
        onComplete={handleComplete}
      />
    );

    const completeButton = screen.getByRole('button', { name: 'Concluir agendamento #42' });
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(handleComplete).toHaveBeenCalledWith(42);
    });
  });

  it('renders finalized labels when status is COMPLETED or CANCELLED', () => {
    const { rerender } = render(
      <AppointmentCard
        appointment={{ ...baseAppointment, status: 'COMPLETED' }}
        onCancel={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText('✓ Visita Concluída')).toBeInTheDocument();

    rerender(
      <AppointmentCard
        appointment={{ ...baseAppointment, status: 'CANCELLED' }}
        onCancel={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    expect(screen.getByText('✕ Visita Cancelada')).toBeInTheDocument();
  });
});
