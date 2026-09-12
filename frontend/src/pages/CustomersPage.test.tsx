import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as resources from '../api/resources';
import type { Customer } from '../types';
import { ApiError } from '../types';
import { CustomersPage } from './CustomersPage';

vi.mock('../api/resources');

const mockCustomers: Customer[] = [
  { id: 1, name: 'Ana Silva', email: 'ana@exemplo.com', phone: '11 91111-1111', active: true },
  { id: 2, name: 'Bruno Costa', email: 'bruno@exemplo.com', phone: '11 92222-2222', active: false },
];

/**
 * Testes unitários para a página de Gestão de Clientes (CustomersPage).
 * Valida o requisito funcional RF01 e as regras de ativação e integridade cadastral (RN01).
 */
describe('CustomersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resources.listCustomers).mockResolvedValue(mockCustomers);
    vi.mocked(resources.createCustomer).mockResolvedValue({
      id: 3,
      name: 'Carla Dias',
      email: 'carla@exemplo.com',
      phone: '11 93333-3333',
      active: true,
    });
    vi.mocked(resources.toggleCustomerActive).mockResolvedValue({
      ...mockCustomers[0],
      active: false,
    });
  });

  /**
   * Valida RF01: Exibição da lista de clientes cadastrados retornados pela API.
   */
  it('exibe lista de clientes existentes ao carregar', async () => {
    render(<CustomersPage />);
    expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument();
  });

  /**
   * Valida RN01: Exibição correta dos badges de status Ativo e Inativo.
   */
  it('exibe badge Ativo e Inativo corretamente', async () => {
    render(<CustomersPage />);
    await screen.findByText('Ana Silva');
    const badges = screen.getAllByText(/Ativo|Inativo/);
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * Valida RF01: Exibição de mensagem informativa quando a listagem de clientes está vazia.
   */
  it('exibe mensagem de estado vazio quando não há clientes', async () => {
    vi.mocked(resources.listCustomers).mockResolvedValue([]);
    render(<CustomersPage />);
    expect(await screen.findByText(/Nenhum cliente cadastrado/)).toBeInTheDocument();
  });

  /**
   * Valida RNF02: Exibição de estado de carregamento e remoção após retorno dos dados.
   */
  it('exibe estado de carregamento e o remove assim que os dados chegam', async () => {
    let resolveList: (customers: Customer[]) => void = () => {};
    vi.mocked(resources.listCustomers).mockReturnValue(
      new Promise<Customer[]>((resolve) => {
        resolveList = resolve;
      }),
    );

    render(<CustomersPage />);

    expect(screen.getByText('Carregando clientes...')).toBeInTheDocument();

    resolveList(mockCustomers);

    await waitFor(() => {
      expect(screen.queryByText('Carregando clientes...')).not.toBeInTheDocument();
      expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    });
  });

  /**
   * Valida RNF03: Exibição de banner de erro ao falhar a requisição de carregamento.
   */
  it('exibe erro de carregamento quando a API falha', async () => {
    vi.mocked(resources.listCustomers).mockRejectedValue(
      new ApiError('NETWORK_ERROR', 'Não foi possível conectar à API.'),
    );
    render(<CustomersPage />);
    expect(await screen.findByText(/Erro ao carregar clientes/)).toBeInTheDocument();
  });

  /**
   * Valida RNF02: Validação no formulário dos campos obrigatórios (nome, email, telefone).
   */
  it('valida campos obrigatórios antes de enviar o formulário', async () => {
    render(<CustomersPage />);
    await screen.findByText('Ana Silva');
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    expect(await screen.findByText('Nome é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('E-mail é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('Telefone é obrigatório.')).toBeInTheDocument();
  });

  /**
   * Valida RNF02: Validação de formato correto de e-mail no formulário.
   */
  it('exibe erro de e-mail inválido', async () => {
    render(<CustomersPage />);
    await screen.findByText('Ana Silva');
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Teste' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'nao-é-email' } });
    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '11 99999-9999' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    expect(await screen.findByText('E-mail inválido.')).toBeInTheDocument();
  });

  /**
   * Valida RF01: Criação de novo cliente e atualização reativa da lista.
   */
  it('cadastra cliente válido e atualiza a lista reativamente', async () => {
    render(<CustomersPage />);
    await screen.findByText('Ana Silva');
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Carla Dias' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'carla@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '11 93333-3333' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    await waitFor(() => {
      expect(screen.getByText('Carla Dias')).toBeInTheDocument();
    });
    expect(resources.createCustomer).toHaveBeenCalledWith({
      name: 'Carla Dias',
      email: 'carla@exemplo.com',
      phone: '11 93333-3333',
    });
  });

  /**
   * Valida RNF03: Exibição de erro da API quando o cadastro de cliente falha (ex.: e-mail duplicado).
   */
  it('exibe erro da API ao falhar no cadastro', async () => {
    vi.mocked(resources.createCustomer).mockRejectedValue(
      new ApiError('CONFLICT', 'E-mail já cadastrado.'),
    );
    render(<CustomersPage />);
    await screen.findByText('Ana Silva');
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Teste' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } });
    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '11 91111-1111' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    expect(await screen.findByText('E-mail já cadastrado.')).toBeInTheDocument();
  });

  /**
   * Valida RN01: Alternância de status ativo/inativo do cliente.
   */
  it('alterna status do cliente ao clicar em Desativar', async () => {
    render(<CustomersPage />);
    await screen.findByText('Ana Silva');
    fireEvent.click(screen.getByRole('button', { name: /Desativar Ana Silva/i }));
    await waitFor(() => {
      expect(resources.toggleCustomerActive).toHaveBeenCalledWith(1);
    });
  });
});
