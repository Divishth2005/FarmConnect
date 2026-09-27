package com.divishth.farmconnect.security;

import com.divishth.farmconnect.entity.Buyer;
import com.divishth.farmconnect.entity.Farmer;
import com.divishth.farmconnect.entity.User;
import com.divishth.farmconnect.enums.Role;
import com.divishth.farmconnect.repository.BuyerRepository;
import com.divishth.farmconnect.repository.FarmerRepository;
import com.divishth.farmconnect.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Resolves the logged-in user (from the JWT-populated SecurityContext) to their
 * User / Farmer / Buyer records, so services can enforce ownership.
 */
@Service
public class CurrentUserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FarmerRepository farmerRepository;

    @Autowired
    private BuyerRepository buyerRepository;

    public User getUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new AccessDeniedException("Not authenticated");
        }
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AccessDeniedException("User account no longer exists"));
    }

    public Farmer getFarmer() {
        User user = getUser();
        if (user.getRole() != Role.FARMER) {
            throw new AccessDeniedException("Only farmers can perform this action");
        }
        return farmerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new AccessDeniedException("No farmer profile linked to this account"));
    }

    public Buyer getBuyer() {
        User user = getUser();
        if (user.getRole() != Role.BUYER) {
            throw new AccessDeniedException("Only buyers can perform this action");
        }
        return buyerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new AccessDeniedException("No buyer profile linked to this account"));
    }

    public void requireFarmer(Long farmerId) {
        if (!getFarmer().getId().equals(farmerId)) {
            throw new AccessDeniedException("Access denied: this belongs to another farmer");
        }
    }

    public void requireBuyer(Long buyerId) {
        if (!getBuyer().getId().equals(buyerId)) {
            throw new AccessDeniedException("Access denied: this belongs to another buyer");
        }
    }
}
