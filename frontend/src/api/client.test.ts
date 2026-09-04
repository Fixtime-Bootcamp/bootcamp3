import { describe, expect, it, vi } from 'vitest';
import { listAppointments } from './resources';
import { ApiError } from '../types';

describe('API client', () => {
  it('returns appointments from a successful response', async () => {
    const appointments = [{ id: 10, customerId: 1, technicianId: 2, serviceId: 3, startsAt: '2026-09-03T10:00:00', endsAt: '2026-09-03T11:30:00', status: 'SCHEDULED' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(appointments), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    await expect(listAppointments()).resolves.toEqual(appointments);
    expect(fetch).toHaveBeenCalledWith('/api/v1/appointments', expect.objectContaining({ headers: {} }));
  });

  it('maps validation errors and field errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 400,
      error: 'VALIDATION_FAILED',
      message: 'Erros de validacao nos campos',
      fieldErrors: { startsAt: 'deve ser informado' },
    }), { status: 400, headers: { 'Content-Type': 'application/json' } })));

    await expect(listAppointments()).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      fieldErrors: { startsAt: 'deve ser informado' },
    });
  });

  it('maps conflict responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      status: 409,
      error: 'CONFLICT',
      message: 'Conflito de agenda',
    }), { status: 409, headers: { 'Content-Type': 'application/json' } })));

    await expect(listAppointments()).rejects.toBeInstanceOf(ApiError);
    await expect(listAppointments()).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
  });
});
