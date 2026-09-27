package com.divishth.farmconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@Data
@NoArgsConstructor
public class AddressUpdateRequestDTO {
    private String addressLine;
    private String district;
    private String state;
    private String pinCode;
}
