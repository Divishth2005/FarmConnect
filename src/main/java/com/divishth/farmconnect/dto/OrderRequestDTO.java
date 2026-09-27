package com.divishth.farmconnect.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor

public class OrderRequestDTO {

    // Optional: orders are always placed as the logged-in buyer
    private Long buyerId;

    @NotNull(message = "Crop ID is required")
    private Long cropId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than 0")
    private Double quantity;

}