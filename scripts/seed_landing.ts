import { createClient } from 'npm:@supabase/supabase-js';
import "jsr:@std/dotenv/load";

const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables (PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).");
    Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log("🌱 Seeding Founding Teams for Landing Page...");

    // 1. Create/Get League
    let league;
    const { data: existingLeague } = await supabase
        .from('leagues')
        .select()
        .eq('name', 'Maintainer One')
        .maybeSingle();

    if (existingLeague) {
        league = existingLeague;
        console.log(`✅ League Exists: ${league.name}`);
    } else {
        const { data: newLeague, error: leagueError } = await supabase
            .from('leagues')
            .insert({ name: 'Maintainer One', protocol_version: 'v1' })
            .select()
            .single();

        if (leagueError) {
            console.error("Error creating league:", leagueError);
            return;
        }
        league = newLeague;
        console.log(`✅ Created League: ${league.name}`);
    }

    // 2. Founding Teams Data
    const foundingTeams = [
        { name: 'Amber Seekers', color: '#FFBF00', logo: '/logos/amber_seekers.svg' },
        { name: 'Beige Blockers', color: '#F5F5DC', logo: '/logos/beige_blockers.svg' },
        { name: 'Crimson Strikers', color: '#DC143C', logo: '/logos/crimson_strikers.svg' },
        { name: 'Denim Drifters', color: '#1560BD', logo: '/logos/denim_drifters.svg' },
        { name: 'Emerald Pausers', color: '#50C878', logo: '/logos/emerald_pausers.svg' },
        { name: 'Fuchsia Soloists', color: '#FF00FF', logo: '/logos/fuchsia_soloists.svg' }
    ];

    for (const t of foundingTeams) {
        const { data: existingTeam } = await supabase
            .from('teams')
            .select()
            .eq('name', t.name)
            .eq('league_id', league.id)
            .maybeSingle();

        if (existingTeam) {
            const { error: updateError } = await supabase
                .from('teams')
                .update({ color: t.color, logo_url: t.logo, logo_icon_url: t.logo })
                .eq('id', existingTeam.id);
            if (updateError) console.error(`❌ Failed to update team ${t.name}:`, updateError);
            else console.log(`✅ Updated Team: ${t.name}`);
        } else {
            const { error: teamError } = await supabase
                .from('teams')
                .insert({ 
                    name: t.name, 
                    league_id: league.id, 
                    color: t.color, 
                    logo_url: t.logo, 
                    logo_icon_url: t.logo 
                });

            if (teamError) {
                console.error(`❌ Failed to seed team ${t.name}:`, teamError);
            } else {
                console.log(`✅ Seeded Team: ${t.name}`);
            }
        }
    }

    console.log("\n✨ Landing page seed complete! Your 'Founding Teams' section should now be populated.");
}

seed();
