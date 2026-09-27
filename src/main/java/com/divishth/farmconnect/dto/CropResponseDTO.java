package com.divishth.farmconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CropResponseDTO {

    private Long id;
    private Long farmerId;
    private String name;
    private Double price;
    private Double quantity;
    private String description;
    private String farmerName;
    private String farmerDistrict;
    private String farmerState;
    private String imageUrl;
}