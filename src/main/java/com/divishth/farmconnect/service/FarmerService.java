package com.divishth.farmconnect.service;


import com.divishth.farmconnect.dto.FarmerResponseDTO;
import com.divishth.farmconnect.dto.FarmerUpdateRequestDTO;
import com.divishth.farmconnect.entity.Farmer;
import com.divishth.farmconnect.exception.ResourceNotFoundException;
import com.divishth.farmconnect.mapper.FarmerMapper;
import com.divishth.farmconnect.repository.FarmerRepository;
import com.divishth.farmconnect.repository.UserRepository;
import com.divishth.farmconnect.security.CurrentUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FarmerService {

    @Autowired
    private FarmerMapper farmerMapper;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CurrentUserService currentUserService;

    public FarmerResponseDTO getById(Long id){
        Farmer farmer=farmerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Farmer Not Found"));
        return farmerMapper.mapRequestToResponse(farmer);
    }

    // Deletes the profile together with its login account
    @Transactional
    public void deleteById(Long id){
        Farmer farmer = farmerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Farmer Not Found"));
        currentUserService.requireFarmer(id);
        farmerRepository.delete(farmer);
        farmerRepository.flush();
        if (farmer.getUser() != null) {
            userRepository.delete(farmer.getUser());
        }
    }

    public FarmerResponseDTO updateFarmer(Long id, FarmerUpdateRequestDTO updateDto) {

        Farmer existingFarmer = farmerRepository.findById(id).orElseThrow(()->new ResourceNotFoundException("Farmer Not Found"));
        currentUserService.requireFarmer(id);
        farmerMapper.updateFarmerFromDto(updateDto, existingFarmer);
        Farmer updatedFarmer = farmerRepository.save(existingFarmer);
        return farmerMapper.mapRequestToResponse(updatedFarmer);

        }

}
