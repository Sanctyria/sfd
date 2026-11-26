<script lang="ts">
	import { onMount } from 'svelte';
	import { getContext } from 'svelte';
	import { ArrowRight, UsersRound } from '@lucide/svelte';
	import Footer from '#lib/marketing/Footer.svelte';

	type SiteAudio = {
		getMuted: () => boolean;
		getVolume: () => number;
	};

	const audio = getContext<SiteAudio>('site-audio');
	let videoElement: HTMLVideoElement;
	let musicElement: HTMLAudioElement;
	let videoEnded = $state(false);
	let muted = $state(audio.getMuted());
	let volume = $state(audio.getVolume());

	onMount(() => {
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		const saveData = navigator.connection?.saveData === true;
		const slowConnection = ['slow-2g', '2g'].includes(navigator.connection?.effectiveType ?? '');
		if (reducedMotion || saveData || slowConnection) return;

		const startVideo = () => {
			if (document.hidden) return;
			videoElement.src = '/assets/video/worldloop.mp4';
			videoElement.playbackRate = 0.3;
			videoElement.load();
			void videoElement.play().catch(() => undefined);
		};
		const handleVisibilityChange = () => {
			if (document.hidden) {
				videoElement.pause();
			} else if (videoElement.src) {
				void videoElement.play().catch(() => undefined);
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);
		if (window.requestIdleCallback) {
			const idleHandle = window.requestIdleCallback(startVideo, { timeout: 2500 });
			return () => {
				window.cancelIdleCallback?.(idleHandle);
				document.removeEventListener('visibilitychange', handleVisibilityChange);
			};
		}
		const timeoutHandle = window.setTimeout(startVideo, 1200);
		return () => {
			window.clearTimeout(timeoutHandle);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});

	$effect(() => {
		muted = audio.getMuted();
		volume = audio.getVolume();
		if (!musicElement) return;
		musicElement.muted = muted;
		musicElement.volume = volume;
		if (!muted) {
			if (!musicElement.src) {
				musicElement.src = '/assets/music/eternalqueen.mp3';
				musicElement.load();
			}
			void musicElement.play().catch(() => undefined);
		}
	});
</script>

<svelte:head>
	<title>Sanctyria | A Dark-Fantasy World and Creator Community</title>
	<meta
		name="description"
		content="Sanctyria is an original dark-fantasy universe told through stories, art, music, and interactive experiences. Explore its world or meet the creators in Sanctity."
	/>
	<meta
		name="keywords"
		content="Sanctyria, dark fantasy universe, Sanctity creator community, fantasy stories, Eternal Flame, Flameborn"
	/>
	<link rel="canonical" href="https://sanctyria.com" />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://sanctyria.com" />
	<meta property="og:title" content="Sanctyria | A Dark-Fantasy World and Creator Community" />
	<meta
		property="og:description"
		content="Sanctyria is an original dark-fantasy universe told through stories, art, music, and interactive experiences. Explore its world or meet the creators in Sanctity."
	/>
	<meta property="og:image" content="https://sanctyria.com/sitepreview.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content="https://sanctyria.com" />
	<meta name="twitter:title" content="Sanctyria | A Dark-Fantasy World and Creator Community" />
	<meta
		name="twitter:description"
		content="Sanctyria is an original dark-fantasy universe told through stories, art, music, and interactive experiences. Explore its world or meet the creators in Sanctity."
	/>
	<meta name="twitter:image" content="https://sanctyria.com/sitepreview.png" />
</svelte:head>

<div class="relative w-full overflow-hidden bg-[#080809] text-white">
	<section class="relative flex min-h-screen w-full flex-col justify-center overflow-hidden">
		<div class="absolute inset-0 z-0 overflow-hidden bg-black">
			<video
				bind:this={videoElement}
				class="h-full w-full object-cover"
				muted
				playsinline
				preload="none"
				poster="/assets/worldview/ezgif-frame-120.jpg"
				loop
				onended={() => (videoEnded = true)}
			>
			</video>
			<div class="pointer-events-none absolute inset-0 bg-black/35"></div>
			<div
				class="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#080809] to-transparent"
			></div>
		</div>
		<audio bind:this={musicElement} loop preload="none" {muted} class="hidden"></audio>
		<main
			class="relative z-10 flex flex-grow flex-col items-center justify-center px-6 py-36 text-center"
		>
			<section class="mx-auto flex w-full max-w-6xl flex-col items-center">
				<p
					class="animate-fade-rise mb-6 font-mono text-xs tracking-[0.22em] text-orange-200/90 uppercase"
				>
					A world of stories. A community of creators.
				</p>
				<h1
					class="animate-fade-rise max-w-5xl font-display text-5xl leading-[0.98] text-white select-none sm:text-7xl md:text-8xl"
				>
					A dark-fantasy world, brought to life by its community.
				</h1>
				<p
					class="animate-fade-rise-delay mt-6 max-w-3xl font-body text-base leading-relaxed text-white/85 sm:mt-8 sm:text-xl"
					style="text-shadow: 0 1px 3px rgba(0,0,0,0.85)"
				>
					Sanctyria is an original fantasy universe told through stories, art, music, and
					interactive experiences. Explore the world—or meet the creators building what comes next
					in Sanctity.
				</p>
				<div
					class="animate-fade-rise-delay-2 mt-10 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4"
				>
					<a
						href="/about"
						class={`w-full max-w-[300px] rounded-full bg-white px-7 py-4 text-sm font-semibold text-black shadow-md transition-all duration-300 hover:scale-[1.03] hover:bg-orange-100 hover:shadow-lg active:scale-[0.98] sm:w-auto sm:max-w-none sm:px-9 sm:py-4 sm:text-base ${videoEnded ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-black' : ''}`}
						>Explore the world</a
					>
					<a
						href="/sanctity"
						aria-label="Discover Sanctity, the creator-focused community app"
						class="group relative flex w-full max-w-[300px] items-center justify-center gap-2 overflow-hidden rounded-full border border-white/40 bg-black/35 px-6 py-4 text-sm font-medium text-white shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-white hover:bg-white/10 active:scale-[0.98] sm:w-auto sm:max-w-none sm:gap-3 sm:px-8 sm:py-4 sm:text-base"
					>
						<UsersRound class="h-5 w-5 shrink-0" />
						<span>Meet the community in Sanctity</span>
						<ArrowRight
							class="h-3.5 w-3.5 shrink-0 opacity-60 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
						/>
					</a>
				</div>
			</section>
		</main>
	</section>

	<section class="px-6 py-20 sm:py-28">
		<div class="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
			<div>
				<p class="font-mono text-xs tracking-[0.2em] text-orange-300 uppercase">Start here</p>
				<h2 class="mt-4 font-display text-4xl leading-tight sm:text-5xl">So, what is Sanctyria?</h2>
			</div>
			<div>
				<p class="text-lg leading-relaxed text-white/70 sm:text-xl">
					Sanctyria is a shared fantasy universe and the creative work growing around it. Discover
					its places and characters, experience its stories and music, or connect with creators in
					Sanctity, our community app.
				</p>
				<div class="mt-8 grid gap-3 sm:grid-cols-3">
					<a
						href="/nations"
						class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-orange-200/40 hover:bg-white/[0.06]"
					>
						<span class="block font-display text-2xl">Explore</span>
						<span class="mt-2 block text-sm leading-relaxed text-white/55"
							>Meet the nations, characters, and lore.</span
						>
					</a>
					<a
						href="/studio"
						class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-orange-200/40 hover:bg-white/[0.06]"
					>
						<span class="block font-display text-2xl">Experience</span>
						<span class="mt-2 block text-sm leading-relaxed text-white/55"
							>Find stories, artwork, film, and music.</span
						>
					</a>
					<a
						href="/sanctity"
						class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-orange-200/40 hover:bg-white/[0.06]"
					>
						<span class="block font-display text-2xl">Create together</span>
						<span class="mt-2 block text-sm leading-relaxed text-white/55"
							>Meet creators in the Sanctity community.</span
						>
					</a>
				</div>
			</div>
		</div>
	</section>
</div>

<Footer />
