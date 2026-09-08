import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

describe('FixTime shell & operational agenda', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('presents loading and then the empty agenda state', async () => {
    let resolveRequest: (response: Response) => void = () => undefined;
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      if (url.includes('/api/v1/appointments')) {
        return new Promise<Response>((resolve) => { resolveRequest = resolve; });
      }
      return Promise.resolve(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    }));

    render(<App />);

    expect(screen.getByText('Carregando agendamentos...')).toBeInTheDocument();
    resolveRequest(new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    await waitFor(() => expect(screen.getByText('Nenhuma visita agendada')).toBeInTheDocument());
  });

  it('presents a standardized conflict error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 409,
      error: 'CONFLICT',
      message: 'O técnico já possui uma visita nesse intervalo',
    }), { status: 409, headers: { 'Content-Type': 'application/json' } })));
    render(<App />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('O técnico já possui uma visita nesse intervalo'));
  });

  it('opens appointment modal and refreshes agenda on successful creation', async () => {
    let appointments = [
      { id: 1, customerId: 1, technicianId: 10, serviceId: 100, startsAt: '2026-09-02T09:00:00', endsAt: '2026-09-02T10:00:00', status: 'SCHEDULED' },
    ];

    const mockCustomers = [{ id: 1, name: 'Ana Paula', active: true }];
    const mockTechnicians = [{ id: 10, name: 'Roberto Santos', active: true }];
    const mockServices = [{ id: 100, name: 'Troca de compressor', durationMinutes: 90, price: 350, active: true }];

    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/api/v1/customers')) {
        return new Response(JSON.stringify(mockCustomers), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/api/v1/technicians/10/availability')) {
        return new Response(JSON.stringify([{ startsAt: '2026-09-03T08:00:00', endsAt: '2026-09-03T18:00:00' }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/api/v1/technicians')) {
        return new Response(JSON.stringify(mockTechnicians), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/api/v1/services')) {
        return new Response(JSON.stringify(mockServices), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/api/v1/appointments') && init?.method === 'POST') {
        const newAppt = {
          id: 2,
          customerId: 1,
          technicianId: 10,
          serviceId: 100,
          startsAt: '2026-09-02T10:00:00',
          endsAt: '2026-09-02T11:30:00',
          status: 'SCHEDULED',
        };
        appointments = [...appointments, newAppt];
        return new Response(JSON.stringify(newAppt), { status: 201, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/api/v1/appointments')) {
        return new Response(JSON.stringify(appointments), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('Not found', { status: 404 });
    }));

    render(<App />);

    await waitFor(() => expect(screen.getByText('ID #1')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /novo agendamento/i }));

    await waitFor(() => expect(screen.getByText('Agendar Visita Técnica')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Técnico *'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Serviço *'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Data da visita *'), { target: { value: '2026-09-02' } });
    fireEvent.change(screen.getByLabelText('Horário de início *'), { target: { value: '10:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Agendamento' }));

    await waitFor(() => {
      expect(screen.queryByText('Agendar Visita Técnica')).not.toBeInTheDocument();
      expect(screen.getByText('ID #2')).toBeInTheDocument();
    });
  });

  it('filters appointments when changing date in date bar', async () => {
    const mockAppointments = [
      { id: 10, customerId: 1, technicianId: 10, serviceId: 100, startsAt: '2026-09-05T09:00:00', endsAt: '2026-09-05T10:00:00', status: 'SCHEDULED' },
    ];

    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (url.includes('date=2026-09-05')) {
        return new Response(JSON.stringify(mockAppointments), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));

    render(<App />);

    await waitFor(() => expect(screen.getByText('Nenhuma visita agendada')).toBeInTheDocument());

    const dateInput = screen.getByLabelText('Filtrar data da agenda');
    fireEvent.change(dateInput, { target: { value: '2026-09-05' } });

    await waitFor(() => {
      expect(screen.getByText('ID #10')).toBeInTheDocument();
    });
  });

  it('cancels an appointment and updates status locally without full reload', async () => {
    // 2026-09-02T16:00:00 is far in advance if tested against past date or current
    const initialAppointments = [
      { id: 99, customerId: 1, technicianId: 10, serviceId: 100, startsAt: '2099-09-02T16:00:00', endsAt: '2099-09-02T17:30:00', status: 'SCHEDULED' },
    ];

    const cancelledAppointment = {
      ...initialAppointments[0],
      status: 'CANCELLED',
    };

    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/api/v1/appointments/99/cancel') && init?.method === 'PATCH') {
        return new Response(JSON.stringify(cancelledAppointment), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes('/api/v1/appointments')) {
        return new Response(JSON.stringify(initialAppointments), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));

    render(<App />);

    await waitFor(() => expect(screen.getByText('ID #99')).toBeInTheDocument());

    const cancelButton = screen.getByRole('button', { name: 'Cancelar agendamento #99' });
    expect(cancelButton).not.toBeDisabled();

    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('✕ Visita Cancelada')).toBeInTheDocument();
      expect(screen.getByText('CANCELLED')).toBeInTheDocument();
    });
  });

  it('displays error alert when cancel action fails', async () => {
    const initialAppointments = [
      { id: 88, customerId: 1, technicianId: 10, serviceId: 100, startsAt: '2099-09-02T16:00:00', endsAt: '2099-09-02T17:30:00', status: 'SCHEDULED' },
    ];

    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (url.includes('/api/v1/appointments/88/cancel')) {
        return new Response(JSON.stringify({ status: 500, error: 'SERVER_ERROR', message: 'Erro interno ao cancelar' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (url.includes('/api/v1/appointments')) {
        return new Response(JSON.stringify(initialAppointments), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));

    render(<App />);

    await waitFor(() => expect(screen.getByText('ID #88')).toBeInTheDocument());

    const cancelButton = screen.getByRole('button', { name: 'Cancelar agendamento #88' });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Erro ao cancelar agendamento #88: Erro interno ao cancelar')).toBeInTheDocument();
    });
  });
});
