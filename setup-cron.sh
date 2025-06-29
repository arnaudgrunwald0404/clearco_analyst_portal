#!/bin/bash

# Publication Discovery Cron Job Setup Script
# This script sets up a daily cron job to run the publication discovery

set -e

echo "🔧 Setting up daily publication discovery cron job..."

# Get the current directory (project root)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Project directory: $PROJECT_DIR"

# Create a wrapper script for the cron job
WRAPPER_SCRIPT="$PROJECT_DIR/cron-publication-discovery.sh"

echo "📝 Creating wrapper script at: $WRAPPER_SCRIPT"

cat > "$WRAPPER_SCRIPT" << EOF
#!/bin/bash

# Cron job wrapper for publication discovery
# This script is called by cron to run the daily publication discovery

# Set proper environment
export PATH="/usr/local/bin:/usr/bin:/bin"
export NODE_ENV="production"

# Change to project directory
cd "$PROJECT_DIR"

# Source environment variables if .env exists
if [ -f ".env" ]; then
    export \$(cat .env | grep -v '^#' | xargs)
fi

# Log file for cron output
LOG_FILE="$PROJECT_DIR/logs/publication-discovery.log"

# Create logs directory if it doesn't exist
mkdir -p "\$(dirname "\$LOG_FILE")"

# Run the publication discovery script and log output
echo "[\$(date)] Starting publication discovery cron job" >> "\$LOG_FILE"

npm run discover:daily >> "\$LOG_FILE" 2>&1

EXIT_CODE=\$?

if [ \$EXIT_CODE -eq 0 ]; then
    echo "[\$(date)] Publication discovery completed successfully" >> "\$LOG_FILE"
else
    echo "[\$(date)] Publication discovery failed with exit code \$EXIT_CODE" >> "\$LOG_FILE"
fi

echo "[\$(date)] ----------------------------------------" >> "\$LOG_FILE"
EOF

# Make the wrapper script executable
chmod +x "$WRAPPER_SCRIPT"

echo "✅ Wrapper script created and made executable"

# Create logs directory
mkdir -p "$PROJECT_DIR/logs"

# Set up the cron job
echo "🕐 Setting up cron job (runs daily at 2:00 AM)..."

# Create a temporary cron file
TEMP_CRON=$(mktemp)

# Get existing cron jobs (if any)
crontab -l 2>/dev/null > "$TEMP_CRON" || true

# Check if our cron job already exists
if grep -q "publication-discovery" "$TEMP_CRON"; then
    echo "⚠️  Cron job already exists. Removing old entry..."
    grep -v "publication-discovery" "$TEMP_CRON" > "$TEMP_CRON.new"
    mv "$TEMP_CRON.new" "$TEMP_CRON"
fi

# Add our cron job (runs daily at 2:00 AM)
echo "# Daily publication discovery for Analyst Portal" >> "$TEMP_CRON"
echo "0 2 * * * $WRAPPER_SCRIPT # publication-discovery" >> "$TEMP_CRON"

# Install the new cron tab
crontab "$TEMP_CRON"

# Clean up
rm "$TEMP_CRON"

echo "✅ Cron job installed successfully!"

# Display the installed cron job
echo ""
echo "📋 Current cron jobs:"
crontab -l | grep -A1 -B1 "publication-discovery" || echo "No cron jobs found"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📌 Summary:"
echo "   • Wrapper script: $WRAPPER_SCRIPT"
echo "   • Log file: $PROJECT_DIR/logs/publication-discovery.log"
echo "   • Schedule: Daily at 2:00 AM"
echo ""
echo "🔍 To manually test the cron job:"
echo "   $WRAPPER_SCRIPT"
echo ""
echo "📊 To view logs:"
echo "   tail -f $PROJECT_DIR/logs/publication-discovery.log"
echo ""
echo "⚙️ To modify the schedule:"
echo "   crontab -e"
echo ""
echo "🗑️ To remove the cron job:"
echo "   crontab -l | grep -v 'publication-discovery' | crontab -"
EOF
