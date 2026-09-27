package com.divishth.farmconnect.mapper;

import com.divishth.farmconnect.dto.CropRequestDTO;
import com.divishth.farmconnect.dto.CropResponseDTO;
import com.divishth.farmconnect.entity.Crop;
import org.springframework.stereotype.Component;

@Component
public class CropMapper {

    public Crop mapRequestToCrop(CropRequestDTO dto) {
        if (dto == null) return null;
        Crop crop = new Crop();
        crop.setName(dto.getName());
        crop.setPrice(dto.getPrice());
        crop.setQuantity(dto.getQuantity());
        crop.setDescription(dto.getDescription());
        // farmer is set manually in CropService
        return crop;
    }

    public static String imageUrl(Crop crop) {
        return crop.getImageUpdatedAt() == null ? null
                : "/crop/" + crop.getId() + "/image?v=" + crop.getImageUpdatedAt();
    }

    public CropResponseDTO mapCropToResponse(Crop crop) {
        if (crop == null) return null;
        CropResponseDTO dto = new CropResponseDTO();
        dto.setId(crop.getId());
        dto.setName(crop.getName());
        dto.setPrice(crop.getPrice());
        dto.setQuantity(crop.getQuantity());
        dto.setDescription(crop.getDescription());
        dto.setImageUrl(imageUrl(crop));
        if (crop.getFarmer() != null) {
            dto.setFarmerId(crop.getFarmer().getId());
            dto.setFarmerName(crop.getFarmer().getName());
            if (crop.getFarmer().getAddress() != null) {
                dto.setFarmerDistrict(crop.getFarmer().getAddress().getDistrict());
                dto.setFarmerState(crop.getFarmer().getAddress().getState());
            }
        }
        return dto;
    }

    public void updateCropFromDto(CropRequestDTO dto, Crop crop) {
        if (dto == null) return;
        if (dto.getName() != null) crop.setName(dto.getName());
        if (dto.getPrice() != null) crop.setPrice(dto.getPrice());
        if (dto.getQuantity() != null) crop.setQuantity(dto.getQuantity());
        if (dto.getDescription() != null) crop.setDescription(dto.getDescription());
    }
}