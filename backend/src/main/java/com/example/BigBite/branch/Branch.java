package com.example.BigBite.branch;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "branches")
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "branch_code", nullable = false, unique = true)
    private String branchCode;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String city;

    @Column(name = "state_province")
    private String state;

    @Column(name = "postal_code")
    private String postalCode;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String email;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false)
    private BranchStatus status = BranchStatus.ACTIVE;

    @Column(name = "opening_time")
    private LocalTime openingTime;

    @Column(name = "closing_time")
    private LocalTime closingTime;

    @Column(name = "takeaway_enabled", nullable = false, columnDefinition = "boolean default true")
    private boolean takeawayEnabled = true;

    @Column(name = "cod_enabled", nullable = false, columnDefinition = "boolean default true")
    private boolean codEnabled = true;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Branch() {}

    public Branch(String name, String branchCode, String address, String city, String phone, String email) {
        this.name = name;
        this.branchCode = branchCode;
        this.address = address;
        this.city = city;
        this.phone = phone;
        this.email = email;
        this.status = BranchStatus.ACTIVE;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.status == null) {
            this.status = BranchStatus.ACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBranchCode() {
        return branchCode;
    }

    public void setBranchCode(String branchCode) {
        this.branchCode = branchCode;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getPostalCode() {
        return postalCode;
    }

    public void setPostalCode(String postalCode) {
        this.postalCode = postalCode;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public BranchStatus getStatus() {
        return status;
    }

    public void setStatus(BranchStatus status) {
        this.status = status;
    }

    public LocalTime getOpeningTime() {
        return openingTime;
    }

    public void setOpeningTime(LocalTime openingTime) {
        this.openingTime = openingTime;
    }

    public LocalTime getClosingTime() {
        return closingTime;
    }

    public void setClosingTime(LocalTime closingTime) {
        this.closingTime = closingTime;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public boolean isTakeawayEnabled() {
        return takeawayEnabled;
    }

    public void setTakeawayEnabled(boolean takeawayEnabled) {
        this.takeawayEnabled = takeawayEnabled;
    }

    public boolean isCodEnabled() {
        return codEnabled;
    }

    public void setCodEnabled(boolean codEnabled) {
        this.codEnabled = codEnabled;
    }

    /**
     * True when the branch is ACTIVE and {@code now} falls inside its trading hours.
     * Branches without hours are treated as always open; hours may wrap past midnight.
     */
    public boolean isOpenAt(LocalTime now) {
        if (status != BranchStatus.ACTIVE) {
            return false;
        }
        if (openingTime == null || closingTime == null || openingTime.equals(closingTime)) {
            return true;
        }
        if (openingTime.isBefore(closingTime)) {
            return !now.isBefore(openingTime) && now.isBefore(closingTime);
        }
        return !now.isBefore(openingTime) || now.isBefore(closingTime);
    }
}
