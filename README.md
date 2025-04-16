# ClickHouseIngestionTool

# ClickHouse-Flat File Integration Application

A web-based application that enables bidirectional data exchange between ClickHouse database and flat file systems.

## Overview

This full-stack application facilitates seamless data ingestion between ClickHouse databases and flat files (CSV), supporting both export (ClickHouse to Flat File) and import (Flat File to ClickHouse) operations. The system features JWT-based authentication, column-level selection, and detailed operation reporting.

## Features

### Core Functionality
- **Bidirectional Data Flow**:
  - Export data from ClickHouse to flat files
  - Import data from flat files into ClickHouse
- **JWT Authentication** for secure ClickHouse connections
- **Dynamic Schema Discovery** with column-level selection
- **Batch Processing** for optimal performance
- **Comprehensive Error Handling** for connection, authentication, and data issues
- **Detailed Reporting** showing records processed

### User Interface
- **Intuitive Source/Target Selection** for data flow direction
- **Dynamic Configuration Forms** for connection details
- **Table and Column Selection** with checkbox interface
- **Real-time Status Updates** during operations
- **Results Display** showing ingestion summary

## Technical Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Java with Spring Boot framework
- **Database**: ClickHouse (tested with Docker deployment)
- **Authentication**: JWT token-based access
- **Data Processing**: Batch processing with OpenCSV library

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/clickhouse-flat-file-integration.git
   ```

2. Navigate to the project directory:
   ```
   cd clickhouse-flat-file-integration
   ```

3. Build the application:
   ```
   ./mvnw clean package
   ```

4. Run the application:
   ```
   java -jar target/clickhouse-flat-file-integration-1.0.0.jar
   ```

5. Access the application:
   ```
   http://localhost:8080
   ```

## Usage Guide

### ClickHouse to Flat File Export

1. Select "ClickHouse to Flat File" from the source dropdown
2. Enter ClickHouse connection details:
   - Host
   - Port
   - Database name
   - Username
   - JWT token
3. Click "Connect" to establish connection
4. Select the source table and specific columns to export
5. Configure flat file settings (filename, path, delimiter)
6. Click "Start Ingestion" to begin export
7. View the results showing total records exported

### Flat File to ClickHouse Import

1. Select "Flat File to ClickHouse" from the source dropdown
2. Upload your CSV file and specify delimiter
3. Enter ClickHouse connection details
4. Click "Connect" to establish connection
5. Map columns between flat file and ClickHouse table
6. Click "Start Ingestion" to begin import
7. View the results showing total records imported

## Optional Features

- **Progress Bar**: Real-time visual indicator of ingestion progress
- **Data Preview**: View sample data (first 100 rows) before proceeding with ingestion

## Error Handling

The application handles various error scenarios:
- Connection failures
- Authentication issues
- Schema mismatches
- Data validation errors

All errors are logged on the server-side and displayed to users with helpful resolution guidance.

## Testing

The application has been tested with datasets including:
- uk_price_paid
- ontime

Test scenarios validate:
- Data integrity during bidirectional transfers
- Error handling under various failure conditions
- Performance with batch processing

## Development

This project was developed with assistance from AI tools including ChatGPT, GitHub Copilot, and TabNine. All AI prompts used during development are documented in `prompts.txt` for transparency.

