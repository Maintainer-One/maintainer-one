import { delay } from "https://deno.land/std@0.224.0/async/delay.ts";

/**
 * Supabase Managed Lifecycle Script
 * This script starts Supabase and keeps the process alive.
 * When the process is terminated (Ctrl+C, SIGTERM), it automatically shuts down Supabase.
 */

async function getSupabaseCommand() {
  const localPath = "./node_modules/supabase/bin/supabase";
  
  // 1. Try local node_modules binary
  try {
    const stats = await Deno.stat(localPath);
    if (stats.isFile) return localPath;
  } catch (e) {
    // Binary doesn't exist yet
  }

  // 2. If it's the 'supabase' npm package but no binary, try to download it
  try {
    const pkgStats = await Deno.stat("./node_modules/supabase/package.json");
    if (pkgStats.isFile) {
      console.log("📦 [Lifecycle] Local supabase package found but binary missing. Attempting to download...");
      const p = new Deno.Command("node", {
        args: ["./node_modules/supabase/scripts/postinstall.js"],
        stdout: "inherit",
        stderr: "inherit",
      }).spawn();
      const status = await p.status;
      if (status.success) return localPath;
    }
  } catch (e) {
    // Package doesn't exist
  }

  // 3. Fallback to global supabase on PATH
  return "supabase";
}

async function runSupabase(args: string[]) {
  const cmd = await getSupabaseCommand();
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  
  const p = new Deno.Command(cmd, {
    args: args,
    stdout: "inherit",
    stderr: "inherit",
  }).spawn();
  
  return await p.status;
}

let logProcess: Deno.ChildProcess | null = null;
let cleaningUp = false;

const cleanup = async () => {
  if (cleaningUp) return;
  cleaningUp = true;

  console.log("\n\n🧹 [Lifecycle] Detected exit signal. Cleaning up...");
  
  if (logProcess) {
    try {
      logProcess.kill("SIGINT");
    } catch (e) {
      // Ignore if already dead
    }
  }

  const status = await runSupabase(["stop", "--no-backup"]);
  if (status.success) {
    console.log("✅ [Lifecycle] Supabase stopped successfully.");
  } else {
    console.error("❌ [Lifecycle] Error stopping Supabase.");
  }
  Deno.exit(0);
};

// Listen for termination signals
Deno.addSignalListener("SIGINT", cleanup);
Deno.addSignalListener("SIGTERM", cleanup);

console.log("🛠️  [Lifecycle] Starting Supabase...");
const startStatus = await runSupabase(["start"]);

if (!startStatus.success) {
  console.error("❌ [Lifecycle] Failed to start Supabase.");
  Deno.exit(1);
}

console.log("\n✨ [Lifecycle] Supabase is UP and running.");
console.log("📖 [Lifecycle] Streaming logs below.");
console.log("⌨️  [Lifecycle] Commands: type 'migrate' to run migrations, 'reset' to reset DB, 'help' for more.\n");

// 1. Start input handler for interactive commands
(async () => {
  const decoder = new TextDecoder();
  for await (const chunk of Deno.stdin.readable) {
    const input = decoder.decode(chunk).trim().toLowerCase();
    
    if (input === "migrate") {
      console.log("\n🚀 [Lifecycle] Manually triggering migrations...");
      await runSupabase(["migration", "up"]);
      console.log("\n📖 [Lifecycle] Returning to logs...\n");
    } else if (input === "reset") {
      console.log("\n⚠️  [Lifecycle] Manually resetting database...");
      await runSupabase(["db", "reset"]);
      console.log("\n📖 [Lifecycle] Returning to logs...\n");
    } else if (input === "seed") {
      console.log("\n🌱 [Lifecycle] Running inaugural bootstrap script...");
      const p = new Deno.Command("deno", {
        args: ["run", "-A", "scripts/bootstrap_inaugural.ts"],
        stdout: "inherit",
        stderr: "inherit",
      }).spawn();
      await p.status;
      console.log("\n📖 [Lifecycle] Returning to logs...\n");
    } else if (input === "help") {
      console.log("\n❓ [Lifecycle] Available commands:");
      console.log("   - migrate : Runs 'supabase migration up'");
      console.log("   - reset   : Runs 'supabase db reset'");
      console.log("   - seed    : Runs 'scripts/bootstrap_inaugural.ts'");
      console.log("   - help    : Shows this message");
      console.log("   - Ctrl+C  : Stops Supabase and exits\n");
    }
  }
})();

// 2. Start following logs in the background (Aggregated Docker logs)
const projectName = Deno.cwd().split("/").pop();
logProcess = new Deno.Command("sh", {
  args: ["-c", `docker ps --filter "label=com.supabase.cli.project=${projectName}" -q | xargs -L 1 -P 0 docker logs -f`],
  stdout: "inherit",
  stderr: "inherit",
}).spawn();

// Keep the script alive by waiting for the log process
await logProcess.status;
