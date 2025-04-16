package com.example.ClickhouseIngestionTool.dto;


import lombok.Data;

import java.util.List;

@Data
public class JoinConfig {
    private boolean enabled;
    private List<JoinTable> tables;
    private String condition;
}