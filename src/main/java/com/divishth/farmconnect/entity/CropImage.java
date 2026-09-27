package com.divishth.farmconnect.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Photo for a crop listing, stored in the database so it survives redeploys
 * on hosts with ephemeral disks. Kept in its own table (keyed by crop id) so
 * crop list queries never load image bytes.
 */
@Entity
@Table(name = "crop_image")
@Data
@NoArgsConstructor
public class CropImage {

    @Id
    private Long cropId;

    @Lob
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] data;

    @Column(nullable = false)
    private String contentType;
}
