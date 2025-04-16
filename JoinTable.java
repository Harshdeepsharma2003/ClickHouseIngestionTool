package com.example.ClickhouseIngestionTool.dto;


import lombok.Data;

@Data
public class JoinTable {
    private String table;
    private String joinType;
    private String condition;
}
