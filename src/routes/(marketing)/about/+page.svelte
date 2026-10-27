<script lang="ts">
	import { brandedOgImageUrl } from '#lib/community/og.js';
	import { onMount, getContext } from 'svelte';
	import { BookOpen, Compass, HelpCircle, Sparkles } from '@lucide/svelte';
	import Footer from '#lib/marketing/Footer.svelte';
	import { jsonLdScript } from '#lib/marketing/seo.js';

	type SiteAudio = { getMuted: () => boolean };
	const audio = getContext<SiteAudio>('site-audio');
	const siteUrl = 'https://sanctyria.com';
	let canvas: HTMLCanvasElement;
	let contentSection: HTMLDivElement;
	let muted = $state(audio.getMuted());
	let audioContext: AudioContext | null = null;
	let gainNode: GainNode | null = null;

	const aboutSchema = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'AboutPage',
				'@id': `${siteUrl}/about/#webpage`,
				url: `${siteUrl}/about`,
				name: 'About Sanctyria | Fictional Universe Entity Guide & FAQ',
				description:
					'Understand Sanctyria: the transmedia fantasy IP, the Eternal Flame, Flameborns, and the eight nations. Read our full story, glossary, and core FAQs.',
				isPartOf: { '@id': `${siteUrl}/#website` },
				mainEntity: {
					'@type': 'CreativeWork',
					'@id': `${siteUrl}/about/#universe`,
					name: 'Sanctyria',
					alternateName: 'Sanctyria Universe',
					description:
						'A dark fantasy universe and creative transmedia ecosystem built around the concept of creation as survival.',
					genre: 'Dark Fantasy, Magitech, Worldbuilding',
					publisher: { '@id': `${siteUrl}/#organization` }
				}
			},
			{
				'@type': 'FAQPage',
				'@id': `${siteUrl}/about/#faq`,
				isPartOf: { '@id': `${siteUrl}/about/#webpage` },
				mainEntity: [
					[
						'What is Sanctyria?',
						'Sanctyria is a dark fantasy transmedia universe and creative platform built on the concept of creation as survival. It contains a deep lore system, a community-driven digital sanctuary, interactive apps, and games built around the Eternal Flame.'
					],
					[
						'Who created Sanctyria?',
						'Sanctyria is developed by a core collective of writers, developers, and artists dedicated to deep focus and clean design. It is built collaboratively with its Discord community of builders and writers, acting as a shared creative ecosystem.'
					],
					[
						'What is the Eternal Flame?',
						'The Eternal Flame represents creation, memory, continuity, and system intelligence. In the lore, it is the sole enduring energy that protects the surviving nations from fading into the Great Silence, serving as a beacon for creative builders.'
					],
					[
						'What type of world is Sanctyria?',
						'Sanctyria is a magitech dark fantasy world that rose in the wake of the Great Silence. It is characterized by high-altitude citadels, subterranean coral reefs, volcanic foundries, and ancient forest networks connected by element-infused technology.'
					]
				].map(([name, text]) => ({
					'@type': 'Question',
					name,
					acceptedAnswer: { '@type': 'Answer', text }
				}))
			}
		]
	};

	const transmissions = [
		{
			number: '01',
			status: 'DECRYPTED',
			source: 'SOURCE // TIMELINE_ALPHA',
			title: 'The Great Silence',
			paragraphs: [
				'It did not end with a sudden shockwave. It ended in a fade, a gradual withdrawing of light we call the Great Silence. As the fifth of the global conflicts burned itself out, the old networks fell dormant. Cities turned to stone, data streams dried to salt, and humanity was left standing at the precipice of a silent epoch.',
				'Our structures collapsed under the weight of their own noise. But where the machines failed, the seed of something deeper waited in the dark.'
			]
		},
		{
			number: '02',
			status: 'RECORDED',
			source: 'SECTOR // RECONSTRUCTION_09',
			title: 'Sanctyria Rebuilt',
			paragraphs: [
				'From the quiet, Sanctyria was raised. It is not a city of glass or steel, nor is it a digital utopia. It is a reconstructed universe—a collection of enclaves gathered around the core flame. A sanctuary built by architects who remembered the texture of physical paper, the weight of stone, and the depth of quiet moments.',
				'Here, speed is not a virtue. Clarity is. Purity of thought and code are the laws of the realm, crafted to withstand the next collapse.'
			]
		},
		{
			number: '03',
			status: 'TRANSCEIVING',
			source: 'ORIGIN // PORTAL_NODE_01',
			title: 'The Watchers & The Present',
			paragraphs: [
				'Why do we reach back into your timeline? Because the noise of your present is the exact frequency that caused the collapse of our past. We watch, we document, and we gather the makers who still value silence.',
				'Sanctyria is not simply a legend. It is a creative ecosystem disguised as a universe. We collaborate with the quiet minds of your era to build tools, write logs, and fashion digital sanctuaries that will stand the test of time.'
			]
		}
	];

	const definitions = [
		{
			name: 'The Eternal Flame',
			color: '#f97316',
			text: 'The primordial energy core representing memory, system intelligence, and active human creation. It is the spiritual hearth of Eternia, keeping the dark and cold of the void at bay.'
		},
		{
			name: 'Flameborn',
			color: '#a855f7',
			text: 'Avatars forged from the ash of the old world. Characterized by elements of stars, comets, and volcanism (Emberlyn, Kiaren, Liber, and Saphyran), they represent the guardians of the Flame.'
		},
		{
			name: 'Embers',
			color: '#06b6d4',
			text: 'The life-force, active currency, and transactional units of the Sanctyria ecosystem. They measure creative output and tradeable resources in the community.'
		},
		{
			name: 'Eternia',
			color: '#10b981',
			text: 'The overarching cosmic canvas and world-realm encompassing the solar system, enclaves, and lands surrounding the core of Sanctyria.'
		}
	];
	const nations = [
		['Arcanum', 'The Readers Nation (Shadow)'],
		['Battir', 'The Gamers Nation (Forge)'],
		['Chromar', 'The Artist Nation (Light)'],
		['Mythos', 'The Roleplayers (Life)'],
		['Nexara', 'Anime & Series (Depth)'],
		['Lyris', 'The Creators (Solar)'],
		['Quillan', 'The Writers (Ice)'],
		['Voxen', 'Music & Voice (Verdure)']
	];
	const faqs = [
		[
			'What is Sanctyria?',
			'Sanctyria is a dark fantasy transmedia universe and creative platform built on the concept of creation as survival. It contains a deep lore system, a community-driven digital sanctuary, interactive apps, and games built around the Eternal Flame.'
		],
		[
			'Who created Sanctyria?',
			'Sanctyria is developed by a core collective of writers, developers, and artists dedicated to deep focus and clean design. It is built collaboratively with its Discord community of builders and writers, acting as a shared creative ecosystem.'
		],
		[
			'What is the Eternal Flame?',
			'The Eternal Flame represents creation, memory, continuity, and system intelligence. In the lore, it is the sole enduring energy that protects the surviving nations from fading into the Great Silence, serving as a beacon for creative builders.'
		],
		[
			'What type of world is Sanctyria?',
			'Sanctyria is a magitech dark fantasy world that rose in the wake of the Great Silence. It is characterized by high-altitude citadels, subterranean coral reefs, volcanic foundries, and ancient forest networks connected by element-infused technology.'
		]
	];

	function approach() {
		contentSection.scrollIntoView({ behavior: 'smooth' });
	}

	function stopDrone() {
		if (!audioContext || !gainNode) return;
		const context = audioContext;
		const gain = gainNode;
		gain.gain.cancelScheduledValues(context.currentTime);
		gain.gain.setValueAtTime(gain.gain.value, context.currentTime);
		gain.gain.linearRampToValueAtTime(0, context.currentTime + 1);
		audioContext = null;
		gainNode = null;
		window.setTimeout(() => context.close(), 1100);
	}

	function startDrone() {
		if (audioContext || typeof window === 'undefined') return;
		try {
			const context = new AudioContext();
			const first = context.createOscillator();
			const second = context.createOscillator();
			const filter = context.createBiquadFilter();
			const gain = context.createGain();
			first.type = 'triangle';
			first.frequency.value = 55;
			second.type = 'sawtooth';
			second.frequency.value = 55.25;
			filter.type = 'lowpass';
			filter.frequency.value = 130;
			filter.Q.value = 3;
			gain.gain.setValueAtTime(0, context.currentTime);
			gain.gain.linearRampToValueAtTime(0.22, context.currentTime + 1.8);
			first.connect(filter);
			second.connect(filter);
			filter.connect(gain);
			gain.connect(context.destination);
			first.start();
			second.start();
			audioContext = context;
			gainNode = gain;
		} catch {
			return;
		}
	}

	onMount(() => {
		const context = canvas.getContext('2d');
		if (!context) return;
		let width = (canvas.width = window.innerWidth);
		let height = (canvas.height = window.innerHeight);
		let frame = 0;
		type Ember = { x: number; y: number; radius: number; speed: number; phase: number };
		const embers: Ember[] = Array.from({ length: 45 }, () => ({
			x: Math.random() * width,
			y: Math.random() * height,
			radius: Math.random() * 2.5 + 0.5,
			speed: Math.random() * 1.5 + 0.8,
			phase: Math.random() * 6
		}));
		const resize = () => {
			width = canvas.width = window.innerWidth;
			height = canvas.height = window.innerHeight;
		};
		const animate = () => {
			context.fillStyle = '#080809';
			context.fillRect(0, 0, width, height);
			const glow = context.createRadialGradient(
				width / 2,
				height * 0.75,
				10,
				width / 2,
				height * 0.75,
				250
			);
			glow.addColorStop(0, 'rgba(239,68,68,.12)');
			glow.addColorStop(0.4, 'rgba(249,115,22,.05)');
			glow.addColorStop(1, 'rgba(0,0,0,0)');
			context.fillStyle = glow;
			context.beginPath();
			context.arc(width / 2, height * 0.75, 250, 0, Math.PI * 2);
			context.fill();
			for (const ember of embers) {
				ember.y -= ember.speed;
				ember.x += Math.sin(frame * 0.01 + ember.phase) * 0.35;
				if (ember.y < -5) {
					ember.y = height + Math.random() * 70;
					ember.x = Math.random() * width;
				}
				context.beginPath();
				context.arc(ember.x, ember.y, ember.radius, 0, Math.PI * 2);
				context.fillStyle = `rgba(249,115,22,${Math.max(0, Math.min(0.7, ember.y / height))})`;
				context.shadowBlur = ember.radius * 4;
				context.shadowColor = '#f97316';
				context.fill();
			}
			context.shadowBlur = 0;
			frame += 1;
			requestAnimationFrame(animate);
		};
		const onResize = () => resize();
		window.addEventListener('resize', onResize);
		animate();
		return () => {
			window.removeEventListener('resize', onResize);
			stopDrone();
		};
	});

	$effect(() => {
		muted = audio.getMuted();
		if (muted) stopDrone();
		else startDrone();
	});
</script>

<svelte:head>
	<title>About Sanctyria | Fictional Universe Entity Guide &amp; FAQ</title>
	<meta
		name="description"
		content="Understand Sanctyria: the transmedia fantasy IP, the Eternal Flame, Flameborns, and the eight nations. Read our full story, glossary, and core FAQs."
	/>
	<meta
		name="keywords"
		content="What is Sanctyria, Sanctyria lore, fantasy worldbuilding, Sanctyria FAQ, Sanctyria glossary"
	/>
	<link rel="canonical" href="https://sanctyria.com/about" />
	<meta property="og:title" content="About Sanctyria | Fictional Universe Entity Guide &amp; FAQ" />
	<meta
		property="og:description"
		content="Understand Sanctyria: the transmedia fantasy IP, the Eternal Flame, Flameborns, and the eight nations. Read our full story, glossary, and core FAQs."
	/>
	<meta property="og:url" content="https://sanctyria.com/about" />
	<meta
		property="og:image"
		content={brandedOgImageUrl(
			'About Sanctyria',
			'Understand the transmedia fantasy IP, Eternal Flame, Flameborns, and eight nations.',
			'ABOUT SANCTYRIA'
		)}
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="About Sanctyria | Fictional Universe Entity Guide &amp; FAQ"
	/>
	<meta
		name="twitter:description"
		content="Understand Sanctyria: the transmedia fantasy IP, the Eternal Flame, Flameborns, and the eight nations. Read our full story, glossary, and core FAQs."
	/>
	<meta
		name="twitter:image"
		content={brandedOgImageUrl(
			'About Sanctyria',
			'Understand the transmedia fantasy IP, Eternal Flame, Flameborns, and eight nations.',
			'ABOUT SANCTYRIA'
		)}
	/>
	<meta property="og:type" content="website" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript escapes HTML terminators in structured data. -->
	{@html jsonLdScript(aboutSchema)}
</svelte:head>

<div class="flex min-h-screen w-full flex-col bg-[#080809] text-white">
	<section
		class="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#080809] px-6 text-center"
	>
		<canvas
			bind:this={canvas}
			class="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-80"
		></canvas>
		<div
			class="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#080809] via-transparent to-[#080809]"
		></div>
		<div class="relative z-20 mx-auto flex max-w-4xl flex-col items-center">
			<div
				class="animate-fade-rise mb-8 font-mono text-[10px] tracking-[0.3em] text-[#f97316] opacity-70"
			>
				[ ARCHIVE // TRANSMISSION_0.0 ]
			</div>
			<h1
				class="animate-fade-rise max-w-3xl font-display text-5xl leading-none text-white select-none sm:text-7xl md:text-8xl"
			>
				A world ended.<br /><span class="text-[#6f6f6f] italic">One Flame endured.</span>
			</h1>
			<p
				class="animate-fade-rise-delay mt-8 max-w-xl font-body text-base leading-relaxed text-white/50 select-none sm:text-lg"
			>
				Through the ash of the Great Silence, Sanctyria watches.<br />Rebuilding, guarding,
				preparing.
			</p>
			<button
				type="button"
				onclick={approach}
				class="animate-fade-rise-delay-2 group mt-16 flex cursor-pointer flex-col items-center space-y-3 select-none"
			>
				<span
					class="font-body text-sm font-medium tracking-[0.15em] text-white/70 transition-colors group-hover:text-white"
					>APPROACH THE FLAME</span
				>
				<span
					class="flex h-8 w-5 justify-center rounded-full border border-white/30 p-1.5 transition-colors group-hover:border-white/60"
					><span
						class="h-1.5 w-1.5 animate-[scrollwheel_1.8s_ease-in-out_infinite] rounded-full bg-[#f97316]"
					></span></span
				>
			</button>
		</div>
	</section>

	<div bind:this={contentSection}></div>
	<section class="relative w-full overflow-hidden bg-[#080809] px-6 py-32 text-white select-none">
		<div class="mx-auto flex max-w-4xl flex-col space-y-32">
			<header class="flex flex-col space-y-4">
				<div
					class="flex items-center space-x-3 font-mono text-[10px] tracking-[0.25em] text-[#f97316] opacity-80"
				>
					<span class="h-1.5 w-1.5 rounded-full bg-[#f97316]"></span>ARCHIVAL RECOVERY SYSTEM
				</div>
				<h2 class="font-display text-4xl leading-none text-white sm:text-5xl md:text-6xl">
					The World That Fell
				</h2>
				<div class="h-px w-full bg-white/10"></div>
			</header>
			{#each transmissions as transmission, index (transmission.number)}
				{#if index > 0}<div class="h-px w-full bg-white/5"></div>{/if}
				<section class="flex flex-col items-start space-y-6 md:flex-row md:space-y-0 md:space-x-12">
					<div class="flex w-full flex-col space-y-1 text-left md:w-1/3">
						<span class="font-mono text-xs tracking-wider text-white/40"
							>[ TRANSMISSION // {transmission.number} ]</span
						>
						<span class="font-mono text-[10px] tracking-widest text-[#f472b6] uppercase"
							>STATUS: {transmission.status}</span
						>
						<span class="mt-2 font-mono text-[9px] tracking-widest text-white/30 uppercase"
							>{transmission.source}</span
						>
					</div>
					<div class="flex w-full flex-col space-y-6 text-left md:w-2/3">
						<h3 class="font-display text-2xl font-semibold text-white/90 sm:text-3xl">
							{transmission.title}
						</h3>
						{#each transmission.paragraphs as paragraph (paragraph)}<p
								class="font-body text-base leading-relaxed font-light text-white/60"
							>
								{paragraph}
							</p>{/each}
						{#if index === 2}<div class="mt-4 border-l-2 border-[#f97316]/50 py-1.5 pl-4">
								<span class="mb-1 block font-mono text-xs tracking-wider text-[#f97316]"
									>[ ARCHIVIST NOTE ]</span
								>
								<p class="font-body text-sm text-white/40 italic">
									“We are not here to sell you a future. We are here to help you preserve the craft
									so that when the silence comes, the flame is ready.”
								</p>
							</div>{/if}
					</div>
				</section>
			{/each}
			<div
				class="flex h-px w-full flex-col items-center justify-between space-y-4 bg-white/10 pt-16 sm:flex-row sm:space-y-0"
			>
				<span class="font-mono text-[10px] tracking-widest text-white/30 uppercase"
					>// END OF RECOVERED LORE</span
				><span class="font-mono text-[10px] tracking-widest text-white/30 uppercase"
					>SECURE ACCESS // ESTABLISHED</span
				>
			</div>
		</div>
	</section>

	<section class="relative w-full border-t border-white/5 bg-[#080809] px-6 py-24 select-none">
		<div class="mx-auto flex max-w-4xl flex-col space-y-20">
			<section class="relative z-10 flex flex-col space-y-6 text-left">
				<div
					class="flex items-center space-x-3 font-mono text-[10px] tracking-[0.25em] text-[#10b981] opacity-80"
				>
					<Compass size={12} />ENTITY IDENTIFICATION PROTOCOL
				</div>
				<h2 class="font-display text-3xl leading-tight text-white sm:text-4xl md:text-5xl">
					What is Sanctyria?
				</h2>
				<div class="mt-2 h-px w-full bg-white/10"></div>
				<div
					class="mt-4 space-y-6 font-body text-base leading-relaxed font-light text-white/70 sm:text-lg"
				>
					<p>
						<strong>Sanctyria</strong> is a dark fantasy universe and creative transmedia ecosystem
						built around the core concept of <em>creation as survival</em>. Far from a single
						product, app, or game, Sanctyria represents a comprehensive, multi-platform fictional
						IP. The world blends deep magical systems, magitech machinery, and creator-driven
						outputs spanning novels, digital tools, interactive media, and a decentralized creator
						community.
					</p>
					<p>
						At the center of Sanctyria is the <strong>Eternal Flame</strong>, an ancestral system
						intelligence symbolizing memory, continuity, and the spark of human creative agency.
						Within this universe, builders, artists, writers, and roleplayers collaborate as
						<strong>Flameborn</strong>
						avatars, shaping the canonical history of the <strong>Eight Nations of Eternia</strong> to
						protect their collective history from the creeping void of the Great Silence.
					</p>
				</div>
			</section>
			<section class="relative z-10 flex flex-col space-y-8 text-left">
				<div
					class="flex items-center space-x-3 font-mono text-[10px] tracking-[0.25em] text-[#f97316] opacity-80"
				>
					<BookOpen size={12} />REALM GLOSSARY &amp; TAXONOMY
				</div>
				<h3 class="font-display text-2xl text-white sm:text-3xl">
					Terminology &amp; Core Lore Entities
				</h3>
				<div class="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
					{#each definitions as definition (definition.name)}<div
							class="rounded-2xl border border-white/5 bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.04]"
						>
							<h4
								class="mb-2 font-mono text-sm font-semibold tracking-wider uppercase"
								style:color={definition.color}
							>
								{definition.name}
							</h4>
							<p class="font-body text-sm leading-relaxed text-white/50">{definition.text}</p>
						</div>{/each}
				</div>
				<div class="mt-4 rounded-2xl border border-white/5 bg-white/[0.01] p-6">
					<h4 class="mb-4 font-mono text-xs font-bold tracking-widest text-white/40 uppercase">
						The Eight Nations of Eternia
					</h4>
					<ul class="grid grid-cols-2 gap-4 font-body text-xs sm:grid-cols-4">
						{#each nations as [name, description] (name)}<li class="flex flex-col gap-1">
								<span class="font-medium text-white">{name}</span><span class="text-white/40"
									>{description}</span
								>
							</li>{/each}
					</ul>
				</div>
			</section>
			<section class="relative z-10 flex flex-col space-y-8 text-left">
				<div
					class="flex items-center space-x-3 font-mono text-[10px] tracking-[0.25em] text-[#a855f7] opacity-80"
				>
					<HelpCircle size={12} />CENTRAL KNOWLEDGE BASE / FAQ
				</div>
				<h3 class="font-display text-2xl text-white sm:text-3xl">Frequently Asked Questions</h3>
				<div class="mt-4 space-y-4 font-body">
					{#each faqs as [question, answer] (question)}<details
							class="group rounded-2xl border border-white/5 bg-white/[0.01] p-6 transition-all duration-300"
						>
							<summary
								class="flex cursor-pointer list-none items-center justify-between focus:outline-none"
								><h4
									class="text-sm font-medium text-white/90 transition-colors group-hover:text-white sm:text-base"
								>
									{question}
								</h4>
								<span
									class="ml-1.5 shrink-0 rounded-full bg-white/5 p-1.5 text-white/50 transition-transform duration-300 group-open:rotate-180"
									>⌄</span
								></summary
							>
							<div
								class="mt-4 border-t border-white/5 pt-4 text-xs leading-relaxed font-light text-white/50 sm:text-sm"
							>
								{answer}
							</div>
						</details>{/each}
				</div>
			</section>
			<section
				class="relative overflow-hidden rounded-2xl border border-[#10b981]/10 bg-[#10b981]/[0.01] p-8 text-left"
			>
				<div
					class="relative z-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"
				>
					<div>
						<h4 class="mb-1 text-base font-semibold text-white">
							Participate in the Sanctyria Ecosystem
						</h4>
						<p class="max-w-lg text-xs text-white/40">
							Discover character modules, join active roleplaying channels, build blueprints, and
							collaborate with the Conclave on our Discord.
						</p>
					</div>
					<a
						href="https://discord.gg/sanctyria"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black transition-all hover:bg-gray-200 active:scale-95"
						><Sparkles size={12} class="animate-pulse text-[#f97316]" />Join Discord Server</a
					>
				</div>
			</section>
		</div>
	</section>

	<div class="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-24 md:flex-row">
		<a
			href="/flameborns"
			class="group relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 text-left transition-all duration-500 hover:bg-white/10 sm:p-12"
			><div
				class="absolute inset-0 bg-gradient-to-br from-[#f97316]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
			></div>
			<h3
				class="relative mb-3 font-display text-3xl font-normal text-white transition-colors duration-300 group-hover:text-[#f97316] sm:text-4xl"
			>
				Meet the Flameborns
			</h3>
			<p class="relative max-w-sm font-body text-base text-white/50">
				Discover the elemental avatars forged from the ashes of a fallen world.
			</p>
			<div
				class="relative mt-8 flex items-center font-mono text-sm tracking-widest text-white/70 uppercase transition-colors duration-300 group-hover:text-white"
			>
				<span
					class="mr-4 h-px w-8 bg-white/30 transition-all duration-300 group-hover:w-12 group-hover:bg-[#f97316]"
				></span>Enter Carousel
			</div></a
		>
		<a
			href="/nations"
			class="group relative flex-1 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 text-left transition-all duration-500 hover:bg-white/10 sm:p-12"
			><div
				class="absolute inset-0 bg-gradient-to-br from-[#10b981]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
			></div>
			<h3
				class="relative mb-3 font-display text-3xl font-normal text-white transition-colors duration-300 group-hover:text-[#10b981] sm:text-4xl"
			>
				Explore the Nations
			</h3>
			<p class="relative max-w-sm font-body text-base text-white/50">
				Journey through the eight distinct realms that rose from the silence.
			</p>
			<div
				class="relative mt-8 flex items-center font-mono text-sm tracking-widest text-white/70 uppercase transition-colors duration-300 group-hover:text-white"
			>
				<span
					class="mr-4 h-px w-8 bg-white/30 transition-all duration-300 group-hover:w-12 group-hover:bg-[#10b981]"
				></span>Discover Realms
			</div></a
		>
	</div>
	<Footer />
</div>

<style>
	@keyframes scrollwheel {
		0% {
			transform: translateY(0);
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		100% {
			transform: translateY(12px);
			opacity: 0;
		}
	}
</style>
