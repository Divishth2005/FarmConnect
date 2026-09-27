package com.divishth.farmconnect.controller;

import com.divishth.farmconnect.dto.FarmerRequestDTO;
import com.divishth.farmconnect.dto.FarmerResponseDTO;
import com.divishth.farmconnect.dto.FarmerUpdateRequestDTO;
import com.divishth.farmconnect.service.FarmerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/farmer")
public class FarmerController {

    @Autowired
    private FarmerService farmerService;

    @PostMapping
    public ResponseEntity<String> createFarmer(@Valid @RequestBody FarmerRequestDTO farmerRequestDTO) {
        farmerService.createFarmer(farmerRequestDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body("Farmer created Successfully");
    }

    @GetMapping("/{id}")
    public ResponseEntity<FarmerResponseDTO> getById(@PathVariable Long id) {
        FarmerResponseDTO farmer = farmerService.getById(id);
        return ResponseEntity.ok(farmer);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteById(@PathVariable Long id) {
        farmerService.deleteById(id);
        return ResponseEntity.ok("Deleted Successfully");
    }

    // ✅ Fixed: added @Valid so PAN/phone regex validations are enforced on PATCH
    // ✅ Fixed: returns the updated FarmerResponseDTO instead of discarding it
    @PatchMapping("/{id}")
    public ResponseEntity<FarmerResponseDTO> updateById(
            @PathVariable Long id,
            @Valid @RequestBody FarmerUpdateRequestDTO farmerUpdateRequest) {
        FarmerResponseDTO updated = farmerService.updateFarmer(id, farmerUpdateRequest);
        return ResponseEntity.ok(updated);
    }

}
