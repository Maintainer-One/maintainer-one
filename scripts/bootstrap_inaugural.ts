import { createClient } from 'npm:@supabase/supabase-js';
import "jsr:@std/dotenv/load";
import { getProtocol } from '../packages/protocols/registry.ts';

const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables (URL or SERVICE_ROLE_KEY).");
    Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function bootstrap() {
    console.log("🌱 Bootstrapping Test Season...");

    // 0. Cleanup existing Inaugural data to ensure a fresh schedule
    console.log("🧹 Cleaning up old Inaugural data...");
    const { data: oldLeague } = await supabase.from('leagues').select('id').eq('name', 'Maintainer One').maybeSingle();
    if (oldLeague) {
        await supabase.from('seasons').delete().eq('league_id', oldLeague.id);
        // Cascading deletes will handle matches and secrets
    }

    // 1. Create/Get League
    let league;
    const { data: existingLeague } = await supabase.from('leagues').select().eq('name', 'Maintainer One').maybeSingle();
    
    if (existingLeague) {
        league = existingLeague;
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
    }

    console.log(`✅ Created League: ${league.name}`);

    // 2. Load and create teams with variations
    const variations = [
        { name: 'Amber Seekers', file: 'greedy_v1.ts', color: '#FFBF00', logo: '/logos/amber_seekers.svg', icon: '/logos/amber_seekers.svg' },
        { name: 'Beige Blockers', file: 'defensive_v1.ts', color: '#F5F5DC', logo: '/logos/beige_blockers.svg', icon: '/logos/beige_blockers.svg' },
        { name: 'Crimson Strikers', file: 'aggressive_v1.ts', color: '#DC143C', logo: '/logos/crimson_strikers.svg', icon: '/logos/crimson_strikers.svg' },
        { name: 'Denim Drifters', file: 'random_v1.ts', color: '#1560BD', logo: '/logos/denim_drifters.svg', icon: '/logos/denim_drifters.svg' },
        { name: 'Emerald Pausers', file: 'patient_v1.ts', color: '#50C878', logo: '/logos/emerald_pausers.svg', icon: '/logos/emerald_pausers.svg' },
        { name: 'Fuchsia Soloists', file: 'staggered_v1.ts', color: '#FF00FF', logo: '/logos/fuchsia_soloists.svg', icon: '/logos/fuchsia_soloists.svg' }
    ];

    const teams: any[] = [];

    for (const v of variations) {
        try {
            // Check if team exists in this league
            const { data: existingTeam } = await supabase
                .from('teams')
                .select()
                .eq('name', v.name)
                .eq('league_id', league.id)
                .maybeSingle();
            
            let team;
            if (existingTeam) {
                team = existingTeam;
                // Update styling
                await supabase.from('teams').update({ 
                    color: v.color, 
                    logo_url: v.logo, 
                    logo_icon_url: v.icon
                }).eq('id', team.id);
            } else {
                const { data: newTeam, error: teamError } = await supabase
                    .from('teams')
                    .insert({ name: v.name, league_id: league.id, color: v.color, logo_url: v.logo, logo_icon_url: v.icon })
                    .select()
                    .single();
                if (teamError) throw teamError;
                team = newTeam;
            }

            // Read file
            const code = await Deno.readTextFile(`./players/v1/${v.file}`);
            
            // Transpile TS to JS using esbuild in IIFE format
            const command = new Deno.Command("npx", {
                args: ["esbuild", "--loader=ts", "--minify=false", "--format=iife", "--global-name=TeamLogicBundle"],
                stdin: "piped",
                stdout: "piped",
            });
            const process = command.spawn();
            const writer = process.stdin.getWriter();
            await writer.write(new TextEncoder().encode(code));
            await writer.close();
            const { stdout } = await process.output();
            let compiledCode = new TextDecoder().decode(stdout);

            // Wrap to extract from the IIFE bundle
            compiledCode = `
                ${compiledCode}
                const logic = TeamLogicBundle.teamLogic || TeamLogicBundle.greedyLogic || TeamLogicBundle.default || TeamLogicBundle;
                return logic(sense);
            `;

            // Update or Create Version 1
            const { data: existingV1s } = await supabase
                .from('team_code_versions')
                .select('id')
                .eq('team_id', team.id)
                .eq('version_number', 1);

            let version;
            if (existingV1s && existingV1s.length > 0) {
                const { data, error: updateError } = await supabase
                    .from('team_code_versions')
                    .update({ source_code: code, compiled_code: compiledCode })
                    .eq('id', existingV1s[0].id)
                    .select()
                    .single();
                if (updateError) {
                    console.error(`Error updating version 1 for ${v.name}:`, updateError);
                    continue;
                }
                version = data;
                
                // Cleanup any duplicate version 1s from previous bugs
                if (existingV1s.length > 1) {
                    const duplicateIds = existingV1s.slice(1).map(v => v.id);
                    await supabase.from('team_code_versions').delete().in('id', duplicateIds);
                }
            } else {
                const { data, error: insertError } = await supabase
                    .from('team_code_versions')
                    .insert({
                        team_id: team.id,
                        version_number: 1,
                        source_code: code,
                        compiled_code: compiledCode
                    })
                    .select()
                    .single();
                
                if (insertError) {
                    console.error(`Error creating version 1 for ${v.name}:`, insertError);
                    continue;
                }
                version = data;
            }

            // Set Active Version ONLY if the team doesn't have one selected yet
            if (!team.active_version_id) {
                await supabase
                    .from('teams')
                    .update({ active_version_id: version.id })
                    .eq('id', team.id);
                team.active_version_id = version.id;
            }

            teams.push({ ...team, active_version_id: team.active_version_id });
            console.log(`✅ Created Team: ${v.name} (v1)`);
        } catch (err) {
            console.error(`Failed to process team ${v.name}:`, err);
        }
    }

    // 3. Prepare Season Dates
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

    // 4. Create Season
    console.log("🏆 Creating Season 1...");
    const { defaultV1Config } = await import('../packages/protocols/v1/config.ts');
    const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .insert({
            league_id: league.id,
            season_number: 1,
            name: 'Test Season',
            status: 'active',
            protocol_version: 'v1',
            protocol_config: { 
                ...defaultV1Config,
                gamesPerSeason: 1 // We want exactly one round robin for the seed
            },
            code_lock_offset_minutes: codeLockOffset,
            start_date: now.toISOString(),
            end_date: seasonEndDate.toISOString()
        })
        .select()
        .single();

    if (seasonError) {
        console.error("Error creating season:", seasonError);
        return;
    }

    // 5. Generate Proper Round Robin Schedule (Circle Method)
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

            matches.push({
                league_id: league.id,
                season_id: season.id,
                home_team_id: teamIds[homeIdx],
                away_team_id: teamIds[awayIdx],
                scheduled_time: roundStartTime.toISOString(),
                code_lock_time: codeLockTime.toISOString(),
                status: 'scheduled',
                // Note: 'seed' was renamed to 'public_seed' and is now handled via match_secrets
                home_code_version_id: teams.find(t => t.id === teamIds[homeIdx]).active_version_id,
                away_code_version_id: teams.find(t => t.id === teamIds[awayIdx]).active_version_id,
                _temp_seed: Math.floor(Math.random() * 1000000) // Keep seed temporarily for the secrets table
            });
        }
    }

    // 5. Bulk insert matches and their secrets
    const { data: createdMatches, error: matchesError } = await supabase
        .from('matches')
        .insert(matches.map(({ _temp_seed, ...m }) => m))
        .select();
    
    if (matchesError) {
        console.error("Error creating matches:", matchesError);
    } else if (createdMatches) {
        console.log(`✅ Created ${createdMatches.length} matches across ${numRounds} rounds.`);
        
        // Create secrets for all matches
        const secrets = createdMatches.map((m, index) => ({
            match_id: m.id,
            secret_seed: matches[index]._temp_seed
        }));
        
        const { error: secretsError } = await supabase.from('match_secrets').insert(secrets);
        if (secretsError) {
            console.error("Error creating match secrets:", secretsError);
        } else {
            console.log(`✅ Generated ${secrets.length} match secrets.`);
        }

        console.log(`🚀 Round 1 starts at: ${firstRoundStartTime.toLocaleTimeString()} (LOCKED NOW)`);
        console.log(`🏁 Final Round starts at: ${finalRoundStartTime.toLocaleTimeString()}`);
    }

    console.log("✅ Bootstrap Complete!");
}

if (import.meta.main) {
    bootstrap();
}
