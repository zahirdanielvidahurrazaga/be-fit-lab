import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fifaowaiokauhuqklzwe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZmFvd2Fpb2thdWh1cWtsendlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxNzI4NTQsImV4cCI6MjA5Mjc0ODg1NH0.lVWItU1dSv9rwZkCRZmCjNXo0fPc794nEpDLwnh5FrQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  // Test Insert
  const { data: insertData, error: insertError } = await supabase.from('badges_config').insert([{
    icon: '🧪', label: 'Test', rule_type: 'MANUAL', rule_value: 0
  }]).select();
  console.log('INSERT ERROR:', insertError);
  console.log('INSERT DATA:', insertData);

  const { data, error } = await supabase.from('badges_config').select('*');
  if (error) {
    console.error('ERROR FETCHING:', error);
  } else {
    console.log('DATA:', data);
  }
}
check();
