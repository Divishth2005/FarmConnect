package com.divishth.farmconnect.controller;

import com.divishth.farmconnect.dto.CropRequestDTO;
import com.divishth.farmconnect.dto.CropResponseDTO;
import com.divishth.farmconnect.service.CropService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/crop")
public class CropController {

    @Autowired
    private CropService cropService;

    @PostMapping
    public ResponseEntity<String> createCrop(@Valid @RequestBody CropRequestDTO cropRequestDTO) {
        cropService.createCrop(cropRequestDTO);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body("Crop created successfully");
    }

    @GetMapping("/page")
    public ResponseEntity<Page<CropResponseDTO>> paging(@RequestParam int page) {
        Page<CropResponseDTO> crops = cropService.paging(page);
        return ResponseEntity.ok(crops);
    }

    @GetMapping("/sort")
    public ResponseEntity<List<CropResponseDTO>> sortCropByPrice(
            @RequestParam String field,
            @RequestParam String direction) {
        List<CropResponseDTO> crops = cropService.sortByPrice(field, direction);
        return ResponseEntity.ok(crops);
    }

    @GetMapping("/search")
    public ResponseEntity<List<CropResponseDTO>> searchCropByName(
            @RequestParam String name) {
        List<CropResponseDTO> crops = cropService.searchCropByName(name);
        return ResponseEntity.ok(crops);
    }

    @GetMapping("/filter")
    public ResponseEntity<List<CropResponseDTO>> filterByPrice(
            @RequestParam Double minPrice,
            @RequestParam Double maxPrice) {
        List<CropResponseDTO> crops = cropService.filterByPrice(minPrice, maxPrice);
        return ResponseEntity.ok(crops);
    }

    @GetMapping
    public ResponseEntity<List<CropResponseDTO>> getAllCrops() {
        List<CropResponseDTO> crops = cropService.getAllCrops();
        return ResponseEntity.ok(crops);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CropResponseDTO> getCropById(@PathVariable Long id) {
        CropResponseDTO crop = cropService.getCropById(id);
        return ResponseEntity.ok(crop);
    }

    @PutMapping("/{cropId}")
    public ResponseEntity<CropResponseDTO> updateCrop(
            @PathVariable Long cropId,
            @Valid @RequestBody CropRequestDTO cropRequestDTO) {
        CropResponseDTO updatedCrop = cropService.updateCrop(cropId, cropRequestDTO);
        return ResponseEntity.ok(updatedCrop);
    }

    @DeleteMapping("/{cropId}")
    public ResponseEntity<String> deleteCropById(@PathVariable Long cropId) {
        boolean isDeleted = cropService.deleteCropById(cropId);
        if (!isDeleted) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Crop not found");
        }
        return ResponseEntity.ok("Crop deleted successfully");
    }
}