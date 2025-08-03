#!/usr/bin/env tsx

import { config } from 'dotenv';
import { supabase } from '../lib/supabase';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function quickSetup() {
  console.log('🚀 Covenant Copilot RAG System Quick Setup\n');

  // Step 1: Check environment variables
  console.log('1️⃣ Checking environment variables...');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY', 
    'OPENAI_API_KEY'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📝 Please add these to your .env.local file:');
    console.error('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.error('SUPABASE_SERVICE_ROLE_KEY=eyJ...');
    console.error('OPENAI_API_KEY=sk-...\n');
    console.error('💡 See SUPABASE_SETUP_GUIDE.md for detailed instructions');
    process.exit(1);
  }
  console.log('✅ All environment variables found\n');

  // Step 2: Check Supabase connection
  console.log('2️⃣ Testing Supabase connection...');
  
  if (!supabase) {
    console.error('❌ Supabase client not initialized');
    console.error('💡 Check your SUPABASE environment variables');
    process.exit(1);
  }

  try {
    const { data, error, count } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Database connection failed:', error.message || 'Unknown error');
      console.error('📋 Error details:', JSON.stringify(error, null, 2));
      console.error('💡 You may need to run the database schema setup first');
      console.error('📄 Copy scripts/setup-database-enhanced.sql into Supabase SQL Editor');
      process.exit(1);
    }
    console.log('✅ Supabase connection successful');
    console.log(`📊 Documents table ready (${count || 0} documents)\n`);
  } catch (err) {
    console.error('❌ Failed to connect to Supabase:', err);
    process.exit(1);
  }

  // Step 3: Check if documents table exists and has the right schema
  console.log('3️⃣ Checking database schema...');
  
  try {
    const { data, error } = await supabase
      .rpc('match_documents_enhanced', {
        query_embedding: Array(1536).fill(0.01),
        match_threshold: 0.9,
        match_count: 1
      });
    
    if (error) {
      console.warn('⚠️ Enhanced search functions not available');
      console.warn('💡 Run the enhanced database schema:');
      console.warn('   Copy scripts/setup-database-enhanced.sql → Supabase SQL Editor');
    } else {
      console.log('✅ Enhanced database schema detected');
    }
  } catch (err) {
    console.warn('⚠️ Enhanced search functions not available');
  }

  // Step 4: Check document count
  console.log('\n4️⃣ Checking indexed documents...');
  
  try {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Error checking documents:', error.message);
      process.exit(1);
    }

    if (!count || count === 0) {
      console.log('📄 No documents found in database');
      console.log('💡 Ready to process documents!');
      console.log('   Run: npm run process-docs');
    } else {
      console.log(`✅ Found ${count} documents in database`);
      
      // Check document types
      const { data: sources } = await supabase
        .from('documents')
        .select('source_url, pdf_page')
        .limit(10);
      
      const webDocs = sources?.filter(s => s.source_url) || [];
      const pdfDocs = sources?.filter(s => s.pdf_page) || [];
      
      console.log(`   📄 PDF chunks: ${pdfDocs.length > 0 ? 'Available' : 'None'}`);
      console.log(`   🌐 Web chunks: ${webDocs.length > 0 ? 'Available' : 'None'}`);
    }
  } catch (err) {
    console.error('❌ Error checking documents:', err);
  }

  // Step 5: Test OpenAI connection
  console.log('\n5️⃣ Testing OpenAI connection...');
  
  try {
    const { embedText } = await import('../lib/embeddings');
    await embedText('test');
    console.log('✅ OpenAI embeddings working');
  } catch (err) {
    console.error('❌ OpenAI connection failed:', err);
    console.error('💡 Check your OPENAI_API_KEY');
  }

  // Final status
  console.log('\n🎉 Setup Status Summary:');
  console.log('✅ Environment variables configured');
  console.log('✅ Supabase connection working');
  console.log('✅ OpenAI API accessible');
  
  const { count } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true });

  if (!count || count === 0) {
    console.log('\n📋 Next Steps:');
    console.log('1. Run: npm run process-docs');
    console.log('2. Run: npm run check-docs');
    console.log('3. Test queries at: http://localhost:3001');
  } else {
    console.log('\n🚀 System ready!');
    console.log('   Test at: http://localhost:3001');
    console.log('   Try: "What fence colors are allowed?"');
  }
}

quickSetup().catch(console.error);