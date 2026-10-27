<script lang="ts">
	import { brandedOgImageUrl } from '#lib/community/og.js';
	import { onMount, getContext } from 'svelte';
	import { ArrowLeft, ArrowRight } from '@lucide/svelte';
	import { jsonLdScript } from '#lib/marketing/seo.js';
	import { playFlamebornTone } from '#lib/marketing/soundEffects.js';

	type SiteAudio = { getMuted: () => boolean; getVolume: () => number };
	const siteAudio = getContext<SiteAudio>('site-audio');
	const characters = [
		{
			name: 'EMBERLYN',
			image: '/assets/characters/ember.png',
			voice: '/assets/voice/ember.mp3',
			color: '#F4845F',
			description:
				'Born from the core of the primary star. Emberlyn controls molten flows and kinetic impact, forging paths through cold space.'
		},
		{
			name: 'KIAREN',
			image: '/assets/characters/kai.png',
			voice: '/assets/voice/kia.mp3',
			color: '#6BBF7A',
			description:
				'Conceived in the deep chambers of crystalline growth. Kiaren breathes life into stone and channels magnetic currents.'
		},
		{
			name: 'LIBER',
			image: '/assets/characters/lib.png',
			voice: '/assets/voice/lib.mp3',
			color: '#E882B4',
			description:
				'Formed within stellar dust clouds. Liber bends electromagnetic waves, creating illusions and refracting light.'
		},
		{
			name: 'SAPHYRAN',
			image: '/assets/characters/saphy.png',
			voice: '/assets/voice/saphy.mp3',
			color: '#6EB5FF',
			description:
				'Sourced from frozen oceans of ancient comets. Saphyran directs thermal energy to phase-shift ice and gas instantaneously.'
		}
	];
	let activeIndex = $state(0);
	let mobile = $state(false);
	let animating = $state(false);
	let container: HTMLDivElement;
	let voice: HTMLAudioElement | undefined;
	const character = $derived(characters[activeIndex]);
	const schema = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'CollectionPage',
				'@id': 'https://sanctyria.com/flameborns/#webpage',
				url: 'https://sanctyria.com/flameborns',
				name: 'Flameborns of Sanctyria | Elemental Character Avatars',
				description:
					'Meet the Flameborn avatars of Sanctyria: Emberlyn, Kiaren, Liber, and Saphyran. Discover their origins, descriptions, and roles in the Eternal Realm.',
				isPartOf: { '@id': 'https://sanctyria.com/#website' },
				mainEntity: {
					'@type': 'ItemList',
					name: 'Flameborn Characters',
					description: 'The four core elemental avatars of Sanctyria.',
					itemListElement: characters.map((item, index) => ({
						'@type': 'ListItem',
						position: index + 1,
						item: { '@type': 'CreativeWork', name: item.name, description: item.description }
					}))
				}
			}
		]
	};

	function move(direction: -1 | 1) {
		if (animating) return;
		animating = true;
		activeIndex = (activeIndex + direction + characters.length) % characters.length;
		playFlamebornTone(character.name, siteAudio.getMuted() ? 0 : siteAudio.getVolume());
		if (!siteAudio.getMuted()) {
			window.speechSynthesis?.cancel();
			const utterance = new SpeechSynthesisUtterance(`${character.name}.`);
			utterance.rate = 0.9;
			utterance.pitch = 0.8;
			const playVoice = () => {
				voice?.pause();
				voice = new Audio(character.voice);
				voice.volume = siteAudio.getVolume();
				voice.play().catch(() => undefined);
			};
			utterance.onend = playVoice;
			utterance.onerror = playVoice;
			window.speechSynthesis?.speak(utterance);
		}
		window.setTimeout(() => (animating = false), 650);
	}

	function role(index: number): 'center' | 'left' | 'right' | 'back' {
		if (index === activeIndex) return 'center';
		if (index === (activeIndex + 3) % 4) return 'left';
		if (index === (activeIndex + 1) % 4) return 'right';
		return 'back';
	}

	onMount(() => {
		const resize = () => (mobile = window.innerWidth < 640);
		resize();
		window.addEventListener('resize', resize);
		const onWheel = (event: WheelEvent) => {
			event.preventDefault();
			move(event.deltaY < 0 ? 1 : -1);
		};
		container.addEventListener('wheel', onWheel, { passive: false });
		return () => {
			window.removeEventListener('resize', resize);
			container.removeEventListener('wheel', onWheel);
			window.speechSynthesis?.cancel();
			voice?.pause();
		};
	});
</script>

<svelte:head>
	<title>Flameborns of Sanctyria | Elemental Character Avatars</title>
	<meta
		name="description"
		content="Meet the Flameborn avatars of Sanctyria: Emberlyn, Kiaren, Liber, and Saphyran. Discover their origins, descriptions, and roles in the Eternal Realm."
	/>
	<meta
		name="keywords"
		content="flameborns of sanctyria, fantasy characters, Sanctyria avatars, Emberlyn, Saphyran, Liber, Kiaren"
	/>
	<link rel="canonical" href="https://sanctyria.com/flameborns" />
	<meta property="og:title" content="Flameborns of Sanctyria | Elemental Character Avatars" />
	<meta
		property="og:description"
		content="Meet the Flameborn avatars of Sanctyria: Emberlyn, Kiaren, Liber, and Saphyran. Discover their origins, descriptions, and roles in the Eternal Realm."
	/>
	<meta property="og:url" content="https://sanctyria.com/flameborns" />
	<meta
		property="og:image"
		content={brandedOgImageUrl(
			'Flameborns of Sanctyria',
			'Meet Emberlyn, Kiaren, Liber, and Saphyran, the elemental avatars of the Eternal Realm.',
			'CHARACTERS'
		)}
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Flameborns of Sanctyria | Elemental Character Avatars" />
	<meta
		name="twitter:description"
		content="Meet the Flameborn avatars of Sanctyria: Emberlyn, Kiaren, Liber, and Saphyran. Discover their origins, descriptions, and roles in the Eternal Realm."
	/>
	<meta
		name="twitter:image"
		content={brandedOgImageUrl(
			'Flameborns of Sanctyria',
			'Meet Emberlyn, Kiaren, Liber, and Saphyran, the elemental avatars of the Eternal Realm.',
			'CHARACTERS'
		)}
	/>
	<meta property="og:type" content="website" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript escapes HTML terminators in structured data. -->
	{@html jsonLdScript(schema)}
</svelte:head>

<div
	bind:this={container}
	class="relative h-screen w-full overflow-hidden transition-colors duration-[650ms]"
	style={`background-color:${character.color};transition-timing-function:cubic-bezier(.4,0,.2,1)`}
>
	<div
		class="pointer-events-none absolute inset-0 z-[8] opacity-40"
		style="background-image:url(&quot;data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E&quot;);background-size:200px 200px"
	></div>
	<div
		class="pointer-events-none absolute inset-x-0 top-[18%] z-[2] flex items-center justify-center overflow-hidden font-anton font-black whitespace-nowrap text-white transition-all duration-500 select-none"
		style="font-size:clamp(90px,28vw,380px);line-height:1;letter-spacing:-.02em;opacity:1"
	>
		{character.name}
	</div>
	<div class="absolute inset-0 z-[3]">
		{#each characters as item, index (item.name)}
			{@const itemRole = role(index)}
			<div
				class="absolute aspect-[0.6/1] transition-all duration-[650ms]"
				style={`left:${itemRole === 'center' ? '50%' : itemRole === 'left' ? (mobile ? '20%' : '30%') : itemRole === 'right' ? (mobile ? '80%' : '70%') : '50%'};bottom:${itemRole === 'center' ? (mobile ? '22%' : '0px') : mobile ? '32%' : '12%'};height:${itemRole === 'center' ? (mobile ? '60%' : '92%') : itemRole === 'left' || itemRole === 'right' ? (mobile ? '16%' : '28%') : mobile ? '13%' : '22%'};transform:translateX(-50%) scale(${itemRole === 'center' && !mobile ? 1.68 : itemRole === 'center' ? 1.25 : 1});filter:${itemRole === 'center' ? 'blur(0)' : itemRole === 'back' ? 'blur(4px)' : 'blur(2px)'};opacity:${itemRole === 'center' ? 1 : itemRole === 'back' ? 1 : 0.85};z-index:${itemRole === 'center' ? 20 : itemRole === 'back' ? 5 : 10}`}
			>
				<img
					src={item.image}
					alt={`Flameborn character figurine ${item.name}`}
					class="h-full w-full object-contain object-bottom select-none"
					draggable="false"
				/>
			</div>
		{/each}
	</div>
	<div
		class="absolute bottom-6 left-4 z-30 flex max-w-[320px] flex-col text-white sm:bottom-20 sm:left-24"
	>
		<p
			class="mb-2 text-base font-bold tracking-[.02em] text-white uppercase opacity-95 sm:mb-3 sm:text-[22px]"
		>
			{character.name}
		</p>
		<p
			class="mb-4 hidden min-h-20 text-xs leading-relaxed text-white opacity-85 sm:mb-5 sm:block sm:text-sm"
		>
			{character.description}
		</p>
		<div class="flex items-center space-x-3 sm:space-x-4">
			<button
				type="button"
				onclick={() => move(-1)}
				disabled={animating}
				aria-label="Previous character"
				class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-transparent text-white transition-all duration-150 hover:scale-105 hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:w-16"
				><ArrowLeft size={26} strokeWidth={2.25} /></button
			>
			<button
				type="button"
				onclick={() => move(1)}
				disabled={animating}
				aria-label="Next character"
				class="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-transparent text-white transition-all duration-150 hover:scale-105 hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:w-16"
				><ArrowRight size={26} strokeWidth={2.25} /></button
			>
		</div>
	</div>
	<a
		href="/nations"
		class="group absolute right-4 bottom-6 z-30 flex items-center font-anton text-white uppercase transition-opacity hover:opacity-100 sm:right-10 sm:bottom-20"
		style="font-size:clamp(20px,4vw,56px);opacity:.95;line-height:1"
		><span class="decoration-white/50 underline-offset-4 group-hover:underline">VISIT NATIONS</span
		><ArrowRight
			class="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1 sm:ml-4 sm:h-8 sm:w-8"
			strokeWidth={2.25}
		/></a
	>
</div>
