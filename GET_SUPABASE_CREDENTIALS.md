# Get Real Supabase Credentials

## 🎯 **You Need Real Supabase Credentials**

Your current credentials look like sample/demo keys. Here's how to get real ones:

### **Step 1: Create Supabase Account**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up with GitHub (recommended)

### **Step 2: Create New Project**
1. Click "New Project"
2. **Name**: `covenant-copilot`
3. **Database Password**: Generate a strong password (save it!)
4. **Region**: Choose closest to you (US East, US West, etc.)
5. Click "Create new project"
6. **Wait 2-3 minutes** for initialization

### **Step 3: Get Your Real Credentials**
1. In Supabase dashboard → **Settings** → **API**
2. Copy these values:

```bash
# Project URL (under "Project Configuration")
NEXT_PUBLIC_SUPABASE_URL=https://your-unique-id.supabase.co

# Service Role Key (under "Project API keys" - the "secret" one)
SUPABASE_SERVICE_ROLE_KEY=eyJ...very-long-key...
```

### **Step 4: Update Your .env.local**
Replace the current demo keys with your real ones:

```bash
# Edit the file:
code .env.local
# or
nano .env.local

# Replace with your real credentials:
OPENAI_API_KEY=sk-...your-actual-openai-key...
NEXT_PUBLIC_SUPABASE_URL=https://your-real-project-id.supabase.co  
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-real-service-role-key...
```

### **Step 5: Test Connection**
```bash
npm run setup
```

**Expected output:**
```
✅ All environment variables found
✅ Supabase connection successful  
📄 No documents found in database
💡 Ready to process documents! Run: npm run process-docs
```

### **Step 6: Set Up Database Schema**
1. In Supabase dashboard → **SQL Editor**
2. Copy contents of `scripts/setup-database-enhanced.sql`
3. Paste and run in SQL Editor

### **Step 7: Process Documents**
```bash
npm run process-docs
```

Then you'll have a fully working RAG system with real sources instead of 404 links!

## **🚨 Important Notes**

- **Service Role Key**: Use the "secret" key, not the "anon public" key
- **Save Password**: You'll need the database password for advanced features
- **Keep Keys Secret**: Don't commit real keys to version control

**Time needed**: ~10 minutes to create account and get credentials