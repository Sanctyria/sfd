<script lang="ts">
	import { brandedOgImageUrl } from '#lib/community/og.js';
	import {
		Gem,
		GraduationCap,
		Hexagon,
		Radio,
		Sparkles,
		Star,
		Swords,
		Wrench
	} from '@lucide/svelte';
	import Footer from '#lib/marketing/Footer.svelte';
	import { partnerships } from '#lib/marketing/partnerships.js';

	const partnershipIcons = {
		swords: Swords,
		sparkles: Sparkles,
		wrench: Wrench,
		gem: Gem,
		radio: Radio,
		star: Star,
		'graduation-cap': GraduationCap,
		hexagon: Hexagon
	};
</script>

<svelte:head>
	<title>Sanctyria Partnerships | Collaborative Realms</title>
	<meta
		name="description"
		content="Forge alliances with Sanctyria. Discover syndicates, cross-platform collaborations, and co-development contracts in our creative world."
	/>
	<meta
		name="keywords"
		content="Sanctyria partnerships, fantasy collaborations, Aether forge syndicate, creative agreements"
	/>
	<link rel="canonical" href="https://sanctyria.com/partnership" />
	<meta property="og:title" content="Sanctyria Partnerships | Collaborative Realms" />
	<meta
		property="og:description"
		content="Forge alliances with Sanctyria. Discover syndicates, cross-platform collaborations, and co-development contracts in our creative world."
	/>
	<meta property="og:url" content="https://sanctyria.com/partnership" />
	<meta
		property="og:image"
		content={brandedOgImageUrl(
			'Sanctyria Partnerships',
			'Forge alliances with Sanctyria through creative partnerships, collaborations, and co-development.',
			'PARTNERSHIPS'
		)}
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Sanctyria Partnerships | Collaborative Realms" />
	<meta
		name="twitter:description"
		content="Forge alliances with Sanctyria. Discover syndicates, cross-platform collaborations, and co-development contracts in our creative world."
	/>
	<meta
		name="twitter:image"
		content={brandedOgImageUrl(
			'Sanctyria Partnerships',
			'Forge alliances with Sanctyria through creative partnerships, collaborations, and co-development.',
			'PARTNERSHIPS'
		)}
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<div class="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#080809] text-white">
	<section
		class="relative flex min-h-[80vh] w-full flex-col items-center justify-center overflow-hidden pt-40 pb-28"
	>
		<div
			class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_40%,rgba(249,115,22,0.07)_0%,rgba(168,85,247,0.04)_50%,transparent_80%)]"
		></div>
		<div class="relative z-10 mx-auto max-w-4xl px-6 text-center">
			<div class="animate-fade-rise">
				<span class="mb-6 block font-mono text-xs tracking-[0.3em] text-white/30 uppercase"
					>Alliances &amp; Pacts</span
				>
				<h1
					class="mb-6 font-display text-5xl leading-[0.95] font-normal text-white sm:text-6xl lg:text-7xl"
				>
					Partnerships
				</h1>
				<p class="mx-auto mb-4 max-w-xl font-body text-lg text-white/40 sm:text-xl">
					Sanctyria does not do shallow promotions.
				</p>
				<p
					class="mx-auto max-w-2xl font-body text-base leading-relaxed font-medium text-white/60 sm:text-lg"
				>
					Every partnership is a <span class="text-[#f97316]">mutual pact</span> that strengthens creation,
					community, and legacy.
				</p>
			</div>
			<div class="animate-fade-rise-delay mx-auto mt-12 flex items-center justify-center gap-3">
				<div
					class="h-px max-w-[80px] flex-1 bg-gradient-to-r from-transparent to-orange-500/50"
				></div>
				<span class="font-mono text-xs tracking-[0.25em] text-white/25 uppercase"
					>8 Partnership Types</span
				>
				<div
					class="h-px max-w-[80px] flex-1 bg-gradient-to-l from-transparent to-orange-500/50"
				></div>
			</div>
		</div>
		<div
			class="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-b from-transparent to-[#080809]"
		></div>
	</section>

	<section class="relative mx-auto w-full max-w-7xl px-6 pb-16">
		<div class="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			{#each partnerships as partnership, index (partnership.id)}
				{@const PartnershipIcon = partnershipIcons[partnership.icon]}
				<article
					class="partnership-card group animate-fade-rise relative overflow-hidden rounded-2xl"
					style={`--accent:${partnership.accentColor};--glow:${partnership.glowColor};animation-delay:${index * 80}ms`}
				>
					<div
						class="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 shadow-[0_8px_32px_rgba(0,0,0,.3)] backdrop-blur-2xl transition-all duration-400 group-hover:border-[var(--accent)]/30 group-hover:bg-[var(--glow)] group-hover:shadow-[0_20px_60px_rgba(0,0,0,.5)]"
					>
						<div
							class="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-40 transition-opacity group-hover:opacity-100"
						></div>
						<div class="mb-5 flex items-start justify-between">
							<div>
								<span
									class="mb-1 block font-mono text-xs tracking-[0.2em] uppercase opacity-70"
									style:color={partnership.accentColor}>Type {partnership.number}</span
								>
								<h2 class="font-display text-xl leading-tight font-semibold text-white">
									{partnership.title}
								</h2>
								<p class="mt-1 font-body text-sm text-white/40 italic">{partnership.subtitle}</p>
							</div>
							<div
								class="ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-shadow group-hover:shadow-[0_0_20px_var(--glow)]"
								style={`background:${partnership.glowColor};border-color:${partnership.accentColor}30;color:${partnership.accentColor}`}
							>
								<PartnershipIcon size={19} strokeWidth={1.6} />
							</div>
						</div>
						<div
							class="mb-5 h-px w-full"
							style={`background:linear-gradient(90deg,${partnership.accentColor}40,transparent)`}
						></div>
						<div class="mb-4">
							<span class="mb-2 block font-mono text-xs tracking-widest text-white/30 uppercase"
								>Ideal For</span
							>
							<div class="flex flex-wrap gap-1.5">
								{#each partnership.idealFor as item (item)}<span
										class="rounded-full border px-2.5 py-1 font-body text-xs"
										style={`background:${partnership.accentColor}12;border-color:${partnership.accentColor}25;color:${partnership.accentColor}`}
										>{item}</span
									>{/each}
							</div>
						</div>
						<div class="mb-4">
							<span class="mb-2 block font-mono text-xs tracking-widest text-white/30 uppercase"
								>They Bring</span
							>
							<ul class="space-y-1">
								{#each partnership.theyOffer as item (item)}<li
										class="flex items-start gap-2 font-body text-sm text-white/50"
									>
										<span class="mt-0.5 shrink-0 opacity-60" style:color={partnership.accentColor}
											>—</span
										>{item}
									</li>{/each}
							</ul>
						</div>
						<div class="mb-5">
							<span class="mb-2 block font-mono text-xs tracking-widest text-white/30 uppercase"
								>Sanctyria Gives</span
							>
							<ul class="space-y-1">
								{#each partnership.weOffer as item (item)}<li
										class="flex items-start gap-2 font-body text-sm text-white/70"
									>
										<span class="mt-0.5 shrink-0" style:color={partnership.accentColor}>+</span
										>{item}
									</li>{/each}
							</ul>
						</div>
						<div
							class="mt-auto rounded-xl border px-4 py-3"
							style={`background:${partnership.accentColor}08;border-color:${partnership.accentColor}18`}
						>
							<span class="mb-0.5 block font-mono text-xs tracking-widest text-white/25 uppercase"
								>Lore Designation</span
							><span
								class="block font-display text-sm font-semibold"
								style:color={partnership.accentColor}>{partnership.loreTitle}</span
							><span class="mt-0.5 block font-body text-xs text-white/35 italic"
								>{partnership.loreLabel}</span
							>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</section>

	<section class="mx-auto w-full max-w-4xl px-6 pt-8 pb-24 text-center">
		<div
			class="relative overflow-hidden rounded-2xl border border-white/[0.06] p-10 shadow-[inset_0_1px_0_rgba(255,255,255,.07),0_24px_64px_rgba(0,0,0,.4)] backdrop-blur-2xl sm:p-14"
			style="background:rgba(255,255,255,.025);backdrop-filter:blur(32px) saturate(180%);-webkit-backdrop-filter:blur(32px) saturate(180%)"
		>
			<div
				class="absolute inset-x-0 top-0 h-px"
				style="background:linear-gradient(90deg,transparent 0%,rgba(249,115,22,.7) 40%,rgba(168,85,247,.7) 60%,transparent 100%)"
			></div>
			<p class="mb-3 font-display text-2xl leading-relaxed text-white/80 sm:text-3xl">
				Sanctyria partnerships are not transactions.
			</p>
			<p class="mb-3 font-display text-2xl leading-relaxed text-white/60 sm:text-3xl">
				They are alliances forged through <span class="text-[#f97316]">creation</span>,
				<span class="text-[#a855f7]">trust</span>, and shared vision.
			</p>
			<p class="mt-4 font-display text-xl font-semibold text-white sm:text-2xl">
				If you build, protect, or empower creators, <span class="text-[#f97316]"
					>there is a place for you here.</span
				>
			</p>
			<div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
				<a
					href="/reach-us"
					class="group rounded-full px-8 py-3.5 font-display text-sm font-semibold text-black transition-all duration-300 hover:scale-105 active:scale-95"
					style="background:linear-gradient(135deg,#f97316,#fb923c);box-shadow:0 0 30px rgba(249,115,22,.4),0 4px 16px rgba(0,0,0,.3)"
					><span class="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-black/40"
					></span>Forge an Alliance</a
				>
				<a
					href="/about"
					class="rounded-full border border-white/10 px-8 py-3.5 font-display text-sm font-medium text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.03] hover:text-white"
					>Learn About Sanctyria</a
				>
			</div>
		</div>
	</section>
	<Footer />
</div>
