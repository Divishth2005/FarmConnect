package com.divishth.farmconnect.dto;

import com.divishth.farmconnect.embedded.Address;
import lombok.Data;

@Data
public class FarmerResponseDTO {
    private Long id;
    private String name;
    private String phoneNumber;
    private String email;
    private AddressResponseDTO address;
}
