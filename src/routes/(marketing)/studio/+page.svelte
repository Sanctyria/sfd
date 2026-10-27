<script lang="ts">
	import { brandedOgImageUrl } from '#lib/community/og.js';
	import { onMount, getContext } from 'svelte';
	import {
		AppWindow,
		ArrowLeft,
		ArrowUpRight,
		AudioLines,
		BookOpen,
		Disc3,
		Film,
		Gamepad2,
		Headphones,
		Image as ImageIcon,
		Pause,
		Play,
		Repeat2,
		Search,
		X,
		Volume2,
		VolumeX
	} from '@lucide/svelte';

	type Shelf = 'film' | 'music' | 'books' | 'games' | 'apps' | 'art' | 'voices';
	type Format = 'audio' | 'video' | 'image' | 'link' | 'pdf';
	type Entry = {
		id: string;
		title: string;
		shelf: Shelf;
		format: Format;
		src?: string;
		image?: string;
		href?: string;
		linkLabel?: string;
		note: string;
		accent: string;
		thumbnailBackground?: string;
	};
	type SiteAudio = {
		getMuted: () => boolean;
		getVolume: () => number;
		toggleMute: () => void;
		setVolumeLevel: (level: number) => void;
	};
	const audioState = getContext<SiteAudio>('site-audio');
	const shelves = [
		{ id: 'all', label: 'Everything', icon: AudioLines },
		{ id: 'film', label: 'Film', icon: Film },
		{ id: 'music', label: 'Music', icon: Disc3 },
		{ id: 'books', label: 'Books', icon: BookOpen },
		{ id: 'games', label: 'Games', icon: Gamepad2 },
		{ id: 'apps', label: 'Apps', icon: AppWindow },
		{ id: 'art', label: 'Art', icon: ImageIcon },
		{ id: 'voices', label: 'Voices', icon: Headphones }
	] as const;
	const shelfNames: Record<Shelf, string> = {
		film: 'Film',
		music: 'Music',
		books: 'Books',
		games: 'Games',
		apps: 'Apps',
		art: 'Art',
		voices: 'Voices'
	};
	const entries: Entry[] = [
		{
			id: 'the-world-that-fell',
			title: 'The World That Fell',
			shelf: 'film',
			format: 'video',
			src: '/assets/video/worldloop.mp4',
			image: '/assets/worldview/ezgif-frame-120.jpg',
			note: 'A moving glimpse into the lands and legends of Sanctyria.',
			accent: '#f07839'
		},
		...(
			[
				['arcanum', 'Arcanum', 'Arcanum.mp3', '#d97742'],
				['battir', 'Battir', 'Battir.mp3', '#bc5745'],
				['chromar', 'Chromar', 'Chromar.mp3', '#a88450'],
				['eternal-queen', 'Eternal Queen', 'eternalqueen.mp3', '#da7045'],
				['lyris', 'Lyris', 'Lyris.mp3', '#997758'],
				['mythos', 'Mythos', 'Mythos.mp3', '#b8563d'],
				['nexara', 'Nexara', 'Nexara.mp3', '#cf8b48'],
				['quillan', 'Quillan', 'Quillan.mp3', '#8d694d'],
				['voxen', 'Voxen', 'Voxen.mp3', '#b26b42']
			] as const
		).map(([id, title, file, accent]) => ({
			id,
			title,
			shelf: 'music' as const,
			format: 'audio' as const,
			src: `/assets/music/${file}`,
			note: 'Original music from the Sanctyria soundscape.',
			accent
		})),
		...(
			[
				['ember', 'Ember', 'ember.png', 'A flame that remembers.'],
				['kai', 'Kai', 'kai.png', 'A new presence in the living world.'],
				['lib', 'Lib', 'lib.png', 'A portrait from the Sanctyrian archive.'],
				['saphy', 'Saphy', 'saphy.png', 'A portrait from the Sanctyrian archive.']
			] as const
		).map(([id, title, file, note]) => ({
			id: `portrait-${id}`,
			title,
			shelf: 'art' as const,
			format: 'image' as const,
			src: `/assets/characters/${file}`,
			note,
			accent: '#e98048'
		})),
		...(
			[
				['ember', 'Ember', 'ember.mp3'],
				['kia', 'Kia', 'kia.mp3'],
				['lib', 'Lib', 'lib.mp3'],
				['saphy', 'Saphy', 'saphy.mp3']
			] as const
		).map(([id, title, file]) => ({
			id: `voice-${id}`,
			title: `${title} — voice`,
			shelf: 'voices' as const,
			format: 'audio' as const,
			src: `/assets/voice/${file}`,
			note: 'A character voice from the Sanctyria archive.',
			accent: '#e98048'
		})),
		{
			id: 'arcanium-library',
			title: 'Arcanium Library',
			shelf: 'apps',
			format: 'link',
			image: 'https://arcanium.sanctyria.com/assets/arcanium.png',
			thumbnailBackground: '#000000',
			href: 'https://arcanium.sanctyria.com',
			linkLabel: 'Open Arcanium Library',
			note: 'A reading app for stories from the Sanctyria universe.',
			accent: '#e98048'
		},
		{
			id: 'quillian-inkscraft',
			title: 'Quillian Inkscraft',
			shelf: 'apps',
			format: 'link',
			image: 'https://inkscraft.sanctyria.com/assets/LW-CWa4_wdZ.png',
			href: 'https://inkscraft.sanctyria.com',
			linkLabel: 'Open Quillian Inkscraft',
			note: 'A writer’s studio for crafting stories in the Sanctyria universe.',
			accent: '#e98048'
		},
		{
			id: 'the-record-of-what-we-carried',
			title: 'The Record of What We Carried',
			shelf: 'books',
			format: 'pdf',
			src: '/assets/books/The%20Record%20of%20What%20We%20Carried/The%20Record%20of%20What%20We%20Carried.pdf',
			image: '/assets/books/The%20Record%20of%20What%20We%20Carried/record%20we%20carried.jpg',
			href: '/assets/books/The%20Record%20of%20What%20We%20Carried/The%20Record%20of%20What%20We%20Carried.pdf',
			linkLabel: 'Open full book in a new tab',
			note: 'Read the book in the Sanctyria Studio archive.',
			accent: '#b26b42'
		}
	];
	let activeShelf = $state<'all' | Shelf>('all');
	let query = $state('');
	let selected = $state<Entry | null>(null);
	let activeTrack = $state<Entry | null>(null);
	let playing = $state(false);
	let repeat = $state(false);
	let duration = $state(0);
	let currentTime = $state(0);
	let audio = $state<HTMLAudioElement>();
	const filtered = $derived(
		entries.filter(
			(entry) =>
				(activeShelf === 'all' || entry.shelf === activeShelf) &&
				`${entry.title} ${entry.note} ${shelfNames[entry.shelf]}`
					.toLowerCase()
					.includes(query.trim().toLowerCase())
		)
	);

	function openEntry(entry: Entry) {
		if (entry.format === 'audio') {
			if (activeTrack?.id === entry.id) {
				playing = !playing;
			} else {
				activeTrack = entry;
				currentTime = 0;
				playing = true;
			}
		} else selected = entry;
	}
	function count(shelf: 'all' | Shelf) {
		return shelf === 'all'
			? entries.length
			: entries.filter((entry) => entry.shelf === shelf).length;
	}
	function formatTime(seconds: number) {
		if (!Number.isFinite(seconds)) return '0:00';
		return `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60)
			.toString()
			.padStart(2, '0')}`;
	}
	function closeModal() {
		selected = null;
	}
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') closeModal();
	}
	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
	$effect(() => {
		if (!audio || !activeTrack) return;
		audio.volume = audioState.getVolume();
		audio.muted = audioState.getMuted();
		if (playing) audio.play().catch(() => (playing = false));
		else audio.pause();
	});
</script>

<svelte:head>
	<title>Sanctyria Studio | A Universe in Every Medium</title>
	<meta
		name="description"
		content="Explore the films, music, voices, and art of the Sanctyria universe."
	/>
	<meta name="keywords" content="Sanctyria, fantasy universe, music, film, character art, voices" />
	<link rel="canonical" href="https://sanctyria.com/studio" />
	<meta property="og:title" content="Sanctyria Studio | A Universe in Every Medium" />
	<meta
		property="og:description"
		content="Explore the films, music, voices, and art of the Sanctyria universe."
	/>
	<meta property="og:url" content="https://sanctyria.com/studio" />
	<meta
		property="og:image"
		content={brandedOgImageUrl(
			'Sanctyria Studio',
			'Explore the films, music, voices, and art of the Sanctyria universe.',
			'STUDIO'
		)}
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Sanctyria Studio | A Universe in Every Medium" />
	<meta
		name="twitter:description"
		content="Explore the films, music, voices, and art of the Sanctyria universe."
	/>
	<meta
		name="twitter:image"
		content={brandedOgImageUrl(
			'Sanctyria Studio',
			'Explore the films, music, voices, and art of the Sanctyria universe.',
			'STUDIO'
		)}
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<div
	class="relative min-h-screen overflow-hidden bg-[#0b0a09] pb-28 text-[#f7f1e8] selection:bg-orange-400/30"
>
	<div class="pointer-events-none absolute inset-0 opacity-30" aria-hidden="true">
		<div
			class="absolute inset-0 bg-[radial-gradient(ellipse_at_14%_0%,rgba(132,62,32,0.2),transparent_42%)]"
		></div>
		<div
			class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-size-[72px_72px]"
		></div>
	</div>
	<header
		class="relative z-20 mx-auto flex h-[76px] max-w-[1500px] items-center justify-between border-b border-white/10 px-5 sm:px-9 lg:px-14"
	>
		<a
			href="/"
			class="group flex items-center gap-3 text-left"
			aria-label="Return to Sanctyria home"
			><img src="/assets/dlst.gif" alt="Sanctyria logo" class="h-9 w-9 object-contain" /><span
				class="font-display text-[22px] leading-none">Sanctyria</span
			><span
				class="hidden border-l border-white/15 pl-3 font-mono text-[9px] tracking-[0.2em] text-white/40 uppercase sm:inline"
				>Studio archive</span
			></a
		>
		<a
			href="/"
			class="flex items-center gap-2 font-mono text-[10px] tracking-[0.17em] text-white/55 uppercase transition-colors hover:text-white"
			><ArrowLeft size={14} />Return to realm</a
		>
	</header>
	<main class="relative z-10 mx-auto max-w-[1500px] px-5 sm:px-9 lg:px-14">
		<section
			class="relative mt-5 min-h-[480px] overflow-hidden border border-white/10 sm:mt-8 sm:min-h-[530px]"
		>
			<video
				class="absolute inset-0 h-full w-full object-cover object-center opacity-55"
				src="/assets/video/worldloop.mp4"
				poster="/assets/worldview/ezgif-frame-120.jpg"
				autoplay
				muted
				loop
				playsinline
				aria-hidden="true"
			></video>
			<div
				class="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,9,8,.97)_0%,rgba(10,9,8,.81)_42%,rgba(10,9,8,.18)_100%)]"
			></div>
			<div
				class="absolute inset-0 bg-[linear-gradient(0deg,rgba(10,9,8,.8)_0%,transparent_55%)]"
			></div>
			<div
				class="absolute top-8 -right-16 h-72 w-72 rounded-full border border-orange-100/15 sm:top-14 sm:right-[8%] sm:h-[420px] sm:w-[420px]"
			></div>
			<div
				class="absolute top-16 -right-7 h-56 w-56 rounded-full border border-orange-100/10 sm:top-22 sm:right-[11%] sm:h-[360px] sm:w-[360px]"
			></div>
			<div
				class="relative flex min-h-[480px] flex-col justify-between p-6 sm:min-h-[530px] sm:p-10 lg:p-14"
			>
				<div
					class="flex items-center gap-3 font-mono text-[9px] tracking-[0.25em] text-orange-200/90 uppercase"
				>
					<span class="h-px w-8 bg-orange-300"></span>01 / The Sanctyria archive
				</div>
				<div class="max-w-[730px] py-14 sm:py-16">
					<p class="mb-4 font-mono text-[10px] tracking-[0.24em] text-white/55 uppercase">
						One universe. Many ways in.
					</p>
					<h1
						class="font-display text-[54px] leading-[0.94] text-white sm:text-[76px] lg:text-[94px]"
					>
						A world told<br /><span class="text-orange-300 italic">in every medium.</span>
					</h1>
					<p class="mt-6 max-w-[440px] text-sm leading-7 text-white/70 sm:text-[15px]">
						Walk through the stories, sounds, faces, and fragments that make up a living realm.
					</p>
					<div class="mt-8 flex flex-wrap items-center gap-3">
						<a
							href="#archive"
							class="inline-flex h-11 items-center gap-3 bg-orange-300 px-5 font-mono text-[10px] font-bold tracking-[.15em] text-[#1b100b] uppercase transition-colors hover:bg-orange-200"
							>Enter the archive <ArrowUpRight size={15} /></a
						><button
							type="button"
							onclick={() => (selected = entries[0])}
							class="inline-flex h-11 items-center gap-2 border border-white/30 bg-black/20 px-5 font-mono text-[10px] tracking-[.15em] text-white uppercase transition-colors hover:border-white/70 hover:bg-white/10"
							><Play size={13} fill="currentColor" />Watch the world unfold</button
						>
					</div>
				</div>
				<div
					class="flex items-end justify-between gap-6 border-t border-white/20 pt-4 font-mono text-[9px] tracking-[.18em] text-white/55 uppercase"
				>
					<span>Moving image / Sanctyria</span><span class="hidden sm:inline"
						>A story still becoming</span
					><span class="text-orange-200">Available now: {entries.length} works</span>
				</div>
			</div>
		</section>
		<section id="archive" class="scroll-mt-8 pt-16 pb-14 sm:pt-20">
			<div
				class="flex flex-col justify-between gap-7 border-b border-white/10 pb-8 lg:flex-row lg:items-end"
			>
				<div>
					<p class="mb-3 font-mono text-[9px] tracking-[.25em] text-orange-300 uppercase">
						Choose a doorway
					</p>
					<h2 class="font-display text-4xl text-white sm:text-5xl">The living archive</h2>
				</div>
				<label class="relative block w-full lg:max-w-[300px]"
					><Search class="absolute top-1/2 left-0 -translate-y-1/2 text-white/40" size={16} /><input
						type="search"
						bind:value={query}
						placeholder="Search the archive"
						class="h-11 w-full border-b border-white/20 bg-transparent pr-2 pl-7 text-sm text-white outline-none placeholder:text-white/35 focus:border-orange-300"
						aria-label="Search media archive"
					/></label
				>
			</div>
			<nav
				class="-mx-5 flex gap-1 overflow-x-auto border-b border-white/10 px-5 py-3 sm:-mx-9 sm:px-9 lg:-mx-14 lg:px-14"
				aria-label="Media categories"
			>
				{#each shelves as shelf (shelf.id)}{@const ShelfIcon = shelf.icon}<button
						type="button"
						onclick={() => (activeShelf = shelf.id)}
						aria-pressed={activeShelf === shelf.id}
						class={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 font-mono text-[10px] tracking-[.12em] uppercase transition-colors sm:px-4 ${activeShelf === shelf.id ? 'border-orange-300 text-orange-200' : 'border-transparent text-white/45 hover:text-white/80'}`}
						><ShelfIcon size={14} strokeWidth={1.6} />{shelf.label}<span
							class="text-[9px] text-white/30">{count(shelf.id).toString().padStart(2, '0')}</span
						></button
					>{/each}
			</nav>
			<div
				class="mt-5 mb-6 flex items-center justify-between font-mono text-[9px] tracking-[.16em] text-white/35 uppercase"
			>
				<span
					>{activeShelf === 'all' ? 'All expressions' : shelfNames[activeShelf]} / {filtered.length}
					{filtered.length === 1 ? 'work' : 'works'}</span
				><span class="hidden sm:inline">Select a work to listen, watch, or look closer</span>
			</div>
			{#if filtered.length}
				<div class="grid grid-cols-1 gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{#each filtered as entry, index (entry.id)}
						<button
							type="button"
							onclick={() => openEntry(entry)}
							class="group text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-300"
							style={`animation-delay:${Math.min(index, 8) * 45}ms`}
							aria-label={`${entry.format === 'audio' ? (activeTrack?.id === entry.id && playing ? 'Pause' : 'Play') : entry.format === 'pdf' ? 'Read' : 'Open'} ${entry.title}`}
						>
							<span
								class="relative mb-4 block aspect-[1.18] overflow-hidden border border-white/10 bg-[#171310]"
								style={`background-color:${entry.thumbnailBackground ?? '#171310'}`}
							>
								{#if entry.format === 'image' || entry.image}<img
										src={entry.format === 'image' ? entry.src : (entry.image ?? entry.src)}
										alt={entry.format === 'video' ? '' : entry.title}
										loading="lazy"
										class={`h-full w-full transition duration-700 group-hover:scale-[1.04] ${entry.format === 'image' || entry.format === 'link' || entry.format === 'pdf' ? 'object-contain' : 'object-cover'} ${entry.format === 'video' ? 'opacity-80' : ''}`}
									/>{:else}<span
										class="absolute inset-0 flex items-center justify-center overflow-hidden"
										style={`background:radial-gradient(ellipse at 50% 45%,${entry.accent}38,transparent 52%),#13100e`}
										><span
											class="absolute h-40 w-40 rounded-full border border-white/10 transition-transform duration-700 group-hover:scale-110"
										></span><span class="absolute h-28 w-28 rounded-full border border-white/15"
										></span><span
											class="absolute h-16 w-16 rounded-full border border-orange-100/30 bg-[#0d0a08]/70 shadow-[0_0_50px_rgba(227,116,59,.18)]"
										></span><Disc3
											class="relative text-orange-100/65"
											size={22}
											strokeWidth={1}
										/></span
									>{/if}
								<span
									class="absolute top-3 left-3 border border-white/15 bg-black/55 px-2.5 py-1 font-mono text-[8px] tracking-[.18em] text-white/80 uppercase backdrop-blur-sm"
									>{shelfNames[entry.shelf]}</span
								><span
									class="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center border border-white/25 bg-black/50 text-white backdrop-blur-sm transition-colors group-hover:border-orange-200 group-hover:bg-orange-300 group-hover:text-black"
									>{#if entry.format === 'audio'}{#if activeTrack?.id === entry.id && playing}<Pause
												size={14}
											/>{:else}<Play
												size={14}
												fill="currentColor"
											/>{/if}{:else if entry.format === 'video'}<Play
											size={14}
											fill="currentColor"
										/>{:else}<ArrowUpRight size={15} />{/if}</span
								>
								{#if entry.format === 'audio' && activeTrack?.id === entry.id && playing}<span
										class="absolute bottom-0 left-0 h-0.5 w-full bg-white/20"
										><span
											class="block h-full bg-orange-300"
											style={`width:${duration ? (currentTime / duration) * 100 : 0}%`}
										></span></span
									>{/if}
							</span>
							<span class="flex items-start justify-between gap-3"
								><span
									><span
										class="block font-display text-[25px] leading-tight text-white transition-colors group-hover:text-orange-200"
										>{entry.title}</span
									><span class="mt-1.5 block text-xs leading-5 text-white/45">{entry.note}</span
									></span
								><span
									class="mt-2 shrink-0 font-mono text-[8px] tracking-[.12em] text-white/35 uppercase"
									>{entry.format === 'audio'
										? 'Listen'
										: entry.format === 'video'
											? 'Watch'
											: entry.format === 'pdf'
												? 'Read'
												: entry.format === 'link'
													? 'Open'
													: 'View'}</span
								></span
							>
						</button>
					{/each}
				</div>
			{:else if activeShelf === 'all'}
				<div class="border-y border-white/10 py-16 text-center">
					<p class="font-display text-3xl text-white">Nothing found in this telling.</p>
					<p class="mt-2 text-sm text-white/45">Try another title or clear your search.</p>
					<button
						type="button"
						onclick={() => (query = '')}
						class="mt-5 font-mono text-[10px] tracking-[.15em] text-orange-200 uppercase underline underline-offset-4"
						>Clear search</button
					>
				</div>
			{:else}
				<div class="relative overflow-hidden border-y border-white/10 py-16 sm:py-20">
					<div
						class="pointer-events-none absolute -top-24 -right-8 h-72 w-72 rounded-full border border-orange-100/10"
					></div>
					<div
						class="pointer-events-none absolute -top-16 -right-1 h-56 w-56 rounded-full border border-orange-100/10"
					></div>
					<p class="font-mono text-[9px] tracking-[.24em] text-orange-300 uppercase">
						A new chapter, in time
					</p>
					<h3 class="mt-3 max-w-xl font-display text-4xl leading-tight text-white sm:text-5xl">
						This shelf is waiting for its first story.
					</h3>
					<p class="mt-4 max-w-lg text-sm leading-6 text-white/50">
						The {shelfNames[activeShelf].toLowerCase()} collection is not in the archive yet. Until then,
						wander through the worlds, music, voices, and art already here.
					</p>
					<button
						type="button"
						onclick={() => {
							activeShelf = 'all';
							query = '';
						}}
						class="mt-7 inline-flex items-center gap-2 font-mono text-[10px] tracking-[.16em] text-orange-200 uppercase transition-colors hover:text-white"
						>Explore available works <ArrowUpRight size={14} /></button
					>
				</div>
			{/if}
		</section>
		<footer
			class="flex flex-col justify-between gap-4 border-t border-white/10 py-6 font-mono text-[9px] tracking-[.15em] text-white/35 uppercase sm:flex-row sm:items-center"
		>
			<span>Sanctyria Studio / An ever-growing universe</span>
			<nav aria-label="Sanctyria destinations" class="flex flex-wrap items-center gap-4">
				<a
					href="https://world.sanctyria.com"
					class="text-white/55 transition-colors hover:text-white">World</a
				><a href="/journal" class="text-white/55 transition-colors hover:text-white">Journal</a><a
					href="/"
					class="flex items-center gap-2 text-white/55 transition-colors hover:text-white"
					>Back to Sanctyria <ArrowUpRight size={13} /></a
				>
			</nav>
		</footer>
	</main>

	{#if activeTrack}
		<div
			class="fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-[#11100e]/95 backdrop-blur-xl"
		>
			<audio
				bind:this={audio}
				src={activeTrack.src}
				loop={repeat && activeTrack.shelf === 'music'}
				ontimeupdate={() => (currentTime = audio?.currentTime ?? 0)}
				onloadedmetadata={() => (duration = audio?.duration || 0)}
				onended={() => (playing = false)}
			></audio>
			<div class="mx-auto flex max-w-[1500px] items-center gap-4 px-5 py-3 sm:px-9 lg:px-14">
				<button
					type="button"
					onclick={() => (playing = !playing)}
					aria-label={playing ? 'Pause audio' : 'Play audio'}
					class="flex h-10 w-10 shrink-0 items-center justify-center bg-orange-300 text-[#1b100b] transition-colors hover:bg-orange-200"
					>{#if playing}<Pause size={16} />{:else}<Play
							size={16}
							fill="currentColor"
						/>{/if}</button
				>
				<div class="w-36 min-w-0 shrink-0 sm:w-52">
					<p class="truncate text-sm text-white">{activeTrack.title}</p>
					<p class="mt-0.5 font-mono text-[8px] tracking-[.15em] text-white/40 uppercase">
						{shelfNames[activeTrack.shelf]} / Sanctyria
					</p>
				</div>
				<span class="hidden font-mono text-[9px] text-white/40 tabular-nums sm:inline"
					>{formatTime(currentTime)}</span
				>
				<input
					type="range"
					min="0"
					max={duration || 0}
					value={Math.min(currentTime, duration || 0)}
					oninput={(event) => {
						if (audio) {
							audio.currentTime = Number(event.currentTarget.value);
							currentTime = audio.currentTime;
						}
					}}
					aria-label="Seek audio"
					class="h-1 min-w-10 flex-1 cursor-pointer accent-orange-300"
				/>
				<span class="hidden font-mono text-[9px] text-white/40 tabular-nums sm:inline"
					>{formatTime(duration)}</span
				>
				<div class="flex shrink-0 items-center gap-1.5">
					<button
						type="button"
						onclick={audioState.toggleMute}
						aria-label={audioState.getMuted() ? 'Unmute Studio audio' : 'Mute Studio audio'}
						class="flex h-9 w-9 items-center justify-center text-white/55 transition-colors hover:text-white"
						>{#if audioState.getMuted()}<VolumeX size={17} />{:else}<Volume2
								size={17}
							/>{/if}</button
					><input
						type="range"
						min="0"
						max="1"
						step=".01"
						value={audioState.getMuted() ? 0 : audioState.getVolume()}
						oninput={(event) => {
							audioState.setVolumeLevel(Number(event.currentTarget.value));
							if (audioState.getMuted() && Number(event.currentTarget.value) > 0)
								audioState.toggleMute();
						}}
						aria-label="Studio audio volume"
						class="hidden h-1 w-20 cursor-pointer accent-orange-300 sm:block"
					/>
				</div>
				{#if activeTrack.shelf === 'music'}<button
						type="button"
						onclick={() => (repeat = !repeat)}
						aria-label={repeat ? 'Turn off repeat' : 'Repeat this track'}
						aria-pressed={repeat}
						title={repeat ? 'Repeat on' : 'Repeat off'}
						class={`flex h-9 w-9 shrink-0 items-center justify-center transition-colors ${repeat ? 'text-orange-200' : 'text-white/45 hover:text-white'}`}
						><Repeat2 size={17} /></button
					>{/if}<AudioLines class="hidden text-orange-200/70 sm:block" size={17} />
			</div>
		</div>
	{/if}

	{#if selected}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md sm:p-8"
			role="presentation"
			onclick={(event) => {
				if (event.target === event.currentTarget) closeModal();
			}}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-label={selected.title}
				tabindex="-1"
				class="relative grid max-h-[90vh] w-full max-w-5xl overflow-auto border border-white/15 bg-[#100e0c] md:grid-cols-[1.4fr_.8fr]"
			>
				<button
					type="button"
					onclick={closeModal}
					aria-label="Close media viewer"
					class="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center border border-white/20 bg-black/65 text-white transition-colors hover:bg-white hover:text-black"
					><X size={18} /></button
				>
				<div class="flex min-h-60 items-center justify-center bg-black md:min-h-[520px]">
					{#if selected.format === 'video'}<!-- svelte-ignore a11y_media_has_caption --><video
							src={selected.src}
							poster={selected.image}
							controls
							autoplay
							playsinline
							aria-label={selected.title}
							class="max-h-[72vh] w-full object-contain"
						></video>{:else if selected.format === 'pdf'}<iframe
							src={selected.src}
							title={`Read ${selected.title}`}
							class="h-[72vh] min-h-[400px] w-full bg-black"
						></iframe>{:else if selected.format === 'image' || selected.image}<img
							src={selected.format === 'image' ? selected.src : selected.image}
							alt={selected.title}
							class="max-h-[72vh] w-full object-contain"
						/>{:else}<div
							class="flex h-full min-h-60 w-full items-center justify-center text-orange-100/50"
						>
							<Disc3 size={44} strokeWidth={1} />
						</div>{/if}
				</div>
				<div
					class="flex flex-col justify-end border-t border-white/10 p-6 sm:p-9 md:border-t-0 md:border-l"
				>
					<p class="font-mono text-[9px] tracking-[.2em] text-orange-300 uppercase">
						{shelfNames[selected.shelf]} / Sanctyria
					</p>
					<h2 class="mt-3 font-display text-4xl leading-tight text-white sm:text-5xl">
						{selected.title}
					</h2>
					<p class="mt-4 text-sm leading-6 text-white/55">{selected.note}</p>
					{#if selected.href}<a
							href={selected.href}
							target="_blank"
							rel="noopener noreferrer"
							class="mt-7 inline-flex w-fit items-center gap-2 bg-orange-300 px-4 py-3 font-mono text-[10px] font-bold tracking-[.15em] text-[#1b100b] uppercase transition-colors hover:bg-orange-200"
							>{selected.linkLabel ?? `Open ${selected.title}`} <ArrowUpRight size={14} /></a
						>{/if}
					<p
						class="mt-8 border-t border-white/10 pt-4 font-mono text-[9px] tracking-[.15em] text-white/35 uppercase"
					>
						An artifact from the living archive
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
