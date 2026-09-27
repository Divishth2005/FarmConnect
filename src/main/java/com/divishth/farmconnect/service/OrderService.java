package com.divishth.farmconnect.service;

import com.divishth.farmconnect.dto.OrderRequestDTO;
import com.divishth.farmconnect.dto.OrderResponseDTO;
import com.divishth.farmconnect.entity.Buyer;
import com.divishth.farmconnect.entity.Crop;
import com.divishth.farmconnect.entity.Farmer;
import com.divishth.farmconnect.entity.Order;
import com.divishth.farmconnect.entity.User;
import com.divishth.farmconnect.enums.OrderStatus;
import com.divishth.farmconnect.enums.Role;
import com.divishth.farmconnect.exception.ResourceNotFoundException;
import com.divishth.farmconnect.mapper.OrderMapper;
import com.divishth.farmconnect.repository.CropRepository;
import com.divishth.farmconnect.repository.OrderRepository;
import com.divishth.farmconnect.security.CurrentUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private OrderMapper orderMapper;

    @Autowired
    private CurrentUserService currentUserService;

    @Transactional
    public OrderResponseDTO placeOrder(OrderRequestDTO dto) {

        // Orders are always placed as the logged-in buyer
        Buyer buyer = currentUserService.getBuyer();
        if (dto.getBuyerId() != null && !dto.getBuyerId().equals(buyer.getId())) {
            throw new AccessDeniedException("You can only place orders as yourself");
        }

        Crop crop = cropRepository.findByIdForUpdate(dto.getCropId())
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

    // Buyers see their own orders; farmers see orders placed on their crops
    public List<OrderResponseDTO> getAllOrders() {

        User user = currentUserService.getUser();
        List<Order> orders = user.getRole() == Role.FARMER
                ? orderRepository.findByCropFarmerId(currentUserService.getFarmer().getId())
                : orderRepository.findByBuyerId(currentUserService.getBuyer().getId());

        return orders.stream()
                .map(orderMapper::mapOrderToResponse)
                .toList();
    }

    public OrderResponseDTO getOrderById(Long id) {

        Order order = findOrder(id);
        requireParticipant(order);

        return orderMapper.mapOrderToResponse(order);
    }

    public List<OrderResponseDTO> getOrdersByBuyer(Long buyerId) {

        currentUserService.requireBuyer(buyerId);

        return orderRepository.findByBuyerId(buyerId)
                .stream()
                .map(orderMapper::mapOrderToResponse)
                .toList();
    }

    public List<OrderResponseDTO> getOrdersByFarmer(Long farmerId) {

        currentUserService.requireFarmer(farmerId);

        return orderRepository.findByCropFarmerId(farmerId)
                .stream()
                .map(orderMapper::mapOrderToResponse)
                .toList();
    }

    @Transactional
    public String cancelOrder(Long id) {

        Order order = findOrder(id);
        currentUserService.requireBuyer(order.getBuyer().getId());

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Only pending orders can be cancelled");
        }

        Crop crop = cropRepository.findByIdForUpdate(order.getCrop().getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Crop not found"));
        crop.setQuantity(crop.getQuantity() + order.getQuantity());
        order.setStatus(OrderStatus.CANCELLED);

        cropRepository.save(crop);
        orderRepository.save(order);

        return "Order cancelled successfully";
    }

    @Transactional
    public String confirmOrder(Long id) {

        Order order = findOrder(id);
        requireCropOwner(order);

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Only pending orders can be confirmed");
        }

        order.setStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        return "Order confirmed successfully";
    }

    @Transactional
    public String markAsDelivered(Long id) {

        Order order = findOrder(id);
        requireCropOwner(order);

        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new IllegalStateException("Only confirmed orders can be delivered");
        }

        order.setStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        return "Order delivered successfully";
    }

    private Order findOrder(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Order not found"));
    }

    private void requireCropOwner(Order order) {
        Farmer farmer = currentUserService.getFarmer();
        Farmer owner = order.getCrop().getFarmer();
        if (owner == null || !owner.getId().equals(farmer.getId())) {
            throw new AccessDeniedException("You can only manage orders for your own crops");
        }
    }

    private void requireParticipant(Order order) {
        User user = currentUserService.getUser();
        if (user.getRole() == Role.BUYER) {
            currentUserService.requireBuyer(order.getBuyer().getId());
        } else {
            requireCropOwner(order);
        }
    }
}
