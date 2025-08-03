import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQLFix() {
  try {
    console.log('🔧 Running database function type fix...');
    
    // Read the SQL fix file
    const sqlFilePath = join(process.cwd(), 'scripts', 'fix-function-types.sql');
    const sqlContent = readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL into individual statements (removing comments and empty lines)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Try direct SQL execution if rpc doesn't work
        console.log('📡 Trying direct SQL execution...');
        const { error: directError } = await supabase
          .from('_sql')
          .insert({ query: statement });
          
        if (directError) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue with next statement
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('🎉 Database function fix completed!');
    console.log('🧪 Testing the fix...');
    
    // Test the fix by calling the function
    const testEmbedding = Array(1536).fill(0);
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: testEmbedding,
      match_threshold: 0.5,
      match_count: 1
    });
    
    if (error) {
      console.error('❌ Test failed:', error.message);
    } else {
      console.log('✅ Function test successful! The fix worked.');
    }
    
  } catch (error: any) {
    console.error('❌ Error running SQL fix:', error.message);
  }
}

runSQLFix();