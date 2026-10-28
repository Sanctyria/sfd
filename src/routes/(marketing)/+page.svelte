<script lang="ts">
	import { onMount } from 'svelte';
	import { getContext } from 'svelte';
	import { ArrowRight, UsersRound } from '@lucide/svelte';

	type SiteAudio = {
		getMuted: () => boolean;
		getVolume: () => number;
	};

	const audio = getContext<SiteAudio>('site-audio');
	let videoElement: HTMLVideoElement;
	let musicElement: HTMLAudioElement;
	let videoLoaded = $state(false);
	let videoEnded = $state(false);
	let muted = $state(audio.getMuted());
	let volume = $state(audio.getVolume());

	onMount(() => {
		videoElement.playbackRate = 0.3;
		videoElement.play().catch(() => undefined);
	});

	$effect(() => {
		muted = audio.getMuted();
		volume = audio.getVolume();
		if (!musicElement) return;
		musicElement.muted = muted;
		musicElement.volume = volume;
		if (!muted) musicElement.play().catch(() => undefined);
	});
</script>

<svelte:head>
	<title>Sanctyria | Dark Fantasy Universe &amp; Creative Sanctuary</title>
	<meta
		name="description"
		content="Step inside Sanctyria, a dark fantasy universe and creative transmedia ecosystem. Gather around the Eternal Flame, explore magitech systems, and join the community."
	/>
	<meta
		name="keywords"
		content="Sanctyria, dark fantasy universe, creative fantasy community, transmedia fantasy project, Eternal Flame, Flameborn"
	/>
	<link rel="canonical" href="https://sanctyria.com" />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://sanctyria.com" />
	<meta property="og:title" content="Sanctyria | Dark Fantasy Universe &amp; Creative Sanctuary" />
	<meta
		property="og:description"
		content="Step inside Sanctyria, a dark fantasy universe and creative transmedia ecosystem. Gather around the Eternal Flame, explore magitech systems, and join the community."
	/>
	<meta property="og:image" content="https://sanctyria.com/sitepreview.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content="https://sanctyria.com" />
	<meta name="twitter:title" content="Sanctyria | Dark Fantasy Universe &amp; Creative Sanctuary" />
	<meta
		name="twitter:description"
		content="Step inside Sanctyria, a dark fantasy universe and creative transmedia ecosystem. Gather around the Eternal Flame, explore magitech systems, and join the community."
	/>
	<meta name="twitter:image" content="https://sanctyria.com/sitepreview.png" />
</svelte:head>

<div class="relative flex h-screen min-h-screen w-full flex-col overflow-hidden bg-transparent">
	<div class="absolute inset-0 z-0 overflow-hidden bg-black">
		<video
			bind:this={videoElement}
			src="/assets/video/worldloop.mp4"
			class="h-full w-full object-cover"
			muted
			playsinline
			preload="auto"
			loop
			oncanplay={() => (videoLoaded = true)}
			onloadeddata={() => (videoLoaded = true)}
			onended={() => (videoEnded = true)}
			style:opacity={videoLoaded ? 1 : 0}
		>
		</video>
		<div
			class="pointer-events-none absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black to-transparent"
		></div>
	</div>
	<audio
		bind:this={musicElement}
		src="/assets/music/eternalqueen.mp3"
		autoplay
		loop
		{muted}
		class="hidden"
	></audio>
	<main class="relative z-10 flex flex-grow flex-col items-center justify-center">
		<section
			class="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-6 text-center"
			style="padding-top: calc(8rem - 75px); padding-bottom: 10rem"
		>
			<h1
				class="animate-fade-rise max-w-7xl font-display text-3xl leading-[1.05] text-brand-black select-none sm:text-7xl sm:leading-[0.95] md:text-8xl"
			>
				A dark fantasy <span class="font-normal text-white italic">world</span> where creation shapes
				reality.
			</h1>
			<p
				class="animate-fade-rise-delay mt-5 max-w-2xl font-body text-sm leading-relaxed text-white sm:mt-8 sm:text-lg"
				style="text-shadow: 0 1px 3px rgba(0,0,0,0.85)"
			>
				Explore eight nations, ancient power, and a living mythology around the Eternal Flame & then
				join a community of creators and storytellers bringing it to life.
			</p>
			<div
				class="animate-fade-rise-delay-2 mt-12 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row sm:gap-4"
			>
				<a
					href="/about"
					class={`w-full max-w-[280px] rounded-full bg-brand-black px-5 py-4 text-sm font-medium text-white shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] sm:w-auto sm:max-w-none sm:px-14 sm:py-5 sm:text-base ${videoEnded ? 'shadow-[0_0_25px_rgba(0,0,0,0.6)] ring-2 ring-brand-black/80 ring-offset-2' : ''}`}
					>Begin Journey</a
				>
				<a
					href="/home"
					aria-label="Explore the Sanctyria community"
					class="group relative flex w-full max-w-[280px] items-center justify-center gap-2 overflow-hidden rounded-full border border-brand-black/15 bg-white/60 px-4 py-4 text-sm font-medium text-brand-black shadow-sm backdrop-blur-sm transition-all duration-300 hover:border-brand-black hover:bg-brand-black hover:text-white hover:shadow-md active:scale-[0.98] sm:w-auto sm:max-w-none sm:gap-3 sm:px-12 sm:py-5 sm:text-base"
				>
					<span
						class="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-600 group-hover:translate-x-full"
					></span>
					<UsersRound class="relative h-5 w-5 shrink-0 transition-colors duration-300" />
					<span class="relative">Explore the Community</span>
					<ArrowRight
						class="relative h-3.5 w-3.5 shrink-0 opacity-50 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
					/>
				</a>
			</div>
		</section>
	</main>
</div>
