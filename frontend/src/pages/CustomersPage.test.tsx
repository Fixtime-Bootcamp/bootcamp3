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

  it('exibe lista de clientes existentes ao carregar', async () => {
    render(<CustomersPage />);
    expect(await screen.findByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Bruno Costa')).toBeInTheDocument();
  });

  it('exibe badge Ativo e Inativo corretamente', async () => {
    render(<CustomersPage />);
    await screen.findByText('Ana Silva');
    const badges = screen.getAllByText(/Ativo|Inativo/);
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it('exibe mensagem de estado vazio quando não há clientes', async () => {
    vi.mocked(resources.listCustomers).mockResolvedValue([]);
    render(<CustomersPage />);
    expect(await screen.findByText(/Nenhum cliente cadastrado/)).toBeInTheDocument();
  });

  it('exibe erro de carregamento quando a API falha', async () => {
    vi.mocked(resources.listCustomers).mockRejectedValue(
      new ApiError('NETWORK_ERROR', 'Não foi possível conectar à API.'),
    );
    render(<CustomersPage />);
    expect(await screen.findByText(/Erro ao carregar clientes/)).toBeInTheDocument();
  });

  it('valida campos obrigatórios antes de enviar o formulário', async () => {
    render(<CustomersPage />);
    await screen.findByText('Ana Silva');
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    expect(await screen.findByText('Nome é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('E-mail é obrigatório.')).toBeInTheDocument();
    expect(screen.getByText('Telefone é obrigatório.')).toBeInTheDocument();
  });

  it('exibe erro de e-mail inválido', async () => {
    render(<CustomersPage />);
    await screen.findByText('Ana Silva');
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Teste' } });
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'nao-é-email' } });
    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '11 99999-9999' } });
    fireEvent.click(screen.getByRole('button', { name: /cadastrar/i }));
    expect(await screen.findByText('E-mail inválido.')).toBeInTheDocument();
  });

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

  it('alterna status do cliente ao clicar em Desativar', async () => {
    render(<CustomersPage />);
    await screen.findByText('Ana Silva');
    fireEvent.click(screen.getByRole('button', { name: /Desativar Ana Silva/i }));
    await waitFor(() => {
      expect(resources.toggleCustomerActive).toHaveBeenCalledWith(1);
    });
  });
});
