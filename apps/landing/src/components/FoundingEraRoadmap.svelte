<script lang="ts">
	const protocols = [
		{
			version: 'V1',
			name: 'Spatial Literacy',
			lesson: 'Learn to see the board.',
			detail: '3v3 bots on a discrete grid. Deterministic movement, collision resolution, point zones, pathfinding, and replay inspection.',
			status: 'live' as const,
		},
		{
			version: 'V2',
			name: 'Commitment & Formation',
			lesson: 'Balance local superiority against global coverage.',
			detail: 'Zone score multiplied by nearby friendly bots. Teams choose to swarm, screen, split, bait, or abandon — formation becomes a signature.',
			status: 'planned' as const,
		},
		{
			version: 'V3',
			name: 'Bot Variability & Upgrade Draft',
			lesson: 'Adapt strategy to non-uniform personnel.',
			detail: 'Introduce bot components and chassis traits. The first automated draft phase — teams write logic to evaluate and select upgrades.',
			status: 'planned' as const,
		},
		{
			version: 'V4',
			name: 'Wear & Recovery',
			lesson: 'Manage reliability, risk, and limited maintenance resources.',
			detail: 'Bots accrue wear from collisions and overuse. Recovery logic allocates limited repair actions across the roster between matches.',
			status: 'planned' as const,
		},
		{
			version: 'V5',
			name: 'Roster Depth & Chassis Draft',
			lesson: 'Plan across a season instead of a single match.',
			detail: 'Expand beyond active match bots. Backups, rotations, full chassis acquisition. Season arcs begin to matter more than isolated outcomes.',
			status: 'planned' as const,
		},
		{
			version: 'V6',
			name: 'Automated Trading',
			lesson: 'Value assets in context.',
			detail: 'Trade windows as scheduled phases. Team logic proposes, evaluates, counters, and accepts trades automatically — no manual approvals.',
			status: 'planned' as const,
		},
		{
			version: 'V7',
			name: 'Scouting & Imperfect Information',
			lesson: 'Make decisions under uncertainty.',
			detail: 'Spend limited scouting resources to reveal hidden traits. Draft and trade logic must reason from uncertain reports rather than perfect data.',
			status: 'planned' as const,
		},
		{
			version: 'V8',
			name: 'Lore System',
			lesson: 'The community authors the world\'s story, and the world responds.',
			detail: 'Community-submitted narrative events that touch real team state — bots, wear, draft records, trade history. The world gains memory.',
			status: 'planned' as const,
		},
		{
			version: 'V9',
			name: 'Manufacturers — End of the Founding Era',
			lesson: 'The league has grown too big to ignore. Now the money arrives.',
			detail: 'Robotics manufacturers have been watching. By V9 the league is popular enough that corporations begin developing advanced hardware specifically for it — pouring real money into designs that dwarf the humble prototype chassis the Founding Era was built on. The uniform bots of V1 are retired. The scrappy open-source experiment has become an industry. The Founding Era ends not as a patch note, but as a world event the community has been building toward.',
			status: 'planned' as const,
		},
	];

	const statusLabel = {
		live: 'In Development',
		planned: 'Planned',
		open: 'Community TBD',
	};

	const statusStyle = {
		live: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
		planned: 'bg-white/5 text-white/40 border-white/10',
		open: 'bg-amber-500/10 text-amber-400/70 border-amber-500/20',
	};
</script>

<section class="relative z-10 py-32 px-4 bg-[var(--color-background-deeper)]/60 border-y border-white/5">
	<div class="max-w-4xl mx-auto">
		<div class="text-center mb-6">
			<h2 class="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
				The <span class="text-[var(--color-brand-primary)]">Founding Era</span>
			</h2>
			<p class="text-xl text-white/40 font-medium uppercase tracking-widest mb-6">
				Era 1 — Protocols V1 through V9
			</p>
			<p class="text-white/50 max-w-2xl mx-auto leading-relaxed font-medium">
				The roadmap below reflects the current design intent. It will change — especially if a community forms and pushes in a more exciting direction. That's the point.
			</p>
		</div>

		<!-- Arc label -->
		<p class="text-center text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-brand-primary)]/60 mb-16">
			Learn the board → Build the organization → Author the world → Watch the world change around you
		</p>

		<div class="relative">
			<!-- Vertical line -->
			<div class="absolute left-[calc(2.5rem-1px)] top-0 bottom-0 w-px bg-white/10 hidden sm:block"></div>

			<div class="flex flex-col gap-6">
				{#each protocols as protocol, i}
					<div class="flex gap-6 items-start group">
						<!-- Version badge -->
						<div class="shrink-0 w-20 flex flex-col items-center gap-1 pt-1 hidden sm:flex">
							<div class="w-px flex-1 {i === 0 ? 'invisible' : 'bg-white/10'}"></div>
							<div class="size-5 rounded-full border {protocol.status === 'live' ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : protocol.status === 'open' ? 'bg-amber-500/20 border-amber-500/40' : 'bg-white/5 border-white/20'} z-10"></div>
							<div class="w-px flex-1 {i === protocols.length - 1 ? 'invisible' : 'bg-white/10'}"></div>
						</div>

						<!-- Card -->
						<div class="flex-1 glass-panel rounded-2xl p-6 {protocol.status === 'live' ? 'border-emerald-500/20' : ''} group-hover:border-white/20 transition-all">
							<div class="flex flex-wrap items-start justify-between gap-3 mb-3">
								<div class="flex items-center gap-3 flex-wrap">
									<span class="text-xs font-black uppercase tracking-widest text-white/30">{protocol.version}</span>
									{#if protocol.status !== 'open'}
										<h3 class="text-base font-black uppercase tracking-tight text-white">{protocol.name}</h3>
									{:else}
										<h3 class="text-base font-black uppercase tracking-tight text-white/30 italic">{protocol.name}</h3>
									{/if}
								</div>
								<span class="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded border {statusStyle[protocol.status]}">
									{statusLabel[protocol.status]}
								</span>
							</div>

							<p class="text-sm font-bold text-[var(--color-brand-secondary)]/80 mb-2">{protocol.lesson}</p>
							<p class="text-sm text-white/40 leading-relaxed">{protocol.detail}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
