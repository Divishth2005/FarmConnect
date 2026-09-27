package com.divishth.farmconnect.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder

public class AddressResponseDTO {
    private String addressLine;
    private String district;
    private String state;
    private String pinCode;
}
