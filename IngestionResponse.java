package com.example.ClickhouseIngestionTool.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class IngestionResponse {
    private boolean success;
    private String message;
    private int recordCount;
}