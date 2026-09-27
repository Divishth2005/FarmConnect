package com.divishth.farmconnect.entity;

import com.divishth.farmconnect.embedded.Address;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
public class Buyer {

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Buyer name is required")
    private String name;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "\\d{10}", message = "Phone number must contain exactly 10 digits")
    @Column(nullable = false, unique = true)
    private String phoneNumber;

    @Valid
    @Embedded
    private Address address;

}
