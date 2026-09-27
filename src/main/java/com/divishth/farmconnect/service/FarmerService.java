package com.divishth.farmconnect.service;


import com.divishth.farmconnect.dto.FarmerRequestDTO;
import com.divishth.farmconnect.dto.FarmerResponseDTO;
import com.divishth.farmconnect.dto.FarmerUpdateRequestDTO;
import com.divishth.farmconnect.entity.Farmer;
import com.divishth.farmconnect.exception.ResourceNotFoundException;
import com.divishth.farmconnect.mapper.FarmerMapper;
import com.divishth.farmconnect.repository.FarmerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FarmerService {

    @Autowired
    private FarmerMapper farmerMapper;

    @Autowired
    private FarmerRepository farmerRepository;

    public void createFarmer(FarmerRequestDTO farmerRequestDTO){
        Farmer farmer=farmerMapper.mapRequestToFarmer(farmerRequestDTO);
        farmerRepository.save(farmer);
    }

    public FarmerResponseDTO getById(Long id){
        Farmer farmer=farmerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Farmer Not Found"));
        return farmerMapper.mapRequestToResponse(farmer);
    }

    public void deleteById(Long id){
      farmerRepository.deleteById(id);
    }

    public FarmerResponseDTO updateFarmer(Long id, FarmerUpdateRequestDTO updateDto) {

        Farmer existingFarmer = farmerRepository.findById(id).orElseThrow(()->new ResourceNotFoundException("Farmer Not Found"));
        farmerMapper.updateFarmerFromDto(updateDto, existingFarmer);
        Farmer updatedFarmer = farmerRepository.save(existingFarmer);
        return farmerMapper.mapRequestToResponse(updatedFarmer);

        }

}
