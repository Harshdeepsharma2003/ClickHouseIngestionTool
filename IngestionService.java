package com.example.ClickhouseIngestionTool.service;


import com.example.ClickhouseIngestionTool.dto.ClickHouseConnectionRequest;
import com.example.ClickhouseIngestionTool.dto.IngestionRequest;
import com.example.ClickhouseIngestionTool.dto.IngestionResponse;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.apache.tomcat.util.http.fileupload.ByteArrayOutputStream;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.sql.*;
import java.util.*;
import java.util.stream.Collectors;


@Service
public class IngestionService {

    public List<String> connectAndFetchTables(ClickHouseConnectionRequest config) {
        try (Connection conn = getConnection(config)) {
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("SHOW TABLES");
            List<String> tables = new ArrayList<>();
            while (rs.next()) {
                tables.add(rs.getString(1));
            }
            return tables;
        } catch (Exception e) {
            throw new RuntimeException("Connection or query failed: " + e.getMessage());
        }
    }

    public List<String> getColumnsForTable(IngestionRequest request) {
        try (Connection conn = getConnection(request.getClickhouseConfig())) {
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery("DESCRIBE TABLE " + request.getSourceTable());
            List<String> columns = new ArrayList<>();
            while (rs.next()) {
                columns.add(rs.getString("name"));
            }
            return columns;
        } catch (Exception e) {
            throw new RuntimeException("Failed to get columns: " + e.getMessage());
        }
    }

    public List<List<String>> getDataPreview(IngestionRequest request) {
        try (Connection conn = getConnection(request.getClickhouseConfig())) {
            String columns = String.join(", ", request.getColumns());
            String query = "SELECT " + columns + " FROM " + request.getSourceTable() + " LIMIT 100";
            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(query);

            List<List<String>> preview = new ArrayList<>();
            preview.add(request.getColumns());

            while (rs.next()) {
                List<String> row = new ArrayList<>();
                for (String col : request.getColumns()) {
                    row.add(rs.getString(col));
                }
                preview.add(row);
            }
            return preview;
        } catch (Exception e) {
            throw new RuntimeException("Failed to preview data: " + e.getMessage());
        }
    }

    public IngestionResponse ingest(IngestionRequest request, MultipartFile file) {
        if ("flatfile-to-clickhouse".equalsIgnoreCase(request.getDirection())) {
            return ingestFileToClickHouse(request, file);
        } else if ("clickhouse-to-flatfile".equalsIgnoreCase(request.getDirection())) {
            // This is now handled in /export endpoint
            return new IngestionResponse(true, "Use /export endpoint", 0);
        }
        return new IngestionResponse(false, "Invalid direction", 0);
    }

    private IngestionResponse ingestFileToClickHouse(IngestionRequest request, MultipartFile file) {
        try (Connection conn = getConnection(request.getClickhouseConfig())) {
            InputStreamReader reader = new InputStreamReader(file.getInputStream());
            Iterable<CSVRecord> records = CSVFormat.DEFAULT
                    .withFirstRecordAsHeader()
                    .parse(reader);

            List<String> columns = request.getColumns();
            String columnStr = String.join(", ", columns);
            String placeholders = columns.stream().map(c -> "?").collect(Collectors.joining(", "));

            if (request.isCreateTable()) {
                // Create a basic table (You may want to customize column types)
                StringBuilder create = new StringBuilder("CREATE TABLE IF NOT EXISTS ")
                        .append(request.getTargetTable())
                        .append(" (");
                for (String col : columns) {
                    create.append(col).append(" String, ");
                }
                create.setLength(create.length() - 2); // remove last comma
                create.append(") ENGINE = MergeTree() ORDER BY tuple()");
                conn.createStatement().execute(create.toString());
            }

            String insertSQL = "INSERT INTO " + request.getTargetTable() + " (" + columnStr + ") VALUES (" + placeholders + ")";
            PreparedStatement pstmt = conn.prepareStatement(insertSQL);

            int count = 0;
            for (CSVRecord record : records) {
                for (int i = 0; i < columns.size(); i++) {
                    pstmt.setString(i + 1, record.get(columns.get(i)));
                }
                pstmt.addBatch();
                count++;
            }
            pstmt.executeBatch();

            return new IngestionResponse(true, "CSV ingested successfully", count);

        } catch (Exception e) {
            return new IngestionResponse(false, "Ingestion failed: " + e.getMessage(), 0);
        }
    }

    public byte[] exportClickHouseToCSV(IngestionRequest request) {
        try (Connection conn = getConnection(request.getClickhouseConfig());
             ByteArrayOutputStream out = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(out);
             CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT)) {

            String columns = String.join(", ", request.getColumns());
            String query = "SELECT " + columns + " FROM " + request.getSourceTable() + " LIMIT 10000"; // or 1000

            Statement stmt = conn.createStatement();
            ResultSet rs = stmt.executeQuery(query);

            if (request.getFlatFileConfig().isIncludeHeader()) {
                printer.printRecord(request.getColumns());
            }

            while (rs.next()) {
                List<String> row = new ArrayList<>();
                for (String col : request.getColumns()) {
                    row.add(rs.getString(col));
                }
                printer.printRecord(row);
            }

            printer.flush();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("Export failed: " + e.getMessage());
        }
    }

    private Connection getConnection(ClickHouseConnectionRequest config) throws SQLException {
        String url = "jdbc:clickhouse://" + config.getHost() + ":" + config.getPort() + "/" + config.getDatabase() + "?compress=0";
        Properties props = new Properties();
        props.setProperty("user", config.getUser());
        props.setProperty("password", config.getJwt());
        return DriverManager.getConnection(url, props);
    }

}
