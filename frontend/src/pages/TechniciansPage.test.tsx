import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as resources from '../api/resources';
import type { Technician } from '../types';
import { ApiError } from '../types';
import { TechniciansPage } from './TechniciansPage';

vi.mock('../api/resources');

const mockTechnicians: Technician[] = [
  { id: 1, name: 'Carlos Mecânico', email: 'carlos@fixtime.com', phone: '11 91111-2222', active: true },
  { id: 2, name: 'Diego Eletricista', email: 'diego@fixtime.com', phone: '11 93333-4444', active: false },
];

/**
 * Testes unitários para a página de Gestão de Técnicos (TechniciansPage).
 * Valida o requisito funcional RF02 e as regras de ativação e integridade cadastral de técnicos (RN01).
 */
describe('TechniciansPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resources.listTechnicians).mockResolvedValue(mockTechnicians);
    vi.mocked(resources.createTechnician).mockResolvedValue({
      id: 3,
      name: 'Eduardo Técnico',
      email: 'edu@fixtime.com',
      phone: '11 95555-6666',
      active: true,
    });
    vi.mocked(resources.toggleTechnicianActive).mockResolvedValue({
      ...mockTechnicians[0],
      active: false,
    });
  });

  /**
   * Valida RF02: Exibição da lista de técnicos cadastrados retornada pela API.
   */
  it('exibe lista de técnicos ao carregar', async () => {
    render(<TechniciansPage />);
    expect(await screen.findByText('Carlos Mecânico')).toBeInTheDocument();
    expect(screen.getByText('Diego Eletricista')).toBeInTheDocument();
  });

  /**
   * Valida RF02: Exibição de mensagem informativa quando a lista de técnicos está vazia.
   */
  it('exibe estado vazio quando não há técnicos', async () => {
    vi.mocked(resources.listTechnicians).mockResolvedValue([]);
    render(<TechniciansPage />);
    expect(await screen.findByText(/Nenhum técnico cadastrado/)).toBeInTheDocument();
  });

  /**
   * Valida RNF03: Exibição de banner de erro quando a API falha ao carregar a lista.
   */
  it('exibe erro quando a API falha ao carregar', async () => {
    vi.mocked(resources.listTechnicians).mockRejectedValue(
      new ApiError('NETWORK_ERROR', 'Não foi possível conectar à API.'),
    );
    render(<TechniciansPage />);
    expect(await screen.findByText(/Erro ao carregar técnicos/)).toBeInTheDocument();
  });

  /**
   * Valida RNF02: Validação de campos obrigatórios no formulário de cadastro de técnico.
   */
  it('valida campos obrigatórios ao tentar cadastrar', async () => {
    render(<TechniciansPage />);
    await screen.findByText('Carlos Mecânico');
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    expect(await screen.findByText('Nome é obrigatório.')).toBeInTheDocument();
  });

  /**
   * Valida RF02: Cadastro de novo técnico e atualização reativa da lista.
   */
  it('cadastra técnico válido e atualiza lista reativamente', async () => {
    render(<TechniciansPage />);
    await screen.findByText('Carlos Mecânico');
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Eduardo Técnico' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'edu@fixtime.com' } });
    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '11 95555-6666' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    await waitFor(() => {
      expect(screen.getByText('Eduardo Técnico')).toBeInTheDocument();
    });
  });

  /**
   * Valida RNF03: Exibição de erro da API quando o cadastro de técnico falha (ex.: e-mail em conflito).
   */
  it('exibe erro HTTP ao falhar no cadastro', async () => {
    vi.mocked(resources.createTechnician).mockRejectedValue(
      new ApiError('CONFLICT', 'E-mail já cadastrado.'),
    );
    render(<TechniciansPage />);
    await screen.findByText('Carlos Mecânico');
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Teste' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'carlos@fixtime.com' } });
    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '11 91111-2222' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    expect(await screen.findByText('E-mail já cadastrado.')).toBeInTheDocument();
  });

  /**
   * Valida RN01: Alternância do status ativo/inativo do técnico.
   */
  it('alterna status do técnico ao clicar em Desativar', async () => {
    render(<TechniciansPage />);
    await screen.findByText('Carlos Mecânico');
    fireEvent.click(screen.getByRole('button', { name: /Desativar Carlos Mecânico/i }));
    await waitFor(() => {
      expect(resources.toggleTechnicianActive).toHaveBeenCalledWith(1);
    });
  });
});
