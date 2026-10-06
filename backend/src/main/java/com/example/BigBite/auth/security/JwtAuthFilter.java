package com.example.BigBite.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.example.BigBite.auth.User;
import com.example.BigBite.auth.UserRepository;
import com.example.BigBite.auth.UserStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.userRepository = userRepository;
    }

    /** Rejects tokens of suspended/rejected accounts and tokens issued before the last password change. */
    private boolean isStillValid(String jwt, String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null || user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.REJECTED) {
            return false;
        }
        if (user.getPasswordChangedAt() == null) {
            return true;
        }
        java.util.Date issuedAt = jwtUtil.extractClaim(jwt, io.jsonwebtoken.Claims::getIssuedAt);
        java.time.Instant changedAt = user.getPasswordChangedAt().atZone(java.time.ZoneId.systemDefault()).toInstant();
        return issuedAt != null && !issuedAt.toInstant().isBefore(changedAt);
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        try {
            userEmail = jwtUtil.extractEmail(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtUtil.validateToken(jwt) && isStillValid(jwt, userEmail)) {
                    UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Log or ignore so chain continues and unauthenticated access will be caught by security filter chain
        }

        filterChain.doFilter(request, response);
    }
}
