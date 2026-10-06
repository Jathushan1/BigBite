package com.example.BigBite.branch.dto;

import com.example.BigBite.branch.BranchStatus;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import java.time.LocalTime;

public class UpdateBranchRequestDto {

    @Size(min = 2, max = 100, message = "Branch name must be between 2 and 100 characters")
    private String name;

    @Size(min = 2, max = 20, message = "Branch code must be between 2 and 20 characters")
    private String branchCode;

    private String address;

    private String city;

    private String state;

    private String postalCode;

    private String phone;

    @Email(message = "Invalid email format")
    private String email;

    private BranchStatus status;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime openingTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime closingTime;

    private Boolean takeawayEnabled;

    private Boolean codEnabled;

    public UpdateBranchRequestDto() {}

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

    public Boolean getTakeawayEnabled() {
        return takeawayEnabled;
    }

    public void setTakeawayEnabled(Boolean takeawayEnabled) {
        this.takeawayEnabled = takeawayEnabled;
    }

    public Boolean getCodEnabled() {
        return codEnabled;
    }

    public void setCodEnabled(Boolean codEnabled) {
        this.codEnabled = codEnabled;
    }
}
