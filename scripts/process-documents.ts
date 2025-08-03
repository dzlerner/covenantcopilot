import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import * as cheerio from 'cheerio';
import { supabase } from '../lib/supabase';
import { embedDocuments } from '../lib/embeddings';

interface Document {
  pageContent: string;
  metadata: {
    source_url?: string;
    pdf_page?: number;
    section_title?: string;
    title?: string;
    tags?: string[];
    page_range?: string;
    [key: string]: any;
  };
}

export async function processPDF(pdfPath: string): Promise<Document[]> {
  console.log('Loading PDF from:', pdfPath);
  
  if (!fs.existsSync(pdfPath)) {
    console.warn(`PDF file not found: ${pdfPath}`);
    return [];
  }
  
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfData = await pdfParse(pdfBuffer);
  
  console.log(`Loaded PDF with ${pdfData.text.length} characters`);
  
  // Enhanced section-based chunking
  const structuredSections = splitByHeading(pdfData.text);
  console.log(`Found ${structuredSections.length} structured sections`);
  
  const documents: Document[] = [];
  
  structuredSections.forEach((section, sectionIndex) => {
    // Use larger chunks (1000 chars, 200 overlap) for better context
    const chunks = chunkText(section.text, 1000, 200);
    
    chunks.forEach((chunk, chunkIndex) => {
      documents.push({
        pageContent: chunk,
        metadata: {
          pdf_page: Math.floor((sectionIndex * 3 + chunkIndex) / 3) + 1,
          section_title: section.title,
          title: 'HRCA Residential Improvement Guidelines',
          tags: section.tags,
          page_range: section.page_range
        }
      });
    });
  });
  
  console.log(`Split into ${documents.length} enhanced chunks across ${structuredSections.length} sections`);
  
  return documents;
}

export async function processWebPages(urls: string[]): Promise<Document[]> {
  console.log('Loading web pages:', urls);
  
  const allChunks: Document[] = [];
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      const html = await response.text();
      
      const $ = cheerio.load(html);
      
      // Extract main content (remove scripts, styles, nav, etc.)
      $('script, style, nav, header, footer, .nav, .navigation').remove();
      
      const content = $('main, .content, .main-content, body').first().text()
        .replace(/\s+/g, ' ')
        .trim();
      
      if (content.length > 100) {
        // Enhanced web content processing with section awareness
        const structuredSections = splitByHeading(content);
        
        structuredSections.forEach(section => {
          const chunks = chunkText(section.text, 1000, 200);
          
          chunks.forEach(chunk => {
            allChunks.push({
              pageContent: chunk,
              metadata: {
                source_url: url,
                section_title: section.title,
                title: $('title').text() || url,
                tags: section.tags
              }
            });
          });
        });
        
        console.log(`Processed ${structuredSections.length} sections from ${url}`);
      }
    } catch (error) {
      console.error(`Error processing ${url}:`, error);
    }
  }
  
  console.log(`Total web chunks: ${allChunks.length}`);
  return allChunks;
}

// Enhanced chunking with section awareness
interface StructuredSection {
  title: string;
  text: string;
  page_range?: string;
  tags: string[];
}

function splitByHeading(text: string): StructuredSection[] {
  const sections: StructuredSection[] = [];
  
  // Split by common section patterns in HOA documents
  const sectionRegex = /(?:Section\s+[\d.]+|Article\s+[\d.]+|\d+\.\d+|\b[A-Z][^.]*(?:Standards?|Guidelines?|Requirements?|Rules?)\b)/gi;
  const matches = Array.from(text.matchAll(new RegExp(sectionRegex.source, 'gi')));
  
  if (matches.length === 0) {
    // Fallback: create single section
    return [{
      title: 'General Content',
      text: text,
      tags: extractTags(text)
    }];
  }
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];
    
    const startPos = match.index || 0;
    const endPos = nextMatch ? (nextMatch.index || text.length) : text.length;
    
    const sectionText = text.slice(startPos, endPos).trim();
    const title = match[0].trim();
    
    if (sectionText.length > 100) {
      sections.push({
        title,
        text: sectionText,
        tags: extractTags(sectionText, title)
      });
    }
  }
  
  return sections;
}

function extractTags(text: string, title?: string): string[] {
  const tags: string[] = [];
  const lowerText = (text + ' ' + (title || '')).toLowerCase();
  
  // Domain-specific tags for HOA rules
  const tagPatterns = {
    'fence': /\b(?:fence|fencing|boundary|perimeter)\b/,
    'paint': /\b(?:paint|color|stain|finish)\b/,
    'exterior': /\b(?:exterior|outside|outdoor|external)\b/,
    'interior': /\b(?:interior|inside|indoor|internal)\b/,
    'brown': /\b(?:brown|highlands ranch brown|earth tone)\b/,
    'natural': /\b(?:natural|wood tone|natural wood)\b/,
    'approval': /\b(?:approval|permit|arc|committee|review)\b/,
    'shed': /\b(?:shed|storage|outbuilding|structure)\b/,
    'deck': /\b(?:deck|patio|outdoor living)\b/,
    'landscaping': /\b(?:landscape|garden|plant|tree|lawn)\b/,
    'parking': /\b(?:park|parking|vehicle|rv|trailer)\b/,
    'holiday': /\b(?:holiday|christmas|decoration|light)\b/,
    'required': /\b(?:required|must|mandatory|shall)\b/,
    'prohibited': /\b(?:prohibited|not allowed|forbidden|banned)\b/
  };
  
  for (const [tag, pattern] of Object.entries(tagPatterns)) {
    if (pattern.test(lowerText)) {
      tags.push(tag);
    }
  }
  
  return tags;
}

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    
    if (chunk.trim().length > 50) { // Only include meaningful chunks
      chunks.push(chunk.trim());
    }
    
    start += chunkSize - overlap;
  }
  
  return chunks;
}

export async function storeDocuments(documents: Document[]): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured. Check your environment variables.');
  }

  console.log(`Storing ${documents.length} documents...`);
  
  // Extract text content for embedding
  const texts = documents.map(doc => doc.pageContent);
  
  // Generate embeddings
  console.log('Generating embeddings...');
  const embeddings = await embedDocuments(texts);
  
  // Prepare data for insertion with enhanced metadata
  const rows = documents.map((doc, index) => ({
    content: doc.pageContent,
    embedding: embeddings[index],
    source_url: doc.metadata.source_url || null,
    pdf_page: doc.metadata.pdf_page || null,
    section_title: doc.metadata.section_title || doc.metadata.title || null,
    tags: doc.metadata.tags || [],
    page_range: doc.metadata.page_range || null,
  }));
  
  // Insert into Supabase
  console.log('Inserting into database...');
  const { data, error } = await supabase
    .from('documents')
    .insert(rows);
  
  if (error) {
    throw error;
  }
  
  console.log('Successfully stored documents');
}

export async function processAllDocuments(): Promise<void> {
  try {
    console.log('Starting document processing...');
    
    // Process PDF
    const pdfChunks = await processPDF('public/documents/ResidentialImprovementGuidelines.pdf');
    
    // Process web pages
    const webUrls = [
      'https://hrcaonline.org/Property-Owners/Residential/Covenants-Improvements',
      'https://hrcaonline.org/Property-Owners/Architectural-Review',
      'https://hrcaonline.org/Property-Owners/Forms',
    ];
    
    const webChunks = await processWebPages(webUrls);
    
    // Combine all documents
    const allDocuments = [...pdfChunks, ...webChunks];
    
    // Clear existing documents
    if (!supabase) {
      throw new Error('Supabase not configured. Check your environment variables.');
    }
    
    console.log('Clearing existing documents...');
    await supabase.from('documents').delete().neq('id', '');
    
    // Store new documents
    await storeDocuments(allDocuments);
    
    console.log('Document processing complete!');
  } catch (error) {
    console.error('Error processing documents:', error);
    throw error;
  }
}