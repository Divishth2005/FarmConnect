package com.divishth.farmconnect.dto;

import lombok.Data;

@Data
public class BuyerResponseDTO {
    private Long id;
    private String name;
    private String phoneNumber;

    private AddressResponseDTO address;
}
