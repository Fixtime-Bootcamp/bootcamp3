import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

describe('FixTime shell', () => {
  it('presents loading and then the empty agenda state', async () => {
    let resolveRequest: (response: Response) => void = () => undefined;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>((resolve) => { resolveRequest = resolve; })));
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
});
