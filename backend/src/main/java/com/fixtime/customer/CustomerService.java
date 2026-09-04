package com.fixtime.customer;

import com.fixtime.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {
    private final CustomerRepository repository;

    public CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public CustomerResponse create(CreateCustomerRequest request) {
        Customer customer = new Customer(request.name(), request.email(), request.phone(), true);
        Customer saved = repository.save(customer);
        return CustomerResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<CustomerResponse> listAll() {
        return repository.findAll().stream()
                .map(CustomerResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Customer getActiveCustomerOrThrow(Long id) {
        Customer customer = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente com ID " + id + " nao encontrado"));
        if (!customer.isActive()) {
            throw new IllegalArgumentException("Cliente com ID " + id + " esta inativo");
        }
        return customer;
    }
}
