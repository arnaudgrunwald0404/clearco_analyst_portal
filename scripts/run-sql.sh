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

# Execute using psql
PGPASSWORD=3tts3ttEcd psql \
  -h db.qimvwwfwakvgfvclqpue.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f "$sql_file"