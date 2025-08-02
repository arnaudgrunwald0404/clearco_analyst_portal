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
  'https://qimvwwfwakvgfvclqpue.supabase.co/rest/v1/rpc/run_sql' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXZ3d2Z3YWt2Z2Z2Y2xxcHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwNDk4NiwiZXhwIjoyMDY2NTgwOTg2fQ.oAecaBcP5Bbkyl8ObKXugnvcCzqUWfVjry4cRAr_kNg' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXZ3d2Z3YWt2Z2Z2Y2xxcHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwNDk4NiwiZXhwIjoyMDY2NTgwOTg2fQ.oAecaBcP5Bbkyl8ObKXugnvcCzqUWfVjry4cRAr_kNg' \
  -H 'Content-Type: application/json' \
  -d "{\"sql\":\"$sql_content\"}"