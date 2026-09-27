package com.divishth.farmconnect.service;

import com.divishth.farmconnect.dto.LoginRequestDTO;
import com.divishth.farmconnect.dto.LoginResponseDTO;
import com.divishth.farmconnect.dto.RegisterRequestDTO;
import com.divishth.farmconnect.entity.Buyer;
import com.divishth.farmconnect.entity.Farmer;
import com.divishth.farmconnect.entity.User;
import com.divishth.farmconnect.enums.Role;
import com.divishth.farmconnect.exception.ConflictException;
import com.divishth.farmconnect.repository.BuyerRepository;
import com.divishth.farmconnect.repository.FarmerRepository;
import com.divishth.farmconnect.repository.UserRepository;
import com.divishth.farmconnect.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BuyerRepository buyerRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    // ========================= REGISTER =========================

    @Transactional
    public String register(RegisterRequestDTO dto) {

        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new ConflictException("Email is already registered. Please login or use a different email.");
        }

        // ✅ Fix: Validate role-specific fields BEFORE saving anything to DB
        // This prevents orphaned User rows when farmer validation fails.
        if (dto.getRole() == Role.FARMER) {
            if (dto.getPanNo() == null || dto.getPanNo().isBlank()) {
                throw new IllegalArgumentException("PAN number is required for Farmer registration");
            }
            if (dto.getAadhaarNo() == null || dto.getAadhaarNo().isBlank()) {
                throw new IllegalArgumentException("Aadhaar number is required for Farmer registration");
            }
        }

        User user = new User();
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setRole(dto.getRole());
        userRepository.save(user);

        if (dto.getRole() == Role.BUYER) {

            Buyer buyer = new Buyer();
            buyer.setName(dto.getName());
            buyer.setPhoneNumber(dto.getPhoneNumber());
            buyer.setAddress(dto.getAddress());
            buyer.setUser(user);
            buyerRepository.save(buyer);

        } else if (dto.getRole() == Role.FARMER) {

            Farmer farmer = new Farmer();
            farmer.setName(dto.getName());
            farmer.setPhoneNumber(dto.getPhoneNumber());
            // email is sourced from User.email — not stored on Farmer
            farmer.setAddress(dto.getAddress());
            farmer.setPanNo(dto.getPanNo());
            farmer.setAadhaarNo(dto.getAadhaarNo());
            farmer.setUser(user);
            farmerRepository.save(farmer);
        }

        return "User Registered Successfully";
    }

    // ========================= LOGIN =========================

    public LoginResponseDTO login(LoginRequestDTO dto) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        dto.getEmail(),
                        dto.getPassword()
                )
        );

        User user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserDetails userDetails =
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPassword(),
                        List.of(
                                new SimpleGrantedAuthority(
                                        "ROLE_" + user.getRole().name()
                                )
                        )
                );

        String token = jwtService.generateToken(userDetails);

        // Resolve profile id and name based on role
        Long profileId = null;
        String profileName = null;

        if (user.getRole() == Role.FARMER) {
            Farmer farmer = farmerRepository.findByUserId(user.getId())
                    .orElse(null);
            if (farmer != null) {
                profileId = farmer.getId();
                profileName = farmer.getName();
            }
        } else if (user.getRole() == Role.BUYER) {
            Buyer buyer = buyerRepository.findByUserId(user.getId())
                    .orElse(null);
            if (buyer != null) {
                profileId = buyer.getId();
                profileName = buyer.getName();
            }
        }

        return new LoginResponseDTO(profileId, profileName, user.getRole().name(), token);
    }
}