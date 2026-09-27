package com.divishth.farmconnect.repository;

import com.divishth.farmconnect.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByCropFarmerId(Long farmerId);
    List<Order> findByBuyerId(Long buyerId);
}
