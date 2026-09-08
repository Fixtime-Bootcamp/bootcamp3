package com.fixtime.blockeddate;

import com.fixtime.exception.ConflictException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BlockedDateService {
    private final BlockedDateRepository repository;
    private final NationalHolidayProvider nationalHolidayProvider;
    private final Clock clock;

    public BlockedDateService(
            BlockedDateRepository repository,
            NationalHolidayProvider nationalHolidayProvider,
            Clock clock) {
        this.repository = repository;
        this.nationalHolidayProvider = nationalHolidayProvider;
        this.clock = clock;
    }

    @Transactional
    public BlockedDateResponse create(CreateBlockedDateRequest request) {
        if (repository.existsByDate(request.date())) {
            throw new ConflictException("A data " + request.date() + " ja esta bloqueada");
        }

        Optional<String> holidayName = nationalHolidayProvider.getHolidayName(request.date());
        if (holidayName.isPresent()) {
            throw new ConflictException("A data " + request.date() + " ja esta bloqueada como feriado nacional (" + holidayName.get() + ")");
        }

        BlockedDate blockedDate = new BlockedDate(
                request.date(),
                request.reason(),
                LocalDateTime.now(clock)
        );

        BlockedDate saved = repository.save(blockedDate);
        return BlockedDateResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<BlockedDateResponse> listAll() {
        return repository.findAllByOrderByDateAsc().stream()
                .map(BlockedDateResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isDateBlocked(LocalDate date) {
        if (date == null) {
            return false;
        }
        return repository.existsByDate(date) || nationalHolidayProvider.isNationalHoliday(date);
    }

    @Transactional(readOnly = true)
    public Optional<String> getBlockedReason(LocalDate date) {
        if (date == null) {
            return Optional.empty();
        }
        Optional<BlockedDate> fromRepo = repository.findByDate(date);
        if (fromRepo.isPresent()) {
            return Optional.of(fromRepo.get().getReason());
        }
        return nationalHolidayProvider.getHolidayName(date);
    }
}
