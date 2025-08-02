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

# Execute using psql with connection pooler
PGPASSWORD=3tts3ttEcd psql \
  "postgres://postgres.qimvwwfwakvgfvclqpue:3tts3ttEcd@aws-0-us-east-1.pooler.supabase.com:6543/postgres?options=reference%3Dqimvwwfwakvgfvclqpue" \
  -f "$sql_file"