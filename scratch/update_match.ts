import { createClient } from 'npm:@supabase/supabase-js';
import "jsr:@std/dotenv/load";

const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL")!;
const supabaseKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function updateMatch() {
    const { error } = await supabase
        .from('matches')
        .update({ scheduled_time: new Date(Date.now() - 3600000).toISOString() })
        .eq('status', 'pending')
        .limit(1);
    
    if (error) console.error(error);
    else console.log("✅ Updated one match to be in the past.");
}

updateMatch();
