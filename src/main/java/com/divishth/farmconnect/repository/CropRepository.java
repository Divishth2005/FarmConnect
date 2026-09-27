package com.divishth.farmconnect.repository;

import com.divishth.farmconnect.entity.Crop;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CropRepository extends JpaRepository<Crop,Long> {

    List<Crop> findByNameContainingIgnoreCase(String name);

    List<Crop> findByPriceBetween(Double minPrice, Double maxPrice);

    // Row lock so concurrent orders can't both read the same stock and oversell
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Crop c WHERE c.id = :id")
    Optional<Crop> findByIdForUpdate(@Param("id") Long id);
}
