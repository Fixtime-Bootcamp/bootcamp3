import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadFile, filenameFromContentDisposition, request } from './client';
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

  it('unwraps paginated appointment payloads and filters by startDate/endDate', async () => {
    const appointments = [{ id: 11, customerId: 1, technicianId: 2, serviceId: 3, startsAt: '2026-10-16T09:00:00', endsAt: '2026-10-16T10:00:00', status: 'SCHEDULED' }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      content: appointments,
      totalElements: 1,
      totalPages: 1,
      pageNumber: 0,
      size: 20,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));

    await expect(listAppointments({ date: '2026-10-16' })).resolves.toEqual(appointments);
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/appointments?startDate=2026-10-16&endDate=2026-10-16',
      expect.objectContaining({ headers: {} }),
    );
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

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * Valida RNF03: Mapeamento de erros quando o backend não informa um código conhecido.
 */
describe('request error mapping', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    [404, 'NOT_FOUND'],
    [409, 'CONFLICT'],
    [400, 'BAD_REQUEST'],
    [500, 'UNKNOWN_ERROR'],
  ])('derives the error code from HTTP status %i when the body has no known code', async (status, code) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'SOMETHING_ELSE', message: 'Falhou' }, status)));

    await expect(request('/customers')).rejects.toMatchObject({ code, status, message: 'Falhou' });
  });

  it('keeps known error codes sent by the backend', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'BUSINESS_RULE_VIOLATION', message: 'Fora do horario' }, 422)));

    await expect(request('/appointments')).rejects.toMatchObject({ code: 'BUSINESS_RULE_VIOLATION', status: 422 });
  });

  it('uses a default message when the error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Internal Server Error', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    })));

    await expect(request('/customers')).rejects.toMatchObject({
      code: 'UNKNOWN_ERROR',
      status: 500,
      message: 'Não foi possível concluir a requisição.',
    });
  });

  it('treats malformed JSON bodies as empty payloads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{invalido', {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })));

    await expect(request('/customers/1')).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('resolves to null for successful responses without JSON content', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(request('/customers/1')).resolves.toBeNull();
  });

  it('maps fetch failures to NETWORK_ERROR', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(request('/customers')).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
      message: 'Não foi possível conectar à API.',
    });
  });

  it('sends the JSON content type only when there is a body and keeps custom headers', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ id: 1 }, 201)));

    await request('customers', { method: 'POST', body: '{}', headers: { 'X-Trace': 'abc' } });

    expect(fetch).toHaveBeenCalledWith('/api/v1/customers', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Trace': 'abc' },
    }));
  });
});

/**
 * Valida RF08: Download do CSV exportado com nome de arquivo vindo do Content-Disposition.
 */
describe('downloadFile', () => {
  const { createObjectURL, revokeObjectURL } = URL;
  let clickedDownload: string | undefined;

  beforeEach(() => {
    clickedDownload = undefined;
    URL.createObjectURL = vi.fn().mockReturnValue('blob:fixtime');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clickedDownload = this.download;
    });
  });

  afterEach(() => {
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('downloads the blob using the filename from the response and cleans up', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('id;status\n', {
      status: 200,
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="agendamentos.csv"' },
    })));

    await downloadFile('/appointments/export', 'fallback.csv');

    expect(clickedDownload).toBe('agendamentos.csv');
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixtime');
    expect(document.querySelector('a[download]')).toBeNull();
  });

  it('falls back to the default filename when the header is missing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('id\n', { status: 200 })));

    await downloadFile('/appointments/export', 'fallback.csv');

    expect(clickedDownload).toBe('fallback.csv');
  });

  it('throws ApiError and does not download when the response fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      error: 'BAD_REQUEST',
      message: 'startDate deve ser anterior a endDate',
    }, 400)));

    await expect(downloadFile('/appointments/export', 'fallback.csv')).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      message: 'startDate deve ser anterior a endDate',
    });
    expect(clickedDownload).toBeUndefined();
  });
});

describe('filenameFromContentDisposition', () => {
  it.each([
    [null, 'fallback.csv'],
    ["attachment; filename*=UTF-8''agendamentos%20out%C3%BAbro.csv", 'agendamentos outúbro.csv'],
    ["attachment; filename*=UTF-8''quebrado%E0%A4%A.csv", 'quebrado%E0%A4%A.csv'],
    ['attachment; filename="relatorio.csv"', 'relatorio.csv'],
    ['attachment; filename=simples.csv; size=10', 'simples.csv'],
    ['attachment', 'fallback.csv'],
  ])('parses %s', (header, expected) => {
    expect(filenameFromContentDisposition(header, 'fallback.csv')).toBe(expected);
  });
});
