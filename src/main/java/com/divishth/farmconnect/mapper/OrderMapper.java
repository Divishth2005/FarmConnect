package com.divishth.farmconnect.mapper;

import com.divishth.farmconnect.dto.OrderRequestDTO;
import com.divishth.farmconnect.dto.OrderResponseDTO;
import com.divishth.farmconnect.entity.Order;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {

    public Order mapRequestToOrder(OrderRequestDTO dto) {
        if (dto == null) return null;
        Order order = new Order();
        order.setQuantity(dto.getQuantity());
        // buyer and crop are set manually in OrderService
        return order;
    }

    public OrderResponseDTO mapOrderToResponse(Order order) {
        if (order == null) return null;
        OrderResponseDTO dto = new OrderResponseDTO();
        dto.setId(order.getId());
        dto.setQuantity(order.getQuantity());
        dto.setTotalPrice(order.getTotalPrice());
        dto.setOrderDate(order.getOrderDate());
        dto.setStatus(order.getStatus());
        if (order.getBuyer() != null) {
            dto.setBuyerName(order.getBuyer().getName());
        }
        if (order.getCrop() != null) {
            dto.setCropName(order.getCrop().getName());
        }
        return dto;
    }
}
