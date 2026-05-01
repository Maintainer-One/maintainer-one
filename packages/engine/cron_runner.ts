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

async function runCron() {
    console.log("🚀 Starting Automated Season Runner...");

    // 1. Fetch pending matches scheduled for now or earlier
    const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select(`
            *,
            leagues (protocol_version, protocol_config),
            home_team:teams!home_team_id (id, name, color, active_version_id),
            away_team:teams!away_team_id (id, name, color, active_version_id)
        `)
        .eq('status', 'pending')
        .lte('scheduled_time', new Date().toISOString());

    if (matchError) {
        console.error("Error fetching matches:", matchError);
        return;
    }

    if (!matches || matches.length === 0) {
        console.log("No pending matches to simulate.");
        return;
    }

    console.log(`Found ${matches.length} matches to simulate.`);

    for (const match of matches) {
        try {
            console.log(`🏟 Simulating Match: ${match.id}`);

            // 2. Fetch code versions
            // @ts-ignore: home_team and away_team are returned by the join
            const homeVersionId = match.home_team.active_version_id;
            // @ts-ignore
            const awayVersionId = match.away_team.active_version_id;

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

            // 4. Update Match in DB
            const { error: updateError } = await supabase
                .from('matches')
                .update({
                    status: 'simulated',
                    home_score: finalState.teams.A.score,
                    away_score: finalState.teams.B.score,
                    home_code_version_id: homeVersionId,
                    away_code_version_id: awayVersionId,
                    winner_id: finalState.winner === 'A' ? match.home_team_id : (finalState.winner === 'B' ? match.away_team_id : null)
                })
                .eq('id', match.id);

            if (updateError) {
                console.error(`Error updating match ${match.id}:`, updateError);
            } else {
                console.log(`✅ Match ${match.id} simulated successfully. Score: ${finalState.teams.A.score} - ${finalState.teams.B.score}`);
            }

        } catch (err) {
            console.error(`Unexpected error simulating match ${match.id}:`, err);
        }
    }
}

// Deno Cron (Production) - Runs daily at 9:00 AM
// @ts-ignore: Deno.cron is a global in Deno environment
if (typeof Deno.cron === 'function') {
    // @ts-ignore
    Deno.cron("Daily Season Simulation", "0 9 * * *", runCron);
}

// Local Trigger
if (import.meta.main) {
    runCron();
}
