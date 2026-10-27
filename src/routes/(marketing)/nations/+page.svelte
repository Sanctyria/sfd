<script lang="ts">
	import { brandedOgImageUrl } from '#lib/community/og.js';
	import { onMount, getContext } from 'svelte';
	import {
		ChevronLeft,
		ChevronRight,
		Play,
		Users,
		MapPin,
		Sword,
		Shield,
		Flame,
		Zap,
		Droplets,
		Wind
	} from '@lucide/svelte';
	import { jsonLdScript } from '#lib/marketing/seo.js';
	import { playNationSwitchTone } from '#lib/marketing/soundEffects.js';

	type SiteAudio = { getMuted: () => boolean; getVolume: () => number };
	const siteAudio = getContext<SiteAudio>('site-audio');
	const nations = [
		{
			id: 'arcanum',
			name: 'Arcanum',
			subtitle: 'The Readers Nation',
			description:
				'Draped in perpetual dusk, Arcanum trades in memory and shadow. Its archivists preserve forbidden histories erased from every other nation’s record—at a price.',
			stat1Label: 'Founded',
			stat1Value: 'Year 0 — Pre-Silence',
			stat2Label: 'Population',
			stat2Value: '2.3 M Residents',
			era: 'AGE OF SILENCE',
			element: 'SHADOW',
			population: '2.3M',
			icon: Flame,
			accent: '#a78bfa',
			audio: '/assets/music/Arcanum.mp3'
		},
		{
			id: 'battir',
			name: 'Battir',
			subtitle: 'The Gamers Nation',
			description:
				'Built in the caldera of a dead volcano, Battir is the engine of the known world. Its foundries run without pause, and its citizens measure worth in steel, not blood.',
			stat1Label: 'Founded',
			stat1Value: 'Year 214 — Age of Iron',
			stat2Label: 'Output',
			stat2Value: '40% World Supply',
			era: 'AGE OF IRON',
			element: 'FORGE',
			population: '5.8M',
			icon: Shield,
			accent: '#f97316',
			audio: '/assets/music/Battir.mp3'
		},
		{
			id: 'chromar',
			name: 'Chromar',
			subtitle: 'The Artist Nation',
			description:
				'Carved into sea-cliffs that catch the first and last light of every day, Chromar is both beacon and fortress. Its lantern-priests chart stars that no longer exist—yet always come true.',
			stat1Label: 'Founded',
			stat1Value: 'Year 88 — Dawn Compact',
			stat2Label: 'Fleet Size',
			stat2Value: '1,200 Vessels',
			era: 'DAWN COMPACT',
			element: 'LIGHT',
			population: '3.1M',
			icon: Zap,
			accent: '#fbbf24',
			audio: '/assets/music/Chromar.mp3'
		},
		{
			id: 'mythos',
			name: 'Mythos',
			subtitle: 'The Roleplayer Nation',
			description:
				'A nation that grew from a wall. The Mythos is not ruled—it is tended. Its wardens cultivate a living palisade of ancient briar that remembers every war it has stopped.',
			stat1Label: 'Founded',
			stat1Value: 'Year 401 — The Great Sealing',
			stat2Label: 'Wall Length',
			stat2Value: '4,200 km',
			era: 'THE GREAT SEALING',
			element: 'LIFE',
			population: '1.6M',
			icon: Shield,
			accent: '#4ade80',
			audio: '/assets/music/Mythos.mp3'
		},
		{
			id: 'nexara',
			name: 'Nexara',
			subtitle: 'The Anime and Series Nation',
			description:
				'Beneath three ocean floors lies Nexara, a republic of tunnels and bioluminescent coral. Its citizens have never seen the sun—and consider that a point of pride.',
			stat1Label: 'Founded',
			stat1Value: 'Year 560 — The Descent',
			stat2Label: 'Depth',
			stat2Value: '14 km Below Sea',
			era: 'THE DESCENT',
			element: 'DEPTH',
			population: '900K',
			icon: Droplets,
			accent: '#38bdf8',
			audio: '/assets/music/Nexara.mp3'
		},
		{
			id: 'lyris',
			name: 'Lyris',
			subtitle: 'The Creators Nation',
			description:
				'Across the Mirrorflats, where heat bends horizon into sky, Lyris has turned scarcity into doctrine. Its Solar Conclave has mapped every known ley-line of surviving warmth.',
			stat1Label: 'Founded',
			stat1Value: 'Year 33 — The Pact of Ash',
			stat2Label: 'Territory',
			stat2Value: '1.2M km²',
			era: 'PACT OF ASH',
			element: 'SOLAR',
			population: '4.4M',
			icon: Flame,
			accent: '#fb923c',
			audio: '/assets/music/Lyris.mp3'
		},
		{
			id: 'quillan',
			name: 'Quillan',
			subtitle: 'The Writers Nation',
			description:
				'Above the cloudline, Quillan’s citadels are carved directly into glaciers that predate recorded history. Its people speak in two tongues: one for summer, one for the Long Dark.',
			stat1Label: 'Founded',
			stat1Value: 'Year 112 — The Climb',
			stat2Label: 'Altitude',
			stat2Value: '6,800 m Average',
			era: 'THE CLIMB',
			element: 'ICE',
			population: '780K',
			icon: Wind,
			accent: '#93c5fd',
			audio: '/assets/music/Quillan.mp3'
		},
		{
			id: 'voxen',
			name: 'Voxen',
			subtitle: 'The Voice and Musician Nation',
			description:
				'In Voxen, the forest votes. Ancient root-networks link every settlement into a single murmuring intelligence. Its elected Speakers translate the canopy’s will into law.',
			stat1Label: 'Founded',
			stat1Value: 'Year 0 — The First Growth',
			stat2Label: 'Tree Coverage',
			stat2Value: '98.4% Territory',
			era: 'THE FIRST GROWTH',
			element: 'VERDURE',
			population: '2.9M',
			icon: Users,
			accent: '#86efac',
			audio: '/assets/music/Voxen.mp3'
		}
	];
	const descriptions = [
		'Draped in perpetual dusk, Arcanum trades in memory and shadow. Its archivists preserve forbidden histories erased from every other nation’s record.',
		'Built in the caldera of a dead volcano, Battir is the engine of the known world. Its foundries run without pause.',
		'Carved into sea-cliffs that catch the first and last light of every day, Chromar is both beacon and fortress. Its lantern-priests chart stars.',
		'A nation that grew from a wall. The Mythos is not ruled—it is tended. Its wardens cultivate a living palisade of ancient briar.',
		'Beneath three ocean floors lies Nexara, a republic of tunnels and bioluminescent coral. Its citizens have never seen the sun.',
		'Across the Mirrorflats, where heat bends horizon into sky, Lyris has turned scarcity into doctrine.',
		'Above the cloudline, Quillan’s citadels are carved directly into glaciers. Its people speak in two tongues.',
		'In Voxen, the forest votes. Ancient root-networks link every settlement into a single murmuring intelligence.'
	];
	let activeIndex = $state(0);
	let animating = $state(false);
	let container: HTMLDivElement;
	let audio = $state<HTMLAudioElement>();
	const nation = $derived(nations[activeIndex]);
	const schema = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'CollectionPage',
				'@id': 'https://sanctyria.com/nations/#webpage',
				url: 'https://sanctyria.com/nations',
				name: 'Nations of Sanctyria | The Eight Realms of Eternia',
				description:
					'Journey through the 8 nations of Sanctyria: Arcanum, Battir, Chromar, Mythos, Nexara, Lyris, Quillan, and Voxen. Explore elements, eras, and cultures.',
				isPartOf: { '@id': 'https://sanctyria.com/#website' },
				mainEntity: {
					'@type': 'ItemList',
					name: 'The Eight Nations of Eternia',
					description: 'The eight reconstructed realms of the Sanctyria universe.',
					itemListElement: nations.map((entry, index) => ({
						'@type': 'ListItem',
						position: index + 1,
						item: { '@type': 'CreativeWork', name: entry.name, description: descriptions[index] }
					}))
				}
			}
		]
	};

	function select(index: number) {
		if (animating || index === activeIndex) return;
		playNationSwitchTone(
			index > activeIndex ? 'next' : 'prev',
			siteAudio.getMuted() ? 0 : siteAudio.getVolume()
		);
		animating = true;
		activeIndex = (index + nations.length) % nations.length;
		window.setTimeout(() => (animating = false), 700);
	}

	onMount(() => {
		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			select(activeIndex + (event.deltaY < 0 ? 1 : -1));
		};
		container.addEventListener('wheel', onWheel, { passive: false });
		return () => {
			container.removeEventListener('wheel', onWheel);
			audio?.pause();
			window.speechSynthesis?.cancel();
		};
	});

	$effect(() => {
		const selectedNation = nations[activeIndex];
		let played = false;
		let active = true;
		window.speechSynthesis?.cancel();
		const player = new Audio(selectedNation.audio);
		player.loop = true;
		audio = player;
		const playMusic = () => {
			if (!active || played) return;
			played = true;
			player.play().catch(() => undefined);
		};
		const utterance = new SpeechSynthesisUtterance(
			`${selectedNation.name}. ${selectedNation.subtitle}.`
		);
		utterance.rate = 0.88;
		utterance.pitch = 0.75;
		utterance.onend = playMusic;
		utterance.onerror = playMusic;
		window.speechSynthesis?.speak(utterance);
		const fallbackTimer = window.setTimeout(playMusic, 5000);
		return () => {
			active = false;
			window.clearTimeout(fallbackTimer);
			window.speechSynthesis?.cancel();
			player.pause();
		};
	});

	$effect(() => {
		if (!audio) return;
		audio.muted = siteAudio.getMuted();
		audio.volume = siteAudio.getVolume();
	});
</script>

<svelte:head>
	<title>Nations of Sanctyria | The Eight Realms of Eternia</title>
	<meta
		name="description"
		content="Journey through the 8 nations of Sanctyria: Arcanum, Battir, Chromar, Mythos, Nexara, Lyris, Quillan, and Voxen. Explore elements, eras, and cultures."
	/>
	<meta
		name="keywords"
		content="nations of sanctyria, fantasy worldbuilding, Arcanum, Battir, Chromar, Mythos, Nexara, Lyris, Quillan, Voxen, fantasy nations"
	/>
	<link rel="canonical" href="https://sanctyria.com/nations" />
	<meta property="og:title" content="Nations of Sanctyria | The Eight Realms of Eternia" />
	<meta
		property="og:description"
		content="Journey through the 8 nations of Sanctyria: Arcanum, Battir, Chromar, Mythos, Nexara, Lyris, Quillan, and Voxen. Explore elements, eras, and cultures."
	/>
	<meta property="og:url" content="https://sanctyria.com/nations" />
	<meta
		property="og:image"
		content={brandedOgImageUrl(
			'Nations of Sanctyria',
			'Journey through Arcanum, Battir, Chromar, Mythos, Nexara, Lyris, Quillan, and Voxen.',
			'EIGHT REALMS'
		)}
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Nations of Sanctyria | The Eight Realms of Eternia" />
	<meta
		name="twitter:description"
		content="Journey through the 8 nations of Sanctyria: Arcanum, Battir, Chromar, Mythos, Nexara, Lyris, Quillan, and Voxen. Explore elements, eras, and cultures."
	/>
	<meta
		name="twitter:image"
		content={brandedOgImageUrl(
			'Nations of Sanctyria',
			'Journey through Arcanum, Battir, Chromar, Mythos, Nexara, Lyris, Quillan, and Voxen.',
			'EIGHT REALMS'
		)}
	/>
	<meta property="og:type" content="website" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript escapes HTML terminators in structured data. -->
	{@html jsonLdScript(schema)}
</svelte:head>

<div bind:this={container} class="relative h-screen w-full overflow-hidden bg-black">
	<video
		class="absolute inset-0 h-full w-full object-cover"
		style="z-index:0"
		src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260406_094145_4a271a6c-3869-4f1c-8aa7-aeb0cb227994.mp4"
		autoplay
		loop
		muted
		playsinline
	></video>
	<div
		class="pointer-events-none absolute inset-0"
		style="z-index:1;backdrop-filter:blur(18px);mask-image:linear-gradient(to top,black 0%,transparent 45%)"
	></div>
	<div
		class="pointer-events-none absolute inset-0"
		style="z-index:2;background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,.55) 100%)"
	></div>
	<div
		class="absolute top-24 right-6 z-10 flex items-center gap-2 font-mono text-xs tracking-[0.2em] text-white/50 select-none sm:right-10"
	>
		<span class="font-bold text-white">{String(activeIndex + 1).padStart(2, '0')}</span><span
			>/</span
		><span>08</span>
	</div>
	<div class="absolute top-1/2 right-6 z-10 flex -translate-y-1/2 flex-col gap-2 sm:right-10">
		{#each nations as item, index (item.id)}<button
				type="button"
				onclick={() => select(index)}
				aria-label={`Go to ${item.name}`}
				class="w-1.5 cursor-pointer rounded-full transition-all duration-300"
				style={`height:${index === activeIndex ? '28px' : '6px'};background:${index === activeIndex ? nation.accent : 'rgba(255,255,255,.3)'};box-shadow:${index === activeIndex ? `0 0 8px ${nation.accent}88` : 'none'}`}
			></button>{/each}
	</div>
	<div
		class={`absolute inset-0 z-10 flex flex-col justify-end px-4 pb-10 transition-opacity duration-150 sm:px-8 md:px-16 md:pb-16 ${animating ? 'opacity-0' : 'opacity-100'}`}
	>
		<div class="flex flex-col items-end gap-8 md:flex-row">
			<div class="min-w-0 flex-1">
				<div
					class="mb-5 flex flex-wrap gap-3 font-mono text-xs tracking-widest text-white/70 uppercase sm:gap-5 sm:text-sm"
				>
					<span class="flex items-center gap-1.5"
						><MapPin size={13} class="text-white/50" />{nation.era}</span
					><span class="flex items-center gap-1.5"
						><Sword size={13} class="text-white/50" />{nation.element}</span
					><span class="flex items-center gap-1.5"
						><Users size={13} class="text-white/50" />{nation.population}</span
					>
				</div>
				<h1
					class="animate-blur-fade-up mb-2 font-display text-5xl leading-none font-normal text-white sm:text-6xl md:text-7xl lg:text-8xl"
					style={`letter-spacing:-.04em;text-shadow:0 0 80px ${nation.accent}44`}
				>
					{nation.name}
				</h1>
				<p
					class="animate-blur-fade-up mb-5 font-body text-sm tracking-[.08em] text-white/50 sm:text-base"
				>
					{nation.subtitle.toUpperCase()}
				</p>
				<p
					class="animate-blur-fade-up mb-7 max-w-xl font-body text-sm leading-relaxed text-white/70 sm:text-base md:text-lg"
				>
					{nation.description}
				</p>
				<div class="animate-blur-fade-up mb-8 flex gap-8">
					<div>
						<p class="mb-1 font-mono text-[10px] tracking-[.18em] text-white/40 uppercase">
							{nation.stat1Label}
						</p>
						<p class="font-body text-sm font-medium text-white sm:text-base">{nation.stat1Value}</p>
					</div>
					<div class="w-px self-stretch bg-white/10"></div>
					<div>
						<p class="mb-1 font-mono text-[10px] tracking-[.18em] text-white/40 uppercase">
							{nation.stat2Label}
						</p>
						<p class="font-body text-sm font-medium text-white sm:text-base">{nation.stat2Value}</p>
					</div>
				</div>
				<div class="animate-blur-fade-up flex flex-wrap gap-3 sm:gap-4">
					<button
						type="button"
						class="flex items-center gap-2 rounded-full bg-white px-6 py-2.5 font-body text-sm font-semibold text-black shadow-lg transition-all duration-200 hover:bg-gray-100 active:scale-95 sm:px-8 sm:py-3"
						style={`box-shadow:0 4px 24px ${nation.accent}55`}
						><Play size={16} class="fill-black" />Explore Nation</button
					><a
						href="/flameborns"
						class="liquid-glass flex items-center gap-2 rounded-full px-6 py-2.5 font-body text-sm font-medium text-white transition-all duration-200 hover:bg-white/10 active:scale-95 sm:px-8 sm:py-3"
						><nation.icon size={16} />Flameborns</a
					>
				</div>
			</div>
			<div class="animate-blur-fade-up flex shrink-0 gap-3 md:flex-col">
				<button
					type="button"
					onclick={() => select(activeIndex - 1)}
					disabled={animating}
					aria-label="Previous nation"
					class="liquid-glass flex items-center gap-2 rounded-full px-5 py-3 font-body text-sm font-medium text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-40 sm:px-6 sm:py-3.5"
					><ChevronLeft size={18} /><span class="hidden sm:inline">Prev</span></button
				>
				<button
					type="button"
					onclick={() => select(activeIndex + 1)}
					disabled={animating}
					aria-label="Next nation"
					class="liquid-glass flex items-center gap-2 rounded-full px-5 py-3 font-body text-sm font-medium text-white transition-all hover:bg-white/10 active:scale-95 disabled:opacity-40 sm:px-6 sm:py-3.5"
					><span class="hidden sm:inline">Next</span><ChevronRight size={18} /></button
				>
			</div>
		</div>
	</div>
</div>
