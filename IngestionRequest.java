package com.example.ClickhouseIngestionTool.dto;

import lombok.Data;

import java.util.List;

@Data
public class IngestionRequest {
    private String direction; // clickhouse-to-flatfile or flatfile-to-clickhouse

    private ClickHouseConnectionRequest clickhouseConfig;
    private FlatFileConfig flatFileConfig;

    private List<String> columns;
    private String sourceTable;
    private String targetTable;
    private boolean createTable;

    private JoinConfig joinConfig;
}