import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fifaowaiokauhuqklzwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZmFvd2Fpb2thdWh1cWtsendlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzI4NTQsImV4cCI6MjA5Mjc0ODg1NH0.lVWItU1dSv9rwZkCRZmCjNXo0fPc794nEpDLwnh5FrQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data: badges } = await supabase.from('badges_config').select('*');
  console.log('Badge Configs:', JSON.stringify(badges, null, 2));

  // Find a specific user, or just get custom badges of the first user
  const { data: users } = await supabase.from('users').select('id, full_name, custom_badges').limit(5);
  console.log('Users Custom Badges:', JSON.stringify(users, null, 2));
}

checkData();
