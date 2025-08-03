#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { supabase } from '../lib/supabase';
import { embedDocuments } from '../lib/embeddings';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

interface CrawlConfig {
  domain: string;
  baseUrl: string;
  userAgent: string;
  crawlDelay: number; // milliseconds
  maxPagesPerSession: number;
  respectRobots: boolean;
  allowedFileTypes: string[];
  excludePatterns: RegExp[];
}

interface DiscoveredLink {
  url: string;
  sourceUrl: string;
  linkType: 'internal' | 'external' | 'email' | 'tel' | 'file';
  linkText: string;
}

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

class ComprehensiveCrawler {
  private config: CrawlConfig;
  private crawlSessionId: string | null = null;
  private crawledUrls = new Set<string>();
  private stats = {
    totalDiscovered: 0,
    processed: 0,
    successful: 0,
    failed: 0,
    internalLinks: 0,
    externalLinks: 0
  };

  constructor(domain: string = 'hrcaonline.org') {
    this.config = {
      domain,
      baseUrl: `https://${domain}`,
      userAgent: 'CovenantCopilot/1.0 (+https://covenantcopilot.com)',
      crawlDelay: 2000, // 2 seconds between requests
      maxPagesPerSession: 500,
      respectRobots: true,
      allowedFileTypes: ['.html', '.htm', '.php', '.asp', '.aspx', '.jsp', ''],
      excludePatterns: [
        /\/admin\//i,
        /\/login/i,
        /\/logout/i,
        /\/search\?/i,
        /\.pdf$/i,
        /\.doc$/i,
        /\.docx$/i,
        /\.xls$/i,
        /\.xlsx$/i,
        /\.zip$/i,
        /\.jpg$/i,
        /\.jpeg$/i,
        /\.png$/i,
        /\.gif$/i,
        /\.svg$/i,
        /\.css$/i,
        /\.js$/i,
        /\.json$/i,
        /\.xml$/i,
        /\/calendar\//i,
        /\/events\?/i,
        /mailto:/i,
        /tel:/i
      ]
    };
  }

  async startCrawlSession(): Promise<void> {
    console.log('🚀 Starting comprehensive crawl session...');
    
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    // Create crawl session
    const { data: session, error } = await supabase
      .from('crawl_sessions')
      .insert({})
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create crawl session: ${error.message}`);
    }

    this.crawlSessionId = session.id;
    console.log(`📊 Crawl session started: ${this.crawlSessionId}`);
  }

  async discoverStartingUrls(): Promise<string[]> {
    const startingUrls = [
      `${this.config.baseUrl}`,
      `${this.config.baseUrl}/sitemap.xml`,
      `${this.config.baseUrl}/Property-Owners`,
      `${this.config.baseUrl}/Property-Owners/Residential`,
      `${this.config.baseUrl}/Property-Owners/Architectural-Review`,
      `${this.config.baseUrl}/Property-Owners/Forms`,
      `${this.config.baseUrl}/Property-Owners/Residential/Covenants-Improvements`,
      `${this.config.baseUrl}/About`,
      `${this.config.baseUrl}/Community`,
      `${this.config.baseUrl}/Services`,
      `${this.config.baseUrl}/Contact`
    ];

    // Try to get sitemap URLs
    const sitemapUrls = await this.parseSitemap(`${this.config.baseUrl}/sitemap.xml`);
    if (sitemapUrls.length > 0) {
      console.log(`📄 Found ${sitemapUrls.length} URLs in sitemap`);
      return [...new Set([...startingUrls, ...sitemapUrls])];
    }

    return startingUrls;
  }

  async parseSitemap(sitemapUrl: string): Promise<string[]> {
    try {
      console.log(`🗺️ Checking sitemap: ${sitemapUrl}`);
      const response = await fetch(sitemapUrl, {
        headers: { 'User-Agent': this.config.userAgent }
      });

      if (!response.ok) {
        console.log(`❌ Sitemap not found: ${response.status}`);
        return [];
      }

      const xml = await response.text();
      const urls: string[] = [];
      
      // Parse XML sitemap
      const locMatches = xml.match(/<loc>(.*?)<\/loc>/g);
      if (locMatches) {
        for (const match of locMatches) {
          const url = match.replace(/<\/?loc>/g, '').trim();
          if (url.startsWith(this.config.baseUrl)) {
            urls.push(url);
          }
        }
      }

      return urls;
    } catch (error) {
      console.log(`⚠️ Error parsing sitemap: ${error}`);
      return [];
    }
  }

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

      // Extract all links
      const links: DiscoveredLink[] = [];
      $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        const linkText = $(element).text().trim();
        
        if (href) {
          const link = this.categorizeLink(href, url, linkText);
          if (link) {
            links.push(link);
          }
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
      // Invalid URL, skip it
      return null;
    }
  }

  async storeDiscoveredLinks(links: DiscoveredLink[]): Promise<void> {
    if (!supabase || links.length === 0) return;

    const linkData = links.map(link => ({
      url: link.url,
      source_url: link.sourceUrl,
      link_type: link.linkType,
      link_text: link.linkText.substring(0, 500), // Limit length
      crawl_status: link.linkType === 'internal' ? 'pending' : 'skipped'
    }));

    const { error } = await supabase
      .from('discovered_links')
      .upsert(linkData, { 
        onConflict: 'url',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Error storing links:', error);
    }

    // Update stats
    this.stats.internalLinks += links.filter(l => l.linkType === 'internal').length;
    this.stats.externalLinks += links.filter(l => l.linkType === 'external').length;
  }

  async storePageContent(result: CrawlResult): Promise<void> {
    if (!supabase || !result.content.trim()) return;

    // Generate embeddings for content chunks
    const chunks = this.chunkText(result.content, 1000, 200);
    const embeddings = await embedDocuments(chunks);

    const documentData = chunks.map((chunk, index) => ({
      content: chunk,
      embedding: embeddings[index],
      source_url: result.url,
      page_title: result.title,
      meta_description: result.metaDescription,
      content_type: result.contentType,
      response_status: result.status,
      crawled_at: new Date().toISOString(),
      last_modified: result.lastModified?.toISOString(),
      content_hash: this.hashContent(chunk)
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
  }

  chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    const chunks: string[] = [];
    let start = 0;
    const maxChunks = 1000; // Prevent runaway chunking
    
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

  hashContent(content: string): string {
    // Simple hash function for content deduplication
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  shouldSkipUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Check exclusion patterns
      for (const pattern of this.config.excludePatterns) {
        if (pattern.test(url)) {
          return true;
        }
      }

      // Check file extensions
      const ext = path.extname(urlObj.pathname).toLowerCase();
      if (ext && !this.config.allowedFileTypes.includes(ext)) {
        return true;
      }

      return false;
    } catch {
      return true; // Skip invalid URLs
    }
  }

  async updateCrawlSession(status: 'completed' | 'failed', errorMessage?: string): Promise<void> {
    if (!supabase || !this.crawlSessionId) return;

    await supabase
      .from('crawl_sessions')
      .update({
        completed_at: new Date().toISOString(),
        status,
        error_message: errorMessage,
        total_pages_discovered: this.stats.totalDiscovered,
        pages_processed: this.stats.processed,
        pages_successful: this.stats.successful,
        pages_failed: this.stats.failed,
        internal_links_found: this.stats.internalLinks,
        external_links_found: this.stats.externalLinks
      })
      .eq('id', this.crawlSessionId);
  }

  async runComprehensiveCrawl(): Promise<void> {
    try {
      await this.startCrawlSession();
      
      // Get starting URLs
      const startingUrls = await this.discoverStartingUrls();
      console.log(`🎯 Starting with ${startingUrls.length} seed URLs`);
      
      // Queue for URLs to crawl
      const urlQueue = [...startingUrls];
      let processedCount = 0;
      
      while (urlQueue.length > 0 && processedCount < this.config.maxPagesPerSession) {
        const currentUrl = urlQueue.shift()!;
        
        // Skip if already crawled or should be skipped
        if (this.crawledUrls.has(currentUrl) || this.shouldSkipUrl(currentUrl)) {
          continue;
        }
        
        this.crawledUrls.add(currentUrl);
        processedCount++;
        
        console.log(`📄 Processing ${processedCount}/${this.config.maxPagesPerSession}: ${currentUrl}`);
        
        try {
          // Mark as attempting to crawl
          await supabase?.from('discovered_links')
            .upsert({
              url: currentUrl,
              source_url: 'seed',
              link_type: 'internal',
              link_text: '',
              crawl_status: 'pending'
            });

          // Crawl the page
          const result = await this.crawlPage(currentUrl);
          
          if (result) {
            // Store page content
            await this.storePageContent(result);
            
            // Store discovered links
            await this.storeDiscoveredLinks(result.links);
            
            // Add internal links to queue
            const newInternalLinks = result.links
              .filter(link => link.linkType === 'internal')
              .map(link => link.url)
              .filter(url => !this.crawledUrls.has(url) && !this.shouldSkipUrl(url));
            
            urlQueue.push(...newInternalLinks);
            
            // Mark as successful
            await supabase?.rpc('mark_url_processed', {
              url_to_update: currentUrl,
              status: 'success'
            });
            
            this.stats.successful++;
            console.log(`✅ Successfully processed: ${currentUrl}`);
            
          } else {
            await supabase?.rpc('mark_url_processed', {
              url_to_update: currentUrl,
              status: 'failed',
              error_msg: 'Failed to crawl page'
            });
            
            this.stats.failed++;
          }
          
        } catch (error) {
          console.error(`❌ Error processing ${currentUrl}:`, error);
          
          await supabase?.rpc('mark_url_processed', {
            url_to_update: currentUrl,
            status: 'failed',
            error_msg: String(error)
          });
          
          this.stats.failed++;
        }
        
        this.stats.processed++;
        
        // Respectful delay
        await new Promise(resolve => setTimeout(resolve, this.config.crawlDelay));
        
        // Log progress every 10 pages
        if (processedCount % 10 === 0) {
          console.log(`📊 Progress: ${processedCount} processed, ${urlQueue.length} queued, ${this.stats.successful} successful, ${this.stats.failed} failed`);
        }
      }
      
      await this.updateCrawlSession('completed');
      
      console.log('🎉 Comprehensive crawl completed!');
      console.log(`📊 Final Stats:`);
      console.log(`   • Total Processed: ${this.stats.processed}`);
      console.log(`   • Successful: ${this.stats.successful}`);
      console.log(`   • Failed: ${this.stats.failed}`);
      console.log(`   • Internal Links: ${this.stats.internalLinks}`);
      console.log(`   • External Links: ${this.stats.externalLinks}`);
      
    } catch (error) {
      console.error('🚨 Comprehensive crawl failed:', error);
      await this.updateCrawlSession('failed', String(error));
      throw error;
    }
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting HRCA Comprehensive Crawler');
    
    const crawler = new ComprehensiveCrawler('hrcaonline.org');
    await crawler.runComprehensiveCrawl();
    
    // Clean up old data
    console.log('🧹 Cleaning up old crawl data...');
    await supabase?.rpc('cleanup_old_crawl_data');
    
    console.log('✅ Crawl session completed successfully!');
    
  } catch (error) {
    console.error('❌ Crawl session failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { ComprehensiveCrawler };