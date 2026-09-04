import { ApiError, type ApiErrorCode, type ApiErrorResponse } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

function joinUrl(path: string): string {
  return `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

function codeForStatus(status: number): ApiErrorCode {
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 400) return 'BAD_REQUEST';
  return 'UNKNOWN_ERROR';
}

function errorFromResponse(status: number, payload: unknown): ApiError {
  const response = payload as Partial<ApiErrorResponse> | null;
  const code = response?.error as ApiErrorCode | undefined;
  const knownCode: ApiErrorCode = code && [
    'VALIDATION_FAILED',
    'CONFLICT',
    'BUSINESS_RULE_VIOLATION',
    'BAD_REQUEST',
    'NOT_FOUND',
    'MALFORMED_JSON',
  ].includes(code) ? code : codeForStatus(status);

  return new ApiError(
    knownCode,
    response?.message || 'Não foi possível concluir a requisição.',
    { status, fieldErrors: response?.fieldErrors },
  );
}

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(joinUrl(path), {
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Não foi possível conectar à API.');
  }

  const payload = await readPayload(response);
  if (!response.ok) throw errorFromResponse(response.status, payload);
  return payload as T;
}
