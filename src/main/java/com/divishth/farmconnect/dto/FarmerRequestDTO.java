package com.divishth.farmconnect.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class FarmerRequestDTO {

    @NotBlank(message = "Name required")
    private String name;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits")
    private String phoneNumber;

    // ✅ Removed email — email is managed on the User account, not duplicated on Farmer

    @Valid
    private AddressRequestDTO address;

    @NotBlank
    // ✅ Fixed: anchored PAN regex to prevent partial matches
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message = "Invalid PAN format")
    private String panNo;

    @NotBlank
    @Pattern(regexp = "\\d{12}", message = "Aadhaar must contain exactly 12 digits")
    private String aadhaarNo;
}
