package com.example.ClickhouseIngestionTool.dto;

import lombok.Data;

@Data
public class FlatFileConfig {
    private String outputFilename;
    private String delimiter;
    private boolean includeHeader;
    private boolean hasHeader; // for input direction
}
