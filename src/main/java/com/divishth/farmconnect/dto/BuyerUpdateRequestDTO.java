package com.divishth.farmconnect.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor

@NoArgsConstructor
public class BuyerUpdateRequestDTO {
    private String name;

    @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Invalid phone number")
    private String phoneNumber;

    @Email(message = "Invalid email")
    private String email;

    @Valid
    private AddressUpdateRequestDTO address;
}
