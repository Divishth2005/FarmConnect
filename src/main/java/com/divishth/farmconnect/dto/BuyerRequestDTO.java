package com.divishth.farmconnect.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BuyerRequestDTO {

    @NotBlank(message="Name required")
    private String name;

    @NotBlank(message= "Phone number is required")
    @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits")
    private String phoneNumber;


    @Valid
    private AddressRequestDTO address;
}
