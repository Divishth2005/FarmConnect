package com.divishth.farmconnect.dto;

import com.divishth.farmconnect.embedded.Address;
import com.divishth.farmconnect.enums.Role;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDTO {

    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    @NotBlank
    private String password;

    @NotNull
    private Role role;

    @NotBlank
    private String phoneNumber;

    @Valid
    @NotNull
    private Address address;

    private String panNo;

    private String aadhaarNo;
}