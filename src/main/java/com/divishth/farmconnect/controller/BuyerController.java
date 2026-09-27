package com.divishth.farmconnect.controller;

import com.divishth.farmconnect.dto.*;
import com.divishth.farmconnect.service.BuyerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/buyer")
public class BuyerController {

    @Autowired
    private BuyerService buyerService;

    @GetMapping("/{id}")
    public ResponseEntity<BuyerResponseDTO> getById(@PathVariable Long id) {
        BuyerResponseDTO buyer = buyerService.getById(id);
        return ResponseEntity.ok(buyer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteById(@PathVariable Long id) {
        buyerService.deleteById(id);
        return ResponseEntity.ok("Deleted Successfully");
    }

    // ✅ Fixed: added @Valid so phone/address validations are enforced on PATCH
    // ✅ Fixed: returns the updated BuyerResponseDTO instead of discarding it
    @PatchMapping("/{id}")
    public ResponseEntity<BuyerResponseDTO> updateById(
            @PathVariable Long id,
            @Valid @RequestBody BuyerUpdateRequestDTO buyerUpdateRequest) {
        BuyerResponseDTO updated = buyerService.updateBuyer(id, buyerUpdateRequest);
        return ResponseEntity.ok(updated);
    }
}
