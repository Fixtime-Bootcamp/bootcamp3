package com.fixtime.blockeddate;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/blocked-dates")
public class BlockedDateController {
    private final BlockedDateService service;

    public BlockedDateController(BlockedDateService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BlockedDateResponse create(@Valid @RequestBody CreateBlockedDateRequest request) {
        return service.create(request);
    }

    @GetMapping
    public List<BlockedDateResponse> list() {
        return service.listAll();
    }
}
