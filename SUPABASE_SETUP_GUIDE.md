# Complete Supabase + RAG Setup Guide

## 🎯 **Goal**
Set up the full knowledge base so Covenant Copilot can provide accurate responses with real sources instead of 404 links.

## **Step 1: Create Supabase Account & Project**

### **1.1 Sign Up for Supabase**
```bash
# Go to: https://supabase.com
# Click "Start your project"
# Sign up with GitHub (recommended) or email
```

### **1.2 Create New Project**
```bash
# In Supabase dashboard:
# - Click "New Project"
# - Organization: Choose your personal org
# - Name: "covenant-copilot" 
# - Database Password: Generate strong password (save this!)
# - Region: Choose closest to you (US East, US West, etc.)
# - Click "Create new project"

# ⏱️ Wait 2-3 minutes for project to initialize
```

### **1.3 Get Your Credentials**
```bash
# In your Supabase project dashboard:
# 1. Go to Settings → API
# 2. Copy these values:

PROJECT_URL=https://your-project-ref.supabase.co
ANON_PUBLIC_KEY=eyJ... (long string starting with eyJ)
SERVICE_ROLE_KEY=eyJ... (different long string, marked as "secret")
```

## **Step 2: Configure Environment Variables**

### **2.1 Update .env.local**
```bash
# In your project root, edit .env.local:
cd /Users/david.lerner/covenantcopilot

# Add these variables:
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
OPENAI_API_KEY=sk-...your-openai-key...
```

### **2.2 Verify Environment Setup**
```bash
# Test that variables are loaded:
npm run dev

# Look for: "- Environments: .env.local" ✅
# Should NOT see: "Supabase not configured" ❌
```

## **Step 3: Set Up Database Schema**

### **3.1 Enable pgvector Extension**
```sql
-- In Supabase dashboard:
-- Go to SQL Editor → New Query
-- Run this command:

CREATE EXTENSION IF NOT EXISTS vector;
```

### **3.2 Create Enhanced Database Schema**
```bash
# Run the enhanced database setup:
# Copy the contents of scripts/setup-database-enhanced.sql
# Paste into Supabase SQL Editor and execute

# OR connect via psql:
psql -h db.your-project-ref.supabase.co -U postgres -d postgres
# Paste the schema commands
```

### **3.3 Verify Database Setup**
```sql
-- Check that table exists:
SELECT COUNT(*) FROM documents;

-- Check that functions exist:
SELECT proname FROM pg_proc WHERE proname LIKE 'match_documents%';

-- Should see:
-- match_documents
-- match_documents_enhanced  
-- detect_rule_conflicts
```

## **Step 4: Prepare Documents for Processing**

### **4.1 Add HRCA PDF (if you have it)**
```bash
# If you have the Residential Improvement Guidelines PDF:
mkdir -p public/documents
# Copy PDF to: public/documents/ResidentialImprovementGuidelines.pdf
```

### **4.2 Configure Web URLs**
```typescript
// The system will crawl these HRCA URLs:
const urls = [
  "https://hrcaonline.org/Property-Owners/Residential/Covenants-Improvements",
  "https://hrcaonline.org/Property-Owners/Architectural-Review", 
  "https://hrcaonline.org/Property-Owners/Forms"
];
```

## **Step 5: Process and Index Documents**

### **5.1 Run Document Processing**
```bash
# Process PDFs and web pages, generate embeddings, store in Supabase:
npm run process-docs

# Expected output:
# ✅ "Loading PDF from: public/documents/..."
# ✅ "Found X structured sections"  
# ✅ "Processing web pages..."
# ✅ "Generating embeddings..."
# ✅ "Successfully stored documents"
```

### **5.2 Verify Documents Were Indexed**
```bash
# Check database status:
npm run check-database

# Expected output:
# ✅ "Database connected successfully"
# ✅ "Total documents indexed: 800-1000"
# ✅ "Web sources: 3 URLs with X chunks each"
# ✅ "PDF: X chunks across Y pages"
# ✅ "Vector search returned results"
```

## **Step 6: Test the Full RAG System**

### **6.1 Start Development Server**
```bash
npm run dev
# Should see: "Ready in Xms" without "Supabase not configured"
```

### **6.2 Test Knowledge Base Queries**
```bash
# Go to: http://localhost:3001
# Try these test queries:

1. "What fence colors are allowed?"
   Expected: Real sources from HRCA documents
   
2. "Do I need approval to build a shed?"
   Expected: Specific size requirements with page references
   
3. "When can I put up Christmas lights?"
   Expected: Actual dates from HRCA guidelines
```

### **6.3 Verify Real Sources**
```bash
# In browser developer tools:
# - Open Network tab
# - Ask a question  
# - Check POST to /api/ask
# - Response should show:
#   "sources_found": 3-5 (not 0)
#   "sources": [...] with real URLs and page numbers
```

## **Step 7: Advanced Configuration (Optional)**

### **7.1 Tune Search Parameters**
```typescript
// In lib/vector-search.ts, adjust:
matchThreshold: 0.78,  // Lower = more results (0.7-0.8)
matchCount: 5,         // Number of sources (3-8)
```

### **7.2 Add More Content Sources**
```typescript
// In scripts/run-document-processing.ts:
const additionalUrls = [
  "https://hrcaonline.org/additional-page-1",
  "https://hrcaonline.org/additional-page-2"
];
```

### **7.3 Monitor Performance**
```bash
# Watch for these in terminal:
✅ "Found X relevant documents" (should be > 0)
✅ "Enhanced search available" 
✅ "CONFLICT DETECTED" (for complex queries)
❌ "Supabase not configured" (should never see this)
```

## **🔍 Troubleshooting**

### **Common Issues:**

**"Supabase not configured"**
```bash
# Check .env.local has correct variables:
cat .env.local | grep SUPABASE

# Restart dev server:
npm run dev
```

**"No documents found"**
```bash
# Verify database has content:
npm run check-database

# Re-run processing if needed:
npm run process-docs
```

**"Authentication failed"**
```bash
# Verify SERVICE_ROLE_KEY (not ANON key) in .env.local
# Check Supabase dashboard → Settings → API
```

**"OpenAI API errors"**
```bash
# Verify OPENAI_API_KEY in .env.local
# Check OpenAI account has credits
```

## **✅ Success Indicators**

When everything is working correctly, you should see:

1. **Terminal Logs:**
   ```
   ✅ Found 5 relevant documents
   ✅ Enhanced search available
   ✅ Vector search returned results
   ```

2. **Chat Responses:**
   ```json
   {
     "sources": [
       {
         "label": "HRCA Guidelines Section 4.3 - Fence Standards",
         "url": "https://real-hrca-url.com/guidelines.pdf"
       }
     ]
   }
   ```

3. **Clickable Sources:**
   - Links go to real HRCA pages/documents
   - No more 404 errors
   - Specific page/section references

The system will then provide accurate, source-backed responses instead of hallucinated information with fake links!