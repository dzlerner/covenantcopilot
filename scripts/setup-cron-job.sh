#!/bin/bash

# Setup daily cron job for comprehensive crawling
# This script sets up a cron job that runs the crawler daily at 2 AM

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CRON_LOG_DIR="$PROJECT_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$CRON_LOG_DIR"

# Create the cron script
CRON_SCRIPT="$PROJECT_DIR/run-daily-crawl.sh"

cat > "$CRON_SCRIPT" << 'EOF'
#!/bin/bash

# Daily crawler execution script
# This script is called by cron to run the comprehensive crawler

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Setup environment
export NODE_ENV=production
export PATH="/usr/local/bin:/usr/bin:/bin:$PATH"

# Log file with timestamp
LOG_FILE="logs/crawl-$(date +%Y-%m-%d).log"

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') $1" >> "$LOG_FILE"
}

log "🚀 Starting daily comprehensive crawl"

# Run the crawler
if npm run crawl-comprehensive >> "$LOG_FILE" 2>&1; then
    log "✅ Comprehensive crawl completed successfully"
    
    # Optional: Send success notification
    # curl -X POST "https://your-webhook-url.com/crawl-success" \
    #      -H "Content-Type: application/json" \
    #      -d '{"status": "success", "timestamp": "'$(date -Iseconds)'"}'
    
else
    log "❌ Comprehensive crawl failed"
    
    # Optional: Send failure notification
    # curl -X POST "https://your-webhook-url.com/crawl-failure" \
    #      -H "Content-Type: application/json" \
    #      -d '{"status": "failure", "timestamp": "'$(date -Iseconds)'"}'
    
    # Optional: Send email notification
    # echo "Covenant Copilot crawler failed on $(date)" | mail -s "Crawler Failure Alert" admin@example.com
fi

# Clean up old log files (keep last 30 days)
find logs/ -name "crawl-*.log" -mtime +30 -delete 2>/dev/null || true

log "📊 Daily crawl job completed"
EOF

# Make the cron script executable
chmod +x "$CRON_SCRIPT"

# Create the cron job entry
CRON_ENTRY="0 2 * * * $CRON_SCRIPT"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "$CRON_SCRIPT"; then
    echo "⚠️ Cron job already exists for this script"
    echo "Current cron jobs:"
    crontab -l | grep "$CRON_SCRIPT"
else
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY") | crontab -
    echo "✅ Cron job added successfully!"
    echo "📅 The crawler will run daily at 2:00 AM"
    echo "📝 Logs will be saved to: $CRON_LOG_DIR/crawl-YYYY-MM-DD.log"
fi

echo ""
echo "🔧 Cron job setup complete!"
echo ""
echo "To manage the cron job:"
echo "  View all cron jobs:     crontab -l"
echo "  Edit cron jobs:         crontab -e"
echo "  Remove this cron job:   crontab -l | grep -v '$CRON_SCRIPT' | crontab -"
echo ""
echo "To test the crawler manually:"
echo "  npm run crawl-comprehensive"
echo ""
echo "To view crawl logs:"
echo "  tail -f logs/crawl-\$(date +%Y-%m-%d).log"
echo ""
echo "To check crawl status:"
echo "  npm run crawl-status"