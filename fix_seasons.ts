import { createClient } from 'npm:@supabase/supabase-js';
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

const env = await load();
const supabaseUrl = env['PUBLIC_SUPABASE_URL'];
const supabaseKey = env['PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data: seasons, error } = await supabase.from('seasons').select('*');
    if (error) throw error;

    for (const season of seasons) {
        if (!season.end_date) continue;
        const d = new Date(season.end_date);
        d.setHours(23, 59, 59, 999);
        await supabase.from('seasons').update({ end_date: d.toISOString() }).eq('id', season.id);
    }
    console.log('Fixed seasons.');
}
main();
