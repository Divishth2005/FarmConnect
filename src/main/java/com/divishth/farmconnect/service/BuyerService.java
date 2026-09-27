package com.divishth.farmconnect.service;


import com.divishth.farmconnect.dto.*;
import com.divishth.farmconnect.entity.Buyer;
import com.divishth.farmconnect.exception.ResourceNotFoundException;
import com.divishth.farmconnect.mapper.BuyerMapper;
import com.divishth.farmconnect.repository.BuyerRepository;
import com.divishth.farmconnect.repository.UserRepository;
import com.divishth.farmconnect.security.CurrentUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BuyerService {

    @Autowired
    private BuyerMapper buyerMapper;

    @Autowired
    private BuyerRepository buyerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CurrentUserService currentUserService;

    public BuyerResponseDTO getById(Long id){
    Buyer buyer=buyerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Buyer Not Found"));
        return buyerMapper.mapRequestToResponse(buyer);
    }

    // Deletes the profile together with its login account
    @Transactional
    public void deleteById(Long id){
        Buyer buyer = buyerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Buyer Not Found"));
        currentUserService.requireBuyer(id);
        buyerRepository.delete(buyer);
        buyerRepository.flush();
        if (buyer.getUser() != null) {
            userRepository.delete(buyer.getUser());
        }
    }

    public BuyerResponseDTO updateBuyer(Long id, BuyerUpdateRequestDTO updateDto) {

        Buyer existingBuyer = buyerRepository.findById(id).orElseThrow(()->new ResourceNotFoundException("Buyer Not Found"));
        currentUserService.requireBuyer(id);
        buyerMapper.updateBuyerFromDto(updateDto, existingBuyer);
        Buyer updatedBuyer= buyerRepository.save(existingBuyer);
        return buyerMapper.mapRequestToResponse(updatedBuyer);

    }


}
