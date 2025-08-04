// Crawler that stores content without embeddings
// This allows us to crawl first, then generate embeddings later
import { config } from 'dotenv';
config({ path: '.env.local' });

import * as cheerio from 'cheerio';
import * as path from 'path';
import { supabase } from '../lib/supabase';

interface CrawlResult {
  url: string;
  content: string;
  title: string;
  metaDescription: string;
  links: DiscoveredLink[];
  contentType: string;
  status: number;
  lastModified?: Date;
}

interface DiscoveredLink {
  url: string;
  sourceUrl: string;
  linkType: 'internal' | 'external' | 'file' | 'email' | 'tel';
  linkText: string;
}

class ContentOnlyCrawler {
  private config = {
    domain: 'hrcaonline.org',
    baseUrl: 'https://hrcaonline.org',
    userAgent: 'CovenantCopilot/1.0 (+https://covenantcopilot.com)',
    crawlDelay: 2000,
    maxPagesPerSession: 50
  };

  private crawledUrls = new Set<string>();
  private stats = { processed: 0, successful: 0, failed: 0 };

  async crawlPage(url: string): Promise<CrawlResult | null> {
    try {
      console.log(`🔍 Crawling: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      });

      const content = await response.text();
      const $ = cheerio.load(content);

      // Extract page metadata
      const title = $('title').text().trim() || '';
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      
      // Clean content - remove script, style, nav, footer
      $('script, style, nav, footer, .navigation, .menu, #sidebar').remove();
      const mainContent = $('main, .main, .content, body').first().text() || $('body').text();
      const cleanContent = mainContent.replace(/\s+/g, ' ').trim();

      // Extract links
      const links: DiscoveredLink[] = [];
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        const linkText = $(element).text().trim();
        
        if (href) {
          const link = this.categorizeLink(href, url, linkText);
          if (link) links.push(link);
        }
      });

      return {
        url,
        content: cleanContent,
        title,
        metaDescription,
        links,
        contentType: response.headers.get('content-type') || 'text/html',
        status: response.status,
        lastModified: response.headers.get('last-modified') 
          ? new Date(response.headers.get('last-modified')!) 
          : undefined
      };

    } catch (error) {
      console.error(`❌ Error crawling ${url}:`, error);
      return null;
    }
  }

  categorizeLink(href: string, sourceUrl: string, linkText: string): DiscoveredLink | null {
    try {
      // Handle relative URLs
      let absoluteUrl: string;
      if (href.startsWith('http')) {
        absoluteUrl = href;
      } else if (href.startsWith('//')) {
        absoluteUrl = `https:${href}`;
      } else if (href.startsWith('/')) {
        absoluteUrl = `${this.config.baseUrl}${href}`;
      } else {
        const base = new URL(sourceUrl);
        absoluteUrl = new URL(href, base.origin + base.pathname).toString();
      }

      const url = new URL(absoluteUrl);
      
      // Categorize by type
      if (href.startsWith('mailto:')) {
        return { url: absoluteUrl, sourceUrl, linkType: 'email', linkText };
      }
      
      if (href.startsWith('tel:')) {
        return { url: absoluteUrl, sourceUrl, linkType: 'tel', linkText };
      }

      // Check if it's a file
      const ext = path.extname(url.pathname).toLowerCase();
      if (ext && !['.html', '.htm', '.php', '.asp', '.aspx', '.jsp'].includes(ext)) {
        return { url: absoluteUrl, sourceUrl, linkType: 'file', linkText };
      }

      // Check if internal or external
      if (url.hostname === this.config.domain || url.hostname === `www.${this.config.domain}`) {
        return { url: absoluteUrl, sourceUrl, linkType: 'internal', linkText };
      } else {
        return { url: absoluteUrl, sourceUrl, linkType: 'external', linkText };
      }

    } catch (error) {
      return null;
    }
  }

  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    if (!text || typeof text !== 'string') return [];
    
    const chunks: string[] = [];
    let start = 0;
    const maxChunks = 1000;
    
    while (start < text.length && chunks.length < maxChunks) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
      
      start = end - overlap;
      if (start >= text.length || start < 0) break;
    }
    
    return chunks;
  }

  async storeContentWithoutEmbeddings(result: CrawlResult): Promise<void> {
    if (!supabase || !result.content.trim()) return;

    // Store content chunks WITHOUT embeddings
    const chunks = this.chunkText(result.content, 1000, 200);
    
    const documentData = chunks.map((chunk) => ({
      content: chunk,
      embedding: null, // No embeddings yet!
      source_url: result.url,
      page_title: result.title,
      meta_description: result.metaDescription,
      content_type: result.contentType,
      response_status: result.status,
      crawled_at: new Date().toISOString(),
      last_modified: result.lastModified?.toISOString()
    }));

    // Remove existing documents for this URL
    await supabase
      .from('documents')
      .delete()
      .eq('source_url', result.url);

    // Insert new documents
    const { error } = await supabase
      .from('documents')
      .insert(documentData);

    if (error) {
      console.error(`Error storing content for ${result.url}:`, error);
      throw error;
    }

    console.log(`✅ Stored ${chunks.length} chunks for: ${result.url}`);
  }

  async storeDiscoveredLinks(links: DiscoveredLink[]): Promise<void> {
    if (!supabase || links.length === 0) return;

    const linkData = links.map(link => ({
      url: link.url,
      source_url: link.sourceUrl,
      link_type: link.linkType,
      link_text: link.linkText,
      discovered_at: new Date().toISOString(),
      crawl_status: 'pending'
    }));

    const { error } = await supabase
      .from('discovered_links')
      .upsert(linkData, { 
        onConflict: 'url',
        ignoreDuplicates: false 
      });

    if (error) {
      console.log('Error storing links (expected for duplicates):', error.message);
    }
  }

  async runContentOnlyCrawl(): Promise<void> {
    console.log('🚀 Starting Content-Only Crawl (No Embeddings)');
    
    // Get pending internal links from database
    const { data: pendingLinks } = await supabase
      ?.from('discovered_links')
      .select('url')
      .eq('link_type', 'internal')
      .eq('crawl_status', 'pending')
      .limit(this.config.maxPagesPerSession) || { data: [] };

    const urlsToProcess = pendingLinks?.map(link => link.url) || [
      'https://hrcaonline.org',
      'https://hrcaonline.org/About/Leadership',
      'https://hrcaonline.org/About/History',
      'https://hrcaonline.org/Property-Owners/Forms',
      'https://hrcaonline.org/Property-Owners/Architectural-Review'
    ];

    console.log(`🎯 Processing ${urlsToProcess.length} URLs`);

    for (const url of urlsToProcess) {
      if (this.crawledUrls.has(url)) continue;
      
      this.crawledUrls.add(url);
      this.stats.processed++;
      
      console.log(`📄 Processing ${this.stats.processed}/${urlsToProcess.length}: ${url}`);
      
      try {
        const result = await this.crawlPage(url);
        
        if (result) {
          // Store content WITHOUT embeddings
          await this.storeContentWithoutEmbeddings(result);
          
          // Store discovered links
          await this.storeDiscoveredLinks(result.links);
          
          // Mark as successful in discovered_links table
          await supabase
            ?.from('discovered_links')
            .update({ crawl_status: 'success', last_crawl_attempt: new Date().toISOString() })
            .eq('url', url);
          
          this.stats.successful++;
          console.log(`✅ Successfully processed: ${url}`);
          
        } else {
          await supabase
            ?.from('discovered_links')
            .update({ crawl_status: 'failed', last_crawl_attempt: new Date().toISOString() })
            .eq('url', url);
          
          this.stats.failed++;
          console.log(`❌ Failed to process: ${url}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing ${url}:`, error);
        this.stats.failed++;
      }
      
      // Respectful delay
      await new Promise(resolve => setTimeout(resolve, this.config.crawlDelay));
    }

    console.log('\n🎉 Content-Only Crawl Complete!');
    console.log(`📊 Stats: ${this.stats.successful} successful, ${this.stats.failed} failed`);
    console.log('💡 Next step: Run embedding generation separately');
  }
}

async function main() {
  if (!supabase) {
    console.error('❌ Supabase not configured');
    return;
  }

  const crawler = new ContentOnlyCrawler();
  await crawler.runContentOnlyCrawl();
}

if (require.main === module) {
  main().catch(console.error);
}