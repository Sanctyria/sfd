<script lang="ts">
	import { ArrowLeft, ArrowRight, Feather } from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const article = $derived(data.article);
	const siteUrl = 'https://sanctyria.com';
	const canonicalUrl = $derived(`${siteUrl}/journal/${article.slug}`);
</script>

<svelte:head>
	<title>{article.title} | Sanctyria Journal</title>
	<meta name="description" content={article.dek} />
	<meta
		name="keywords"
		content="Sanctyria, journal, fantasy worldbuilding, stories, creative process"
	/>
	<link rel="canonical" href={canonicalUrl} />
	<meta property="og:title" content={`${article.title} | Sanctyria Journal`} />
	<meta property="og:description" content={article.dek} />
	<meta property="og:image" content={article.image} />
	<meta property="og:image:alt" content={article.imageAlt} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:type" content="article" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${article.title} | Sanctyria Journal`} />
	<meta name="twitter:description" content={article.dek} />
	<meta name="twitter:image" content={article.image} />
</svelte:head>

<main class="relative z-10 mx-auto max-w-7xl px-5 pb-20 sm:px-9 lg:px-12">
	<article class="animate-fade-rise">
		<div class="mx-auto max-w-5xl pt-8 sm:pt-12">
			<a
				href="/journal"
				class="mb-10 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] text-white/55 uppercase transition-colors hover:text-orange-200"
			>
				<ArrowLeft size={14} /> All stories
			</a>
			<div
				class="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[9px] tracking-[0.16em] text-white/45 uppercase"
			>
				<span class="text-orange-200">{article.category}</span><span aria-hidden="true">/</span>
				<time>{article.date}</time><span aria-hidden="true">/</span>
				<span>{article.readTime}</span>
			</div>
			<h1 class="max-w-4xl font-display text-[clamp(3rem,8vw,6.5rem)] leading-[0.91]">
				{article.title}
			</h1>
			<p class="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
				{article.dek}
			</p>
		</div>

		<div class="mx-auto mt-12 grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_190px] lg:gap-20">
			<div class="space-y-9">
				<figure>
					<img
						src={article.image}
						alt={article.imageAlt}
						sizes="(min-width: 1280px) 754px, (min-width: 1024px) 65vw, calc(100vw - 40px)"
						fetchpriority="high"
						class="aspect-[4/3] w-full object-cover object-center sm:aspect-[16/10] lg:aspect-[16/9]"
					/>
					<figcaption
						class="mt-2 text-right font-mono text-[9px] tracking-[0.12em] text-white/35 uppercase"
					>
						{article.imageNote}
					</figcaption>
				</figure>
				{#each article.sections as section, index (`${article.slug}-${index}`)}
					<section>
						{#if section.heading}<h2 class="mb-4 font-display text-3xl text-orange-100 sm:text-4xl">
								{section.heading}
							</h2>{/if}
						<div class="space-y-5 text-[15px] leading-8 text-white/70 sm:text-base sm:leading-8">
							{#each section.paragraphs as paragraph (paragraph)}<p>{paragraph}</p>{/each}
						</div>
					</section>
				{/each}
				<blockquote
					class="border-y border-orange-200/25 py-7 font-display text-3xl leading-tight text-orange-100 sm:py-9 sm:text-4xl"
				>
					“{article.pullQuote}”
				</blockquote>
				<a
					href="/journal"
					class="inline-flex items-center gap-2 border border-white/20 px-4 py-3 font-mono text-[10px] tracking-[0.14em] text-white/70 uppercase transition-colors hover:border-orange-200/50 hover:text-orange-100"
				>
					<ArrowLeft size={14} /> Back to the journal
				</a>
			</div>
			<aside class="hidden border-l border-white/10 pl-5 lg:sticky lg:top-8 lg:block lg:self-start">
				<span class="font-mono text-[8px] tracking-[0.2em] text-orange-200/70 uppercase"
					>Continue reading</span
				>
				<p class="mt-2 text-[11px] leading-5 text-white/40">
					More dispatches from the world in progress.
				</p>
				<div class="mt-5 space-y-4">
					{#each data.relatedArticles as related (related.slug)}
						<a
							href={`/journal/${related.slug}`}
							class="group/item grid w-full grid-cols-[80px_1fr] gap-3 text-left"
						>
							<img
								src={related.image}
								alt=""
								loading="lazy"
								class="aspect-[4/3] w-20 object-cover opacity-75 transition-opacity group-hover/item:opacity-100"
							/>
							<span class="min-w-0 self-center">
								<span class="block font-mono text-[8px] tracking-[0.12em] text-white/35 uppercase"
									>{related.category}</span
								>
								<span
									class="mt-1 block font-display text-lg leading-tight text-white/75 transition-colors group-hover/item:text-orange-100"
									>{related.title}</span
								>
							</span>
						</a>
					{/each}
				</div>
				<div
					class="mt-7 flex items-center gap-2 font-mono text-[9px] tracking-[0.12em] text-orange-200/70 uppercase"
				>
					<Feather size={13} /> Sanctyria Studio
				</div>
			</aside>
		</div>
		<section
			class="mx-auto mt-16 max-w-5xl border-t border-white/10 pt-8 sm:mt-20 sm:pt-10"
			aria-label="Continue reading the journal"
		>
			<div class="mb-6 flex items-end justify-between gap-4">
				<div>
					<span class="font-mono text-[8px] tracking-[0.2em] text-orange-200/70 uppercase"
						>Follow the thread</span
					>
					<h2 class="mt-2 font-display text-4xl sm:text-5xl">Continue reading</h2>
				</div>
				<span class="hidden font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase sm:block"
					>From the journal</span
				>
			</div>
			<div class="grid gap-6 sm:grid-cols-2">
				{#each data.relatedArticles as related (related.slug)}
					<a
						href={`/journal/${related.slug}`}
						class="group grid grid-cols-[132px_1fr] gap-4 border-y border-white/10 py-4 text-left transition-colors hover:border-orange-200/35 sm:grid-cols-[168px_1fr]"
					>
						<img
							src={related.image}
							alt=""
							loading="lazy"
							class="aspect-[3/2] w-full object-cover"
						/>
						<span class="flex min-w-0 flex-col justify-center">
							<span class="font-mono text-[8px] tracking-[0.12em] text-orange-200/65 uppercase"
								>{related.category} <span class="px-1 text-white/25">/</span>
								{related.readTime}</span
							>
							<span
								class="mt-2 font-display text-2xl leading-tight text-white/85 transition-colors group-hover:text-orange-100"
								>{related.title}</span
							>
							<span
								class="mt-2 inline-flex items-center gap-1.5 font-mono text-[8px] tracking-[0.13em] text-white/40 uppercase"
								>Read next <ArrowRight size={12} /></span
							>
						</span>
					</a>
				{/each}
			</div>
		</section>
	</article>
</main>
