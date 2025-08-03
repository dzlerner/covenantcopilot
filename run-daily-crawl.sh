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
