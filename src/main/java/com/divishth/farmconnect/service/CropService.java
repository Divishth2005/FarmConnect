package com.divishth.farmconnect.service;

import com.divishth.farmconnect.dto.CropRequestDTO;
import com.divishth.farmconnect.dto.CropResponseDTO;
import com.divishth.farmconnect.entity.Crop;
import com.divishth.farmconnect.entity.Farmer;
import com.divishth.farmconnect.exception.ResourceNotFoundException;
import com.divishth.farmconnect.mapper.CropMapper;
import com.divishth.farmconnect.repository.CropRepository;
import com.divishth.farmconnect.security.CurrentUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class CropService {

    private static final Set<String> SORTABLE_FIELDS = Set.of("name", "price", "quantity");

    @Autowired
    private CropMapper cropMapper;
    @Autowired
    private CropRepository cropRepository;
    @Autowired
    private CurrentUserService currentUserService;

    public void createCrop(CropRequestDTO cropRequestDTO){

        // Crops always belong to the logged-in farmer
        Farmer farmer = currentUserService.getFarmer();
        if (cropRequestDTO.getFarmerId() != null && !cropRequestDTO.getFarmerId().equals(farmer.getId())) {
            throw new AccessDeniedException("You can only add crops to your own profile");
        }

        Crop crop = cropMapper.mapRequestToCrop(cropRequestDTO);
        crop.setFarmer(farmer);

        cropRepository.save(crop);
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

    public boolean deleteCropById(Long cropId) {

        Crop crop = cropRepository.findById(cropId).orElse(null);
        if (crop == null) {
            return false;
        }
        requireOwner(crop);

        cropRepository.delete(crop);
        return true;
    }

    private void requireOwner(Crop crop) {
        Farmer farmer = currentUserService.getFarmer();
        if (crop.getFarmer() == null || !crop.getFarmer().getId().equals(farmer.getId())) {
            throw new AccessDeniedException("You can only modify your own crops");
        }
    }
}
