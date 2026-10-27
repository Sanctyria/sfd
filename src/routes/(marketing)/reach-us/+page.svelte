<script lang="ts">
	import { brandedOgImageUrl } from '#lib/community/og.js';
	import { brandIconPaths } from '#lib/marketing/brandIcons.js';
	import Footer from '#lib/marketing/Footer.svelte';
	import { jsonLdScript } from '#lib/marketing/seo.js';

	const links = [
		{ name: 'YouTube', url: 'https://youtube.com/@sanctyria', color: '#ff0000', icon: 'youtube' },
		{ name: 'X', url: 'https://x.com/sanctyria', color: '#ffffff', icon: 'x' },
		{ name: 'TikTok', url: 'https://tiktok.com/@sanctyria', color: '#ffffff', icon: 'tiktok' },
		{ name: 'Discord', url: 'https://discord.gg/sanctyria', color: '#5865f2', icon: 'discord' },
		{
			name: 'Spotify',
			url: 'https://open.spotify.com/artist/sanctyria',
			color: '#1db954',
			icon: 'spotify'
		},
		{ name: 'Ko-fi', url: 'https://ko-fi.com/sanctyria', color: '#ff5e8a', icon: 'kofi' },
		{
			name: 'Instagram',
			url: 'https://instagram.com/sanctyria',
			color: '#e1306c',
			icon: 'instagram'
		}
	] as const;
	const contactSchema = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'ContactPage',
				'@id': 'https://sanctyria.com/reach-us/#webpage',
				url: 'https://sanctyria.com/reach-us',
				name: 'Begin Your Journey | Contact Sanctyria',
				description:
					'Connect with the creators of Sanctyria. Join our Discord community, access our social channels (YouTube, X, Spotify), and enter the eternal realm.',
				isPartOf: { '@id': 'https://sanctyria.com/#website' }
			}
		]
	};
</script>

<svelte:head>
	<title>Begin Your Journey | Contact Sanctyria</title>
	<meta
		name="description"
		content="Connect with the creators of Sanctyria. Join our Discord community, access our social channels (YouTube, X, Spotify), and enter the eternal realm."
	/>
	<meta
		name="keywords"
		content="Sanctyria Discord, contact Sanctyria, Sanctyria community socials"
	/>
	<link rel="canonical" href="https://sanctyria.com/reach-us" />
	<meta property="og:title" content="Begin Your Journey | Contact Sanctyria" />
	<meta
		property="og:description"
		content="Connect with the creators of Sanctyria. Join our Discord community, access our social channels (YouTube, X, Spotify), and enter the eternal realm."
	/>
	<meta property="og:url" content="https://sanctyria.com/reach-us" />
	<meta
		property="og:image"
		content={brandedOgImageUrl(
			'Begin Your Journey',
			'Connect with Sanctyria through our community, social channels, and creative partnerships.',
			'REACH US'
		)}
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Begin Your Journey | Contact Sanctyria" />
	<meta
		name="twitter:description"
		content="Connect with the creators of Sanctyria. Join our Discord community, access our social channels (YouTube, X, Spotify), and enter the eternal realm."
	/>
	<meta
		name="twitter:image"
		content={brandedOgImageUrl(
			'Begin Your Journey',
			'Connect with Sanctyria through our community, social channels, and creative partnerships.',
			'REACH US'
		)}
	/>
	<meta property="og:type" content="website" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript escapes HTML terminators in structured data. -->
	{@html jsonLdScript(contactSchema)}
</svelte:head>

<div class="relative flex min-h-screen w-full flex-col">
	<div class="absolute inset-0 z-0 overflow-hidden bg-black">
		<video
			src="/assets/video/worldloop.mp4"
			class="h-full w-full object-cover"
			muted
			playsinline
			autoplay
			loop
			preload="auto"
		></video>
		<div
			class="pointer-events-none absolute inset-x-0 bottom-0 h-[35%] bg-gradient-to-t from-black to-transparent"
		></div>
	</div>
	<section
		class="relative z-10 flex flex-grow flex-col items-center justify-center bg-black/40 px-6 pt-40 pb-20 text-center backdrop-blur-sm"
	>
		<div
			class="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/50"
		></div>
		<div class="relative z-10 max-w-6xl">
			<h1
				class="animate-fade-rise mx-auto mb-4 max-w-4xl font-display text-5xl leading-[0.95] text-white select-none sm:text-6xl md:text-7xl"
			>
				Step inside <span
					class="font-normal text-[#22c55e] italic"
					style="text-shadow: 0 0 20px rgba(34,197,94,.6),0 0 40px rgba(34,197,94,.3)"
					>the sanctuary.</span
				>
			</h1>
			<p
				class="animate-fade-rise-delay mx-auto mt-8 max-w-2xl font-body text-base leading-relaxed text-white sm:text-lg"
				style="text-shadow: 0 2px 4px rgba(0,0,0,.6)"
			>
				Ready to begin your journey? Drop us a note or schedule a session to collaborate on your
				next digital platform. Let's create something eternal.
			</p>
			<div
				class="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
			>
				{#each links as social, index (social.name)}
					<a
						href={social.url}
						target="_blank"
						rel="noopener noreferrer"
						class="group animate-fade-rise-delay-2 relative h-32 overflow-hidden rounded-2xl backdrop-blur-lg transition-all duration-500 hover:scale-[1.05] active:scale-95"
						style={`animation-delay: ${index * 80}ms`}
					>
						<div
							class="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 transition-all duration-500 group-hover:to-transparent"
							style={`background-color: ${social.color}20`}
						></div>
						<div
							class="absolute inset-0 rounded-2xl border border-white/30 backdrop-blur-md transition-all duration-500 group-hover:border-white/50"
						></div>
						<div
							class="absolute inset-0 -translate-x-full rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full"
						></div>
						<div class="relative flex h-full flex-col items-center justify-center gap-3 p-4">
							<svg
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
								class="h-8 w-8 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110"
								style={`color:${social.color}`}
							>
								{#each brandIconPaths[social.icon] as path (path)}<path d={path} />{/each}
							</svg>
							<div class="flex flex-col gap-1">
								<h2 class="font-body text-sm font-semibold text-white">{social.name}</h2>
								<p class="font-body text-xs text-white/70">Join Us</p>
							</div>
						</div>
					</a>
				{/each}
			</div>
			<a
				href="/"
				class="mt-12 inline-block rounded-full bg-white px-10 py-5 text-base font-medium text-brand-black shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] sm:px-14"
				>Return Home</a
			>
		</div>
	</section>
	<Footer />
</div>
