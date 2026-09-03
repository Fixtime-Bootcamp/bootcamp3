package com.fixtime.technician;

import com.fixtime.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TechnicianService {
    private final TechnicianRepository repository;

    public TechnicianService(TechnicianRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public TechnicianResponse create(CreateTechnicianRequest request) {
        Technician technician = new Technician(request.name(), request.email(), request.phone(), true);
        Technician saved = repository.save(technician);
        return TechnicianResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<TechnicianResponse> listAll() {
        return repository.findAll().stream()
                .map(TechnicianResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Technician getActiveTechnicianOrThrow(Long id) {
        Technician technician = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tecnico com ID " + id + " nao encontrado"));
        if (!technician.isActive()) {
            throw new IllegalArgumentException("Tecnico com ID " + id + " esta inativo");
        }
        return technician;
    }
}
