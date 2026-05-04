import { createClient } from 'npm:@supabase/supabase-js';
import { simulateMatch } from './match_runner.ts';
import { loadLogicFromString } from './logic_loader.ts';
import "jsr:@std/dotenv/load";

const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL");
const supabaseKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables.");
    Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateLockedMatches() {
    // 1. Fetch scheduled matches past their code lock time
    const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select(`
            *,
            leagues (protocol_version, protocol_config),
            home_team:teams!home_team_id (id, name, color, active_version_id),
            away_team:teams!away_team_id (id, name, color, active_version_id)
        `)
        .eq('status', 'scheduled')
        .lte('code_lock_time', new Date().toISOString());

    if (matchError) {
        console.error("Error fetching locked matches:", matchError);
        return;
    }

    if (!matches || matches.length === 0) return;

    console.log(`Found ${matches.length} matches ready to simulate (Code Locked).`);

    for (const match of matches) {
        try {
            console.log(`🏟 Simulating Match: ${match.id}`);

            // 2. Fetch code versions
            // @ts-ignore
            const homeVersionId = match.home_override_version_id || match.home_team.active_version_id;
            // @ts-ignore
            const awayVersionId = match.away_override_version_id || match.away_team.active_version_id;

            if (!homeVersionId || !awayVersionId) {
                console.error(`Skipping match ${match.id}: One or both teams lack an active version.`);
                continue;
            }

            const { data: versions, error: versionError } = await supabase
                .from('team_code_versions')
                .select('id, compiled_code')
                .in('id', [homeVersionId, awayVersionId]);

            if (versionError || !versions || versions.length < 2) {
                console.error(`Error fetching code versions for match ${match.id}:`, versionError);
                continue;
            }

            const homeCode = versions.find(v => v.id === homeVersionId)!.compiled_code;
            const awayCode = versions.find(v => v.id === awayVersionId)!.compiled_code;

            const homeLogic = loadLogicFromString(homeCode);
            const awayLogic = loadLogicFromString(awayCode);

            // 3. Run Simulation
            const { finalState } = await simulateMatch(
                Number(match.seed),
                // @ts-ignore
                match.leagues.protocol_version,
                homeLogic,
                awayLogic,
                // @ts-ignore
                match.leagues.protocol_config,
                // @ts-ignore
                { A: match.home_team, B: match.away_team }
            );

            // 4. Update Match in DB to 'simmed'
            const { error: updateError } = await supabase
                .from('matches')
                .update({
                    status: 'simmed',
                    home_score: finalState.teams.A.score,
                    away_score: finalState.teams.B.score,
                    home_code_version_id: homeVersionId,
                    away_code_version_id: awayVersionId,
                    winner_id: finalState.winner === 'A' ? match.home_team_id : (finalState.winner === 'B' ? match.away_team_id : null),
                    stats: {
                        home_team: finalState.teams.A.stats,
                        away_team: finalState.teams.B.stats,
                        players: finalState.players.map((p: any) => ({
                            id: p.id,
                            team: p.team,
                            stats: p.stats
                        }))
                    }
                })
                .eq('id', match.id);

            if (updateError) {
                console.error(`Error updating match ${match.id}:`, updateError);
            } else {
                console.log(`✅ Match ${match.id} simulated successfully. Awaiting broadcast time.`);
            }

        } catch (err) {
            console.error(`Unexpected error simulating match ${match.id}:`, err);
        }
    }
}

async function broadcastPlayedMatches() {
    // Transition matches from 'simmed' to 'played' when scheduled_time arrives
    const { data: matches, error } = await supabase
        .from('matches')
        .select('id')
        .eq('status', 'simmed')
        .lte('scheduled_time', new Date().toISOString());

    if (error) {
        console.error("Error fetching broadcast-ready matches:", error);
        return;
    }

    if (!matches || matches.length === 0) return;

    for (const match of matches) {
        const { error: updateError } = await supabase
            .from('matches')
            .update({ status: 'played' })
            .eq('id', match.id);

        if (updateError) {
            console.error(`Failed to broadcast match ${match.id}:`, updateError);
        } else {
            console.log(`📺 Match ${match.id} is now LIVE (Played)!`);
        }
    }
}

async function runCron() {
    console.log(`[${new Date().toISOString()}] Running Match Lifecycle Cron...`);
    await simulateLockedMatches();
    await broadcastPlayedMatches();
}

// Deno Cron (Production) - Runs every minute
// @ts-ignore: Deno.cron is a global in Deno environment
if (typeof Deno.cron === 'function') {
    // @ts-ignore
    Deno.cron("Match Lifecycle Runner", "* * * * *", runCron);
}

// Local Trigger & Polling Loop
if (import.meta.main) {
    console.log("Starting local cron runner (polling every 10 seconds)...");
    runCron(); // run immediately
    setInterval(runCron, 10000);
}
