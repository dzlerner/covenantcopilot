import { supabase } from './supabase';
import { embedText } from './embeddings';

export interface SearchResult {
  id: string;
  content: string;
  source_url?: string;
  pdf_page?: number;
  section_title?: string;
  tags?: string[];
  page_range?: string;
  similarity: number;
  tag_boost_score?: number;
}

export interface ConflictDetection {
  conflict_type: string;
  description: string;
  affected_content: string[];
}

export async function searchDocuments(
  query: string,
  matchThreshold: number = 0.78,
  matchCount: number = 5
): Promise<SearchResult[]> {
  try {
    if (!supabase) {
      console.warn('Supabase not configured, returning empty results');
      return [];
    }

    // Generate embedding for the query
    const queryEmbedding = await embedText(query);
    
    // Enhanced search with tag boosting
    const results = await searchDocumentsEnhanced(query, queryEmbedding, matchThreshold, matchCount);
    
    return results;
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}

export async function searchDocumentsEnhanced(
  query: string,
  queryEmbedding: number[],
  matchThreshold: number = 0.78,
  matchCount: number = 5
): Promise<SearchResult[]> {
  if (!supabase) {
    console.warn('Supabase not configured, returning empty results');
    return [];
  }

  const lowerQuery = query.toLowerCase();
  
  // Determine relevant tags for boosting
  const boostTags: string[] = [];
  const requireTags: string[] = [];
  
  const tagMappings = {
    'fence': ['fence', 'fencing', 'boundary'],
    'paint': ['paint', 'color', 'stain'],
    'shed': ['shed', 'storage', 'outbuilding'],
    'deck': ['deck', 'patio'],
    'parking': ['park', 'parking', 'vehicle', 'rv'],
    'holiday': ['holiday', 'christmas', 'decoration'],
    'approval': ['approval', 'permit', 'arc'],
    'exterior': ['exterior', 'outside'],
    'interior': ['interior', 'inside']
  };
  
  for (const [tag, keywords] of Object.entries(tagMappings)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      boostTags.push(tag);
    }
  }
  
  // For fence queries, get more results to catch potential conflicts
  const adjustedCount = lowerQuery.includes('fence') ? Math.min(matchCount + 3, 8) : matchCount;
  
  try {
    // Try enhanced function first, fallback to basic if not available
    let data, error;
    
    try {
      ({ data, error } = await supabase.rpc('match_documents_enhanced', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: adjustedCount,
        boost_tags: boostTags,
        require_tags: requireTags
      }));
    } catch {
      // Fallback to basic search
      console.log('Enhanced search not available, using basic search');
      ({ data, error } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: adjustedCount,
      }));
    }
    
    if (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Enhanced search failed:', error);
    throw error;
  }
}

export function detectRuleConflicts(results: SearchResult[]): string[] {
  const conflicts: string[] = [];
  const allContent = results.map(r => r.content.toLowerCase()).join(' ');
  
  // Fence color conflicts
  const mentionsBrown = /highlands?\s*ranch\s*brown|hrca\s*brown/i.test(allContent);
  const mentionsNatural = /natural\s*wood\s*tones?|earth\s*tones?/i.test(allContent);
  const mentionsExterior = /exterior\s*fence/i.test(allContent);
  const mentionsInterior = /interior\s*fence/i.test(allContent);
  
  if (mentionsBrown && mentionsNatural) {
    if (mentionsExterior && mentionsInterior) {
      conflicts.push("⚠️ POTENTIAL CONFLICT DETECTED: Different fence color requirements found - 'Highlands Ranch Brown' and 'natural wood tones'. This likely indicates different rules for interior vs exterior fences. Please specify fence location for accurate guidance.");
    } else {
      conflicts.push("⚠️ POTENTIAL CONFLICT DETECTED: Some sections reference 'natural wood tones', while others require 'Highlands Ranch Brown'. This may indicate different rules for interior vs exterior fences.");
    }
  }
  
  // Approval requirement conflicts
  const mentionsApprovalRequired = /(?:approval\s*required|arc\s*approval|must\s*be\s*approved)/i.test(allContent);
  const mentionsNoApproval = /(?:no\s*approval\s*required|approval\s*not\s*required)/i.test(allContent);
  
  if (mentionsApprovalRequired && mentionsNoApproval) {
    conflicts.push("⚠️ POTENTIAL CONFLICT DETECTED: Documents contain conflicting approval requirements. Please review specific circumstances and contact ARC for clarification.");
  }
  
  // Size/dimension conflicts for structures
  const mentionsSizeLimit = /(?:maximum|max|limit|not\s*exceed)/i.test(allContent);
  const mentionsNoSizeLimit = /(?:no\s*size\s*limit|unlimited\s*size)/i.test(allContent);
  
  if (mentionsSizeLimit && mentionsNoSizeLimit) {
    conflicts.push("⚠️ POTENTIAL CONFLICT DETECTED: Mixed information about size limitations. Different rules may apply to different areas or structure types.");
  }
  
  return conflicts;
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return 'No relevant information found in the HRCA documents.';
  }
  
  // Detect conflicts
  const conflicts = detectRuleConflicts(results);
  
  const formattedResults = results
    .map((result) => {
      const source = result.source_url 
        ? `Source: ${result.source_url}` 
        : result.pdf_page 
          ? `Source: HRCA Guidelines (Page ${result.pdf_page})` 
          : 'Source: HRCA Documents';
      
      const title = result.section_title ? `\nSection: ${result.section_title}` : '';
      
      // Add tag information for context
      const tagInfo = result.tags && result.tags.length > 0 
        ? `\nTags: ${result.tags.join(', ')}` 
        : '';
      
      // Add boost score if available
      const boostInfo = result.tag_boost_score && result.tag_boost_score > 0
        ? ` (Relevance boosted: +${(result.tag_boost_score * 100).toFixed(0)}%)`
        : '';
      
      return `${source}${title}${tagInfo}${boostInfo}\n\n${result.content}`;
    })
    .join('\n\n---\n\n');
  
  // Add conflicts at the end if detected
  if (conflicts.length > 0) {
    return formattedResults + '\n\n' + '='.repeat(50) + '\n\n' + conflicts.join('\n\n');
  }
  
  return formattedResults;
}