# Covenant Copilot RAG Setup - Quick Start

## 🚀 **Fast Track Setup (15 minutes)**

### **Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com) → Sign up
2. Create new project: "covenant-copilot"  
3. Save the database password!
4. Wait 2-3 minutes for initialization

### **Step 2: Get Your Credentials**
In Supabase dashboard → Settings → API:
```bash
PROJECT_URL: https://xxxxx.supabase.co
SERVICE_ROLE_KEY: eyJ... (the "secret" key, not anon)
```

### **Step 3: Add Environment Variables**
Edit `.env.local` in your project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
OPENAI_API_KEY=sk-...your-existing-openai-key...
```

### **Step 4: Set Up Database Schema**
1. In Supabase dashboard → SQL Editor
2. Copy contents of `scripts/setup-database-enhanced.sql` 
3. Paste and run in SQL Editor

### **Step 5: Run Quick Setup Check**
```bash
npm run setup
```

Expected output:
```
✅ All environment variables found
✅ Supabase connection successful  
✅ Enhanced database schema detected
✅ OpenAI embeddings working
📋 Next Steps: Run npm run process-docs
```

### **Step 6: Process Documents**
```bash
# Index HRCA documents and web content:
npm run process-docs

# Expected: "Successfully stored documents"
```

### **Step 7: Verify Setup**
```bash
# Check everything is working:
npm run check-docs

# Expected: "Total documents indexed: 800+"
```

### **Step 8: Test Live System**
```bash
npm run dev
# Go to: http://localhost:3001
# Ask: "What fence colors are allowed?"
# Should get: Real sources, no 404 links!
```

## **🔧 Troubleshooting**

**"Supabase not configured"**
- Check `.env.local` has correct SUPABASE variables
- Restart: `npm run dev`

**"Enhanced search functions not available"**  
- Run `scripts/setup-database-enhanced.sql` in Supabase SQL Editor

**"No documents found"**
- Run: `npm run process-docs`
- Check: `npm run check-docs`

**"OpenAI connection failed"**
- Verify `OPENAI_API_KEY` in `.env.local`
- Check OpenAI account has credits

## **✅ Success = Real Sources!**

When working correctly:
- Terminal shows: "Found 5 relevant documents" 
- Responses include real HRCA sources
- Links go to actual HRCA pages/PDFs
- No more 404 errors!

**Total setup time: ~15 minutes**