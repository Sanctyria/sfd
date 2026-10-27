<script lang="ts">
	import { brandedOgImagePath } from '#lib/community/og.js';

	const templatePreview = brandedOgImagePath(
		'Sanctyria Community',
		'Explore creative work and find a community to call your own.',
		'COMMUNITY · EXPLORE'
	);
</script>

<svelte:head>
	<title>Link thumbnail template | Sanctyria</title>
</svelte:head>

<main class="min-h-screen bg-[#0b0b0d] p-5 text-white sm:p-10">
	<div class="mx-auto max-w-4xl">
		<p class="font-mono text-[10px] tracking-[0.2em] text-orange-200/60 uppercase">
			Social preview image
		</p>
		<h1 class="mt-2 font-display text-2xl text-white">Branded 1200 × 630 template</h1>
		<p class="mt-2 text-sm text-white/50">
			The generated 1200 × 630 PNG used for Sanctyria pages and as a fallback when a shared link has
			no thumbnail.
		</p>
		<img
			src={templatePreview}
			alt="Sanctyria branded social preview with the logo, character artwork, and page details"
			width="1200"
			height="630"
			class="mt-6 block h-auto w-full rounded border border-white/10"
		/>
		<p class="mt-3 font-mono text-xs text-white/40">1200 × 630 px · PNG</p>
	</div>
</main>
