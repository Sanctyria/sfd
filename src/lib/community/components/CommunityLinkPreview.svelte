<script lang="ts">
	import { ArrowUpRight, Flame } from '@lucide/svelte';

	interface PreviewProfile {
		displayName: string;
		username: string;
		avatarUrl: string | null;
		avatarColor: string | null;
		initials: string | null;
	}

	interface PreviewMetadata {
		title: string | null;
		description: string | null;
		domain: string;
		imageUrl: string | null;
		profile?: PreviewProfile;
	}

	interface Props {
		url: string;
		title?: string | null;
		description?: string | null;
		domain?: string | null;
	}

	let { url, title, description, domain }: Props = $props();

	const characters = ['ember.png', 'kai.png', 'lib.png', 'saphy.png'];
	let preview = $state<PreviewMetadata | null>(null);
	let previewLoaded = $state(false);

	function getHash(value: string) {
		let hash = 0;
		for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
		return hash;
	}

	function formatRoute(value: string) {
		return (
			value
				.replace(/\.[a-z0-9]+$/i, '')
				.replace(/[-_]+/g, ' ')
				.replace(/\b\w/g, (letter) => letter.toUpperCase()) || 'Discover'
		);
	}

	function routeForUrl(value: string): string {
		const parsed = new URL(value);
		const path = parsed.pathname.split('/').filter(Boolean).at(-1)?.toLowerCase() ?? '';
		if (path === 'home') {
			return parsed.searchParams.get('feed') === 'explore' ? 'Explore' : 'Community';
		}
		if (path === 'journey') return 'Sanctyria';
		return formatRoute(path || 'Discover');
	}

	let route = $derived(routeForUrl(url));
	let characterImage = $derived(
		`/assets/characters/${characters[getHash(`${domain ?? ''}${url}`) % characters.length]}`
	);
	let brandTitle = $derived(route === 'Sanctyria' ? route : `Sanctyria ${route}`);
	let previewTitle = $derived(preview?.title || title || preview?.domain || domain || url);
	let previewDescription = $derived(
		preview?.description || description || 'Open this resource in a new tab.'
	);
	let profileInitials = $derived(
		preview?.profile?.initials ||
			preview?.profile?.displayName
				.split(/\s+/)
				.slice(0, 2)
				.map((part) => part[0])
				.join('')
				.toUpperCase()
	);

	$effect(() => {
		const targetUrl = url;
		let cancelled = false;
		preview = null;
		previewLoaded = false;
		void (async () => {
			try {
				const response = await fetch(
					`/api/community/link-preview?url=${encodeURIComponent(targetUrl)}`,
					{ headers: { accept: 'application/json' } }
				);
				if (!response.ok) throw new Error(`Preview metadata request failed (${response.status}).`);
				const metadata = (await response.json()) as PreviewMetadata;
				if (!cancelled) preview = metadata;
			} catch (error) {
				console.warn('Link preview metadata is unavailable; showing the branded fallback.', error);
			} finally {
				if (!cancelled) previewLoaded = true;
			}
		})();
		return () => {
			cancelled = true;
		};
	});
</script>

<a
	href={url}
	target="_blank"
	rel="noopener noreferrer"
	class="community-link-preview group mt-3 block overflow-hidden rounded border border-white/[0.08] bg-white/[0.025] transition-colors hover:border-orange-200/25"
>
	{#if preview?.profile}
		<div
			class="flex min-h-32 items-center gap-4 border-b border-white/[0.08] bg-[#121110] px-5 py-5 sm:px-7"
		>
			<span
				class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-orange-200/20 font-display text-lg text-white"
				style={preview.profile.avatarUrl
					? undefined
					: `background:${preview.profile.avatarColor ?? '#624239'}`}
			>
				{#if preview.profile.avatarUrl}
					<img src={preview.profile.avatarUrl} alt="" class="h-full w-full object-cover" />
				{:else}
					{profileInitials}
				{/if}
			</span>
			<span class="min-w-0">
				<span class="block truncate font-display text-xl text-white"
					>{preview.profile.displayName}</span
				>
				<span class="mt-1 block truncate text-xs text-white/45">@{preview.profile.username}</span>
				<span
					class="mt-2 block font-mono text-[9px] tracking-[0.16em] text-orange-100/45 uppercase"
				>
					Sanctyria community profile
				</span>
			</span>
		</div>
	{:else if preview?.imageUrl}
		<div
			class="relative isolate flex aspect-[1200/630] w-full items-end overflow-hidden border-b border-white/[0.08] bg-black"
		>
			<img
				src={preview.imageUrl}
				alt=""
				aria-hidden="true"
				loading="lazy"
				width="1200"
				height="630"
				class="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
			/>
			<div
				class="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/15 to-black/10"
			></div>
			<div
				class="relative z-10 flex aspect-[1200/630] w-full items-end justify-between gap-4 px-5 py-4 sm:px-7"
			>
				<span class="min-w-0">
					<span
						class="flex items-center gap-2 font-mono text-[9px] tracking-[0.2em] text-orange-100/80 uppercase"
					>
						<Flame size={13} />
						{preview.domain || domain || 'Shared link'}
					</span>
					<span class="mt-2 block truncate font-display text-xl text-white sm:text-2xl">
						{previewTitle}
					</span>
				</span>
				<span class="shrink-0 rounded-full border border-white/15 bg-black/30 p-2 text-white/80">
					<ArrowUpRight size={15} />
				</span>
			</div>
		</div>
	{:else if previewLoaded}
		<div
			class="relative isolate flex aspect-[1200/630] w-full items-center overflow-hidden border-b border-orange-100/10 bg-[#15100f] px-5 py-4 sm:px-7"
		>
			<div
				class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_45%,rgba(198,91,36,0.28),transparent_52%),linear-gradient(110deg,#17100f_0%,#241713_54%,#100e10_100%)]"
			></div>
			<div
				class="absolute inset-y-0 right-0 -z-10 w-3/5 bg-gradient-to-l from-orange-300/[0.08] to-transparent"
			></div>
			<img
				src={characterImage}
				alt=""
				aria-hidden="true"
				width="1200"
				height="630"
				class="pointer-events-none absolute inset-y-0 right-3 h-full max-w-[48%] object-contain object-bottom opacity-75 transition-transform duration-500 group-hover:scale-[1.03] sm:right-8"
			/>
			<div class="relative z-10 flex h-full w-full flex-col justify-between py-1">
				<div class="flex items-center gap-2 text-orange-200/80">
					<span
						class="flex h-6 w-6 items-center justify-center rounded-full border border-orange-200/25 bg-black/30"
					>
						<Flame size={13} />
					</span>
					<span class="font-display text-sm tracking-wide text-white">Sanctyria</span>
				</div>
				<div class="max-w-[62%]">
					<p
						class="line-clamp-2 font-display text-xl leading-tight text-pretty text-white sm:text-2xl"
					>
						{brandTitle}
					</p>
					<p class="mt-2 font-mono text-[9px] tracking-[0.16em] text-orange-100/55 uppercase">
						{route} <span class="px-1 text-orange-200/50">/</span> Sanctyria
					</p>
				</div>
			</div>
		</div>
	{:else}
		<div
			class="min-h-32 animate-pulse border-b border-white/[0.08] bg-white/[0.03] sm:min-h-36"
		></div>
	{/if}
	<div class="flex min-h-20 items-center gap-4 p-4">
		<span class="min-w-0 flex-1">
			<span class="block truncate font-display text-lg text-white/90 group-hover:text-orange-100">
				{previewTitle}
			</span>
			<span class="mt-1 block text-[11px] leading-5 text-white/45">
				{previewDescription}
			</span>
			<span class="mt-2 block truncate font-mono text-[9px] tracking-[0.08em] text-white/30">
				{preview?.domain || domain || url}
			</span>
		</span>
		<ArrowUpRight
			size={15}
			class="shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
		/>
	</div>
</a>
