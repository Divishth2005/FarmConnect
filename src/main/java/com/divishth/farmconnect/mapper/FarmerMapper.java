package com.divishth.farmconnect.mapper;

import com.divishth.farmconnect.dto.*;
import com.divishth.farmconnect.embedded.Address;
import com.divishth.farmconnect.entity.Farmer;
import org.springframework.stereotype.Component;

@Component
public class FarmerMapper {

    public Farmer mapRequestToFarmer(FarmerRequestDTO dto) {
        if (dto == null) return null;
        Farmer farmer = new Farmer();
        farmer.setName(dto.getName());
        farmer.setPhoneNumber(dto.getPhoneNumber());
        // ✅ email removed from Farmer entity — lives only on User
        farmer.setPanNo(dto.getPanNo());
        farmer.setAadhaarNo(dto.getAadhaarNo());
        farmer.setAddress(mapAddress(dto.getAddress()));
        return farmer;
    }

    public FarmerResponseDTO mapRequestToResponse(Farmer farmer) {
        if (farmer == null) return null;
        FarmerResponseDTO dto = new FarmerResponseDTO();
        dto.setId(farmer.getId());
        dto.setName(farmer.getName());
        dto.setPhoneNumber(farmer.getPhoneNumber());
        // ✅ Email now sourced from the linked User account (avoids duplication)
        dto.setEmail(farmer.getUser() != null ? farmer.getUser().getEmail() : null);
        if (farmer.getAddress() != null) {
            dto.setAddress(AddressResponseDTO.builder()
                    .addressLine(farmer.getAddress().getAddressLine())
                    .district(farmer.getAddress().getDistrict())
                    .state(farmer.getAddress().getState())
                    .pinCode(farmer.getAddress().getPinCode())
                    .build());
        }
        return dto;
    }

    public void updateFarmerFromDto(FarmerUpdateRequestDTO updateDto, Farmer farmer) {
        if (updateDto == null) return;
        if (updateDto.getName() != null) farmer.setName(updateDto.getName());
        if (updateDto.getPhoneNumber() != null) farmer.setPhoneNumber(updateDto.getPhoneNumber());
        // ✅ email update removed — use auth endpoint to update login credentials
        if (updateDto.getPanNo() != null) farmer.setPanNo(updateDto.getPanNo());
        if (updateDto.getAadhaarNo() != null) farmer.setAadhaarNo(updateDto.getAadhaarNo());
        if (updateDto.getAddress() != null) {
            if (farmer.getAddress() == null) farmer.setAddress(new Address());
            updateAddressFromDto(updateDto.getAddress(), farmer.getAddress());
        }
    }

    public void updateAddressFromDto(AddressUpdateRequestDTO dto, Address address) {
        if (dto == null) return;
        if (dto.getAddressLine() != null) address.setAddressLine(dto.getAddressLine());
        if (dto.getDistrict() != null) address.setDistrict(dto.getDistrict());
        if (dto.getState() != null) address.setState(dto.getState());
        if (dto.getPinCode() != null) address.setPinCode(dto.getPinCode());
    }

    private Address mapAddress(AddressRequestDTO dto) {
        if (dto == null) return null;
        Address address = new Address();
        address.setAddressLine(dto.getAddressLine());
        address.setDistrict(dto.getDistrict());
        address.setState(dto.getState());
        address.setPinCode(dto.getPinCode());
        return address;
    }
}
