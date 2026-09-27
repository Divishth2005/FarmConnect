package com.divishth.farmconnect.service;

import com.divishth.farmconnect.dto.CropRequestDTO;
import com.divishth.farmconnect.dto.CropResponseDTO;
import com.divishth.farmconnect.entity.Crop;
import com.divishth.farmconnect.entity.Farmer;
import com.divishth.farmconnect.exception.ResourceNotFoundException;
import com.divishth.farmconnect.mapper.CropMapper;
import com.divishth.farmconnect.repository.CropRepository;
import com.divishth.farmconnect.repository.FarmerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CropService {
    @Autowired
    private CropMapper cropMapper;
    @Autowired
    private CropRepository cropRepository;
    @Autowired
    private FarmerRepository farmerRepository;

    public void createCrop(CropRequestDTO cropRequestDTO){

        Crop crop = cropMapper.mapRequestToCrop(cropRequestDTO);

        if (cropRequestDTO.getFarmerId() != null) {
            Farmer farmer = farmerRepository.findById(cropRequestDTO.getFarmerId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Farmer not found with id: " + cropRequestDTO.getFarmerId()));
            crop.setFarmer(farmer);
        }

        cropRepository.save(crop);
    }

    public Page<CropResponseDTO> paging(int page){
        Page<Crop> crops = cropRepository.findAll(PageRequest.of(page, 15));
        return crops.map(cropMapper::mapCropToResponse);
    }

    public List<CropResponseDTO> sortByPrice(String field, String direction){
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

        cropMapper.updateCropFromDto(cropRequestDTO, existingCrop);

        Crop savedCrop = cropRepository.save(existingCrop);

        return cropMapper.mapCropToResponse(savedCrop);
    }

    public boolean deleteCropById(Long cropId) {

        if (!cropRepository.existsById(cropId)) {
            return false;
        }

        cropRepository.deleteById(cropId);
        return true;
    }

    public void deleteAllCrops() {
        cropRepository.deleteAll();
    }
}
