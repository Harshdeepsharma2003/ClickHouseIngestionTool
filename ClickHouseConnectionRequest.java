package com.example.ClickhouseIngestionTool.dto;

import lombok.Data;

@Data
public class ClickHouseConnectionRequest {
    private String host;
    private int port;
    private String database;
    private String user;
    private String jwt;
}
