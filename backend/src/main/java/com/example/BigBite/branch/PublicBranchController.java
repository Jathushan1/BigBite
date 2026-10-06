package com.example.BigBite.branch;

import com.example.BigBite.branch.dto.PublicBranchDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Read-only branch directory for guests and customers choosing where to order from. */
@RestController
@RequestMapping("/api/branches")
public class PublicBranchController {

    private final BranchService branchService;

    public PublicBranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    @GetMapping
    public ResponseEntity<List<PublicBranchDto>> getBranches() {
        return ResponseEntity.ok(branchService.getPublicBranches());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PublicBranchDto> getBranch(@PathVariable Long id) {
        return ResponseEntity.ok(branchService.getPublicBranch(id));
    }
}
