package com.fixtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fixtime.customer.CreateCustomerRequest;
import com.fixtime.customer.Customer;
import com.fixtime.customer.CustomerRepository;
import com.fixtime.customer.CustomerResponse;
import com.fixtime.customer.CustomerService;
import com.fixtime.exception.ResourceNotFoundException;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CustomerServiceTest {

    private CustomerRepository repository;
    private CustomerService service;

    @BeforeEach
    void setUp() {
        repository = mock(CustomerRepository.class);
        service = new CustomerService(repository);
    }

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

    @Test
    @DisplayName("Deve lancar excecao ao buscar cliente inexistente")
    void throwsOnMissingCustomer() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getActiveCustomerOrThrow(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("ID 99");
    }

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
}
