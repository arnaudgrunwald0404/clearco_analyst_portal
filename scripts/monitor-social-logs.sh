#!/bin/bash

# Monitor Social Media Cron Job Logs
# This script helps monitor the hourly social media monitoring cron job

PROJECT_DIR="/Users/arnaudgrunwald/AGcodework/analyst-portal"
LOG_DIR="$PROJECT_DIR/logs"
CRON_LOG="$LOG_DIR/social-cron.log"
CRON_ERROR_LOG="$LOG_DIR/social-cron-error.log"

echo "📊 Social Media Monitoring Dashboard"
echo "=================================="
echo "Project: $PROJECT_DIR"
echo "Time: $(date)"
echo ""

# Check if logs directory exists
if [ ! -d "$LOG_DIR" ]; then
    echo "❌ Logs directory not found: $LOG_DIR"
    echo "The cron job may not have run yet or logs are being written elsewhere."
    exit 1
fi

# Check cron job status
echo "🔍 Cron Job Status:"
echo "------------------"
if crontab -l 2>/dev/null | grep -q "social:hourly"; then
    echo "✅ Social media cron job is active"
    crontab -l | grep "social:hourly"
else
    echo "❌ No social media cron job found"
    echo "Run ./scripts/setup-social-cron.sh to set it up"
fi

echo ""

# Display recent monitoring statistics from database
echo "📈 Recent Monitoring Statistics:"
echo "-------------------------------"
if [ -f "$PROJECT_DIR/prisma/dev.db" ]; then
    echo "Last 5 monitoring runs:"
    sqlite3 "$PROJECT_DIR/prisma/dev.db" "
        SELECT 
            datetime(timestamp, 'localtime') as local_time,
            type,
            analysts_checked,
            posts_found,
            posts_stored,
            new_mentions,
            high_relevance_posts,
            error_count
        FROM monitoring_stats 
        ORDER BY timestamp DESC 
        LIMIT 5;
    " -header -column
else
    echo "❌ Database not found: $PROJECT_DIR/prisma/dev.db"
fi

echo ""

# Show log file information
echo "📝 Log Files:"
echo "------------"
if [ -f "$CRON_LOG" ]; then
    echo "✅ Main log: $CRON_LOG"
    echo "   Size: $(du -h "$CRON_LOG" | cut -f1)"
    echo "   Last modified: $(stat -f "%Sm" "$CRON_LOG")"
    echo ""
    echo "Last 10 lines from main log:"
    tail -10 "$CRON_LOG"
else
    echo "⚠️  Main log file not found: $CRON_LOG"
fi

echo ""

if [ -f "$CRON_ERROR_LOG" ]; then
    echo "⚠️  Error log: $CRON_ERROR_LOG"
    echo "   Size: $(du -h "$CRON_ERROR_LOG" | cut -f1)"
    echo "   Last modified: $(stat -f "%Sm" "$CRON_ERROR_LOG")"
    
    if [ -s "$CRON_ERROR_LOG" ]; then
        echo ""
        echo "Recent errors:"
        tail -10 "$CRON_ERROR_LOG"
    else
        echo "   (No errors - file is empty ✅)"
    fi
else
    echo "✅ No error log file (no errors yet)"
fi

echo ""

# Show available monitoring commands
echo "🛠️  Available Commands:"
echo "----------------------"
echo "  Monitor logs live:     tail -f $CRON_LOG"
echo "  Monitor errors live:   tail -f $CRON_ERROR_LOG"
echo "  Run manually:          cd $PROJECT_DIR && npm run social:hourly"
echo "  View cron jobs:        crontab -l"
echo "  Remove cron job:       crontab -l | grep -v 'social:hourly' | crontab -"
echo ""

# Option to tail logs
read -p "Would you like to tail the logs live? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📊 Tailing logs live (Ctrl+C to exit)..."
    echo "========================================"
    if [ -f "$CRON_LOG" ]; then
        tail -f "$CRON_LOG"
    else
        echo "❌ Log file not found. Waiting for cron job to create it..."
        touch "$CRON_LOG"
        tail -f "$CRON_LOG"
    fi
fi
