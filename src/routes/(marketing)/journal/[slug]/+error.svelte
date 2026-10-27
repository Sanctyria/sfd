<script lang="ts">
	import { ArrowLeft, Sparkles } from '@lucide/svelte';
</script>

<svelte:head>
	<title>Story not found | Sanctyria Journal</title>
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<main class="relative z-10 mx-auto max-w-3xl px-5 py-28 text-center sm:px-9 lg:px-12">
	<Sparkles class="mx-auto mb-5 text-orange-200" size={22} />
	<h1 class="font-display text-5xl">This story is still unfolding.</h1>
	<p class="mt-4 text-sm text-white/55">That page is not in the journal yet.</p>
	<a
		href="/journal"
		class="mt-8 inline-flex items-center gap-2 border border-white/20 px-4 py-3 font-mono text-[10px] tracking-[0.14em] text-white/70 uppercase hover:border-orange-200/50 hover:text-orange-100"
		><ArrowLeft size={14} /> Browse stories</a
	>
</main>
