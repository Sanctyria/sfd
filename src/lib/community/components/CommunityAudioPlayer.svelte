<script lang="ts">
	import { Maximize2, Music2, Pause, Play, SkipBack, SkipForward, X } from '@lucide/svelte';

	interface Props {
		src: string;
		coverUrl?: string | null;
		title?: string;
		subtitle?: string;
	}

	let {
		src,
		coverUrl = null,
		title = 'Audio post',
		subtitle = 'Sanctyria Community'
	}: Props = $props();
	let audio = $state<HTMLAudioElement>();
	let playing = $state(false);
	let currentTime = $state(0);
	let duration = $state(0);
	let playerOpen = $state(false);
	let playbackError = $state('');

	const progress = $derived(duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0);

	function formatTime(seconds: number): string {
		if (!Number.isFinite(seconds)) return '0:00';
		const minutes = Math.floor(seconds / 60);
		return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
	}

	async function togglePlayback() {
		if (!audio) return;
		playbackError = '';
		if (audio.paused) {
			try {
				await audio.play();
			} catch {
				playbackError = 'Audio playback could not start.';
			}
		} else {
			audio.pause();
		}
	}

	function seek(value: string) {
		const nextTime = Number(value);
		if (!audio || !Number.isFinite(nextTime) || !Number.isFinite(duration)) return;
		audio.currentTime = (nextTime / 100) * duration;
		currentTime = audio.currentTime;
	}

	function skip(seconds: number) {
		if (!audio) return;
		const length = Number.isFinite(audio.duration) ? audio.duration : 0;
		audio.currentTime = Math.max(0, Math.min(length, audio.currentTime + seconds));
		currentTime = audio.currentTime;
	}
</script>

<audio
	class="community-audio-native"
	bind:this={audio}
	{src}
	controls
	preload="metadata"
	onloadedmetadata={() => (duration = audio?.duration ?? 0)}
	ontimeupdate={() => (currentTime = audio?.currentTime ?? 0)}
	onplay={() => (playing = true)}
	onpause={() => (playing = false)}
	onended={() => (playing = false)}
	onerror={() => (playbackError = 'This audio file could not be played.')}
>
	Your browser does not support audio playback.
</audio>

<div class="community-audio-custom" aria-label={`Audio player: ${title}`}>
	<div class="flex items-center gap-3">
		<div
			class="community-audio-cover grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/[0.06] text-orange-200"
		>
			{#if coverUrl}<img src={coverUrl} alt="" class="h-full w-full object-cover" loading="lazy" />
			{:else}<Music2 size={20} />{/if}
		</div>
		<div class="min-w-0 flex-1">
			<p class="truncate text-xs font-semibold text-white/90">{title}</p>
			<p class="mt-1 truncate text-[10px] text-white/45">{subtitle}</p>
		</div>
		<button
			type="button"
			onclick={togglePlayback}
			aria-label={playing ? 'Pause audio' : 'Play audio'}
			class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-300 text-[#17110e]"
		>
			{#if playing}<Pause size={17} fill="currentColor" />{:else}<Play
					size={17}
					fill="currentColor"
				/>{/if}
		</button>
		<button
			type="button"
			onclick={() => (playerOpen = true)}
			aria-label="Open full-screen audio player"
			class="grid h-9 w-9 shrink-0 place-items-center text-white/50 hover:text-white"
			><Maximize2 size={15} /></button
		>
	</div>
	<div class="mt-3 flex items-center gap-2 text-[9px] text-white/45 tabular-nums">
		<span>{formatTime(currentTime)}</span>
		<input
			type="range"
			min="0"
			max="100"
			step="0.1"
			value={progress}
			oninput={(event) => seek(event.currentTarget.value)}
			aria-label="Audio playback position"
			class="community-audio-progress min-w-0 flex-1"
		/>
		<span>{formatTime(duration)}</span>
	</div>
	{#if playbackError}<p role="status" class="mt-2 text-[10px] text-red-200">{playbackError}</p>{/if}
</div>

{#if playerOpen}
	<div
		class="community-audio-fullscreen"
		role="dialog"
		aria-modal="true"
		aria-label={`${title} audio player`}
	>
		<header class="flex items-center justify-between">
			<button
				type="button"
				onclick={() => (playerOpen = false)}
				aria-label="Close full-screen audio player"
				class="grid h-10 w-10 place-items-center rounded-full bg-white/[0.08] text-white/80"
				><X size={20} /></button
			>
			<span class="text-[10px] font-semibold tracking-[0.18em] text-white/45 uppercase"
				>Now playing</span
			>
			<span class="h-10 w-10"></span>
		</header>
		<div class="mx-auto flex w-full max-w-sm flex-col items-center">
			<div
				class="community-audio-artwork mt-10 grid w-full place-items-center overflow-hidden rounded-2xl bg-white/[0.06] text-orange-200 shadow-2xl"
			>
				{#if coverUrl}<img src={coverUrl} alt="" class="h-full w-full object-cover" />
				{:else}<Music2 size={56} />{/if}
			</div>
			<div class="mt-8 w-full text-center">
				<h2 class="truncate font-display text-3xl text-white">{title}</h2>
				<p class="mt-2 truncate text-sm text-white/55">{subtitle}</p>
			</div>
			<div class="mt-8 w-full">
				<div class="flex items-center gap-2 text-[10px] text-white/50 tabular-nums">
					<span>{formatTime(currentTime)}</span>
					<input
						type="range"
						min="0"
						max="100"
						step="0.1"
						value={progress}
						oninput={(event) => seek(event.currentTarget.value)}
						aria-label="Audio playback position"
						class="community-audio-progress min-w-0 flex-1"
					/>
					<span>{formatTime(duration)}</span>
				</div>
				<div class="mt-7 flex items-center justify-center gap-8">
					<button
						type="button"
						onclick={() => skip(-15)}
						aria-label="Back 15 seconds"
						class="text-white/70"><SkipBack size={22} /></button
					>
					<button
						type="button"
						onclick={togglePlayback}
						aria-label={playing ? 'Pause audio' : 'Play audio'}
						class="grid h-16 w-16 place-items-center rounded-full bg-orange-300 text-[#17110e]"
					>
						{#if playing}<Pause size={26} fill="currentColor" />{:else}<Play
								size={26}
								fill="currentColor"
							/>{/if}
					</button>
					<button
						type="button"
						onclick={() => skip(15)}
						aria-label="Forward 15 seconds"
						class="text-white/70"><SkipForward size={22} /></button
					>
				</div>
				{#if playbackError}<p role="status" class="mt-5 text-center text-xs text-red-200">
						{playbackError}
					</p>{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.community-audio-custom {
		display: none;
	}

	.community-audio-progress {
		height: 4px;
		accent-color: #ed6a36;
	}

	.community-audio-fullscreen {
		position: fixed;
		z-index: 80;
		inset: 0;
		overflow-y: auto;
		background:
			radial-gradient(ellipse at 50% 30%, rgba(237, 106, 54, 0.18), transparent 55%), #090a0a;
		color: #f1efe9;
		padding: max(20px, env(safe-area-inset-top)) 24px max(28px, env(safe-area-inset-bottom));
	}

	.community-audio-artwork {
		aspect-ratio: 1;
	}

	@media (max-width: 767px) {
		.community-audio-native {
			display: none;
		}

		.community-audio-custom {
			display: block;
		}
	}

	@media (min-width: 768px) {
		.community-audio-fullscreen {
			display: none;
		}
	}
</style>
