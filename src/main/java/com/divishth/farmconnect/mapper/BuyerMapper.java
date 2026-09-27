package com.divishth.farmconnect.mapper;

import com.divishth.farmconnect.dto.*;
import com.divishth.farmconnect.embedded.Address;
import com.divishth.farmconnect.entity.Buyer;
import org.springframework.stereotype.Component;

@Component
public class BuyerMapper {

    public BuyerResponseDTO mapRequestToResponse(Buyer buyer) {
        if (buyer == null) return null;
        BuyerResponseDTO dto = new BuyerResponseDTO();
        dto.setId(buyer.getId());
        dto.setName(buyer.getName());
        dto.setPhoneNumber(buyer.getPhoneNumber());
        if (buyer.getAddress() != null) {
            dto.setAddress(AddressResponseDTO.builder()
                    .addressLine(buyer.getAddress().getAddressLine())
                    .district(buyer.getAddress().getDistrict())
                    .state(buyer.getAddress().getState())
                    .pinCode(buyer.getAddress().getPinCode())
                    .build());
        }
        return dto;
    }

    public void updateBuyerFromDto(BuyerUpdateRequestDTO updateDto, Buyer buyer) {
        if (updateDto == null) return;
        if (updateDto.getName() != null) buyer.setName(updateDto.getName());
        if (updateDto.getPhoneNumber() != null) buyer.setPhoneNumber(updateDto.getPhoneNumber());
        if (updateDto.getAddress() != null) {
            if (buyer.getAddress() == null) buyer.setAddress(new Address());
            updateAddressFromDto(updateDto.getAddress(), buyer.getAddress());
        }
    }

    public void updateAddressFromDto(AddressUpdateRequestDTO dto, Address address) {
        if (dto == null) return;
        if (dto.getAddressLine() != null) address.setAddressLine(dto.getAddressLine());
        if (dto.getDistrict() != null) address.setDistrict(dto.getDistrict());
        if (dto.getState() != null) address.setState(dto.getState());
        if (dto.getPinCode() != null) address.setPinCode(dto.getPinCode());
    }

}
