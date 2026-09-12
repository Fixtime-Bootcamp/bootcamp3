import { describe, expect, it, vi } from 'vitest';
import { listAppointments } from './resources';
import { ApiError } from '../types';

/**
 * Testes unitários do cliente HTTP tipado do frontend.
 * Valida o cumprimento do contrato REST /api/v1 (RNF01) e mapeamento padronizado de erros (RNF03).
 */
describe('API client', () => {
  /**
   * Valida RNF01 e RF05: Deserialização de resposta 200 OK em lista tipada de agendamentos.
   */
  it('returns appointments from a successful response', async () => {
    const appointments = [{ id: 10, customerId: 1, technicianId: 2, serviceId: 3, startsAt: '2026-09-03T10:00:00', endsAt: '2026-09-03T11:30:00', status: 'SCHEDULED' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(appointments), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    await expect(listAppointments()).resolves.toEqual(appointments);
    expect(fetch).toHaveBeenCalledWith('/api/v1/appointments', expect.objectContaining({ headers: {} }));
  });

  /**
   * Valida RNF02 e RNF03: Mapeamento de erros de validação (400 Bad Request com fieldErrors).
   */
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

  /**
   * Valida RN05 e RNF03: Mapeamento de respostas 409 Conflict para instâncias de ApiError tipadas.
   */
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
