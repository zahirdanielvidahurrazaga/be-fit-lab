const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const VITE_SUPABASE_URL = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const VITE_SUPABASE_ANON_KEY = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function listTables() {
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  console.log("Profiles result:", error || data);
}
listTables();
