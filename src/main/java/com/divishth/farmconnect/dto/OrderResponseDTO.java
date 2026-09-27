package com.divishth.farmconnect.dto;

import com.divishth.farmconnect.enums.OrderStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class OrderResponseDTO {
    private Long id;

    private String buyerName;

    private String buyerPhone;

    private AddressResponseDTO buyerAddress;

    private Long cropId;

    private String farmerName;

    private String farmerPhone;

    private String cropName;

    private Double quantity;

    private Double totalPrice;

    private LocalDateTime orderDate;

    private OrderStatus status;
}
