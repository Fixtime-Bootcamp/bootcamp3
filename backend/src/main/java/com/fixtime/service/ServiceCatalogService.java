package com.fixtime.service;

import com.fixtime.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceCatalogService {
    private final ServiceRepository repository;

    public ServiceCatalogService(ServiceRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ServiceResponse create(CreateServiceRequest request) {
        ServiceEntity entity = new ServiceEntity(
                request.name(),
                request.description(),
                request.durationMinutes(),
                request.price(),
                true);
        ServiceEntity saved = repository.save(entity);
        return ServiceResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<ServiceResponse> listAll() {
        return repository.findAll().stream()
                .map(ServiceResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public ServiceEntity getActiveServiceOrThrow(Long id) {
        ServiceEntity entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Servico com ID " + id + " nao encontrado"));
        if (!entity.isActive()) {
            throw new IllegalArgumentException("Servico com ID " + id + " esta inativo");
        }
        return entity;
    }
}
