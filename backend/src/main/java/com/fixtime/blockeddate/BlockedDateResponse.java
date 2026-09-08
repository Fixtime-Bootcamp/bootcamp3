package com.fixtime.blockeddate;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record BlockedDateResponse(
        Long id,
        LocalDate date,
        String reason,
        LocalDateTime createdAt
) {
    public static BlockedDateResponse fromEntity(BlockedDate entity) {
        return new BlockedDateResponse(
                entity.getId(),
                entity.getDate(),
                entity.getReason(),
                entity.getCreatedAt()
        );
    }
}
