package com.divishth.farmconnect.repository;

import com.divishth.farmconnect.entity.CropImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CropImageRepository extends JpaRepository<CropImage, Long> {
}
