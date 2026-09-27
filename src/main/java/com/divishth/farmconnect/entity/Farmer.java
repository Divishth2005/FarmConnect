package com.divishth.farmconnect.entity;

import com.divishth.farmconnect.embedded.Address;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;

import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
public class Farmer {

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "farmer")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Crop> crops;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name required")
    private String name;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits")
    @Column(nullable = false, unique = true)
    private String phoneNumber;

    // ✅ Removed duplicate email field — email is authoritative on User entity
    // Access via farmer.getUser().getEmail()

    @Valid
    @Embedded
    private Address address;

    @NotBlank
    // ✅ Fixed: anchored regex to prevent partial matches (e.g. "XXABCDE1234Z" would have passed before)
    @Pattern(regexp = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$", message = "Invalid PAN format")
    @Column(nullable = false, unique = true)
    private String panNo;

    @NotBlank
    @Pattern(regexp = "\\d{12}", message = "Aadhaar must contain exactly 12 digits")
    @Column(nullable = false, unique = true)
    private String aadhaarNo;

}
