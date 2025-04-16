package com.example.ClickhouseIngestionTool.controller;


import com.example.ClickhouseIngestionTool.dto.ClickHouseConnectionRequest;
import com.example.ClickhouseIngestionTool.dto.IngestionRequest;
import com.example.ClickhouseIngestionTool.dto.IngestionResponse;
import com.example.ClickhouseIngestionTool.service.IngestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.util.List;


@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class IngestionController {

    @Autowired
    private IngestionService ingestionService;

    @PostMapping("/connect-clickhouse")
    public ResponseEntity<List<String>> connectClickHouse(@RequestBody ClickHouseConnectionRequest request) {
        List<String> tables = ingestionService.connectAndFetchTables(request);
        return ResponseEntity.ok(tables);
    }

    @PostMapping("/load-columns")
    public ResponseEntity<List<String>> loadColumns(@RequestBody IngestionRequest request) {
        List<String> columns = ingestionService.getColumnsForTable(request);
        return ResponseEntity.ok(columns);
    }

    @PostMapping("/preview")
    public ResponseEntity<List<List<String>>> previewData(@RequestBody IngestionRequest request) {
        List<List<String>> preview = ingestionService.getDataPreview(request);
        return ResponseEntity.ok(preview);
    }

    @PostMapping("/ingest")
    public ResponseEntity<IngestionResponse> startIngestion(
            @RequestPart("request") IngestionRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        IngestionResponse response = ingestionService.ingest(request, file);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/export")
    public ResponseEntity<InputStreamResource> exportClickHouseData(@RequestBody IngestionRequest request) {
        byte[] csvData = ingestionService.exportClickHouseToCSV(request);
        InputStreamResource resource = new InputStreamResource(new ByteArrayInputStream(csvData));

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + request.getFlatFileConfig().getOutputFilename())
                .contentType(MediaType.parseMediaType("text/csv"))
                .contentLength(csvData.length)
                .body(resource);
    }
}
