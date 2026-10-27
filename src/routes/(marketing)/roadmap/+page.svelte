<script lang="ts">
	import { brandedOgImageUrl } from '#lib/community/og.js';
	import { onMount } from 'svelte';
	import { ArrowLeft, ArrowRight, Flame } from '@lucide/svelte';
	import Footer from '#lib/marketing/Footer.svelte';
	import { phases } from '#lib/marketing/roadmap.js';
	import { playRoadmapSound } from '#lib/marketing/soundEffects.js';

	let activeSlide = $state(1);
	let touchStart = 0;
	let pageContainer: HTMLDivElement;
	let timelineSection: HTMLElement;
	const particles = Array.from({ length: 18 }, (_, index) => ({
		size: 2 + ((index * 17) % 4),
		top: (index * 37 + 13) % 100,
		left: (index * 53 + 9) % 100,
		color: ['#f97316', '#a855f7', '#06b6d4'][index % 3]
	}));
	const phase = $derived(phases[activeSlide]);

	function setSlide(index: number, playSound = false) {
		if (playSound && window.innerWidth < 768) playRoadmapSound('carousel-step');
		activeSlide = (index + phases.length) % phases.length;
	}

	function handlePointerOver(event: PointerEvent) {
		if (!(event.target instanceof Element)) return;
		const target = event.target.closest('button, a, article');
		if (!target || (event.relatedTarget instanceof Node && target.contains(event.relatedTarget)))
			return;
		playRoadmapSound(
			target instanceof HTMLElement && target.tagName === 'ARTICLE' ? 'whoosh' : 'hover'
		);
	}

	function handleClick(event: MouseEvent) {
		if (!(event.target instanceof Element)) return;
		const target = event.target.closest('button, a, article');
		if (!target) return;
		const isCallToAction =
			target.matches('a[href="/reach-us"]') || target.textContent?.includes('Learn About Us');
		playRoadmapSound(isCallToAction ? 'cta-confirm' : 'click');
	}

	onMount(() => {
		const timer = window.setInterval(() => setSlide(activeSlide + 1, true), 3500);
		pageContainer.addEventListener('pointerover', handlePointerOver);
		pageContainer.addEventListener('click', handleClick);
		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				playRoadmapSound('milestone');
				phases.forEach((_, index) => {
					window.setTimeout(() => playRoadmapSound('dot-ping'), index * 220 + 400);
					window.setTimeout(() => playRoadmapSound('phase-reveal'), index * 180 + 600);
				});
				observer.disconnect();
			},
			{ threshold: 0.2 }
		);
		observer.observe(timelineSection);
		return () => {
			window.clearInterval(timer);
			pageContainer.removeEventListener('pointerover', handlePointerOver);
			pageContainer.removeEventListener('click', handleClick);
			observer.disconnect();
		};
	});
</script>

<svelte:head>
	<title>Sanctyria Roadmap | Vision for the Eternal Continuum</title>
	<meta
		name="description"
		content="Explore the development stages of Sanctyria. Tracking Phase I (Foundation), Phase II (Expansion), Phase III (Living Systems), and long-term transmedia goals."
	/>
	<meta
		name="keywords"
		content="Sanctyria roadmap, fantasy IP roadmap, transmedia project timeline, development goals"
	/>
	<link rel="canonical" href="https://sanctyria.com/roadmap" />
	<meta property="og:title" content="Sanctyria Roadmap | Vision for the Eternal Continuum" />
	<meta
		property="og:description"
		content="Explore the development stages of Sanctyria. Tracking Phase I (Foundation), Phase II (Expansion), Phase III (Living Systems), and long-term transmedia goals."
	/>
	<meta property="og:url" content="https://sanctyria.com/roadmap" />
	<meta
		property="og:image"
		content={brandedOgImageUrl(
			'Sanctyria Roadmap',
			'Explore the development stages and long-term transmedia goals of Sanctyria.',
			'THE ROAD AHEAD'
		)}
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Sanctyria Roadmap | Vision for the Eternal Continuum" />
	<meta
		name="twitter:description"
		content="Explore the development stages of Sanctyria. Tracking Foundation, Expansion, Living Systems, and long-term transmedia goals."
	/>
	<meta
		name="twitter:image"
		content={brandedOgImageUrl(
			'Sanctyria Roadmap',
			'Explore the development stages and long-term transmedia goals of Sanctyria.',
			'THE ROAD AHEAD'
		)}
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<div bind:this={pageContainer} class="relative w-full overflow-x-hidden bg-[#080809] text-white">
	<div class="pointer-events-none fixed inset-0 z-0 overflow-hidden">
		{#each particles as particle, index (index)}<span
				class="rm-particle absolute rounded-full blur-[1px]"
				style={`width:${particle.size}px;height:${particle.size}px;top:${particle.top}%;left:${particle.left}%;background:${particle.color};opacity:.2;animation:drift ${4 + (index % 5)}s ease-in-out ${index * -0.3}s infinite alternate`}
			></span>{/each}
		<div
			class="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(249,115,22,.07)_0%,transparent_70%)]"
		></div>
		<div
			class="absolute right-1/4 bottom-1/3 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,.07)_0%,transparent_70%)]"
		></div>
		<div
			class="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,.06)_0%,transparent_70%)]"
		></div>
	</div>
	<div class="relative z-10">
		<section
			class="relative flex min-h-screen flex-col items-center justify-center px-6 pt-32 pb-20 text-center"
		>
			<div
				class="rm-hero-tag mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-lg"
			>
				<span
					class="h-1.5 w-1.5 animate-pulse rounded-full"
					style={`background:${phase.color};box-shadow:0 0 6px ${phase.color}`}
				></span><span class="text-xs font-medium tracking-[0.15em] text-white/60 uppercase"
					>{phase.label} · Active</span
				>
			</div>
			<h1 class="rm-hero-title max-w-5xl leading-[0.88] select-none">
				<span class="block font-anton text-white" style="font-size:clamp(3.5rem,10vw,8rem)"
					>The Path</span
				>
				<span
					class="block font-display text-[#f97316] italic"
					style="font-size:clamp(3.5rem,10vw,8rem);text-shadow:0 0 60px rgba(249,115,22,.45),0 0 120px rgba(249,115,22,.2)"
					>Forward.</span
				>
			</h1>
			<p class="rm-hero-sub mt-8 max-w-xl text-base leading-relaxed text-white/50">
				Sanctyria is not a quick project — it is a world designed to endure. Every system, story,
				and tool is built to protect creation from being forgotten.
			</p>
			<div
				class="rm-hero-line mt-14 h-px w-24 bg-gradient-to-r from-transparent via-[#f97316] to-transparent"
			></div>
			<a
				href="#timeline"
				class="rm-hero-scroll-hint absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
				><span class="text-[10px] font-medium tracking-[0.2em] text-white/20 uppercase">Scroll</span
				><span class="h-10 w-px bg-gradient-to-b from-white/20 to-transparent"></span></a
			>
		</section>

		<section bind:this={timelineSection} id="timeline" class="px-6 py-24">
			<div class="mx-auto max-w-7xl">
				<div class="mb-16 flex items-center gap-4">
					<span class="text-xs font-medium tracking-[0.25em] text-white/20 uppercase"
						>Sanctyria's Path</span
					>
					<div class="h-px flex-1 bg-white/5"></div>
					<span class="text-xs font-medium tracking-[0.25em] text-white/20 uppercase">4 Phases</span
					>
				</div>
				<div class="hidden md:block">
					<div class="relative min-w-[700px]">
						<div class="absolute top-[56px] right-0 left-0 h-px bg-white/10"></div>
						<div
							class="absolute top-[56px] right-0 left-0 h-px origin-left bg-gradient-to-r from-[#f97316] via-[#06b6d4] via-[#a855f7] to-[#10b981]"
						></div>
						<div class="grid grid-cols-4 gap-6">
							{#each phases as item (item.number)}
								<div class="relative flex flex-col">
									<div
										class="mb-4 text-xs font-medium tracking-[0.15em] uppercase"
										style={`color:${item.status === 'current' ? item.color : 'rgba(255,255,255,.3)'}`}
									>
										{item.label}
									</div>
									<div class="relative mb-6 flex h-6 items-center">
										<div class="relative h-6 w-6">
											<div
												class="absolute inset-0 rounded-full border"
												style={`border-color:${item.color};opacity:${item.status === 'current' ? 1 : 0.5}`}
											></div>
											<div
												class="absolute inset-[5px] rounded-full"
												style={`background:${item.color};box-shadow:${item.status === 'current' ? `0 0 12px ${item.glowColor},0 0 24px ${item.glowColor}` : 'none'}`}
											></div>
											{#if item.status === 'current'}<div
													class="absolute -inset-2 animate-ping rounded-full border opacity-30"
													style={`border-color:${item.color};animation-duration:2s`}
												></div>{/if}
										</div>
									</div>
									<article
										class="flex flex-1 flex-col overflow-hidden rounded-2xl border bg-white/[0.03] backdrop-blur-xl transition-transform hover:-translate-y-3"
										style={`border-color:${item.status === 'current' ? `${item.color}40` : 'rgba(255,255,255,.07)'};box-shadow:${item.status === 'current' ? `0 0 40px ${item.glowColor},inset 0 1px 0 rgba(255,255,255,.06)` : 'inset 0 1px 0 rgba(255,255,255,.04)'}`}
									>
										<div
											class="h-0.5 w-full"
											style={`background:linear-gradient(90deg,${item.color},transparent)`}
										></div>
										<div class="flex flex-1 flex-col p-6">
											{#if item.status === 'current'}<span
													class="mb-4 inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[0.1em] uppercase"
													style={`background:${item.color}18;border-color:${item.color}35;color:${item.color}`}
													><span class="h-1 w-1 rounded-full" style={`background:${item.color}`}
													></span>Active</span
												>{/if}
											<h2
												class="mb-1 font-anton text-[1.05rem] leading-tight tracking-[0.02em] text-white"
											>
												{item.title}
											</h2>
											<p class="mb-4 text-xs opacity-80" style:color={item.color}>
												{item.subtitle}
											</p>
											<div class="mb-4 h-px bg-white/[0.06]"></div>
											<ul class="flex-1 space-y-2.5">
												{#each item.items as goal (goal)}<li
														class="flex items-start gap-2 text-xs leading-relaxed text-white/55"
													>
														<span
															class="mt-[5px] h-1 w-1 shrink-0 rounded-full opacity-70"
															style:background={item.color}
														></span>{goal}
													</li>{/each}
											</ul>
										</div>
									</article>
								</div>
							{/each}
						</div>
					</div>
				</div>
				<div
					class="md:hidden"
					role="region"
					aria-label="Roadmap phase carousel"
					ontouchstart={(event) => (touchStart = event.touches[0].clientX)}
					ontouchend={(event) => {
						const delta = touchStart - event.changedTouches[0].clientX;
						if (Math.abs(delta) > 40) setSlide(activeSlide + (delta > 0 ? 1 : -1), true);
					}}
				>
					<div class="mb-8 flex items-center justify-center gap-2">
						{#each phases as item, index (item.number)}<button
								type="button"
								onclick={() => setSlide(index, true)}
								aria-label={`Show ${item.label}`}
								class="h-2 rounded-full transition-all duration-300"
								style={`width:${activeSlide === index ? '28px' : '8px'};background:${activeSlide === index ? item.color : 'rgba(255,255,255,.15)'};box-shadow:${activeSlide === index ? `0 0 10px ${item.glowColor}` : 'none'}`}
							></button>{/each}
					</div>
					<div class="mb-6 flex items-center gap-3">
						<div class="relative h-6 w-6">
							<div
								class="absolute inset-0 rounded-full border"
								style={`border-color:${phase.color}`}
							></div>
							<div
								class="absolute inset-[5px] rounded-full"
								style={`background:${phase.color};box-shadow:0 0 12px ${phase.glowColor}`}
							></div>
						</div>
						<span class="text-xs font-medium tracking-[0.15em] uppercase" style:color={phase.color}
							>{phase.label}</span
						>{#if phase.status === 'current'}<span
								class="ml-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[.1em] uppercase"
								style={`background:${phase.color}18;border-color:${phase.color}35;color:${phase.color}`}
								><span class="h-1 w-1 animate-pulse rounded-full" style:background={phase.color}
								></span>Active</span
							>{/if}
					</div>
					<article
						class="overflow-hidden rounded-2xl border bg-white/[0.03] backdrop-blur-2xl"
						style={`border-color:${phase.status === 'current' ? `${phase.color}50` : 'rgba(255,255,255,.1)'};box-shadow:${phase.status === 'current' ? `0 0 50px ${phase.glowColor},inset 0 1px 0 rgba(255,255,255,.06)` : 'inset 0 1px 0 rgba(255,255,255,.04)'}`}
					>
						<div
							class="h-0.5 w-full"
							style={`background:linear-gradient(90deg,${phase.color},transparent)`}
						></div>
						<div class="p-6">
							<h2 class="mb-1 font-anton text-2xl leading-tight tracking-[0.02em] text-white">
								{phase.title}
							</h2>
							<p class="mb-5 text-xs opacity-80" style:color={phase.color}>{phase.subtitle}</p>
							<div class="mb-5 h-px bg-white/[0.06]"></div>
							<ul class="space-y-3">
								{#each phase.items as goal (goal)}<li
										class="flex items-start gap-2.5 text-sm leading-relaxed text-white/60"
									>
										<span class="mt-1 text-xs" style:color={phase.color}>✓</span>{goal}
									</li>{/each}
							</ul>
						</div>
					</article>
					<div class="mt-6 flex items-center justify-between px-1">
						<button
							type="button"
							onclick={() => setSlide(activeSlide - 1, true)}
							class="flex items-center gap-2 py-2 text-xs text-white/40 transition-colors hover:text-white"
							><ArrowLeft size={16} />Prev</button
						><span class="text-xs font-medium tracking-[.15em] text-white/20"
							>{activeSlide + 1} / {phases.length}</span
						><button
							type="button"
							onclick={() => setSlide(activeSlide + 1, true)}
							class="flex items-center gap-2 py-2 text-xs text-white/40 transition-colors hover:text-white"
							>Next<ArrowRight size={16} /></button
						>
					</div>
				</div>
			</div>
		</section>

		<section class="px-6 py-24">
			<div class="mx-auto max-w-7xl">
				<div class="mb-20 text-center">
					<h2 class="mb-4 font-anton text-4xl leading-none text-white sm:text-6xl">
						SANCTYRIA'S <span
							class="font-display font-normal text-[#f97316] italic"
							style="text-shadow:0 0 40px rgba(249,115,22,.4)">phases</span
						>
					</h2>
					<p class="mx-auto max-w-md text-sm leading-relaxed text-white/40">
						Each phase builds on the last — a living architecture that grows with its community.
					</p>
				</div>
				<div class="space-y-10">
					{#each phases as item, index (item.number)}
						<article
							class="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] backdrop-blur-2xl transition-all duration-400 hover:border-white/20"
						>
							<div
								class="absolute top-0 bottom-0 left-0 w-[3px]"
								style={`background:linear-gradient(180deg,${item.color},transparent)`}
							></div>
							<div
								class={`flex items-start ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
							>
								<div
									class="flex min-w-[200px] shrink-0 flex-col items-center justify-center p-10 md:p-14"
								>
									<span
										class="font-anton text-[5rem] leading-none opacity-90"
										style={`color:${item.color};text-shadow:0 0 40px ${item.glowColor}`}
										>0{item.number}</span
									><span class="mt-2 text-xs tracking-[0.2em] text-white/25 uppercase"
										>{item.label}</span
									>
								</div>
								<div class="my-8 hidden w-px self-stretch bg-white/[0.06] md:block"></div>
								<div class="flex-1 p-8 md:p-12">
									<div class="mb-4 flex items-center gap-3">
										{#if item.status === 'current'}<span
												class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium tracking-[.1em] uppercase"
												style={`background:${item.color}18;border-color:${item.color}35;color:${item.color}`}
												><span
													class="h-1 w-1 animate-pulse rounded-full"
													style:background={item.color}
												></span>Active</span
											>{:else if item.status === 'vision'}<span
												class="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium tracking-[.1em] text-white/40 uppercase"
												>Long-Term Vision</span
											>{/if}
									</div>
									<h3 class="mb-2 font-anton text-2xl leading-tight tracking-[0.02em] text-white">
										{item.title}
									</h3>
									<div
										class="mb-6 h-px w-12 bg-gradient-to-r from-[var(--phase)] to-transparent"
										style={`--phase:${item.color}`}
									></div>
									<div class="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
										{#each item.items as goal (goal)}<div class="flex items-start gap-2.5">
												<span class="shrink-0 text-xs" style:color={item.color}>✓</span><span
													class="text-sm leading-relaxed text-white/55">{goal}</span
												>
											</div>{/each}
									</div>
								</div>
							</div>
						</article>
					{/each}
				</div>
			</div>
		</section>

		<section class="px-6 py-32">
			<div class="mx-auto max-w-4xl text-center">
				<div class="mb-10 flex justify-center"><Flame size={40} class="text-orange-500" /></div>
				<h2 class="mb-8 font-anton text-5xl leading-none text-white sm:text-7xl">
					WHERE SANCTYRIA<br /><span
						class="font-display font-normal text-[#f97316] italic"
						style="text-shadow:0 0 60px rgba(249,115,22,.5),0 0 120px rgba(249,115,22,.25)"
						>is headed.</span
					>
				</h2>
				<div class="mb-16 space-y-3 font-display text-xl italic">
					<p class="text-white/50"><span class="text-[#f97316]">If you build,</span> you belong.</p>
					<p class="text-white/50">
						<span class="text-[#a855f7]">If you contribute,</span> you are remembered.
					</p>
					<p class="text-white/50">
						<span class="text-[#06b6d4]">If you endure,</span> you become part of the Flame.
					</p>
				</div>
				<a
					href="/reach-us"
					class="inline-flex items-center gap-2 rounded-full bg-white/5 px-6 py-3 font-mono text-xs tracking-[.15em] text-white/60 uppercase transition-colors hover:bg-white/10 hover:text-white"
					>Begin your journey <ArrowRight size={14} /></a
				>
			</div>
		</section>
	</div>
	<Footer />
</div>

<style>
	@keyframes drift {
		from {
			transform: translateY(-16px) translateX(-8px);
			opacity: 0.12;
		}
		to {
			transform: translateY(16px) translateX(8px);
			opacity: 0.45;
		}
	}
</style>
