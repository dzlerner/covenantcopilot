import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function fixDatabase() {
  const connectionString = `postgresql://postgres.tburenttoowkbxvogeed:${process.env.SUPABASE_SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;
  
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Read the SQL fix file
    const sqlFilePath = join(process.cwd(), 'scripts', 'fix-function-types.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf8');
    
    console.log('📝 Executing SQL fix...');
    console.log('SQL Content preview:');
    console.log(sqlContent.substring(0, 200) + '...');
    
    // Execute the entire SQL content
    const result = await client.query(sqlContent);
    
    console.log('✅ SQL fix executed successfully!');
    
    // Test the fix
    console.log('🧪 Testing the fix...');
    const testEmbedding = Array(1536).fill(0);
    const testResult = await client.query(
      'SELECT * FROM match_documents($1, $2, $3)', 
      [testEmbedding, 0.5, 1]
    );
    
    console.log('✅ Function test successful! Found', testResult.rows.length, 'results');
    console.log('🎉 Database fix completed successfully!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.detail) {
      console.error('Details:', error.detail);
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

fixDatabase();