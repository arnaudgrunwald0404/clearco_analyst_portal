#!/bin/bash

# Cron job wrapper for publication discovery
# This script is called by cron to run the daily publication discovery

# Set proper environment
export PATH="/usr/local/bin:/usr/bin:/bin"
export NODE_ENV="production"

# Change to project directory
cd "/Users/arnaudgrunwald/AGcodework/analyst-portal"

# Source environment variables if .env exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Log file for cron output
LOG_FILE="/Users/arnaudgrunwald/AGcodework/analyst-portal/logs/publication-discovery.log"

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

# Run the publication discovery script and log output
echo "[$(date)] Starting publication discovery cron job" >> "$LOG_FILE"

npm run discover:daily >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Publication discovery completed successfully" >> "$LOG_FILE"
else
    echo "[$(date)] Publication discovery failed with exit code $EXIT_CODE" >> "$LOG_FILE"
fi

echo "[$(date)] ----------------------------------------" >> "$LOG_FILE"
