#!/usr/bin/env tsx

import { supabase } from '../lib/supabase';

async function checkDatabase() {
  try {
    if (!supabase) {
      console.error('❌ Supabase not configured. Check your environment variables.');
      return;
    }

    console.log('🔍 Checking database connection...');
    
    // Test connection
    const { data: healthCheck, error: connectionError } = await supabase
      .from('documents')
      .select('count(*)', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError.message);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Check document count
    const { count, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting documents:', countError.message);
      return;
    }
    
    console.log(`📄 Total documents indexed: ${count || 0}`);
    
    if (count && count > 0) {
      // Check sources
      const { data: webSources, error: webError } = await supabase
        .from('documents')
        .select('source_url')
        .not('source_url', 'is', null);
      
      const { data: pdfSources, error: pdfError } = await supabase
        .from('documents')
        .select('pdf_page')
        .not('pdf_page', 'is', null);
      
      if (webError || pdfError) {
        console.error('❌ Error fetching sources:', webError?.message || pdfError?.message);
        return;
      }
      
      console.log('\n📊 Document sources:');
      
      // Count unique web sources
      const uniqueWebSources = [...new Set(webSources?.map(s => s.source_url) || [])];
      uniqueWebSources.forEach(url => {
        const count = webSources?.filter(s => s.source_url === url).length || 0;
        console.log(`  🌐 ${url}: ${count} chunks`);
      });
      
      // Count PDF pages
      const uniquePdfPages = [...new Set(pdfSources?.map(s => s.pdf_page) || [])];
      if (uniquePdfPages.length > 0) {
        console.log(`  📋 PDF: ${pdfSources?.length || 0} chunks across ${uniquePdfPages.length} pages`);
      }
      
      // Test vector search
      console.log('\n🔍 Testing vector search...');
      const { data: searchTest, error: searchError } = await supabase
        .rpc('match_documents', {
          query_embedding: Array(1536).fill(0.001), // dummy embedding
          match_threshold: 0.1,
          match_count: 3
        });
      
      if (searchError) {
        console.error('❌ Vector search test failed:', searchError.message);
      } else {
        console.log(`✅ Vector search working (found ${searchTest?.length || 0} results)`);
      }
    } else {
      console.log('\n⚠️  No documents found. Run "npm run process-docs" to index documents.');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkDatabase()
  .then(() => {
    console.log('\n✅ Database check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database check failed:', error);
    process.exit(1);
  });