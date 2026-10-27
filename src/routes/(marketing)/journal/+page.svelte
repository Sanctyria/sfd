<script lang="ts">
	import { brandedOgImageUrl } from '#lib/community/og.js';
	import { ArrowUpRight, Feather, Sparkles } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const siteUrl = 'https://sanctyria.com';
	const canonicalUrl = `${siteUrl}/journal`;
	const articles = $derived(data.articles);
</script>

<svelte:head>
	<title>Sanctyria Journal | Stories from a World Still Becoming</title>
	<meta
		name="description"
		content="Field notes, worldbuilding, and stories from the people making Sanctyria."
	/>
	<meta
		name="keywords"
		content="Sanctyria, journal, fantasy worldbuilding, stories, creative process"
	/>
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:title" content="Sanctyria Journal | Stories from a World Still Becoming" />
	<meta
		property="og:description"
		content="Field notes, worldbuilding, and stories from the people making Sanctyria."
	/>
	<meta
		property="og:image"
		content={brandedOgImageUrl(
			'Sanctyria Journal',
			'Field notes, worldbuilding, and stories from the people making Sanctyria.',
			'JOURNAL'
		)}
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Sanctyria Journal | Stories from a World Still Becoming" />
	<meta
		name="twitter:description"
		content="Field notes, worldbuilding, and stories from the people making Sanctyria."
	/>
	<meta
		name="twitter:image"
		content={brandedOgImageUrl(
			'Sanctyria Journal',
			'Field notes, worldbuilding, and stories from the people making Sanctyria.',
			'JOURNAL'
		)}
	/>
</svelte:head>

<main class="relative z-10 mx-auto max-w-7xl px-5 pb-20 sm:px-9 lg:px-12">
	<section
		class="grid gap-8 pt-14 pb-12 sm:pt-20 lg:grid-cols-[1fr_0.55fr] lg:items-end lg:gap-16 lg:pb-16"
	>
		<div>
			<div
				class="mb-5 flex items-center gap-3 font-mono text-[9px] tracking-[0.22em] text-orange-200/80 uppercase"
			>
				<span class="h-px w-8 bg-orange-200/70"></span> Dispatches from the making of a world
			</div>
			<h1 class="max-w-3xl font-display text-[clamp(3.5rem,9vw,7.8rem)] leading-[0.82]">
				Stories from a<br /><span class="text-[#d4a287] italic">world becoming.</span>
			</h1>
		</div>
		<div class="lg:pb-2">
			<p class="max-w-md text-sm leading-7 text-white/55 sm:text-base sm:leading-8">
				Field notes, fragments of lore, and dispatches from the people building Sanctyria. Come a
				little closer to the stories behind the story.
			</p>
			<div
				class="mt-6 flex items-center gap-3 font-mono text-[9px] tracking-[0.15em] text-white/35 uppercase"
			>
				<span class="inline-flex items-center gap-2"
					><Feather size={13} /> The Sanctyria journal</span
				><span class="h-1 w-1 rounded-full bg-orange-200/60"></span>{articles.length}
				{articles.length === 1 ? 'story' : 'stories'} to explore
			</div>
		</div>
	</section>

	{#if articles[0]}
		<section aria-label="Featured journal story">
			<a
				href={`/journal/${articles[0].slug}`}
				class="group grid w-full border-y border-white/10 text-left transition-colors hover:border-orange-200/35 lg:grid-cols-[0.9fr_1.1fr]"
			>
				<div class="flex flex-col justify-between py-7 sm:py-10 lg:py-12 lg:pr-12">
					<div>
						<div
							class="mb-6 flex items-center gap-3 font-mono text-[9px] tracking-[0.17em] text-orange-200 uppercase"
						>
							<Sparkles size={13} /> First dispatch <span class="text-white/25">/</span>
							{articles[0].category}
						</div>
						<h2
							class="max-w-xl font-display text-5xl leading-[0.94] transition-colors group-hover:text-orange-100 sm:text-6xl lg:text-[4.5rem]"
						>
							{articles[0].title}
						</h2>
						<p class="mt-5 max-w-lg text-sm leading-7 text-white/55 sm:text-base">
							{articles[0].dek}
						</p>
					</div>
					<div class="mt-8 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
						<span class="font-mono text-[9px] tracking-[0.14em] text-white/40 uppercase"
							>{articles[0].date} <span class="px-1.5 text-orange-200/60">·</span>
							{articles[0].readTime}</span
						>
						<span
							class="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.12em] text-orange-200 uppercase"
							>Read story <ArrowUpRight
								size={14}
								class="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
							/></span
						>
					</div>
				</div>
				<div class="relative min-h-64 overflow-hidden lg:min-h-[430px]">
					<img
						src={articles[0].image}
						alt={articles[0].imageAlt}
						class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
					/>
					<span
						class="absolute right-3 bottom-3 bg-black/45 px-2 py-1 font-mono text-[8px] tracking-[0.12em] text-white/70 uppercase backdrop-blur-sm"
						>{articles[0].imageNote}</span
					>
				</div>
			</a>
		</section>
	{/if}

	<section class="pt-14 sm:pt-20" aria-labelledby="latest-stories-heading">
		<div class="mb-7 flex items-end justify-between border-b border-white/10 pb-4">
			<div>
				<span class="font-mono text-[8px] tracking-[0.2em] text-white/35 uppercase"
					>The notebook</span
				>
				<h2 id="latest-stories-heading" class="mt-2 font-display text-4xl sm:text-5xl">
					More from the journal
				</h2>
			</div>
			<span class="hidden font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase sm:block"
				>02 — 03 / Latest notes</span
			>
		</div>
		<div class="grid gap-x-7 gap-y-10 md:grid-cols-2">
			{#each articles.slice(1) as article (article.slug)}
				<a href={`/journal/${article.slug}`} class="group text-left">
					<div class="relative aspect-[1.72] overflow-hidden bg-white/5">
						<img
							src={article.image}
							alt={article.imageAlt}
							loading="lazy"
							class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
						/>
						<span
							class="absolute top-3 left-3 bg-[#10110f]/75 px-2.5 py-1.5 font-mono text-[8px] tracking-[0.13em] text-orange-100 uppercase backdrop-blur-sm"
							>{article.category}</span
						>
					</div>
					<div
						class="flex items-center justify-between gap-4 pt-4 font-mono text-[8px] tracking-[0.14em] text-white/40 uppercase"
					>
						<span>{article.date}</span><span>{article.readTime}</span>
					</div>
					<div class="mt-2 flex items-start justify-between gap-4">
						<h3
							class="max-w-lg font-display text-3xl leading-tight transition-colors group-hover:text-orange-100 sm:text-4xl"
						>
							{article.title}
						</h3>
						<ArrowUpRight
							size={18}
							class="mt-2 shrink-0 text-orange-200/70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
						/>
					</div>
					<p class="mt-2 max-w-xl text-sm leading-6 text-white/50">{article.dek}</p>
				</a>
			{/each}
		</div>
	</section>
</main>
