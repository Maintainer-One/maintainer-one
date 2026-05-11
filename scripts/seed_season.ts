import { createClient } from 'npm:@supabase/supabase-js';
import "jsr:@std/dotenv/load";

const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables (URL or SERVICE_ROLE_KEY).");
    Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSeason() {
    console.log("🌱 Seeding a new Season...");

    // 1. Get League
    const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .select()
        .eq('name', 'Maintainer One')
        .maybeSingle();

    if (!league || leagueError) {
        console.error("❌ League not found or error:", leagueError);
        return;
    }

    // 2. Get Teams
    const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select()
        .eq('league_id', league.id);

    if (!teams || teams.length === 0 || teamsError) {
        console.error("❌ No teams found for the league.", teamsError);
        return;
    }

    // 3. Determine next season number
    const { data: seasons } = await supabase
        .from('seasons')
        .select('season_number')
        .eq('league_id', league.id)
        .order('season_number', { ascending: false })
        .limit(1);
    
    const nextSeasonNumber = seasons && seasons.length > 0 ? seasons[0].season_number + 1 : 1;

    // 4. Prepare Season Dates
    const now = new Date();
    const codeLockOffset = 1; // 1 minute offset from lock to start
    const roundIntervalMins = 5;
    const teamIds = teams.map(t => t.id);
    const n = teamIds.length;
    const numRounds = n - 1;
    
    // First round starts 1 minute after seed (at T+1)
    const firstRoundStartTime = new Date(now.getTime() + codeLockOffset * 60000);
    const finalRoundStartTime = new Date(firstRoundStartTime.getTime() + (numRounds - 1) * roundIntervalMins * 60000);
    const seasonEndDate = new Date(finalRoundStartTime.getTime() + roundIntervalMins * 60000);

    // 5. Create Season
    console.log(`🏆 Creating Season ${nextSeasonNumber}...`);
    const { defaultV1Config } = await import('../packages/protocols/v1/config.ts');
    const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .insert({
            league_id: league.id,
            season_number: nextSeasonNumber,
            name: `Season ${nextSeasonNumber}`,
            status: 'active',
            protocol_version: 'v1',
            protocol_config: { 
                ...defaultV1Config,
                gamesPerSeason: 1 // We want exactly one round robin
            },
            code_lock_offset_minutes: codeLockOffset,
            start_date: now.toISOString(),
            end_date: seasonEndDate.toISOString()
        })
        .select()
        .single();

    if (seasonError) {
        console.error("❌ Error creating season:", seasonError);
        return;
    }

    // 6. Generate Proper Round Robin Schedule (Circle Method)
    console.log("📅 Generating Round-Robin Schedule...");
    const gamesPerRound = n / 2;
    const matches = [];

    for (let round = 0; round < numRounds; round++) {
        const roundStartTime = new Date(firstRoundStartTime.getTime() + round * roundIntervalMins * 60000);
        const codeLockTime = new Date(roundStartTime.getTime() - codeLockOffset * 60000);

        for (let i = 0; i < gamesPerRound; i++) {
            const homeIdx = (round + i) % (n - 1);
            let awayIdx = (n - 1 - i + round) % (n - 1);

            // Last team stays fixed, others rotate around it
            if (i === 0) {
                awayIdx = n - 1;
            }

            // Fallback to null if active_version_id is somehow missing, but usually they should have one
            const homeVersion = teams.find(t => t.id === teamIds[homeIdx])?.active_version_id;
            const awayVersion = teams.find(t => t.id === teamIds[awayIdx])?.active_version_id;

            matches.push({
                league_id: league.id,
                season_id: season.id,
                home_team_id: teamIds[homeIdx],
                away_team_id: teamIds[awayIdx],
                scheduled_time: roundStartTime.toISOString(),
                code_lock_time: codeLockTime.toISOString(),
                status: 'scheduled',
                home_code_version_id: homeVersion,
                away_code_version_id: awayVersion,
                _temp_seed: Math.floor(Math.random() * 1000000) // Keep seed temporarily for the secrets table
            });
        }
    }

    // 7. Bulk insert matches and their secrets
    const { data: createdMatches, error: matchesError } = await supabase
        .from('matches')
        .insert(matches.map(({ _temp_seed, ...m }) => m))
        .select();
    
    if (matchesError) {
        console.error("❌ Error creating matches:", matchesError);
    } else if (createdMatches) {
        console.log(`✅ Created ${createdMatches.length} matches across ${numRounds} rounds.`);
        
        // Create secrets for all matches
        const secrets = createdMatches.map((m, index) => ({
            match_id: m.id,
            secret_seed: matches[index]._temp_seed
        }));
        
        const { error: secretsError } = await supabase.from('match_secrets').insert(secrets);
        if (secretsError) {
            console.error("❌ Error creating match secrets:", secretsError);
        } else {
            console.log(`✅ Generated ${secrets.length} match secrets.`);
        }

        console.log(`🚀 Round 1 starts at: ${firstRoundStartTime.toLocaleTimeString()} (LOCKED NOW)`);
        console.log(`🏁 Final Round starts at: ${finalRoundStartTime.toLocaleTimeString()}`);
    }

    console.log(`✅ Season ${nextSeasonNumber} Successfully Seeded!`);
}

if (import.meta.main) {
    seedSeason();
}
