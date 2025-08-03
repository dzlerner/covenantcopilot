# HRCA Documents

## Required Files

Place the following documents in this directory:

### ResidentialImprovementGuidelines.pdf
- The official HRCA Residential Improvement Guidelines PDF
- This should be the most current version available
- Download from: https://hrcaonline.org/Property-Owners/Forms

## Processing

After adding the PDF, run:

```bash
npm run process-docs
```

This will:
1. Parse the PDF into searchable chunks
2. Crawl key HRCA web pages
3. Generate embeddings for all content
4. Store in the vector database for retrieval

## Verification

Check that documents were processed correctly:

```bash
npm run check-docs
```

## Updates

When HRCA releases updated guidelines:
1. Replace the PDF file with the new version
2. Re-run `npm run process-docs`
3. Verify with `npm run check-docs`

The system will automatically clear old documents and index the new content.