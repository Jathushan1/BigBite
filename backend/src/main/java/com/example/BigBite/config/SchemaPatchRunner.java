package com.example.BigBite.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * One-time, idempotent schema fix for MySQL databases created by older builds.
 * <p>
 * Hibernate used to create {@code @Enumerated(STRING)} columns as native MySQL {@code ENUM}s, and
 * {@code ddl-auto=update} never widens them, so inserting a new value (for example the STAFF role)
 * fails with "Data truncated". This runner converts those columns to VARCHAR. It does nothing on
 * other databases or when no ENUM columns remain.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SchemaPatchRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SchemaPatchRunner.class);
    private static final Set<String> OWNED_TABLES = Set.of("users", "branches", "orders", "order_status_history",
            "order_payment_attempts", "menu_items", "branch_sales", "saved_addresses", "order_items");

    private final DataSource dataSource;
    private final JdbcTemplate jdbc;

    public SchemaPatchRunner(DataSource dataSource) {
        this.dataSource = dataSource;
        this.jdbc = new JdbcTemplate(dataSource);
    }

    @Override
    public void run(ApplicationArguments args) {
        try (Connection connection = dataSource.getConnection()) {
            if (!connection.getMetaData().getDatabaseProductName().toLowerCase().contains("mysql")) {
                return;
            }
        } catch (Exception ex) {
            log.warn("Schema patch skipped: {}", ex.getMessage());
            return;
        }

        List<Map<String, Object>> enumColumns = jdbc.queryForList(
                "SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE FROM information_schema.COLUMNS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND DATA_TYPE = 'enum'");
        int patched = 0;
        for (Map<String, Object> column : enumColumns) {
            String table = String.valueOf(column.get("TABLE_NAME"));
            String name = String.valueOf(column.get("COLUMN_NAME"));
            if (!OWNED_TABLES.contains(table.toLowerCase()) || !name.matches("[A-Za-z0-9_]+")) {
                continue;
            }
            String nullability = "NO".equalsIgnoreCase(String.valueOf(column.get("IS_NULLABLE"))) ? "NOT NULL" : "NULL";
            jdbc.execute("ALTER TABLE `" + table + "` MODIFY COLUMN `" + name + "` VARCHAR(64) " + nullability);
            log.info("Schema patch: {}.{} ENUM -> VARCHAR(64)", table, name);
            patched++;
        }
        if (patched > 0) {
            log.info("Schema patch converted {} ENUM column(s) to VARCHAR", patched);
        }
    }
}
