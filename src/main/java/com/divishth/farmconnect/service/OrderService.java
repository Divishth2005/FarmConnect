package com.divishth.farmconnect.service;

import com.divishth.farmconnect.dto.OrderRequestDTO;
import com.divishth.farmconnect.dto.OrderResponseDTO;
import com.divishth.farmconnect.entity.Buyer;
import com.divishth.farmconnect.entity.Crop;
import com.divishth.farmconnect.entity.Order;
import com.divishth.farmconnect.enums.OrderStatus;
import com.divishth.farmconnect.exception.ResourceNotFoundException;
import com.divishth.farmconnect.mapper.OrderMapper;
import com.divishth.farmconnect.repository.BuyerRepository;
import com.divishth.farmconnect.repository.CropRepository;
import com.divishth.farmconnect.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private BuyerRepository buyerRepository;

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private OrderMapper orderMapper;

    @Transactional
    public OrderResponseDTO placeOrder(OrderRequestDTO dto) {

        Buyer buyer = buyerRepository.findById(dto.getBuyerId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Buyer not found"));

        Crop crop = cropRepository.findById(dto.getCropId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Crop not found"));

        if (dto.getQuantity() > crop.getQuantity()) {
            throw new IllegalArgumentException("Insufficient crop quantity available");
        }

        Order order = orderMapper.mapRequestToOrder(dto);

        order.setBuyer(buyer);
        order.setCrop(crop);
        order.setOrderDate(LocalDateTime.now());
        order.setStatus(OrderStatus.PENDING);
        order.setTotalPrice(crop.getPrice() * dto.getQuantity());

        crop.setQuantity(crop.getQuantity() - dto.getQuantity());

        cropRepository.save(crop);
        orderRepository.save(order);

        return orderMapper.mapOrderToResponse(order);
    }

    public List<OrderResponseDTO> getAllOrders() {

        return orderRepository.findAll()
                .stream()
                .map(orderMapper::mapOrderToResponse)
                .toList();
    }

    public OrderResponseDTO getOrderById(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Order not found"));

        return orderMapper.mapOrderToResponse(order);
    }

    public List<OrderResponseDTO> getOrdersByBuyer(Long buyerId) {

        buyerRepository.findById(buyerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Buyer not found"));

        return orderRepository.findByBuyerId(buyerId)
                .stream()
                .map(orderMapper::mapOrderToResponse)
                .toList();
    }

    public List<OrderResponseDTO> getOrdersByFarmer(Long farmerId) {

        return orderRepository.findByCropFarmerId(farmerId)
                .stream()
                .map(orderMapper::mapOrderToResponse)
                .toList();
    }

    @Transactional
    public String cancelOrder(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Only pending orders can be cancelled");
        }

        Crop crop = order.getCrop();
        crop.setQuantity(crop.getQuantity() + order.getQuantity());
        order.setStatus(OrderStatus.CANCELLED);

        cropRepository.save(crop);
        orderRepository.save(order);

        return "Order cancelled successfully";
    }

    @Transactional
    public String confirmOrder(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Only pending orders can be confirmed");
        }

        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        return "Order confirmed successfully";
    }

    @Transactional
    public String markAsDelivered(Long id) {

        Order order = orderRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed orders can be delivered");
        }

        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        return "Order delivered successfully";
    }
}