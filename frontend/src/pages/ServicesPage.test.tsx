import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as resources from '../api/resources';
import type { Service } from '../types';
import { ApiError } from '../types';
import { ServicesPage } from './ServicesPage';

vi.mock('../api/resources');

const mockServices: Service[] = [
  {
    id: 1,
    name: 'Troca de Compressor',
    description: 'Substituição completa do compressor',
    durationMinutes: 90,
    price: 350,
    active: true,
  },
  {
    id: 2,
    name: 'Revisão Geral',
    description: null,
    durationMinutes: 60,
    price: 120,
    active: false,
  },
];

describe('ServicesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resources.listServices).mockResolvedValue(mockServices);
    vi.mocked(resources.createService).mockResolvedValue({
      id: 3,
      name: 'Instalação de Ar',
      description: null,
      durationMinutes: 120,
      price: 500,
      active: true,
    });
    vi.mocked(resources.toggleServiceActive).mockResolvedValue({
      ...mockServices[0],
      active: false,
    });
  });

  it('exibe lista de serviços ao carregar', async () => {
    render(<ServicesPage />);
    expect(await screen.findByText('Troca de Compressor')).toBeInTheDocument();
    expect(screen.getByText('Revisão Geral')).toBeInTheDocument();
  });

  it('exibe duração e preço de cada serviço', async () => {
    render(<ServicesPage />);
    await screen.findByText('Troca de Compressor');
    expect(screen.getByText('90 min')).toBeInTheDocument();
  });

  it('exibe estado vazio quando não há serviços', async () => {
    vi.mocked(resources.listServices).mockResolvedValue([]);
    render(<ServicesPage />);
    expect(await screen.findByText(/Nenhum serviço cadastrado/)).toBeInTheDocument();
  });

  it('exibe erro quando a API falha ao carregar', async () => {
    vi.mocked(resources.listServices).mockRejectedValue(
      new ApiError('NETWORK_ERROR', 'Não foi possível conectar à API.'),
    );
    render(<ServicesPage />);
    expect(await screen.findByText(/Erro ao carregar serviços/)).toBeInTheDocument();
  });

  it('valida campos obrigatórios ao tentar cadastrar', async () => {
    render(<ServicesPage />);
    await screen.findByText('Troca de Compressor');
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    expect(await screen.findByText('Nome é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('Duração deve ser maior que zero.')).toBeInTheDocument();
  });

  it('cadastra serviço válido e atualiza lista reativamente', async () => {
    render(<ServicesPage />);
    await screen.findByText('Troca de Compressor');
    fireEvent.change(screen.getByLabelText('Nome do Serviço'), { target: { value: 'Instalação de Ar' } });
    fireEvent.change(screen.getByLabelText('Duração (min)'), { target: { value: '120' } });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    await waitFor(() => {
      expect(screen.getByText('Instalação de Ar')).toBeInTheDocument();
    });
    expect(resources.createService).toHaveBeenCalled();
  });

  it('exibe erro HTTP ao falhar no cadastro', async () => {
    vi.mocked(resources.createService).mockRejectedValue(
      new ApiError('BAD_REQUEST', 'Preço não pode ser negativo.'),
    );
    render(<ServicesPage />);
    await screen.findByText('Troca de Compressor');
    fireEvent.change(screen.getByLabelText('Nome do Serviço'), { target: { value: 'Teste' } });
    fireEvent.change(screen.getByLabelText('Duração (min)'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Preço (R$)'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    expect(await screen.findByText('Preço não pode ser negativo.')).toBeInTheDocument();
  });

  it('alterna status do serviço ao clicar em Desativar', async () => {
    render(<ServicesPage />);
    await screen.findByText('Troca de Compressor');
    fireEvent.click(screen.getByRole('button', { name: /Desativar Troca de Compressor/i }));
    await waitFor(() => {
      expect(resources.toggleServiceActive).toHaveBeenCalledWith(1);
    });
  });
});
