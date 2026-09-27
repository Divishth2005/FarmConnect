package com.divishth.farmconnect.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
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

    // Zero is allowed so a farmer can mark a listing sold out without deleting it
    @PositiveOrZero(message = "Quantity cannot be negative")
    private Double quantity;

    private String description;
}
