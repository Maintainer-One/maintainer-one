<script lang="ts">
	import { onMount } from 'svelte';

	let { targetDate } = $props<{ targetDate: string }>();
	
	let timeLeft = $state({
		days: 0,
		hours: 0,
		minutes: 0,
		seconds: 0
	});

	function updateCountdown() {
		const target = new Date(targetDate).getTime();
		const now = new Date().getTime();
		const difference = target - now;

		if (difference > 0) {
			timeLeft = {
				days: Math.floor(difference / (1000 * 60 * 60 * 24)),
				hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
				minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
				seconds: Math.floor((difference % (1000 * 60)) / 1000)
			};
		}
	}

	onMount(() => {
		updateCountdown();
		const interval = setInterval(updateCountdown, 1000);
		return () => clearInterval(interval);
	});
</script>

<div class="flex gap-4 md:gap-8 justify-center items-center font-black uppercase tracking-tighter">
	<div class="flex flex-col items-center">
		<span class="text-4xl md:text-6xl text-[var(--color-brand-primary)]">{timeLeft.days}</span>
		<span class="text-[10px] md:text-xs text-white/40 tracking-[0.3em]">Days</span>
	</div>
	<span class="text-2xl md:text-4xl text-white/20 mt-[-1rem]">:</span>
	<div class="flex flex-col items-center">
		<span class="text-4xl md:text-6xl text-white">{timeLeft.hours}</span>
		<span class="text-[10px] md:text-xs text-white/40 tracking-[0.3em]">Hours</span>
	</div>
	<span class="text-2xl md:text-4xl text-white/20 mt-[-1rem]">:</span>
	<div class="flex flex-col items-center">
		<span class="text-4xl md:text-6xl text-white">{timeLeft.minutes}</span>
		<span class="text-[10px] md:text-xs text-white/40 tracking-[0.3em]">Mins</span>
	</div>
	<span class="text-2xl md:text-4xl text-white/20 mt-[-1rem]">:</span>
	<div class="flex flex-col items-center">
		<span class="text-4xl md:text-6xl text-white/60">{timeLeft.seconds}</span>
		<span class="text-[10px] md:text-xs text-white/40 tracking-[0.3em]">Secs</span>
	</div>
</div>
