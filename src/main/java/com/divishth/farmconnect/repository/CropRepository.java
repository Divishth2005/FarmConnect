package com.divishth.farmconnect.repository;

import com.divishth.farmconnect.entity.Crop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CropRepository extends JpaRepository<Crop,Long> {

    List<Crop> findByNameContainingIgnoreCase(String name);

    List<Crop> findByPriceBetween(Double minPrice, Double maxPrice);
}
