package com.divishth.farmconnect.dto;

import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CropRequestDTO {
    // Optional: crops always belong to the logged-in farmer
    private Long farmerId;
    private String name;

    @Positive(message = "Price must be greater than 0")
    private Double price;

    @Positive(message = "Quantity must be greater than 0")
    private Double quantity;

    private String description;
}
