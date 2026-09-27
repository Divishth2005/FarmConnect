package com.divishth.farmconnect.controller;

import com.divishth.farmconnect.dto.OrderRequestDTO;
import com.divishth.farmconnect.dto.OrderResponseDTO;
import com.divishth.farmconnect.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponseDTO> placeOrder(
            @Valid @RequestBody OrderRequestDTO orderRequestDTO) {
        return ResponseEntity.ok(orderService.placeOrder(orderRequestDTO));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponseDTO>> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponseDTO> getOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.getOrderById(id));
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByBuyer(@PathVariable Long buyerId) {
        return ResponseEntity.ok(orderService.getOrdersByBuyer(buyerId));
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<List<OrderResponseDTO>> getOrdersByFarmer(@PathVariable Long farmerId) {
        return ResponseEntity.ok(orderService.getOrdersByFarmer(farmerId));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<String> cancelOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.cancelOrder(id));
    }

    @PatchMapping("/{id}/confirm")
    public ResponseEntity<String> confirmOrder(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.confirmOrder(id));
    }

    @PatchMapping("/{id}/deliver")
    public ResponseEntity<String> markAsDelivered(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.markAsDelivered(id));
    }
}