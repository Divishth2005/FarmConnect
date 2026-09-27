package com.divishth.farmconnect.service;


import com.divishth.farmconnect.dto.*;
import com.divishth.farmconnect.entity.Buyer;
import com.divishth.farmconnect.exception.ResourceNotFoundException;
import com.divishth.farmconnect.mapper.BuyerMapper;
import com.divishth.farmconnect.repository.BuyerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BuyerService {

    @Autowired
    private BuyerMapper buyerMapper;

    @Autowired
    private BuyerRepository buyerRepository;

    public void createBuyer(BuyerRequestDTO buyerRequestDTO){
        Buyer buyer=buyerMapper.mapRequestToBuyer(buyerRequestDTO);
        buyerRepository.save(buyer);
    }

    public BuyerResponseDTO getById(Long id){
    Buyer buyer=buyerRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Buyer Not Found"));
        return buyerMapper.mapRequestToResponse(buyer);
    }

    public void deleteById(Long id){
        buyerRepository.deleteById(id);
    }

    public BuyerResponseDTO updateBuyer(Long id, BuyerUpdateRequestDTO updateDto) {

        Buyer existingBuyer = buyerRepository.findById(id).orElseThrow(()->new ResourceNotFoundException("Buyer Not Found"));
        buyerMapper.updateBuyerFromDto(updateDto, existingBuyer);
        Buyer updatedBuyer= buyerRepository.save(existingBuyer);
        return buyerMapper.mapRequestToResponse(updatedBuyer);

    }


}
