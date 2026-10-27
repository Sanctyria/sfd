<script lang="ts">
	import { getContext } from 'svelte';
	import { jsonLdScript } from '#lib/marketing/seo.js';

	type SiteAudio = { getMuted: () => boolean; getVolume: () => number };
	const siteAudio = getContext<SiteAudio | undefined>('site-audio');
	const characters = [
		{
			id: 'emberlyn',
			name: 'EMBERLYN',
			image: '/assets/characters/ember.png',
			color: '#F4845F',
			error: 'Area Devoured.',
			lore: 'The path forward has been swallowed by the molten core. The star-ashes offer no passage here.',
			frequency: 110
		},
		{
			id: 'kiaren',
			name: 'KIAREN',
			image: '/assets/characters/kai.png',
			color: '#6BBF7A',
			error: 'Ruin Unearthed.',
			lore: 'This coordinate has petrified. Only crystal chambers and magnetic currents remain in the silence.',
			frequency: 147
		},
		{
			id: 'liber',
			name: 'LIBER',
			image: '/assets/characters/lib.png',
			color: '#E882B4',
			error: 'Illusion Dispersed.',
			lore: 'Electromagnetic signals have refracted into nothingness. You chase a light that was never here.',
			frequency: 220
		},
		{
			id: 'saphyran',
			name: 'SAPHYRAN',
			image: '/assets/characters/saphy.png',
			color: '#6EB5FF',
			error: 'Absolute Zero.',
			lore: 'The thermal energy here has collapsed. Connection flash-frozen in the depths of ancient comets.',
			frequency: 294
		}
	];
	let activeIndex = $state(0);
	let supercharged = $state(false);
	let tilt = $state({ x: 0, y: 0 });
	const current = $derived(characters[activeIndex]);
	const schema = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: '404 - Lost in the Silence | Sanctyria',
		description:
			'You have drifted into the Great Silence. Choose a Flameborn avatar to guide you back to the Sanctyria realm.',
		url: 'https://sanctyria.com/404'
	};

	function sound(frequency: number, chord = false) {
		if (!siteAudio || siteAudio.getMuted()) return;
		try {
			const context = new AudioContext();
			for (const [index, multiplier] of (chord ? [1, 1.5, 2] : [1]).entries()) {
				const oscillator = context.createOscillator();
				const gain = context.createGain();
				const filter = context.createBiquadFilter();
				oscillator.connect(filter);
				filter.connect(gain);
				gain.connect(context.destination);
				oscillator.type = chord && index === 2 ? 'sine' : 'triangle';
				oscillator.frequency.setValueAtTime(frequency * multiplier, context.currentTime);
				oscillator.frequency.exponentialRampToValueAtTime(
					frequency * multiplier * (chord ? 0.8 : 1.5),
					context.currentTime + (chord ? 0.8 : 0.4)
				);
				filter.type = 'lowpass';
				filter.frequency.setValueAtTime(220, context.currentTime);
				filter.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.3);
				gain.gain.setValueAtTime(0, context.currentTime);
				gain.gain.linearRampToValueAtTime(
					siteAudio.getVolume() * (chord ? 0.1 : 0.15),
					context.currentTime + 0.1
				);
				gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + (chord ? 0.9 : 0.5));
				oscillator.start();
				oscillator.stop(context.currentTime + (chord ? 1 : 0.6));
			}
		} catch {
			return;
		}
	}
	function burst() {
		sound(current.frequency, true);
		supercharged = true;
		window.setTimeout(() => (supercharged = false), 800);
	}
	function move(event: MouseEvent) {
		const rect = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
		tilt = {
			x: (event.clientX - rect.left) / rect.width - 0.5,
			y: (event.clientY - rect.top) / rect.height - 0.5
		};
	}
</script>

<svelte:head>
	<title>404 - Lost in the Silence | Sanctyria</title>
	<meta
		name="description"
		content="You have drifted into the Great Silence. Choose a Flameborn avatar to guide you back to the Sanctyria universe."
	/>
	<meta name="robots" content="noindex, follow" />
	<link rel="canonical" href="https://sanctyria.com/404" />
	<meta property="og:title" content="404 - Lost in the Silence | Sanctyria" />
	<meta
		property="og:description"
		content="You have drifted into the Great Silence. Choose a Flameborn avatar to guide you back to the Sanctyria universe."
	/>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript escapes HTML terminators in structured data. -->
	{@html jsonLdScript(schema)}
</svelte:head>

<div
	class="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#080809] text-white"
>
	<div
		class="pointer-events-none absolute inset-0 opacity-[.35]"
		style="background-image:url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E&quot;);background-size:200px 200px"
	></div>
	<div
		class="pointer-events-none absolute inset-0 z-[2] opacity-35 blur-[130px] transition-all duration-1000"
		style={`background:radial-gradient(circle at 50% 45%,${current.color}35 0%,transparent 65%)`}
	></div>
	<div
		class="pointer-events-none absolute inset-x-0 top-[20%] z-[3] flex items-center justify-center font-anton whitespace-nowrap text-white/5 select-none"
		style={`font-size:clamp(140px,34vw,520px);line-height:1;-webkit-text-stroke:1.5px rgba(255,255,255,.08);text-shadow:0 0 90px ${current.color}18`}
	>
		404
	</div>
	<div
		class="relative z-20 flex w-full max-w-2xl flex-col items-center justify-center px-6 pt-16 pb-12 select-none"
	>
		<div
			role="presentation"
			onmousemove={move}
			onmouseleave={() => (tilt = { x: 0, y: 0 })}
			onclick={burst}
			class="group relative flex aspect-[.68/1] w-[240px] cursor-pointer items-end justify-center transition-all duration-700 ease-out sm:w-[320px]"
			style={`transform:perspective(1000px) rotateY(${tilt.x * 24}deg) rotateX(${-tilt.y * 24}deg) scale(${supercharged ? 1.06 : 1});transition-duration:${supercharged ? '150ms' : '180ms'}`}
		>
			<div
				class="pointer-events-none absolute inset-6 rounded-3xl opacity-25 blur-3xl transition-all duration-700"
				style={`background-color:${current.color};box-shadow:0 0 100px ${current.color}`}
			></div>
			<img
				src={current.image}
				alt={current.name}
				class="pointer-events-none h-full w-full object-contain object-bottom brightness-95 drop-shadow-[0_12px_45px_rgba(0,0,0,.85)] transition-all duration-300 group-hover:brightness-105"
				draggable="false"
			/>
		</div>
		<div class="mt-8 flex items-center justify-center gap-6">
			{#each characters as character, index (character.id)}<button
					type="button"
					onclick={() => {
						activeIndex = index;
						sound(character.frequency);
					}}
					aria-label={`Switch element to ${character.name}`}
					class="group relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-all duration-300"
					style={`border-color:${activeIndex === index ? character.color : 'rgba(255,255,255,.12)'};background:${activeIndex === index ? `${character.color}25` : 'transparent'};box-shadow:${activeIndex === index ? `0 0 15px ${character.color}80` : 'none'}`}
					><span
						class="h-2.5 w-2.5 scale-75 rounded-full transition-all group-hover:scale-100"
						style={`background:${character.color};box-shadow:${activeIndex === index ? `0 0 8px ${character.color}` : 'none'}`}
					></span></button
				>{/each}
		</div>
		<div class="mt-8 max-w-md text-center">
			<h1
				class="mb-3 font-display text-3xl font-normal tracking-tight text-white uppercase sm:text-4xl"
			>
				Oops! {current.error}
			</h1>
			<p class="min-h-[50px] px-2 font-body text-sm leading-relaxed text-white/50 select-text">
				{current.lore}
			</p>
		</div>
		<div class="mt-8 flex w-full flex-col items-center justify-center gap-4 sm:flex-row">
			<button
				type="button"
				onclick={burst}
				class="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/[.02] px-6 py-4 font-mono text-xs tracking-widest text-white/70 uppercase transition-all duration-300 hover:border-white/30 hover:text-white sm:w-auto"
				><span
					class="h-2 w-2 animate-pulse rounded-full"
					style={`background:${current.color};box-shadow:0 0 8px ${current.color}`}
				></span>Ignite Beacon</button
			><a
				href="/"
				class="w-full rounded-full bg-white px-8 py-4 text-center font-body text-sm font-semibold text-black shadow-[0_4px_20px_rgba(255,255,255,.1)] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_4px_25px_rgba(255,255,255,.18)] active:scale-[.98] sm:w-auto"
				>Return to Sanctyria</a
			><a
				href="/nations"
				class="w-full rounded-full border border-white/10 bg-transparent px-8 py-4 text-center font-body text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:border-white/20 hover:bg-white/5 active:scale-[.98] sm:w-auto"
				>Explore Nations</a
			>
		</div>
	</div>
</div>
