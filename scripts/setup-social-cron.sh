#!/bin/bash

# Setup Social Media Monitoring Cron Job
# This script sets up a cron job to run social media monitoring every hour

PROJECT_DIR="/Users/arnaudgrunwald/AGcodework/analyst-portal"
LOG_DIR="$PROJECT_DIR/logs"
CRON_LOG="$LOG_DIR/social-cron.log"
CRON_ERROR_LOG="$LOG_DIR/social-cron-error.log"

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Create the cron job entry
# Runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
CRON_JOB="0 * * * * cd $PROJECT_DIR && npm run social:hourly >> $CRON_LOG 2>> $CRON_ERROR_LOG"

echo "Setting up social media monitoring cron job..."
echo "Project directory: $PROJECT_DIR"
echo "Logs directory: $LOG_DIR"
echo "Cron job: $CRON_JOB"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -F "npm run social:hourly" > /dev/null; then
    echo "⚠️  Social media cron job already exists!"
    echo "Current crontab:"
    crontab -l | grep "social:hourly"
    
    read -p "Do you want to replace it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Keeping existing cron job."
        exit 0
    fi
    
    # Remove existing social media cron jobs
    crontab -l | grep -v "social:hourly" | crontab -
    echo "Removed existing social media cron job."
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Social media monitoring cron job added successfully!"
    echo "   - Runs every hour at minute 0"
    echo "   - Logs to: $CRON_LOG"
    echo "   - Error logs to: $CRON_ERROR_LOG"
    echo ""
    echo "📋 Current cron jobs:"
    crontab -l
    echo ""
    echo "🔍 You can monitor the cron job with:"
    echo "   tail -f $CRON_LOG"
    echo "   tail -f $CRON_ERROR_LOG"
    echo ""
    echo "⚠️  Make sure to configure TWITTER_BEARER_TOKEN and LINKEDIN_ACCESS_TOKEN in .env"
else
    echo "❌ Failed to add cron job!"
    exit 1
fi
