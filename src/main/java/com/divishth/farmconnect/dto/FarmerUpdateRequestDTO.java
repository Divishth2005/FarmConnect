package com.divishth.farmconnect.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FarmerUpdateRequestDTO {

    private String name;

    @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Invalid phone number")
    private String phoneNumber;

    // ✅ Removed email — email is on the User account; update auth credentials separately

    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message = "Invalid PAN number")
    private String panNo;

    @Pattern(regexp = "^[0-9]{12}$", message = "Invalid Aadhaar number")
    private String aadhaarNo;

    @Valid
    private AddressUpdateRequestDTO address;
}
