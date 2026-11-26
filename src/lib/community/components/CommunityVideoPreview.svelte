<script lang="ts">
	import { Maximize, Play } from '@lucide/svelte';
	import { videoEmbedUrl } from '../community.js';

	interface Props {
		url: string;
		title: string;
	}

	let { url, title }: Props = $props();
	let playing = $state(false);
	let posterFailed = $state(false);
	let fullscreenError = $state('');
	let previewElement = $state<HTMLDivElement>();
	const embedUrl = $derived(videoEmbedUrl(url));
	const posterUrl = $derived.by(() => {
		if (!embedUrl) return null;
		const videoId = embedUrl.match(/youtube-nocookie\.com\/embed\/([\w-]+)/)?.[1];
		return videoId
			? `https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`
			: null;
	});

	async function playFullscreen() {
		if (!embedUrl || !previewElement) return;
		fullscreenError = '';
		try {
			const fullscreenRequest = previewElement.requestFullscreen();
			playing = true;
			await fullscreenRequest;
		} catch {
			fullscreenError = 'Full-screen playback is unavailable in this browser.';
		}
	}
</script>

<div
	class="community-video-mobile-preview"
	class:playing
	bind:this={previewElement}
	role="group"
	aria-label={title}
>
	{#if playing && embedUrl}
		<iframe
			src={`${embedUrl}?autoplay=1`}
			title={`${title} video`}
			referrerpolicy="strict-origin-when-cross-origin"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			allowfullscreen
		></iframe>
	{:else}
		{#if posterUrl && !posterFailed}
			<img src={posterUrl} alt="" loading="lazy" onerror={() => (posterFailed = true)} />
		{/if}
		<button
			type="button"
			class="community-video-preview-play"
			onclick={() => (playing = true)}
			aria-label={`Play ${title}`}><Play size={34} fill="none" strokeWidth={2.2} /></button
		>
		<button
			type="button"
			class="community-video-preview-fullscreen"
			onclick={playFullscreen}
			aria-label={`Play ${title} in full screen`}><Maximize size={21} strokeWidth={2.2} /></button
		>
	{/if}
</div>
{#if fullscreenError}<p class="mt-2 text-[10px] text-red-200/80" role="status">
		{fullscreenError}
	</p>{/if}

<div class="community-video-desktop-embed">
	{#if embedUrl}
		<iframe
			src={embedUrl}
			title={`${title} video`}
			loading="lazy"
			referrerpolicy="strict-origin-when-cross-origin"
			allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
			allowfullscreen
			class="aspect-video w-full"
		></iframe>
	{/if}
</div>

<style>
	.community-video-mobile-preview {
		display: none;
	}

	.community-video-desktop-embed {
		display: block;
	}

	.community-video-mobile-preview img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.community-video-mobile-preview:not(.playing)::after {
		position: absolute;
		z-index: 1;
		inset: 0;
		background: linear-gradient(0deg, rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.08));
		content: '';
		pointer-events: none;
	}

	.community-video-preview-play,
	.community-video-preview-fullscreen {
		position: absolute;
		z-index: 2;
		display: grid;
		place-items: center;
		color: white;
	}

	.community-video-preview-play {
		top: 50%;
		left: 50%;
		width: 68px;
		height: 68px;
		transform: translate(-50%, -50%);
		border-radius: 50%;
		background: #f10d43;
		padding-left: 5px;
		box-shadow: 0 8px 26px rgba(0, 0, 0, 0.3);
	}

	.community-video-preview-fullscreen {
		top: 14px;
		right: 14px;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.56);
		backdrop-filter: blur(8px);
	}

	.community-video-mobile-preview iframe {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		border: 0;
	}

	@media (max-width: 767px) {
		.community-video-mobile-preview {
			position: relative;
			display: block;
			width: 100%;
			aspect-ratio: 16 / 9;
			overflow: hidden;
			border-radius: 8px;
			background: linear-gradient(135deg, #292523, #080909 72%);
		}

		.community-video-desktop-embed {
			display: none;
		}
	}
</style>
