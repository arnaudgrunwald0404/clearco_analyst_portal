#!/bin/bash

# Check if a file is provided
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <sql_file>"
    exit 1
fi

# Get the SQL file
sql_file="$1"

# Check if file exists
if [ ! -f "$sql_file" ]; then
    echo "Error: File $sql_file does not exist"
    exit 1
fi

# Read and properly escape the SQL content
sql_content=$(cat "$sql_file" | sed 's/"/\\"/g' | tr '\n' ' ')

# Make the API call
curl -X POST \
  'https://api.supabase.com/v1/projects/qimvwwfwakvgfvclqpue/sql' \
  -H 'Authorization: Bearer sbp_c4f1f0a6c3c0a2c9c0a2c9c0a2c9c0a2c9c0a2c9' \
  -H 'Content-Type: application/json' \
  --data-raw "{\"query\":\"$sql_content\"}"