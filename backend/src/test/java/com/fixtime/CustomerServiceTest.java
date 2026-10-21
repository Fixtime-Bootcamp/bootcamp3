package com.fixtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fixtime.customer.CreateCustomerRequest;
import com.fixtime.customer.Customer;
import com.fixtime.customer.CustomerRepository;
import com.fixtime.customer.CustomerResponse;
import com.fixtime.customer.CustomerService;
import com.fixtime.exception.ResourceNotFoundException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Testes unitários para o CustomerService.
 * Valida os requisitos de gestão de clientes (RF01) e regras de integridade cadastral e ativação (RN01).
 */
class CustomerServiceTest {

    private CustomerRepository repository;
    private CustomerService service;

    @BeforeEach
    void setUp() {
        repository = mock(CustomerRepository.class);
        service = new CustomerService(repository);
    }

    /**
     * Valida RF01 e RN01: Criação e ativação padrão de novo cliente.
     */
    @Test
    @DisplayName("Deve cadastrar cliente com sucesso")
    void createsCustomer() {
        Customer saved = new Customer("Mario", "mario@teste.com", "11999990000", true);
        saved.setId(1L);

        when(repository.save(any(Customer.class))).thenReturn(saved);

        CustomerResponse response = service.create(new CreateCustomerRequest("Mario", "mario@teste.com", "11999990000"));

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.name()).isEqualTo("Mario");
        assertThat(response.active()).isTrue();
    }

    /**
     * Valida RN01 e RNF03: Lançamento de ResourceNotFoundException ao buscar cliente inexistente.
     */
    @Test
    @DisplayName("Deve lancar excecao ao buscar cliente inexistente")
    void throwsOnMissingCustomer() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getActiveCustomerOrThrow(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("ID 99");
    }

    /**
     * Valida RN01: Rejeição com exceção ao buscar cliente inativo para agendamento.
     */
    @Test
    @DisplayName("Deve lancar excecao ao buscar cliente inativo")
    void throwsOnInactiveCustomer() {
        Customer inactive = new Customer("Inativo", "inativo@teste.com", "11999990000", false);
        inactive.setId(2L);

        when(repository.findById(2L)).thenReturn(Optional.of(inactive));

        assertThatThrownBy(() -> service.getActiveCustomerOrThrow(2L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inativo");
    }

    /**
     * Valida RN01: Retorno do cliente ativo para uso no agendamento.
     */
    @Test
    @DisplayName("Deve retornar cliente ativo")
    void returnsActiveCustomer() {
        Customer active = new Customer("Ativo", "ativo@teste.com", "11999990000", true);
        active.setId(3L);

        when(repository.findById(3L)).thenReturn(Optional.of(active));

        assertThat(service.getActiveCustomerOrThrow(3L)).isSameAs(active);
    }

    /**
     * Valida RF01: Listagem de todos os clientes cadastrados, ativos e inativos.
     */
    @Test
    @DisplayName("Deve listar todos os clientes")
    void listsAllCustomers() {
        Customer first = new Customer("Mario", "mario@teste.com", "11999990000", true);
        first.setId(1L);
        Customer second = new Customer("Luigi", "luigi@teste.com", "11999990001", false);
        second.setId(2L);

        when(repository.findAll()).thenReturn(List.of(first, second));

        List<CustomerResponse> responses = service.listAll();

        assertThat(responses).extracting(CustomerResponse::id).containsExactly(1L, 2L);
        assertThat(responses).extracting(CustomerResponse::active).containsExactly(true, false);
    }

    /**
     * Valida RF01: Listagem vazia quando nao ha clientes cadastrados.
     */
    @Test
    @DisplayName("Deve retornar lista vazia quando nao ha clientes")
    void listsNoCustomers() {
        when(repository.findAll()).thenReturn(List.of());

        assertThat(service.listAll()).isEmpty();
    }

    /**
     * Valida RN01: Inativacao de cliente ativo.
     */
    @Test
    @DisplayName("Deve inativar cliente ativo")
    void deactivatesCustomer() {
        Customer active = new Customer("Mario", "mario@teste.com", "11999990000", true);
        active.setId(1L);

        when(repository.findById(1L)).thenReturn(Optional.of(active));
        when(repository.save(active)).thenReturn(active);

        CustomerResponse response = service.toggleActive(1L);

        assertThat(response.active()).isFalse();
        verify(repository).save(active);
    }

    /**
     * Valida RN01: Reativacao de cliente inativo.
     */
    @Test
    @DisplayName("Deve reativar cliente inativo")
    void reactivatesCustomer() {
        Customer inactive = new Customer("Mario", "mario@teste.com", "11999990000", false);
        inactive.setId(1L);

        when(repository.findById(1L)).thenReturn(Optional.of(inactive));
        when(repository.save(inactive)).thenReturn(inactive);

        assertThat(service.toggleActive(1L).active()).isTrue();
    }

    /**
     * Valida RNF03: Alternar status de cliente inexistente lanca ResourceNotFoundException sem persistir.
     */
    @Test
    @DisplayName("Deve lancar excecao ao alternar status de cliente inexistente")
    void throwsOnToggleMissingCustomer() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.toggleActive(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("ID 99");
        verify(repository, never()).save(any(Customer.class));
    }
}
