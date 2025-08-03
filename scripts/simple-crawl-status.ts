#!/usr/bin/env tsx

import { supabase } from '../lib/supabase';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function simpleStatus() {
  console.log('📊 Covenant Copilot - Crawl Status Report');
  console.log('==========================================');

  if (!supabase) {
    console.error('❌ Supabase not configured');
    return;
  }

  try {
    // Check if crawler tables exist
    const { count: docCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    console.log('📈 Database Status:');
    console.log(`   Documents: ${docCount || 0}`);

    // Try to check crawler tables
    try {
      const { count: linkCount } = await supabase
        .from('discovered_links')
        .select('*', { count: 'exact', head: true });

      const { count: sessionCount } = await supabase
        .from('crawl_sessions')
        .select('*', { count: 'exact', head: true });

      console.log(`   Discovered Links: ${linkCount || 0}`);
      console.log(`   Crawl Sessions: ${sessionCount || 0}`);

      if (sessionCount === 0) {
        console.log('\n💡 Ready to start crawling!');
        console.log('   Run: npm run crawl-comprehensive');
      } else {
        console.log('\n✅ Crawler database is set up and has data');
      }

    } catch (error) {
      console.log('\n⚠️ Crawler tables not set up yet');
      console.log('   Run the crawler SQL schema first');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  simpleStatus();
}
