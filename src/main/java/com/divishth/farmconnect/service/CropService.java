package com.divishth.farmconnect.service;

import com.divishth.farmconnect.dto.CropRequestDTO;
import com.divishth.farmconnect.dto.CropResponseDTO;
import com.divishth.farmconnect.entity.Crop;
import com.divishth.farmconnect.entity.CropImage;
import com.divishth.farmconnect.entity.Farmer;
import com.divishth.farmconnect.exception.ResourceNotFoundException;
import com.divishth.farmconnect.mapper.CropMapper;
import com.divishth.farmconnect.repository.CropImageRepository;
import com.divishth.farmconnect.repository.CropRepository;
import com.divishth.farmconnect.security.CurrentUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import java.util.List;
import java.util.Set;

@Service
public class CropService {

    private static final Set<String> SORTABLE_FIELDS = Set.of("name", "price", "quantity");
    private static final long MAX_IMAGE_BYTES = 5 * 1024 * 1024;

    @Autowired
    private CropMapper cropMapper;
    @Autowired
    private CropRepository cropRepository;
    @Autowired
    private CurrentUserService currentUserService;
    @Autowired
    private CropImageRepository cropImageRepository;

    public CropResponseDTO createCrop(CropRequestDTO cropRequestDTO){

        // Crops always belong to the logged-in farmer
        Farmer farmer = currentUserService.getFarmer();
        if (cropRequestDTO.getFarmerId() != null && !cropRequestDTO.getFarmerId().equals(farmer.getId())) {
            throw new AccessDeniedException("You can only add crops to your own profile");
        }

        if (cropRequestDTO.getQuantity() == null || cropRequestDTO.getQuantity() <= 0) {
            throw new IllegalArgumentException("A new listing needs a quantity greater than 0");
        }

        Crop crop = cropMapper.mapRequestToCrop(cropRequestDTO);
        crop.setFarmer(farmer);

        return cropMapper.mapCropToResponse(cropRepository.save(crop));
    }

    public Page<CropResponseDTO> paging(int page){
        if (page < 0) {
            throw new IllegalArgumentException("Page number cannot be negative");
        }
        Page<Crop> crops = cropRepository.findAll(PageRequest.of(page, 15));
        return crops.map(cropMapper::mapCropToResponse);
    }

    public List<CropResponseDTO> sortByPrice(String field, String direction){
        if (!SORTABLE_FIELDS.contains(field)) {
            throw new IllegalArgumentException("Can only sort by one of: " + SORTABLE_FIELDS);
        }
        List<Crop> crops;
        if("asc".equalsIgnoreCase(direction)){
            crops = cropRepository.findAll(Sort.by(field).ascending());
        }
        else{
            crops = cropRepository.findAll(Sort.by(field).descending());
        }

        return crops.stream().map(cropMapper::mapCropToResponse).toList();
    }

    public List<CropResponseDTO> searchCropByName(String name){

        return cropRepository.findByNameContainingIgnoreCase(name).stream()
                .map(cropMapper::mapCropToResponse).toList();
    }

    public List<CropResponseDTO> filterByPrice(Double minPrice, Double maxPrice){

        return cropRepository.findByPriceBetween(minPrice, maxPrice).stream()
                .map(cropMapper::mapCropToResponse).toList();
    }

    public List<CropResponseDTO> getAllCrops(){

        return cropRepository.findAll().stream().map(cropMapper::mapCropToResponse).toList();
    }

    public CropResponseDTO getCropById(Long id){

        Crop crop = cropRepository.findById(id). orElseThrow(() -> new ResourceNotFoundException("Crop not found"));


        return cropMapper.mapCropToResponse(crop);
    }
    public CropResponseDTO updateCrop(Long cropId, CropRequestDTO cropRequestDTO){

        Crop existingCrop = cropRepository.findById(cropId) .orElseThrow(() -> new ResourceNotFoundException(
                                "Crop not found"));
        requireOwner(existingCrop);

        cropMapper.updateCropFromDto(cropRequestDTO, existingCrop);

        Crop savedCrop = cropRepository.save(existingCrop);

        return cropMapper.mapCropToResponse(savedCrop);
    }

    @Transactional
    public boolean deleteCropById(Long cropId) {

        Crop crop = cropRepository.findById(cropId).orElse(null);
        if (crop == null) {
            return false;
        }
        requireOwner(crop);

        if (cropImageRepository.existsById(cropId)) {
            cropImageRepository.deleteById(cropId);
        }
        cropRepository.delete(crop);
        // Flush now so a crop with orders fails here (409) and the photo delete rolls back
        cropRepository.flush();
        return true;
    }

    // ---------- Photos ----------

    @Transactional
    public CropResponseDTO uploadImage(Long cropId, MultipartFile file) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found"));
        requireOwner(crop);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose a photo to upload");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new IllegalArgumentException("Photo must be 5 MB or smaller");
        }

        byte[] data;
        try {
            data = file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read the uploaded photo");
        }
        // Trust the file's actual bytes, not the name or declared content type
        String contentType = detectImageType(data);
        if (contentType == null) {
            throw new IllegalArgumentException("Only JPEG, PNG or WebP photos are allowed");
        }

        CropImage image = cropImageRepository.findById(cropId).orElseGet(CropImage::new);
        image.setCropId(cropId);
        image.setData(data);
        image.setContentType(contentType);
        cropImageRepository.save(image);

        crop.setImageUpdatedAt(System.currentTimeMillis());
        return cropMapper.mapCropToResponse(cropRepository.save(crop));
    }

    public CropImage getImage(Long cropId) {
        return cropImageRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("This crop has no photo"));
    }

    @Transactional
    public CropResponseDTO deleteImage(Long cropId) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found"));
        requireOwner(crop);

        if (cropImageRepository.existsById(cropId)) {
            cropImageRepository.deleteById(cropId);
        }
        crop.setImageUpdatedAt(null);
        return cropMapper.mapCropToResponse(cropRepository.save(crop));
    }

    private static String detectImageType(byte[] d) {
        if (d.length >= 3 && (d[0] & 0xFF) == 0xFF && (d[1] & 0xFF) == 0xD8 && (d[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        if (d.length >= 8 && (d[0] & 0xFF) == 0x89 && d[1] == 'P' && d[2] == 'N' && d[3] == 'G'
                && d[4] == 0x0D && d[5] == 0x0A && d[6] == 0x1A && d[7] == 0x0A) {
            return "image/png";
        }
        if (d.length >= 12 && d[0] == 'R' && d[1] == 'I' && d[2] == 'F' && d[3] == 'F'
                && d[8] == 'W' && d[9] == 'E' && d[10] == 'B' && d[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    private void requireOwner(Crop crop) {
        Farmer farmer = currentUserService.getFarmer();
        if (crop.getFarmer() == null || !crop.getFarmer().getId().equals(farmer.getId())) {
            throw new AccessDeniedException("You can only modify your own crops");
        }
    }
}
