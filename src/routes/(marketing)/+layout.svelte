<script lang="ts">
	import { onMount } from 'svelte';
	import { setContext } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		ArrowUpRight,
		ChevronDown,
		Flame,
		Handshake,
		Mail,
		Map,
		UsersRound
	} from '@lucide/svelte';
	import { jsonLdScript } from '#lib/marketing/seo.js';
	import {
		playDoorCloseSound,
		playDoorOpenSound,
		startTransitionHum,
		stopTransitionHum
	} from '#lib/marketing/soundEffects.js';
	import CursorParticles from '#lib/marketing/CursorParticles.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	let muted = $state(false);
	let volume = $state(0.55);
	let volumeExpanded = $state(false);
	let mobileMenuOpen = $state(false);
	let transitionState = $state<'idle' | 'closing' | 'opening'>('idle');
	let transitionProgress = $state(0);
	const pathname = $derived(page.url.pathname);
	const currentPage = $derived(pathname === '/' ? 'home' : pathname.split('/')[1]);
	const cursorColor = $derived(
		currentPage === 'nations'
			? '#fbbf24'
			: currentPage === 'journal'
				? '#d58b68'
				: currentPage === 'partnership'
					? '#10b981'
					: currentPage === 'reach-us'
						? '#22c55e'
						: currentPage === 'flameborns'
							? '#F4845F'
							: '#f97316'
	);
	const isJournal = $derived(currentPage === 'journal');
	const isStudio = $derived(currentPage === 'studio');
	const isDarkPage = $derived(currentPage !== 'home' && currentPage !== 'reach-us');
	const siteSchema = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Organization',
				'@id': 'https://sanctyria.com/#organization',
				name: 'Sanctyria',
				url: 'https://sanctyria.com',
				logo: {
					'@type': 'ImageObject',
					'@id': 'https://sanctyria.com/#logo',
					url: 'https://sanctyria.com/dlst.gif',
					caption: 'Sanctyria Logo'
				},
				description:
					'Sanctyria is a dark fantasy universe and creative transmedia ecosystem built around the concept of creation as survival.',
				sameAs: [
					'https://discord.gg/sanctyria',
					'https://x.com/sanctyria',
					'https://youtube.com/@sanctyria',
					'https://open.spotify.com/artist/sanctyria',
					'https://tiktok.com/@sanctyria',
					'https://instagram.com/sanctyria'
				]
			},
			{
				'@type': 'WebSite',
				'@id': 'https://sanctyria.com/#website',
				url: 'https://sanctyria.com',
				name: 'Sanctyria',
				description: 'A dark fantasy universe and creative transmedia ecosystem.',
				publisher: { '@id': 'https://sanctyria.com/#organization' }
			}
		]
	};
	setContext('site-audio', {
		getMuted: () => muted,
		getVolume: () => volume,
		toggleMute,
		setVolumeLevel: (level: number) => {
			volume = Math.max(0, Math.min(1, level));
			localStorage.setItem('sanctyria_music_volume', String(volume));
		}
	});

	function navClass(pageName: string, activePage: string, dark: boolean): string {
		const appearance =
			activePage === pageName
				? dark
					? 'bg-white font-semibold text-black'
					: 'bg-brand-black font-semibold text-white'
				: dark
					? 'font-medium text-white/50 hover:text-white'
					: 'font-medium text-brand-black hover:text-black';
		return `rounded-full px-5 py-2 text-sm transition-all duration-200 ${appearance}`;
	}

	function toggleMute() {
		muted = !muted;
		localStorage.setItem('sanctyria_music_muted', String(muted));
	}

	function setVolume(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		volume = Math.max(0, Math.min(1, Number(input.value) / 100));
		localStorage.setItem('sanctyria_music_volume', String(volume));
	}

	function handleInternalNavigation(event: MouseEvent) {
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		)
			return;
		const target = event.target;
		if (!(target instanceof Element)) return;
		const anchor = target.closest('a[href]');
		if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank') return;
		anchor.closest('details')?.removeAttribute('open');
		mobileMenuOpen = false;
		const destination = new URL(anchor.href, window.location.href);
		if (destination.origin !== window.location.origin || destination.pathname === page.url.pathname)
			return;
		event.preventDefault();
		if (transitionState !== 'idle') return;
		playDoorCloseSound();
		transitionState = 'opening';
		transitionProgress = 0;
		window.requestAnimationFrame(() =>
			window.requestAnimationFrame(() => {
				if (transitionState !== 'opening') return;
				transitionState = 'closing';
				window.setTimeout(startTransitionHum, 700);
				const timer = window.setInterval(() => {
					transitionProgress = Math.min(100, transitionProgress + 5);
					if (transitionProgress >= 100) window.clearInterval(timer);
				}, 55);
				window.setTimeout(async () => {
					window.clearInterval(timer);
					stopTransitionHum();
					await goto(`${destination.pathname}${destination.search}${destination.hash}`);
					playDoorOpenSound();
					transitionState = 'opening';
					window.setTimeout(() => (transitionState = 'idle'), 850);
				}, 1200);
			})
		);
	}

	onMount(() => {
		document.addEventListener('click', handleInternalNavigation, true);
		const savedMuted = localStorage.getItem('sanctyria_music_muted');
		const savedVolume = localStorage.getItem('sanctyria_music_volume');
		if (savedMuted !== null) muted = savedMuted === 'true';
		if (savedVolume !== null) volume = Number(savedVolume);
		return () => document.removeEventListener('click', handleInternalNavigation, true);
	});
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript escapes HTML terminators in structured data. -->
	{@html jsonLdScript(siteSchema)}
</svelte:head>

{#if !isJournal && !isStudio}
	<nav class="absolute top-0 right-0 left-0 z-40 w-full bg-transparent">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8">
			<a
				href="/"
				class={`flex items-center font-display text-3xl transition-colors ${isDarkPage ? 'text-white' : 'text-brand-black'}`}
			>
				<img src="/assets/dlst.gif" alt="Sanctyria Logo" class="mr-2.5 h-8 w-8 object-contain" />
				<span class="font-semibold">Sanctyria</span>
			</a>
			<div
				class={`hidden items-center rounded-full border p-1 shadow-[0_2px_12px_rgba(0,0,0,0.03)] backdrop-blur-md md:flex ${isDarkPage ? 'border-white/10 bg-black/40' : 'border-white/30 bg-white/20'}`}
			>
				<a href="/" class={navClass('home', currentPage, isDarkPage)}>Home</a>
				<details class="group relative">
					<summary
						class={`flex cursor-pointer list-none items-center gap-1 ${navClass(['about', 'flameborns', 'nations'].includes(currentPage) ? currentPage : 'explore', currentPage, isDarkPage)}`}
						>Explore <ChevronDown
							size={13}
							class="transition-transform group-open:rotate-180"
						/></summary
					>
					<div
						class={`absolute top-full left-0 z-50 mt-3 grid w-[min(31rem,calc(100vw-2rem))] grid-cols-[0.9fr_1.1fr] overflow-hidden border shadow-2xl backdrop-blur-2xl ${isDarkPage ? 'border-white/12 bg-[#0b0a09]/96 text-white' : 'border-black/10 bg-[#f8f5ef]/96 text-[#171310]'}`}
					>
						<div
							class={`relative flex min-h-64 flex-col justify-between overflow-hidden border-r p-5 ${isDarkPage ? 'border-white/10 bg-white/[0.03]' : 'border-black/10 bg-black/[0.025]'}`}
						>
							<span
								class={`font-mono text-[8px] tracking-[0.2em] uppercase ${isDarkPage ? 'text-orange-200/65' : 'text-orange-800/65'}`}
								>Sanctyria / Field guide</span
							>
							<div>
								<span
									class={`mb-3 flex h-9 w-9 items-center justify-center border ${isDarkPage ? 'border-orange-200/30 text-orange-200' : 'border-orange-800/25 text-orange-800'}`}
									><Map size={17} strokeWidth={1.5} /></span
								>
								<h3 class="font-display text-3xl leading-[0.95]">
									A realm<br /><span class="italic">unfolding.</span>
								</h3>
								<p
									class={`mt-3 text-[11px] leading-5 ${isDarkPage ? 'text-white/45' : 'text-black/50'}`}
								>
									Meet the people, histories, and places that keep the flame alive.
								</p>
							</div>
							<span
								class={`font-mono text-[8px] tracking-[0.17em] uppercase ${isDarkPage ? 'text-white/25' : 'text-black/30'}`}
								>01 — 03 / The known world</span
							>
							<span
								aria-hidden="true"
								class={`pointer-events-none absolute -right-10 -bottom-12 h-36 w-36 rounded-full border ${isDarkPage ? 'border-orange-100/10' : 'border-orange-900/10'}`}
							></span>
						</div>
						<div class="p-2.5">
							<a
								href="/about"
								class={`group/item flex items-center gap-3 px-3 py-3 transition-colors ${isDarkPage ? 'hover:bg-white/[0.07]' : 'hover:bg-black/[0.045]'}`}
							>
								<span
									class={`flex h-9 w-9 shrink-0 items-center justify-center border ${isDarkPage ? 'border-white/10 text-orange-200/80' : 'border-black/10 text-orange-800'}`}
									><Flame size={16} strokeWidth={1.5} /></span
								>
								<span class="min-w-0 flex-1"
									><span class="block text-[13px] font-medium">About Sanctyria</span><span
										class={`mt-0.5 block text-[10px] ${isDarkPage ? 'text-white/40' : 'text-black/45'}`}
										>Origins, values, and the Eternal Flame</span
									></span
								>
								<ArrowUpRight
									size={14}
									class={`shrink-0 opacity-35 transition-all group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 group-hover/item:opacity-100 ${isDarkPage ? 'text-orange-200' : 'text-orange-800'}`}
								/>
							</a>
							<a
								href="/flameborns"
								class={`group/item flex items-center gap-3 px-3 py-3 transition-colors ${isDarkPage ? 'hover:bg-white/[0.07]' : 'hover:bg-black/[0.045]'}`}
							>
								<span
									class={`flex h-9 w-9 shrink-0 items-center justify-center border ${isDarkPage ? 'border-white/10 text-orange-200/80' : 'border-black/10 text-orange-800'}`}
									><UsersRound size={16} strokeWidth={1.5} /></span
								>
								<span class="min-w-0 flex-1"
									><span class="block text-[13px] font-medium">Flameborns</span><span
										class={`mt-0.5 block text-[10px] ${isDarkPage ? 'text-white/40' : 'text-black/45'}`}
										>Those who carry the living flame</span
									></span
								>
								<ArrowUpRight
									size={14}
									class={`shrink-0 opacity-35 transition-all group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 group-hover/item:opacity-100 ${isDarkPage ? 'text-orange-200' : 'text-orange-800'}`}
								/>
							</a>
							<a
								href="/nations"
								class={`group/item flex items-center gap-3 px-3 py-3 transition-colors ${isDarkPage ? 'hover:bg-white/[0.07]' : 'hover:bg-black/[0.045]'}`}
							>
								<span
									class={`flex h-9 w-9 shrink-0 items-center justify-center border ${isDarkPage ? 'border-white/10 text-orange-200/80' : 'border-black/10 text-orange-800'}`}
									><Map size={16} strokeWidth={1.5} /></span
								>
								<span class="min-w-0 flex-1"
									><span class="block text-[13px] font-medium">Eight Nations</span><span
										class={`mt-0.5 block text-[10px] ${isDarkPage ? 'text-white/40' : 'text-black/45'}`}
										>Explore distinct lands and cultures</span
									></span
								>
								<ArrowUpRight
									size={14}
									class={`shrink-0 opacity-35 transition-all group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 group-hover/item:opacity-100 ${isDarkPage ? 'text-orange-200' : 'text-orange-800'}`}
								/>
							</a>
						</div>
					</div>
				</details>
				<a href="https://world.sanctyria.com" class={navClass('world', currentPage, isDarkPage)}
					>World</a
				>
				<a href="/journal" class={navClass('journal', currentPage, isDarkPage)}>Journal</a>
				<a href="/roadmap" class={navClass('roadmap', currentPage, isDarkPage)}>Roadmap</a>
				<a href="/studio" class={navClass('studio', currentPage, isDarkPage)}>Studio</a>
				<details class="group relative">
					<summary
						class={`flex cursor-pointer list-none items-center gap-1 ${navClass(['partnership', 'reach-us'].includes(currentPage) ? currentPage : 'more', currentPage, isDarkPage)}`}
						>More <ChevronDown
							size={13}
							class="transition-transform group-open:rotate-180"
						/></summary
					>
					<div
						class={`absolute top-full right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden border shadow-2xl backdrop-blur-2xl ${isDarkPage ? 'border-white/12 bg-[#0b0a09]/96 text-white' : 'border-black/10 bg-[#f8f5ef]/96 text-[#171310]'}`}
					>
						<div
							class={`border-b px-5 pt-5 pb-4 ${isDarkPage ? 'border-white/10' : 'border-black/10'}`}
						>
							<span
								class={`font-mono text-[8px] tracking-[0.2em] uppercase ${isDarkPage ? 'text-emerald-200/65' : 'text-emerald-800/65'}`}
								>The next chapter</span
							>
							<h3 class="mt-2 font-display text-[26px] leading-none">Build beyond the story.</h3>
							<p
								class={`mt-2 max-w-68 text-[11px] leading-5 ${isDarkPage ? 'text-white/45' : 'text-black/50'}`}
							>
								Bring your ideas, craft, and curiosity into the Sanctyria universe.
							</p>
						</div>
						<div class="p-2.5">
							<a
								href="/partnership"
								class={`group/item flex items-center gap-3 px-3 py-3 transition-colors ${isDarkPage ? 'hover:bg-white/[0.07]' : 'hover:bg-black/[0.045]'}`}
							>
								<span
									class={`flex h-9 w-9 shrink-0 items-center justify-center border ${isDarkPage ? 'border-white/10 text-emerald-200/80' : 'border-black/10 text-emerald-800'}`}
									><Handshake size={17} strokeWidth={1.5} /></span
								>
								<span class="min-w-0 flex-1"
									><span class="block text-[13px] font-medium">Partnerships</span><span
										class={`mt-0.5 block text-[10px] ${isDarkPage ? 'text-white/40' : 'text-black/45'}`}
										>Create something lasting together</span
									></span
								>
								<ArrowUpRight
									size={14}
									class={`shrink-0 opacity-35 transition-all group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 group-hover/item:opacity-100 ${isDarkPage ? 'text-emerald-200' : 'text-emerald-800'}`}
								/>
							</a>
							<a
								href="/reach-us"
								class={`group/item flex items-center gap-3 px-3 py-3 transition-colors ${isDarkPage ? 'hover:bg-white/[0.07]' : 'hover:bg-black/[0.045]'}`}
							>
								<span
									class={`flex h-9 w-9 shrink-0 items-center justify-center border ${isDarkPage ? 'border-white/10 text-emerald-200/80' : 'border-black/10 text-emerald-800'}`}
									><Mail size={16} strokeWidth={1.5} /></span
								>
								<span class="min-w-0 flex-1"
									><span class="block text-[13px] font-medium">Reach Us</span><span
										class={`mt-0.5 block text-[10px] ${isDarkPage ? 'text-white/40' : 'text-black/45'}`}
										>Start a conversation with the team</span
									></span
								>
								<ArrowUpRight
									size={14}
									class={`shrink-0 opacity-35 transition-all group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5 group-hover/item:opacity-100 ${isDarkPage ? 'text-emerald-200' : 'text-emerald-800'}`}
								/>
							</a>
						</div>
					</div>
				</details>
			</div>
			<a
				href="/reach-us"
				class={`hidden items-center gap-2.5 rounded-full px-6 py-2.5 text-sm font-medium shadow-sm transition-all hover:scale-[1.03] md:flex ${isDarkPage ? 'bg-white text-black' : 'bg-brand-black text-white'}`}
			>
				<span class="h-2 w-2 animate-pulse rounded-full bg-[#10b981]"></span>Begin Journey
			</a>
			<button
				type="button"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				class={`z-30 flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-full border backdrop-blur-md md:hidden ${isDarkPage ? 'border-white/25 bg-white/10' : 'border-white/40 bg-white/30'}`}
				aria-label="Toggle Menu"
				aria-expanded={mobileMenuOpen}
			>
				<span
					class={`h-0.5 w-5 transition-all ${isDarkPage ? 'bg-white' : 'bg-brand-black'} ${mobileMenuOpen ? 'translate-y-2 rotate-45' : ''}`}
				></span>
				<span
					class={`h-0.5 w-5 transition-all ${isDarkPage ? 'bg-white' : 'bg-brand-black'} ${mobileMenuOpen ? 'opacity-0' : ''}`}
				></span>
				<span
					class={`h-0.5 w-5 transition-all ${isDarkPage ? 'bg-white' : 'bg-brand-black'} ${mobileMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}
				></span>
			</button>
		</div>
		{#if mobileMenuOpen}
			<div
				class={`absolute top-full right-4 left-4 z-50 flex max-h-[calc(100vh-6rem)] flex-col space-y-3 overflow-y-auto rounded-2xl border px-8 py-6 shadow-xl backdrop-blur-lg md:hidden ${isDarkPage ? 'border-white/10 bg-[#080809]/95 text-white' : 'border-white/40 bg-white/90 text-brand-black'}`}
			>
				{#each [['Home', '/'], ['About', '/about'], ['Flameborns', '/flameborns'], ['Nations', '/nations'], ['World', 'https://world.sanctyria.com'], ['Studio', '/studio'], ['Journal', '/journal'], ['Partnerships', '/partnership'], ['Roadmap', '/roadmap'], ['Reach Us', '/reach-us']] as item (item[1])}
					<a
						href={item[1]}
						onclick={() => (mobileMenuOpen = false)}
						class="border-b border-white/10 py-1.5 text-base">{item[0]}</a
					>
				{/each}
				<a
					href="/reach-us"
					onclick={() => (mobileMenuOpen = false)}
					class="flex w-full items-center justify-center gap-2.5 rounded-full bg-white py-3.5 text-base font-medium text-black"
					><span class="h-2.5 w-2.5 animate-pulse rounded-full bg-[#10b981]"></span>Begin Journey</a
				>
			</div>
		{/if}
	</nav>
{/if}

{@render children()}

{#if !isStudio}
	<div
		class="group fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 cursor-pointer items-center space-x-3 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-white shadow-lg backdrop-blur-md transition-all duration-300 select-none hover:bg-white/20 active:scale-95 sm:right-8 sm:bottom-8 sm:left-auto sm:translate-x-0"
	>
		{#if volumeExpanded}
			<input
				type="range"
				min="0"
				max="100"
				value={muted ? 0 : volume * 100}
				oninput={setVolume}
				onclick={(event) => event.stopPropagation()}
				class="h-1 w-24 cursor-pointer appearance-none rounded-lg bg-white/20"
				aria-label="Music volume"
			/>
		{/if}
		<button
			type="button"
			onclick={() => (volumeExpanded = !volumeExpanded)}
			class="flex h-4 items-end space-x-0.5 overflow-hidden opacity-80 transition-opacity hover:opacity-100"
			aria-label="Toggle volume slider"
		>
			{#each [0, 1, 2, 3] as index (index)}
				<span
					class={`w-[2px] rounded-full bg-white ${muted ? 'h-1' : index % 2 ? 'h-4' : 'h-3'} ${muted ? '' : 'animate-[soundwave_0.8s_ease-in-out_infinite_alternate]'}`}
				></span>
			{/each}
		</button>
		<button
			type="button"
			onclick={toggleMute}
			class="font-mono text-[10px] tracking-[0.2em] whitespace-nowrap uppercase opacity-80 transition-opacity hover:opacity-100"
			><span class="hidden sm:inline">MUSIC // </span>{muted
				? 'OFF'
				: `${Math.round(volume * 100)}%`}</button
		>
	</div>
{/if}

<CursorParticles color={cursorColor} />

{#if transitionState !== 'idle'}
	<div class="pointer-events-none fixed inset-0 z-[9998] overflow-hidden" aria-hidden="true">
		<div
			class={`absolute top-0 left-0 h-full w-1/2 border-r border-white/5 bg-[#080809] transition-transform duration-700 ease-[cubic-bezier(.77,0,.18,1)] ${transitionState === 'opening' ? '-translate-x-full' : 'translate-x-0'}`}
		></div>
		<div
			class={`absolute top-0 right-0 h-full w-1/2 border-l border-white/5 bg-[#080809] transition-transform duration-700 ease-[cubic-bezier(.77,0,.18,1)] ${transitionState === 'opening' ? 'translate-x-full' : 'translate-x-0'}`}
		></div>
		{#if transitionState === 'closing'}
			<div class="absolute inset-0 flex flex-col justify-between p-8 sm:p-14">
				<div class="flex items-start justify-between">
					<div
						class="flex items-center gap-2.5 font-mono text-xs font-bold tracking-[.2em] text-[#f472b6]"
					>
						<span class="h-2 w-2 animate-pulse rounded-full bg-[#f472b6]"></span>NAVIGATING...
					</div>
					<div class="font-mono text-4xl leading-none font-black text-white sm:text-7xl">
						{transitionProgress}%
					</div>
				</div>
				<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
					<img
						src="/assets/dlst.gif"
						alt="Sanctyria Portal Loader"
						class="h-20 w-20 animate-pulse object-contain drop-shadow-[0_0_32px_rgba(255,255,255,.25)] sm:h-24 sm:w-24"
					/>
				</div>
				<div
					class="flex items-end justify-between font-mono text-[10px] tracking-[.2em] text-white/30"
				>
					<span>SANCTYRIA // V1.0.0-BETA</span><span>TRANSLOCATE // ENGAGED</span>
				</div>
			</div>
		{/if}
	</div>
{/if}
