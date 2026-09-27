package com.divishth.farmconnect.embedded;

import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


@NoArgsConstructor
@AllArgsConstructor
@Data
@Embeddable
public class Address {

    @NotBlank
    private String addressLine;

    @NotBlank
    private String district;

    @NotBlank
    private String state;

    @NotBlank
    private String pinCode;



}
