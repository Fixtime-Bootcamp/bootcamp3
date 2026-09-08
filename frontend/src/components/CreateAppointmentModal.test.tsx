import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateAppointmentModal } from './CreateAppointmentModal';

const mockCustomers = [
  { id: 1, name: 'Ana Paula', email: 'ana@example.com', phone: '11999990001', active: true },
  { id: 2, name: 'Carlos Silva', email: 'carlos@example.com', phone: '11999990002', active: true },
];

const mockTechnicians = [
  { id: 10, name: 'Roberto Santos', email: 'roberto@example.com', phone: '11988880001', active: true },
  { id: 11, name: 'Mariana Lima', email: 'mariana@example.com', phone: '11988880002', active: true },
];

const mockServices = [
  { id: 100, name: 'Troca de compressor', description: 'Substituição completa do compressor', durationMinutes: 90, price: 350.0, active: true },
  { id: 101, name: 'Higienização de ar', description: 'Limpeza e desinfecção', durationMinutes: 45, price: 120.0, active: true },
];

function setupFetchMock(customHandlers: Record<string, Response> = {}) {
  const defaultHandlers: Record<string, Response> = {
    '/api/v1/customers': new Response(JSON.stringify(mockCustomers), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
    '/api/v1/technicians': new Response(JSON.stringify(mockTechnicians), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
    '/api/v1/services': new Response(JSON.stringify(mockServices), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  };

  const handlers = { ...defaultHandlers, ...customHandlers };

  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    // Check custom handlers first
    for (const [route, response] of Object.entries(customHandlers)) {
      if (url.includes(route)) {
        return response.clone();
      }
    }

    if (url.includes('/availability')) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    for (const [route, response] of Object.entries(defaultHandlers)) {
      if (url.includes(route)) {
        return response.clone();
      }
    }

    return new Response(JSON.stringify({ message: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }));
}

describe('CreateAppointmentModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders modal when isOpen is true and loads initial resources', async () => {
    setupFetchMock();
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <CreateAppointmentModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByText('Carregando dados necessários...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Agendar Visita Técnica')).toBeInTheDocument();
      expect(screen.getByLabelText('Cliente *')).toBeInTheDocument();
      expect(screen.getByLabelText('Técnico *')).toBeInTheDocument();
      expect(screen.getByLabelText('Serviço *')).toBeInTheDocument();
    });
  });

  it('validates required fields on submit without inputs', async () => {
    setupFetchMock();
    render(
      <CreateAppointmentModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByLabelText('Cliente *')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Agendamento' }));

    await waitFor(() => {
      expect(screen.getByText('Selecione um cliente.')).toBeInTheDocument();
      expect(screen.getByText('Selecione um técnico.')).toBeInTheDocument();
      expect(screen.getByText('Selecione um serviço.')).toBeInTheDocument();
      expect(screen.getByText('Informe a data da visita.')).toBeInTheDocument();
      expect(screen.getByText('Informe o horário de início.')).toBeInTheDocument();
    });
  });

  it('displays service duration and price when service is selected', async () => {
    setupFetchMock();
    render(
      <CreateAppointmentModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByLabelText('Serviço *')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Serviço *'), { target: { value: '100' } });

    await waitFor(() => {
      expect(screen.getByLabelText('Detalhes do serviço selecionado')).toBeInTheDocument();
      expect(screen.getByText('90 minutos')).toBeInTheDocument();
      expect(screen.getByText('Substituição completa do compressor')).toBeInTheDocument();
    });
  });

  it('queries and displays technician availability when technician and date are chosen', async () => {
    const availabilitySlots = [
      { startsAt: '2026-09-10T08:00:00', endsAt: '2026-09-10T12:00:00' },
      { startsAt: '2026-09-10T14:00:00', endsAt: '2026-09-10T18:00:00' },
    ];

    setupFetchMock({
      '/api/v1/technicians/10/availability': new Response(JSON.stringify(availabilitySlots), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    render(
      <CreateAppointmentModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByLabelText('Técnico *')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Técnico *'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Data da visita *'), { target: { value: '2026-09-10' } });

    await waitFor(() => {
      expect(screen.getByText('08:00 às 12:00')).toBeInTheDocument();
      expect(screen.getByText('14:00 às 18:00')).toBeInTheDocument();
    });
  });

  it('validates invalid start time outside business hours', async () => {
    setupFetchMock();
    render(
      <CreateAppointmentModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByLabelText('Cliente *')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Técnico *'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Serviço *'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Data da visita *'), { target: { value: '2026-09-10' } });
    fireEvent.change(screen.getByLabelText('Horário de início *'), { target: { value: '07:30' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Agendamento' }));

    await waitFor(() => {
      expect(screen.getByText('O horário de início deve estar entre 08:00 e 18:00.')).toBeInTheDocument();
    });
  });

  it('submits valid payload and triggers onSuccess upon successful API response', async () => {
    const createdAppointment = {
      id: 50,
      customerId: 1,
      technicianId: 10,
      serviceId: 100,
      startsAt: '2026-09-10T10:00:00',
      endsAt: '2026-09-10T11:30:00',
      status: 'SCHEDULED',
    };

    setupFetchMock({
      '/api/v1/appointments': new Response(JSON.stringify(createdAppointment), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    });

    const handleSuccess = vi.fn();

    render(
      <CreateAppointmentModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={handleSuccess}
      />
    );

    await waitFor(() => expect(screen.getByLabelText('Cliente *')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Técnico *'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Serviço *'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Data da visita *'), { target: { value: '2026-09-10' } });
    fireEvent.change(screen.getByLabelText('Horário de início *'), { target: { value: '10:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Agendamento' }));

    await waitFor(() => {
      expect(handleSuccess).toHaveBeenCalledWith(createdAppointment);
    });
  });

  it('displays conflict error alert when API returns 409 CONFLICT', async () => {
    setupFetchMock({
      '/api/v1/appointments': new Response(
        JSON.stringify({
          status: 409,
          error: 'CONFLICT',
          message: 'O técnico já possui um agendamento conflitante neste horário.',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    });

    render(
      <CreateAppointmentModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByLabelText('Cliente *')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Técnico *'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Serviço *'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Data da visita *'), { target: { value: '2026-09-10' } });
    fireEvent.change(screen.getByLabelText('Horário de início *'), { target: { value: '10:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Agendamento' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Conflito de agendamento:');
      expect(screen.getByText('O técnico já possui um agendamento conflitante neste horário.')).toBeInTheDocument();
    });
  });

  it('displays API error when server fails with 500 error', async () => {
    setupFetchMock({
      '/api/v1/appointments': new Response(
        JSON.stringify({
          status: 500,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Falha interna no servidor ao processar agendamento.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    });

    render(
      <CreateAppointmentModal
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => expect(screen.getByLabelText('Cliente *')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Técnico *'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Serviço *'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Data da visita *'), { target: { value: '2026-09-10' } });
    fireEvent.change(screen.getByLabelText('Horário de início *'), { target: { value: '10:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar Agendamento' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Erro ao criar agendamento:');
      expect(screen.getByText('Falha interna no servidor ao processar agendamento.')).toBeInTheDocument();
    });
  });
});
