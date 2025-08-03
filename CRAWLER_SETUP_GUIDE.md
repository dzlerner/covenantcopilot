# 🕷️ Comprehensive Web Crawler Setup Guide

This guide will help you set up the comprehensive web crawler that crawls the entire hrcaonline.org website daily and keeps your knowledge base up-to-date.

## 🎯 What This Does

The comprehensive crawler:
- **Discovers all pages** on hrcaonline.org automatically (follows internal links)
- **Extracts and stores** all page content with embeddings for semantic search
- **Categorizes links** as internal, external, email, phone, or file links
- **Respects rate limits** (2-second delay between requests)
- **Runs daily** via cron job to keep content fresh
- **Provides monitoring** and status reporting
- **Handles failures** gracefully with retry logic

## 📋 Setup Steps

### Step 1: Database Schema Setup

Run the enhanced database schema in Supabase SQL Editor:

```bash
npm run setup-crawler-db
```

Copy the output and paste it into Supabase **SQL Editor** → **New Query** → **RUN**

### Step 2: Test Manual Crawl

Before setting up the cron job, test the crawler manually:

```bash
# Test comprehensive crawl
npm run crawl-comprehensive

# Check crawl status
npm run crawl-status
```

**Expected output:**
```
🚀 Starting HRCA Comprehensive Crawler
📊 Crawl session started: [session-id]
🗺️ Found [X] URLs in sitemap
🎯 Starting with [X] seed URLs
📄 Processing 1/500: https://hrcaonline.org/
✅ Successfully processed: https://hrcaonline.org/
...
🎉 Comprehensive crawl completed!
📊 Final Stats:
   • Total Processed: 156
   • Successful: 152
   • Failed: 4
   • Internal Links: 1,247
   • External Links: 89
```

### Step 3: Set Up Daily Cron Job

```bash
npm run setup-crawler
```

This will:
- Create a daily cron job that runs at 2:00 AM
- Set up logging to `logs/crawl-YYYY-MM-DD.log`
- Create automatic cleanup of old logs (30 days)

**Cron job details:**
- **Schedule**: Daily at 2:00 AM
- **Command**: `npm run crawl-comprehensive`
- **Logs**: Saved to `logs/` directory
- **Cleanup**: Old logs auto-deleted after 30 days

### Step 4: Monitor Crawl Activity

```bash
# Check overall status
npm run crawl-status

# View today's log
tail -f logs/crawl-$(date +%Y-%m-%d).log

# View all cron jobs
crontab -l
```

## 📊 Features

### Comprehensive Discovery
- **Sitemap parsing**: Automatically finds sitemap.xml
- **Link following**: Follows all internal links recursively  
- **Smart exclusions**: Skips admin pages, search results, media files
- **File type filtering**: Only processes HTML/text content

### Respectful Crawling
- **Rate limiting**: 2-second delay between requests
- **Robots.txt compliance**: Respects crawl policies (configurable)
- **Session limits**: Max 500 pages per session (configurable)
- **User-Agent**: Identifies as "CovenantCopilot/1.0"

### Link Management
- **Internal links**: hrcaonline.org pages → processed and indexed
- **External links**: Other websites → catalogued but not crawled
- **Email/Phone**: Contact info → extracted and stored
- **File links**: PDFs, docs → catalogued for reference

### Content Processing
- **Text extraction**: Removes navigation, ads, scripts
- **Chunking**: Breaks content into 1000-char chunks with 200-char overlap
- **Embeddings**: Generates vector embeddings for semantic search
- **Deduplication**: Uses content hashing to avoid duplicates

### Monitoring & Analytics
- **Session tracking**: Each crawl session logged with full stats
- **Link analytics**: Track internal vs external link discovery
- **Failure tracking**: Log and retry failed URLs
- **Performance metrics**: Pages/minute, success rates, error patterns

## 🔧 Configuration

### Crawler Settings
Edit `scripts/comprehensive-crawler.ts` to modify:

```typescript
this.config = {
  domain: 'hrcaonline.org',
  crawlDelay: 2000,           // Milliseconds between requests
  maxPagesPerSession: 500,    // Max pages per crawl session
  respectRobots: true,        // Follow robots.txt
  allowedFileTypes: ['.html', '.htm', '.php'], // Process these
  excludePatterns: [          // Skip URLs matching these
    /\/admin\//i,
    /\/search\?/i,
    /\.pdf$/i
  ]
};
```

### Cron Schedule
To change the crawl schedule, edit the cron job:

```bash
crontab -e
```

Current: `0 2 * * *` (2:00 AM daily)
- Hourly: `0 * * * *`  
- Twice daily: `0 2,14 * * *` (2 AM and 2 PM)
- Weekly: `0 2 * * 0` (2 AM Sundays)

## 📈 Status & Monitoring

### View Crawl Status
```bash
npm run crawl-status
```

**Example output:**
```
📊 Covenant Copilot - Crawl Status Report
==========================================

🕐 Latest Crawl Session:
   ID: 550e8400-e29b-41d4-a716-446655440000
   Started: 12/13/2024, 2:00:00 AM
   Completed: 12/13/2024, 2:15:32 AM
   Duration: 16 minutes
   Status: completed
   Pages Discovered: 234
   Pages Processed: 187
   Successful: 182
   Failed: 5
   Internal Links: 1,456
   External Links: 123

📈 Overall Statistics:
   Total Documents: 2,847
   Total Links Discovered: 1,579
   Pending Links: 47
   Internal Links: 1,456
   External Links: 123

🔍 Database Health:
   Oldest Document: 12/1/2024
   Newest Document: 12/13/2024
   ✅ Content is fresh (3 hours since last update)
```

### View Logs
```bash
# Today's crawl log
tail -f logs/crawl-$(date +%Y-%m-%d).log

# Yesterday's log
cat logs/crawl-$(date -d yesterday +%Y-%m-%d).log

# All recent logs
ls -la logs/
```

### Troubleshooting

**If crawl fails:**
1. Check logs: `tail logs/crawl-$(date +%Y-%m-%d).log`
2. Test manually: `npm run crawl-comprehensive`
3. Check Supabase connection: `npm run setup`
4. Verify cron job: `crontab -l`

**Common issues:**
- **Network timeouts**: Website may be slow/down
- **Rate limiting**: Increase `crawlDelay` in config
- **Memory issues**: Reduce `maxPagesPerSession`
- **Permission errors**: Check file permissions on logs directory

## 🎛️ Advanced Usage

### Manual Crawl with Custom Settings
```bash
# Run crawler directly with Node
node -e "
const { ComprehensiveCrawler } = require('./scripts/comprehensive-crawler.ts');
const crawler = new ComprehensiveCrawler('hrcaonline.org');
crawler.runComprehensiveCrawl();
"
```

### Database Queries
```sql
-- See all discovered links
SELECT url, link_type, crawl_status FROM discovered_links 
ORDER BY discovered_at DESC LIMIT 20;

-- Check external domains
SELECT * FROM get_top_external_domains(10);

-- Recent crawl sessions
SELECT * FROM crawl_sessions 
ORDER BY started_at DESC LIMIT 5;

-- Failed URLs needing attention
SELECT url, error_message FROM discovered_links 
WHERE crawl_status = 'failed' 
ORDER BY last_crawl_attempt DESC;
```

### Remove Cron Job
```bash
# List current cron jobs
crontab -l

# Remove the crawler cron job
crontab -l | grep -v "run-daily-crawl.sh" | crontab -
```

## 🚀 Next Steps

Once your crawler is running:

1. **Monitor for first few days** to ensure stable operation
2. **Check crawl-status weekly** to verify content freshness  
3. **Review failed URLs** and update exclusion patterns if needed
4. **Test the chatbot** to see improved, comprehensive answers with real citations
5. **Consider notifications** - uncomment webhook/email sections in cron script

The crawler will now automatically keep your HRCA knowledge base comprehensive and up-to-date! 🎉