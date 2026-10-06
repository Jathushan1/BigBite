package com.example.BigBite.auth.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final boolean outboxPublic;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          @Value("${app.mail.outbox-public:true}") boolean outboxPublic) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.outboxPublic = outboxPublic;
    }

    private static void writeError(HttpServletResponse response, int status, String code, String message)
            throws java.io.IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"status\":" + status + ",\"error\":\"" + code + "\",\"message\":\"" + message + "\"}");
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, exception) ->
                        writeError(response, 401, "AUTH_REQUIRED", "Authentication is required"))
                .accessDeniedHandler((request, response, exception) ->
                        writeError(response, 403, "FORBIDDEN", "Access denied: you do not have sufficient permissions")))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/register/**", "/api/auth/login",
                        "/api/auth/forgot-password", "/api/auth/reset-password").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/branches", "/api/branches/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/menu/**").permitAll()
                .requestMatchers("/api/dev/outbox").access((authentication, context) ->
                        new org.springframework.security.authorization.AuthorizationDecision(outboxPublic
                                || authentication.get().getAuthorities().stream()
                                        .anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()))))
                .requestMatchers("/api/admin/**").hasRole("SUPER_ADMIN")
                .requestMatchers("/api/manager/**").hasRole("BRANCH_MANAGER")
                .requestMatchers("/api/auth/me").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/orders").permitAll()
                .requestMatchers("/api/orders/claim", "/api/orders/addresses").authenticated()
                .requestMatchers("/api/orders/riders").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/orders").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/orders/*/status").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/orders/*/cod/collect", "/api/orders/*/delivery-failed").authenticated()
                // Per-order guest access is checked against X-Guest-Token by OrderAccessGuard.
                .requestMatchers("/api/orders/**").permitAll()
                .requestMatchers("/error").permitAll()
                .anyRequest().authenticated()
            )
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            "http://localhost:4173"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin", "X-Guest-Token", "Idempotency-Key"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
