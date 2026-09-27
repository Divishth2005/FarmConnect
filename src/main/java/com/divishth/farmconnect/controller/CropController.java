package com.divishth.farmconnect.controller;

import com.divishth.farmconnect.dto.CropRequestDTO;
import com.divishth.farmconnect.dto.CropResponseDTO;
import com.divishth.farmconnect.entity.CropImage;
import com.divishth.farmconnect.service.CropService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/crop")
public class CropController {

    @Autowired
    private CropService cropService;

    @PostMapping
    public ResponseEntity<CropResponseDTO> createCrop(@Valid @RequestBody CropRequestDTO cropRequestDTO) {
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(cropService.createCrop(cropRequestDTO));
    }

    @PostMapping(value = "/{cropId}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CropResponseDTO> uploadImage(
            @PathVariable Long cropId,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(cropService.uploadImage(cropId, file));
    }

    // Image URLs carry ?v=<timestamp>, so a given URL never changes and can be cached for good
    @GetMapping("/{cropId}/image")
    public ResponseEntity<byte[]> getImage(@PathVariable Long cropId) {
        CropImage image = cropService.getImage(cropId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                .body(image.getData());
    }

    @DeleteMapping("/{cropId}/image")
    public ResponseEntity<CropResponseDTO> deleteImage(@PathVariable Long cropId) {
        return ResponseEntity.ok(cropService.deleteImage(cropId));
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