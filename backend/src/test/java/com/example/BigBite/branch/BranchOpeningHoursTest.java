package com.example.BigBite.branch;

import org.junit.jupiter.api.Test;

import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

class BranchOpeningHoursTest {

    private Branch branch(LocalTime opens, LocalTime closes) {
        Branch branch = new Branch("Test", "TST", "1 Road", "Colombo", "0112345678", "t@bigbite.lk");
        branch.setOpeningTime(opens);
        branch.setClosingTime(closes);
        return branch;
    }

    @Test
    void sameDayHours() {
        Branch branch = branch(LocalTime.of(10, 0), LocalTime.of(22, 0));
        assertFalse(branch.isOpenAt(LocalTime.of(9, 59)));
        assertTrue(branch.isOpenAt(LocalTime.of(10, 0)));
        assertTrue(branch.isOpenAt(LocalTime.of(21, 59)));
        assertFalse(branch.isOpenAt(LocalTime.of(22, 0)));
    }

    @Test
    void hoursPastMidnight() {
        Branch branch = branch(LocalTime.of(18, 0), LocalTime.of(2, 0));
        assertTrue(branch.isOpenAt(LocalTime.of(23, 30)));
        assertTrue(branch.isOpenAt(LocalTime.of(1, 30)));
        assertFalse(branch.isOpenAt(LocalTime.of(2, 0)));
        assertFalse(branch.isOpenAt(LocalTime.of(12, 0)));
    }

    @Test
    void noHoursMeansAlwaysOpenUnlessInactive() {
        Branch branch = branch(null, null);
        assertTrue(branch.isOpenAt(LocalTime.of(3, 0)));
        branch.setStatus(BranchStatus.INACTIVE);
        assertFalse(branch.isOpenAt(LocalTime.of(12, 0)));
    }
}
