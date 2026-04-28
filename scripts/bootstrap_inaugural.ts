import { createClient } from 'npm:@supabase/supabase-js';
import "jsr:@std/dotenv/load";

const supabaseUrl = Deno.env.get("PUBLIC_SUPABASE_URL");
const supabaseKey = Deno.env.get("PUBLIC_SUPABASE_ANON_KEY");

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables.");
    Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function bootstrap() {
    console.log("🌱 Bootstrapping Inaugural Season...");

    // 1. Create League
    const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .insert({ name: 'Inaugural League', protocol_version: 'v1' })
        .select()
        .single();

    if (leagueError) {
        console.error("Error creating league:", leagueError);
        return;
    }

    console.log(`✅ Created League: ${league.name}`);

    // 2. Load and create teams with variations
    const variations = [
        { name: 'Amber Seekers', file: 'greedy_v1.ts', color: '#FFBF00' },
        { name: 'Beige Blockers', file: 'defensive_v1.ts', color: '#F5F5DC' },
        { name: 'Crimson Strikers', file: 'aggressive_v1.ts', color: '#DC143C' },
        { name: 'Denim Drifters', file: 'random_v1.ts', color: '#1560BD' },
        { name: 'Emerald Pausers', file: 'patient_v1.ts', color: '#50C878' },
        { name: 'Fuchsia Soloists', file: 'staggered_v1.ts', color: '#FF00FF' }
    ];

    const teamIds: string[] = [];

    for (const v of variations) {
        try {
            // Read file
            const code = await Deno.readTextFile(`./players/v1/${v.file}`);
            
            // Transpile TS to JS using esbuild
            const command = new Deno.Command("npx", {
                args: [
                    "esbuild", 
                    `./players/v1/${v.file}`, 
                    "--minify", 
                    "--format=cjs",
                    "--platform=neutral"
                ],
            });
            const { stdout, stderr } = await command.output();
            
            if (stderr.length > 0) {
                console.error(`Esbuild error for ${v.name}:`, new TextDecoder().decode(stderr));
            }
            
            let compiledCode = new TextDecoder().decode(stdout);
            
            // The compiled code will be CJS: exports.teamLogic = ...
            // We wrap it to return the function when called by new Function('sense', compiledCode)
            compiledCode = `
                const module = { exports: {} };
                const exports = module.exports;
                ${compiledCode}
                const logic = module.exports.teamLogic || module.exports.greedyLogic || module.exports.default || exports.teamLogic || exports.greedyLogic;
                if (!logic) throw new Error("No logic function found in compiled code.");
                return logic(sense);
            `;



            // Create Team
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .insert({ name: v.name, league_id: league.id, color: v.color })
                .select()
                .single();

            if (teamError) {
                console.error(`Error creating team ${v.name}:`, teamError);
                continue;
            }

            // Create Code Version
            const { data: version, error: versionError } = await supabase
                .from('team_code_versions')
                .insert({
                    team_id: team.id,
                    version_number: 1,
                    source_code: code,
                    compiled_code: compiledCode
                })
                .select()
                .single();

            if (versionError) {
                console.error(`Error creating version for ${v.name}:`, versionError);
                continue;
            }

            // Set Active Version
            await supabase
                .from('teams')
                .update({ active_version_id: version.id })
                .eq('id', team.id);

            teamIds.push(team.id);
            console.log(`✅ Created Team: ${v.name} (v1)`);
        } catch (err) {
            console.error(`Failed to process team ${v.name}:`, err);
        }
    }

    // 3. Generate Round-Robin Schedule (5 rounds for 6 teams)
    console.log("📅 Generating Schedule...");
    const rounds = 5;
    const matchesPerRound = 3;
    
    const teams = [...teamIds];
    for (let r = 0; r < rounds; r++) {
        const scheduledTime = new Date();
        scheduledTime.setDate(scheduledTime.getDate() + r - 1); // Start with yesterday for first round
        scheduledTime.setHours(10, 0, 0, 0);

        for (let m = 0; m < matchesPerRound; m++) {
            const home = teams[m];
            const away = teams[teams.length - 1 - m];

            const { error: matchError } = await supabase
                .from('matches')
                .insert({
                    league_id: league.id,
                    home_team_id: home,
                    away_team_id: away,
                    scheduled_time: scheduledTime.toISOString(),
                    seed: Math.floor(Math.random() * 1000000)
                });
            
            if (matchError) {
                console.error(`Error creating match for round ${r}:`, matchError);
            }
        }

        // Rotate teams (keep first team fixed)
        if (teams.length > 2) {
            const fixed = teams[0];
            const rotating = teams.slice(1);
            const last = rotating.pop()!;
            rotating.unshift(last);
            teams[0] = fixed;
            for (let i = 0; i < rotating.length; i++) {
                teams[i + 1] = rotating[i];
            }
        }
    }

    console.log("✅ Bootstrap Complete!");
}

if (import.meta.main) {
    bootstrap();
}
