#!/usr/bin/env tsx

import { supabase } from '../lib/supabase';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function checkCrawlStatus() {
  console.log('📊 Covenant Copilot - Crawl Status Report');
  console.log('==========================================');

  if (!supabase) {
    console.error('❌ Supabase not configured');
    return;
  }

  try {
    // Get latest crawl session
    const { data: latestSession, error: sessionError } = await supabase
      .from('crawl_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (sessionError) {
      console.log('📝 No crawl sessions found yet');
    } else {
      console.log('\n🕐 Latest Crawl Session:');
      console.log(`   ID: ${latestSession.id}`);
      console.log(`   Started: ${new Date(latestSession.started_at).toLocaleString()}`);
      console.log(`   Status: ${latestSession.status}`);
      
      if (latestSession.completed_at) {
        const duration = new Date(latestSession.completed_at).getTime() - new Date(latestSession.started_at).getTime();
        console.log(`   Completed: ${new Date(latestSession.completed_at).toLocaleString()}`);
        console.log(`   Duration: ${Math.round(duration / 1000 / 60)} minutes`);
      }
      
      console.log(`   Pages Discovered: ${latestSession.total_pages_discovered || 0}`);
      console.log(`   Pages Processed: ${latestSession.pages_processed || 0}`);
      console.log(`   Successful: ${latestSession.pages_successful || 0}`);
      console.log(`   Failed: ${latestSession.pages_failed || 0}`);
      console.log(`   Internal Links: ${latestSession.internal_links_found || 0}`);
      console.log(`   External Links: ${latestSession.external_links_found || 0}`);
      
      if (latestSession.error_message) {
        console.log(`   Error: ${latestSession.error_message}`);
      }
    }

    // Get overall statistics
    const { data: totalDocs, error: docsError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    const { data: totalLinks, error: linksError } = await supabase
      .from('discovered_links')
      .select('*', { count: 'exact', head: true });

    const { data: pendingLinks, error: pendingError } = await supabase
      .from('discovered_links')
      .select('*', { count: 'exact', head: true })
      .eq('crawl_status', 'pending');

    const { data: internalLinks, error: internalError } = await supabase
      .from('discovered_links')
      .select('*', { count: 'exact', head: true })
      .eq('link_type', 'internal');

    const { data: externalLinks, error: externalError } = await supabase
      .from('discovered_links')
      .select('*', { count: 'exact', head: true })
      .eq('link_type', 'external');

    console.log('\n📈 Overall Statistics:');
    console.log(`   Total Documents: ${totalDocs?.[0]?.count || 0}`);
    console.log(`   Total Links Discovered: ${totalLinks?.[0]?.count || 0}`);
    console.log(`   Pending Links: ${pendingLinks?.[0]?.count || 0}`);
    console.log(`   Internal Links: ${internalLinks?.[0]?.count || 0}`);
    console.log(`   External Links: ${externalLinks?.[0]?.count || 0}`);

    // Get recent crawl activity (last 7 days)
    const { data: recentSessions, error: recentError } = await supabase
      .from('crawl_sessions')
      .select('started_at, status, pages_successful, pages_failed')
      .gte('started_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('started_at', { ascending: false });

    if (recentSessions && recentSessions.length > 0) {
      console.log('\n📅 Recent Crawl Activity (Last 7 Days):');
      recentSessions.forEach((session, index) => {
        const date = new Date(session.started_at).toLocaleDateString();
        const time = new Date(session.started_at).toLocaleTimeString();
        console.log(`   ${index + 1}. ${date} ${time} - ${session.status} (${session.pages_successful || 0} success, ${session.pages_failed || 0} failed)`);
      });
    }

    // Get top domains for external links
    const { data: topDomains, error: domainsError } = await supabase
      .rpc('get_top_external_domains', { limit_count: 10 });

    if (topDomains && topDomains.length > 0) {
      console.log('\n🌐 Top External Domains:');
      topDomains.forEach((domain: any, index: number) => {
        console.log(`   ${index + 1}. ${domain.domain} (${domain.link_count} links)`);
      });
    }

    // Check for failed URLs
    const { data: failedUrls, error: failedError } = await supabase
      .from('discovered_links')
      .select('url, error_message, last_crawl_attempt')
      .eq('crawl_status', 'failed')
      .order('last_crawl_attempt', { ascending: false })
      .limit(5);

    if (failedUrls && failedUrls.length > 0) {
      console.log('\n❌ Recent Failed URLs:');
      failedUrls.forEach((url, index) => {
        console.log(`   ${index + 1}. ${url.url}`);
        if (url.error_message) {
          console.log(`      Error: ${url.error_message}`);
        }
        console.log(`      Last Attempt: ${new Date(url.last_crawl_attempt).toLocaleString()}`);
      });
    }

    // Check database health
    const { data: oldestDoc, error: oldestError } = await supabase
      .from('documents')
      .select('crawled_at')
      .order('crawled_at', { ascending: true })
      .limit(1)
      .single();

    const { data: newestDoc, error: newestError } = await supabase
      .from('documents')
      .select('crawled_at')
      .order('crawled_at', { ascending: false })
      .limit(1)
      .single();

    if (oldestDoc && newestDoc) {
      console.log('\n🔍 Database Health:');
      console.log(`   Oldest Document: ${new Date(oldestDoc.crawled_at).toLocaleDateString()}`);
      console.log(`   Newest Document: ${new Date(newestDoc.crawled_at).toLocaleDateString()}`);
      
      const daysSinceUpdate = (Date.now() - new Date(newestDoc.crawled_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 2) {
        console.log(`   ⚠️ Content may be stale (${Math.round(daysSinceUpdate)} days since last update)`);
      } else {
        console.log(`   ✅ Content is fresh (${Math.round(daysSinceUpdate * 24)} hours since last update)`);
      }
    }

    console.log('\n✅ Status check complete!');

  } catch (error) {
    console.error('❌ Error checking crawl status:', error);
  }
}

// Add the SQL function for top external domains if it doesn't exist
async function ensureHelperFunctions() {
  if (!supabase) return;

  try {
    await supabase.rpc('create_helper_functions_if_not_exists');
  } catch (error) {
    // Function might not exist, that's ok
  }
}

if (require.main === module) {
  ensureHelperFunctions().then(() => checkCrawlStatus());
}

export { checkCrawlStatus };