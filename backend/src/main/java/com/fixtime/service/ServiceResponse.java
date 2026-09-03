package com.fixtime.service;

import java.math.BigDecimal;

public record ServiceResponse(
        Long id,
        String name,
        String description,
        int durationMinutes,
        BigDecimal price,
        boolean active) {
    public static ServiceResponse fromEntity(ServiceEntity service) {
        return new ServiceResponse(
                service.getId(),
                service.getName(),
                service.getDescription(),
                service.getDurationMinutes(),
                service.getPrice(),
                service.isActive());
    }
}
