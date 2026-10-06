package com.example.BigBite.auth;

import com.example.BigBite.auth.dto.RejectUserRequestDto;
import com.example.BigBite.auth.dto.UserDto;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** A branch manager approves, rejects and suspends the staff and riders of their own branch. */
@RestController
@RequestMapping("/api/manager/team")
@PreAuthorize("hasRole('BRANCH_MANAGER')")
public class ManagerTeamController {

    private final ManagerTeamService teamService;

    public ManagerTeamController(ManagerTeamService teamService) {
        this.teamService = teamService;
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getTeam(@AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(teamService.getTeam(principal.getUsername()));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<UserDto> approve(@AuthenticationPrincipal UserDetails principal, @PathVariable Long id) {
        return ResponseEntity.ok(teamService.approve(principal.getUsername(), id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<UserDto> reject(@AuthenticationPrincipal UserDetails principal, @PathVariable Long id,
                                          @RequestBody(required = false) RejectUserRequestDto request) {
        return ResponseEntity.ok(teamService.reject(principal.getUsername(), id,
                request != null ? request.getReason() : null));
    }

    @PutMapping("/{id}/suspend")
    public ResponseEntity<UserDto> suspend(@AuthenticationPrincipal UserDetails principal, @PathVariable Long id) {
        return ResponseEntity.ok(teamService.suspend(principal.getUsername(), id));
    }

    @PutMapping("/{id}/reactivate")
    public ResponseEntity<UserDto> reactivate(@AuthenticationPrincipal UserDetails principal, @PathVariable Long id) {
        return ResponseEntity.ok(teamService.reactivate(principal.getUsername(), id));
    }
}
