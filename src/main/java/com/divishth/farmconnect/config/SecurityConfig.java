package com.divishth.farmconnect.config;

import com.divishth.farmconnect.security.JwtFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtFilter jwtFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /**
     * Centralized CORS configuration — no need for @CrossOrigin on individual controllers.
     * allowedOrigins can be expanded (e.g. from environment variables) for production.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth

                        // ── Public endpoints ──────────────────────────────────────────────
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/", "/index.html", "/tester.html", "/assets/**", "/favicon.svg").permitAll()
                        .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()

                        // ── Crop: anyone can browse the marketplace ────────────────────────
                        // (ownership of individual crops is checked in CropService)
                        .requestMatchers(HttpMethod.GET, "/crop", "/crop/**").permitAll()
                        // Only FARMERs can create, update, or delete crops
                        .requestMatchers(HttpMethod.POST, "/crop/**").hasRole("FARMER")
                        .requestMatchers(HttpMethod.PUT, "/crop/**").hasRole("FARMER")
                        .requestMatchers(HttpMethod.PATCH, "/crop/**").hasRole("FARMER")
                        .requestMatchers(HttpMethod.DELETE, "/crop/**").hasRole("FARMER")

                        // ── Farmer profile management (ownership checked in FarmerService) ─
                        .requestMatchers(HttpMethod.GET, "/farmer/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/farmer/**").hasRole("FARMER")
                        .requestMatchers(HttpMethod.DELETE, "/farmer/**").hasRole("FARMER")

                        // ── Buyer profile management (ownership checked in BuyerService) ──
                        .requestMatchers(HttpMethod.GET, "/buyer/**").authenticated()
                        .requestMatchers(HttpMethod.PATCH, "/buyer/**").hasRole("BUYER")
                        .requestMatchers(HttpMethod.DELETE, "/buyer/**").hasRole("BUYER")

                        // ── Orders: BUYERs place orders, FARMERs confirm/deliver ───────────
                        .requestMatchers(HttpMethod.POST, "/orders/**").hasRole("BUYER")
                        .requestMatchers(HttpMethod.GET, "/orders/**").authenticated()
                        .requestMatchers("/orders/*/cancel").hasRole("BUYER")
                        .requestMatchers("/orders/*/confirm").hasRole("FARMER")
                        .requestMatchers("/orders/*/deliver").hasRole("FARMER")

                        // ── Everything else requires authentication ────────────────────────
                        .anyRequest().authenticated()
                )

                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}