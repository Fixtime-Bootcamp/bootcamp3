package com.fixtime.technician;

public record TechnicianResponse(
        Long id,
        String name,
        String email,
        String phone,
        boolean active) {
    public static TechnicianResponse fromEntity(Technician technician) {
        return new TechnicianResponse(
                technician.getId(),
                technician.getName(),
                technician.getEmail(),
                technician.getPhone(),
                technician.isActive());
    }
}
