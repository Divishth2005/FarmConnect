package com.divishth.farmconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CropRequestDTO {
    private Long farmerId;
    private String name;
    private Double price;
    private Double quantity;
    private String description;
}
