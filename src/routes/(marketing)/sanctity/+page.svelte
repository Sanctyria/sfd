<script lang="ts">
	import { brandedOgImageUrl } from '#lib/community/og.js';
	import {
		ArrowRight,
		AudioLines,
		Compass,
		MessageCircle,
		PenLine,
		UsersRound
	} from '@lucide/svelte';
	import Footer from '#lib/marketing/Footer.svelte';

	let downloadDialog: HTMLDialogElement;
	const windowsDownloads = {
		portable:
			'https://github.com/Sanctyria/Sanctity-Software/releases/download/v1.0.0/Sanctity-Windows-x64-Production-1.0.1.zip',
		installer:
			'https://github.com/Sanctyria/Sanctity-Software/releases/download/installer.v1.0.0/Sanctity-Setup-1.0.1-x64.exe'
	};
	const platforms = [
		{ name: 'iOS', note: 'In internal testing' },
		{ name: 'Android', note: 'In internal testing' }
	];
</script>

<svelte:head>
	<title>Sanctity | A Community App for Creators</title>
	<meta
		name="description"
		content="Sanctity is the creator-focused community app from Sanctyria. Share your work, find your people, and build communities on web, iOS, Android, and Windows."
	/>
	<link rel="canonical" href="https://sanctyria.com/sanctity" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content="Sanctity | A Community App for Creators" />
	<meta
		property="og:description"
		content="A community app built with creators in mind. Share your work, find your people, and build communities with Sanctity."
	/>
	<meta
		property="og:image"
		content={brandedOgImageUrl(
			'Sanctity',
			'A community app built with creators in mind.',
			'THE SANCTYRIA COMMUNITY'
		)}
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Sanctity | A Community App for Creators" />
	<meta
		name="twitter:description"
		content="Share your work, find your people, and build communities with Sanctity."
	/>
	<meta
		name="twitter:image"
		content={brandedOgImageUrl(
			'Sanctity',
			'A community app built with creators in mind.',
			'THE SANCTYRIA COMMUNITY'
		)}
	/>
</svelte:head>

<main class="bg-[#080809] text-white">
	<section class="relative overflow-hidden px-6 pt-36 pb-24 sm:pt-44 sm:pb-32">
		<div
			class="pointer-events-none absolute -top-32 left-1/2 h-[34rem] w-[56rem] -translate-x-1/2 rounded-full bg-orange-500/[0.08] blur-[120px]"
		></div>
		<div class="relative mx-auto max-w-6xl">
			<p class="font-mono text-xs tracking-[0.22em] text-orange-300 uppercase">
				The community app from Sanctyria
			</p>
			<div class="mt-6 grid items-end gap-8 md:grid-cols-[1.3fr_0.7fr]">
				<h1 class="max-w-4xl font-display text-6xl leading-[0.94] sm:text-7xl md:text-8xl">
					Make things.<br /><span class="text-orange-200 italic">Find your people.</span>
				</h1>
				<div>
					<p class="text-base leading-relaxed text-white/65 sm:text-lg">
						Sanctity is a creator-focused community app for sharing what you make, discovering
						people and communities around your interests, and keeping the conversation going.
					</p>
					<a
						href="https://sanctity.sanctyria.com"
						class="mt-7 inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-orange-100"
					>
						Open Sanctity on the web
						<ArrowRight size={16} />
					</a>
					<p class="mt-3 text-xs text-white/40">Already available in your browser.</p>
				</div>
			</div>
		</div>
	</section>

	<section class="border-y border-white/10 bg-white/[0.02] px-6 py-20 sm:py-24">
		<div class="mx-auto max-w-6xl">
			<div class="max-w-2xl">
				<p class="font-mono text-xs tracking-[0.2em] text-orange-300 uppercase">Made for making</p>
				<h2 class="mt-4 font-display text-4xl leading-tight sm:text-5xl">
					A community that gives creativity room to grow.
				</h2>
				<p class="mt-5 leading-relaxed text-white/55">
					Sanctity brings creator tools and community conversation together, so sharing your work is
					only the beginning.
				</p>
			</div>
			<div class="mt-12 grid gap-4 md:grid-cols-3">
				<article class="rounded-2xl border border-white/10 bg-[#0b0b0c] p-6 sm:p-8">
					<PenLine class="text-orange-200" size={22} strokeWidth={1.6} />
					<h3 class="mt-6 font-display text-2xl">Share what you make</h3>
					<p class="mt-3 text-sm leading-relaxed text-white/55">
						Post updates and creative work, including images, video, audio, and links.
					</p>
				</article>
				<article class="rounded-2xl border border-white/10 bg-[#0b0b0c] p-6 sm:p-8">
					<Compass class="text-orange-200" size={22} strokeWidth={1.6} />
					<h3 class="mt-6 font-display text-2xl">Find your people</h3>
					<p class="mt-3 text-sm leading-relaxed text-white/55">
						Discover communities, follow creators, and find work around the things you care about.
					</p>
				</article>
				<article class="rounded-2xl border border-white/10 bg-[#0b0b0c] p-6 sm:p-8">
					<MessageCircle class="text-orange-200" size={22} strokeWidth={1.6} />
					<h3 class="mt-6 font-display text-2xl">Keep the conversation going</h3>
					<p class="mt-3 text-sm leading-relaxed text-white/55">
						Reply, chat, and build lasting connections around the work and ideas you share.
					</p>
				</article>
			</div>
		</div>
	</section>

	<section class="px-6 py-20 sm:py-24">
		<div class="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.85fr_1.15fr]">
			<div>
				<p class="font-mono text-xs tracking-[0.2em] text-orange-300 uppercase">
					Use Sanctity anywhere
				</p>
				<h2 class="mt-4 font-display text-4xl leading-tight sm:text-5xl">
					Your community, across screens.
				</h2>
				<p class="mt-5 leading-relaxed text-white/55">
					Use Sanctity on the web today. Native apps for iOS, Android, and Windows are currently
					being tested privately.
				</p>
			</div>
			<div class="grid gap-3 sm:grid-cols-2">
				<a
					href="https://sanctity.sanctyria.com"
					class="group flex items-center justify-between rounded-2xl border border-orange-200/30 bg-orange-200/[0.06] p-5 transition-colors hover:bg-orange-200/[0.1]"
				>
					<span class="flex items-center gap-3">
						<UsersRound class="text-orange-200" size={20} />
						<span>
							<span class="block font-medium">Web</span>
							<span class="mt-1 block text-xs text-emerald-300">Available now</span>
						</span>
					</span>
					<ArrowRight
						class="text-white/50 transition-transform group-hover:translate-x-1 group-hover:text-white"
						size={17}
					/>
				</a>
				<button
					type="button"
					onclick={() => downloadDialog.showModal()}
					aria-haspopup="dialog"
					class="group flex w-full items-center justify-between rounded-2xl border border-orange-200/30 bg-orange-200/[0.06] p-5 text-left transition-colors hover:bg-orange-200/[0.1]"
				>
					<span class="flex items-center gap-3">
						<AudioLines class="text-orange-200" size={20} />
						<span>
							<span class="block font-medium">Windows</span>
							<span class="mt-1 block text-xs text-emerald-300">Installer or portable</span>
						</span>
					</span>
					<ArrowRight
						class="text-white/50 transition-transform group-hover:translate-x-1 group-hover:text-white"
						size={17}
					/>
				</button>
				{#each platforms as platform (platform.name)}
					<div
						class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-5"
					>
						<span class="flex items-center gap-3">
							<AudioLines class="text-white/55" size={20} />
							<span>
								<span class="block font-medium">{platform.name}</span>
								<span class="mt-1 block text-xs text-white/40">{platform.note}</span>
							</span>
						</span>
						<span
							class="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[9px] tracking-wide text-white/40 uppercase"
							>Private test</span
						>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="px-6 pb-24">
		<div
			class="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-orange-200/[0.08] to-transparent p-8 sm:flex-row sm:items-center sm:p-12"
		>
			<div>
				<h2 class="font-display text-3xl sm:text-4xl">Ready to meet your community?</h2>
				<p class="mt-3 text-sm text-white/55">
					Open Sanctity in your browser and join the conversation.
				</p>
			</div>
			<a
				href="https://sanctity.sanctyria.com"
				class="inline-flex shrink-0 items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-orange-100"
			>
				Open Sanctity
				<ArrowRight size={16} />
			</a>
		</div>
	</section>
</main>

<dialog
	bind:this={downloadDialog}
	aria-labelledby="windows-download-title"
	aria-describedby="windows-download-description"
	class="m-auto w-[min(34rem,calc(100%-2rem))] max-w-none overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0c] p-0 text-white shadow-2xl backdrop:bg-black/75"
>
	<div class="p-6 sm:p-8">
		<div class="flex items-start justify-between gap-6">
			<div>
				<p class="font-mono text-[10px] tracking-[0.2em] text-orange-300 uppercase">
					Sanctity for Windows
				</p>
				<h2 id="windows-download-title" class="mt-3 font-display text-3xl sm:text-4xl">
					Choose your download
				</h2>
			</div>
			<button
				type="button"
				onclick={() => downloadDialog.close()}
				aria-label="Close Windows download options"
				class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-lg text-white/60 transition-colors hover:border-white/30 hover:text-white"
			>
				&times;
			</button>
		</div>
		<p id="windows-download-description" class="mt-4 text-sm leading-relaxed text-white/55">
			Choose the setup installer for a standard installation, or the portable ZIP to run Sanctity
			without installing it.
		</p>
		<div class="mt-7 grid gap-3 sm:grid-cols-2">
			<a
				href={windowsDownloads.installer}
				class="rounded-2xl border border-orange-200/30 bg-orange-200/[0.07] p-5 transition-colors hover:bg-orange-200/[0.12]"
			>
				<span class="block font-medium">Setup installer</span>
				<span class="mt-2 block text-xs leading-relaxed text-white/50">
					Download the .exe and follow the installation steps.
				</span>
				<span class="mt-5 inline-flex items-center gap-2 text-sm font-medium text-orange-100">
					Download installer <ArrowRight size={15} />
				</span>
			</a>
			<a
				href={windowsDownloads.portable}
				class="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
			>
				<span class="block font-medium">Portable ZIP</span>
				<span class="mt-2 block text-xs leading-relaxed text-white/50">
					Download and extract the ZIP, then run Sanctity from its folder.
				</span>
				<span class="mt-5 inline-flex items-center gap-2 text-sm font-medium text-white/85">
					Download portable <ArrowRight size={15} />
				</span>
			</a>
		</div>
		<p class="mt-5 text-[11px] leading-relaxed text-white/35">
			Both downloads are official Sanctity releases from GitHub.
		</p>
	</div>
</dialog>

<Footer />
