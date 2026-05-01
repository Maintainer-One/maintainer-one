import { createClient } from 'https://esm.sh/@supabase/supabase-js';
import * as dotenv from 'https://esm.sh/dotenv';

// Read .env file manually since dotenv.config() might not work smoothly in deno with local .env file in a specific way sometimes
const env = await Deno.readTextFile('.env');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);
const { data, error } = await supabase.from('team_code_versions').select('source_code, compiled_code').limit(1);
console.log(data ? data[0].source_code : error);
