// Test script to verify database search functions work
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function testSearchFunctions() {
  console.log('🧪 Testing Database Search Functions...\n');

  try {
    // Test 1: Get a sample embedding to search with
    console.log('📋 Step 1: Getting sample document for testing...');
    const { data: sampleDoc } = await supabase
      .from('documents')
      .select('id, content, embedding')
      .limit(1)
      .single();

    if (!sampleDoc) {
      console.log('❌ No documents found in database');
      return;
    }

    console.log(`✅ Sample document found: ${sampleDoc.content.substring(0, 100)}...`);

    // Test 2: Test basic match_documents function
    console.log('\n📋 Step 2: Testing basic match_documents function...');
    const { data: basicResults, error: basicError } = await supabase.rpc('match_documents', {
      query_embedding: sampleDoc.embedding,
      match_threshold: 0.1,
      match_count: 3
    });

    if (basicError) {
      console.log('❌ Basic search failed:', basicError.message);
      return;
    }

    console.log(`✅ Basic search works! Found ${basicResults.length} results`);
    console.log(`   Sample result: ${basicResults[0]?.content?.substring(0, 80)}...`);

    // Test 3: Test enhanced match_documents_enhanced function
    console.log('\n📋 Step 3: Testing enhanced match_documents_enhanced function...');
    const { data: enhancedResults, error: enhancedError } = await supabase.rpc('match_documents_enhanced', {
      query_embedding: sampleDoc.embedding,
      match_threshold: 0.1,
      match_count: 3,
      boost_tags: [],
      require_tags: []
    });

    if (enhancedError) {
      console.log('❌ Enhanced search failed:', enhancedError.message);
      return;
    }

    console.log(`✅ Enhanced search works! Found ${enhancedResults.length} results`);
    console.log(`   Sample result: ${enhancedResults[0]?.content?.substring(0, 80)}...`);
    console.log(`   Similarity score: ${enhancedResults[0]?.similarity?.toFixed(3)}`);

    console.log('\n🎉 ALL SEARCH FUNCTIONS WORKING CORRECTLY!');
    console.log('🚀 Your chatbot search should now work at: http://localhost:3007');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testSearchFunctions();