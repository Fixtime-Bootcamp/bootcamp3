package com.fixtime.customer;

public record CustomerResponse(
        Long id,
        String name,
        String email,
        String phone,
        boolean active) {
    public static CustomerResponse fromEntity(Customer customer) {
        return new CustomerResponse(
                customer.getId(),
                customer.getName(),
                customer.getEmail(),
                customer.getPhone(),
                customer.isActive());
    }
}
