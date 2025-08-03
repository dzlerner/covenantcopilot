#!/usr/bin/env tsx

import { processAllDocuments } from './process-documents';

async function main() {
  try {
    await processAllDocuments();
    console.log('✅ Document processing completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Document processing failed:', error);
    process.exit(1);
  }
}

main();