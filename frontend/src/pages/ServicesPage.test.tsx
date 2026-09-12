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

/**
 * Testes unitários para a página de Catálogo de Serviços (ServicesPage).
 * Valida o requisito funcional RF03 e as regras de duração positiva e preço não-negativo (RN02).
 */
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

  /**
   * Valida RF03: Listagem de todos os serviços do catálogo cadastrados.
   */
  it('exibe lista de serviços ao carregar', async () => {
    render(<ServicesPage />);
    expect(await screen.findByText('Troca de Compressor')).toBeInTheDocument();
    expect(screen.getByText('Revisão Geral')).toBeInTheDocument();
  });

  /**
   * Valida RN02: Exibição da duração em minutos e preço monetário formatado.
   */
  it('exibe duração e preço de cada serviço', async () => {
    render(<ServicesPage />);
    await screen.findByText('Troca de Compressor');
    expect(screen.getByText('90 min')).toBeInTheDocument();
  });

  /**
   * Valida RF03: Exibição de estado vazio quando não há serviços disponíveis.
   */
  it('exibe estado vazio quando não há serviços', async () => {
    vi.mocked(resources.listServices).mockResolvedValue([]);
    render(<ServicesPage />);
    expect(await screen.findByText(/Nenhum serviço cadastrado/)).toBeInTheDocument();
  });

  /**
   * Valida RNF03: Exibição de mensagem informativa de erro quando a API falha.
   */
  it('exibe erro quando a API falha ao carregar', async () => {
    vi.mocked(resources.listServices).mockRejectedValue(
      new ApiError('NETWORK_ERROR', 'Não foi possível conectar à API.'),
    );
    render(<ServicesPage />);
    expect(await screen.findByText(/Erro ao carregar serviços/)).toBeInTheDocument();
  });

  /**
   * Valida RN02 e RNF02: Validação de duração positiva (> 0) e nome obrigatório no formulário.
   */
  it('valida campos obrigatórios ao tentar cadastrar', async () => {
    render(<ServicesPage />);
    await screen.findByText('Troca de Compressor');
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    expect(await screen.findByText('Nome é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('Duração deve ser maior que zero.')).toBeInTheDocument();
  });

  /**
   * Valida RF03 e RN02: Cadastro de serviço válido e atualização reativa do catálogo.
   */
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

  /**
   * Valida RN02 e RNF03: Exibição de mensagem de erro da API quando o preço ou duração são inválidos.
   */
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

  /**
   * Valida RN01: Alternância do status ativo/inativo do serviço no catálogo.
   */
  it('alterna status do serviço ao clicar em Desativar', async () => {
    render(<ServicesPage />);
    await screen.findByText('Troca de Compressor');
    fireEvent.click(screen.getByRole('button', { name: /Desativar Troca de Compressor/i }));
    await waitFor(() => {
      expect(resources.toggleServiceActive).toHaveBeenCalledWith(1);
    });
  });
});
