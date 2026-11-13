<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowUpRight, Check, Copy, Heart, ShieldCheck, Sparkles } from '@lucide/svelte';
	import Footer from '#lib/marketing/Footer.svelte';
	import { jsonLdScript } from '#lib/marketing/seo.js';

	interface DonationOptions {
		stripe: boolean;
		paypal: boolean;
		cashAppTag: string | null;
		cryptoWallet: { address: string; asset: string; network: string } | null;
	}

	interface ApiResponse {
		url?: string;
		status?: string;
		error?: { message?: string };
	}

	const amounts = [5, 10, 25, 50, 100];
	let options = $state<DonationOptions | null>(null);
	let selectedAmount = $state(25);
	let customAmount = $state('');
	let busyMethod = $state('');
	let errorMessage = $state('');
	let optionsError = $state('');
	let returnMessage = $state('');
	let copied = $state(false);
	let checkingWallet = $state(false);
	const amount = $derived(customAmount.trim() ? Number(customAmount) : selectedAmount);
	const donationPageSchema = {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: 'Support Sanctyria | Keep the Eternal Flame Burning',
		description:
			"Support the independent creation of Sanctyria's dark fantasy universe and community.",
		url: 'https://sanctyria.com/donate',
		isPartOf: {
			'@type': 'WebSite',
			name: 'Sanctyria',
			url: 'https://sanctyria.com'
		},
		about: {
			'@type': 'Organization',
			name: 'Sanctyria',
			url: 'https://sanctyria.com'
		}
	};

	onMount(() => {
		void loadDonationOptions();
		void handlePayPalReturn();
	});

	async function loadDonationOptions() {
		try {
			const response = await fetch('/api/community/donations/options', {
				headers: { accept: 'application/json' }
			});
			if (!response.ok) throw new Error('Donation options are unavailable.');
			options = (await response.json()) as DonationOptions;
		} catch {
			optionsError = 'Payment options could not be loaded. Refresh the page or try again later.';
		}
	}

	async function handlePayPalReturn() {
		const params = new URLSearchParams(window.location.search);
		if (params.get('status') === 'cancelled') {
			returnMessage = 'Checkout was cancelled. Your support is welcome whenever you are ready.';
			return;
		}
		if (params.get('status') === 'return') {
			returnMessage =
				'Welcome back. Check your payment provider for confirmation; thank you for supporting Sanctyria.';
			return;
		}
		if (params.get('status') !== 'paypal-return') return;

		const orderId = params.get('token');
		if (!orderId) {
			errorMessage = 'PayPal returned without an order reference. Please contact support.';
			return;
		}
		checkingWallet = true;
		try {
			const response = await fetch('/api/community/donations/paypal/capture', {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ orderId })
			});
			const result = (await response.json().catch(() => null)) as ApiResponse | null;
			if (!response.ok) {
				errorMessage = result?.error?.message ?? 'PayPal could not confirm the payment.';
				return;
			}
			returnMessage =
				'PayPal completed your checkout. Your payment confirmation will follow from PayPal.';
		} catch {
			errorMessage = 'PayPal could not confirm the payment. Please contact support.';
		} finally {
			checkingWallet = false;
		}
	}

	async function startCheckout(provider: 'stripe' | 'paypal') {
		errorMessage = '';
		returnMessage = '';
		if (!Number.isInteger(amount) || amount < 1 || amount > 5_000) {
			errorMessage = 'Choose a whole-dollar amount from $1 to $5,000.';
			return;
		}

		busyMethod = provider;
		try {
			const endpoint =
				provider === 'stripe'
					? '/api/community/donations/stripe/checkout'
					: '/api/community/donations/paypal/order';
			const response = await fetch(endpoint, {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ amount })
			});
			const result = (await response.json().catch(() => null)) as ApiResponse | null;
			if (!response.ok || !result?.url) {
				errorMessage = result?.error?.message ?? 'Checkout could not start. Try again shortly.';
				return;
			}
			const checkoutUrl = new URL(result.url);
			const allowedHosts =
				provider === 'stripe'
					? ['checkout.stripe.com']
					: ['www.paypal.com', 'www.sandbox.paypal.com'];
			if (checkoutUrl.protocol !== 'https:' || !allowedHosts.includes(checkoutUrl.hostname)) {
				errorMessage = 'The payment provider returned an invalid checkout destination.';
				return;
			}
			window.location.assign(checkoutUrl);
		} catch {
			errorMessage = 'The payment service is unavailable. Try again shortly.';
		} finally {
			busyMethod = '';
		}
	}

	async function copyWalletAddress() {
		const wallet = options?.cryptoWallet;
		if (!wallet) return;
		try {
			await navigator.clipboard.writeText(wallet.address);
			copied = true;
			window.setTimeout(() => (copied = false), 2_000);
		} catch {
			errorMessage = 'Could not copy the wallet address. Select and copy it manually.';
		}
	}
</script>

<svelte:head>
	<title>Support Sanctyria | Keep the Eternal Flame Burning</title>
	<meta
		name="description"
		content="Support the independent creation of Sanctyria's dark fantasy universe and community."
	/>
	<meta name="robots" content="index, follow" />
	<link rel="canonical" href="https://sanctyria.com/donate" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://sanctyria.com/donate" />
	<meta property="og:title" content="Support Sanctyria | Keep the Eternal Flame Burning" />
	<meta
		property="og:description"
		content="Help build a living world for creators, storytellers, and the community."
	/>
	<meta property="og:image" content="https://sanctyria.com/sitepreview.png" />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content="https://sanctyria.com/donate" />
	<meta name="twitter:title" content="Support Sanctyria | Keep the Eternal Flame Burning" />
	<meta
		name="twitter:description"
		content="Help build a living world for creators, storytellers, and the community."
	/>
	<meta name="twitter:image" content="https://sanctyria.com/sitepreview.png" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- jsonLdScript escapes HTML terminators in structured data. -->
	{@html jsonLdScript(donationPageSchema)}
</svelte:head>

<main class="relative min-h-screen overflow-hidden bg-[#090909] pb-24 text-[#f5f0e8]">
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(181,83,42,0.2),transparent_65%)]"
	></div>
	<div
		class="pointer-events-none absolute top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full border border-orange-100/[0.05]"
	></div>
	<div
		class="pointer-events-none absolute top-36 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full border border-orange-100/[0.06]"
	></div>

	<section class="relative mx-auto max-w-6xl px-5 pt-36 sm:px-8 sm:pt-44">
		<div class="mx-auto max-w-3xl text-center">
			<p
				class="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.3em] text-orange-200/75 uppercase"
			>
				<Sparkles size={14} /> Keep the Eternal Flame Burning
			</p>
			<h1 class="mt-6 font-display text-6xl leading-[0.88] text-white sm:text-8xl">
				Make room for<br /><span class="text-orange-200 italic">what comes next.</span>
			</h1>
			<p class="mx-auto mt-7 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
				Sanctyria grows through the people who believe in it. Your one-time gift helps us keep
				building the world, tools, and gathering places that bring this universe to life.
			</p>
			<div
				class="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] text-white/45"
			>
				<span class="inline-flex items-center gap-1.5"
					><Heart size={13} class="text-orange-200" /> One-time support</span
				>
				<span class="inline-flex items-center gap-1.5"
					><ShieldCheck size={13} class="text-emerald-200" /> Secure provider checkout</span
				>
			</div>
		</div>

		<div class="mx-auto mt-14 grid max-w-5xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
			<section class="border border-white/10 bg-white/[0.035] p-6 sm:p-8">
				<p class="font-mono text-[9px] tracking-[0.23em] text-orange-200/65 uppercase">
					Your offering
				</p>
				<h2 class="mt-3 font-display text-4xl text-white">Choose an amount</h2>
				<p class="mt-2 text-xs leading-5 text-white/45">
					Every contribution goes toward making more of Sanctyria possible.
				</p>
				{#if checkingWallet}
					<p role="status" class="mt-4 text-xs text-orange-100/80">
						Confirming your PayPal checkout...
					</p>
				{/if}

				<div class="mt-7 grid grid-cols-3 gap-2 sm:grid-cols-5">
					{#each amounts as value (value)}
						<button
							type="button"
							aria-pressed={!customAmount && selectedAmount === value}
							onclick={() => {
								selectedAmount = value;
								customAmount = '';
							}}
							class={`border px-2 py-3 text-sm transition-colors ${!customAmount && selectedAmount === value ? 'border-orange-200/70 bg-orange-200/10 text-orange-100' : 'border-white/10 bg-black/20 text-white/60 hover:border-white/30 hover:text-white'}`}
						>
							${value}
						</button>
					{/each}
				</div>
				<label class="mt-3 block">
					<span class="mb-1.5 block text-[10px] text-white/45"
						>Or enter a custom whole-dollar amount (USD)</span
					>
					<span
						class="flex items-center border border-white/10 bg-black/20 px-3 focus-within:border-orange-200/50"
					>
						<span class="text-white/40">$</span>
						<input
							type="number"
							min="1"
							max="5000"
							step="1"
							bind:value={customAmount}
							oninput={() => (selectedAmount = customAmount.trim() ? 0 : 25)}
							placeholder="25"
							class="w-full bg-transparent px-2 py-3 text-sm text-white outline-none placeholder:text-white/25"
							aria-label="Custom donation amount in US dollars"
						/>
						<span class="font-mono text-[9px] text-white/35">USD</span>
					</span>
				</label>

				{#if errorMessage}
					<p
						role="alert"
						class="mt-4 border border-red-300/20 bg-red-300/[0.06] px-3 py-2.5 text-xs text-red-200"
					>
						{errorMessage}
					</p>
				{/if}
				{#if optionsError}
					<p
						role="alert"
						class="mt-4 border border-amber-200/20 bg-amber-200/[0.05] px-3 py-2.5 text-xs text-amber-100/80"
					>
						{optionsError}
					</p>
				{/if}
				{#if returnMessage}
					<p
						role="status"
						class="mt-4 border border-emerald-200/20 bg-emerald-200/[0.06] px-3 py-2.5 text-xs leading-5 text-emerald-100"
					>
						{returnMessage}
					</p>
				{/if}

				<div class="mt-6 border-t border-white/[0.08] pt-5">
					<p class="mb-3 font-mono text-[9px] tracking-[0.18em] text-white/40 uppercase">
						Choose a way to give
					</p>
					<div class="grid gap-2 sm:grid-cols-2">
						<button
							type="button"
							disabled={!options?.stripe || busyMethod !== ''}
							onclick={() => startCheckout('stripe')}
							class="flex items-center justify-between border border-white/15 bg-white px-4 py-3 text-left text-xs font-semibold text-black transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-white/30"
						>
							<span>{busyMethod === 'stripe' ? 'Opening Stripe...' : 'Card · Stripe'}</span>
							<ArrowUpRight size={15} />
						</button>
						<button
							type="button"
							disabled={!options?.paypal || busyMethod !== ''}
							onclick={() => startCheckout('paypal')}
							class="flex items-center justify-between border border-[#d6b66e]/40 bg-[#d6b66e] px-4 py-3 text-left text-xs font-semibold text-[#17130b] transition-colors hover:bg-[#ead08c] disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/10 disabled:text-white/30"
						>
							<span>{busyMethod === 'paypal' ? 'Opening PayPal...' : 'PayPal'}</span>
							<ArrowUpRight size={15} />
						</button>
					</div>
					{#if options && !options.stripe && !options.paypal}
						<p class="mt-3 text-[10px] leading-5 text-white/35">
							Online checkout is being prepared. Direct support options are shown below when
							configured.
						</p>
					{/if}
				</div>
			</section>

			<div class="grid gap-5">
				<section class="border border-white/10 bg-[#111110] p-6 sm:p-8">
					<div class="flex items-start justify-between gap-5">
						<div>
							<p class="font-mono text-[9px] tracking-[0.23em] text-emerald-200/60 uppercase">
								Direct support
							</p>
							<h2 class="mt-3 font-display text-4xl text-white">Alternative paths</h2>
						</div>
						<span
							class="grid h-11 w-11 shrink-0 place-items-center border border-emerald-100/15 text-emerald-100/80"
						>
							<Heart size={19} strokeWidth={1.4} />
						</span>
					</div>

					<div class="mt-6 divide-y divide-white/[0.08] border-y border-white/[0.08]">
						<div class="flex items-center justify-between gap-4 py-4">
							<div>
								<p class="text-sm text-white">Cash App</p>
								<p class="mt-1 text-[10px] text-white/40">
									{options?.cashAppTag
										? `Send your chosen amount to $${options.cashAppTag}`
										: 'Not configured yet'}
								</p>
							</div>
							{#if options?.cashAppTag}
								<a
									href={`https://cash.app/$${encodeURIComponent(options.cashAppTag)}`}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex shrink-0 items-center gap-1 text-xs text-orange-100 hover:text-white"
									>Open Cash App <ArrowUpRight size={14} /></a
								>
							{:else}
								<span class="font-mono text-[8px] tracking-wider text-white/25 uppercase"
									>Setup needed</span
								>
							{/if}
						</div>

						<div class="py-4">
							<div class="flex items-center justify-between gap-4">
								<div>
									<p class="text-sm text-white">Crypto</p>
									<p class="mt-1 text-[10px] text-white/40">
										{options?.cryptoWallet
											? `${options.cryptoWallet.asset} · ${options.cryptoWallet.network}`
											: 'Wallet details not configured yet'}
									</p>
								</div>
								{#if options?.cryptoWallet}
									<button
										type="button"
										onclick={copyWalletAddress}
										class="inline-flex shrink-0 items-center gap-1 text-xs text-orange-100 hover:text-white"
										>{copied ? 'Copied' : 'Copy address'}
										{#if copied}<Check size={14} />{:else}<Copy size={14} />{/if}</button
									>
								{:else}
									<span class="font-mono text-[8px] tracking-wider text-white/25 uppercase"
										>Setup needed</span
									>
								{/if}
							</div>
							{#if options?.cryptoWallet}
								<p
									class="mt-3 border border-white/10 bg-black/30 px-3 py-2 font-mono text-[10px] leading-5 break-all text-white/60"
								>
									{options.cryptoWallet.address}
								</p>
								<p class="mt-2 text-[9px] leading-4 text-amber-100/60">
									Send your chosen amount in the listed asset on the exact network shown. On-chain
									transfers cannot be reversed.
								</p>
							{/if}
						</div>
					</div>
					<p class="mt-4 text-[9px] leading-5 text-white/35">
						Cash App and direct wallet transfers do not provide an automated payment webhook here.
						Keep your provider receipt or transaction ID; these methods may not be confirmed on this
						page.
					</p>
				</section>

				<section
					class="border border-orange-100/10 bg-[linear-gradient(135deg,rgba(132,57,31,0.15),rgba(255,255,255,0.025))] p-6 sm:p-7"
				>
					<p class="font-mono text-[9px] tracking-[0.22em] text-orange-200/65 uppercase">
						A small act, a wider world
					</p>
					<p class="mt-3 max-w-lg font-display text-3xl leading-tight text-white">
						Every gift helps keep this universe independent, imaginative, and open to its community.
					</p>
					<a
						href="/about"
						class="mt-5 inline-flex items-center gap-1.5 text-xs text-orange-100 hover:text-white"
					>
						Discover the world <ArrowUpRight size={14} />
					</a>
				</section>
			</div>
		</div>

		<section
			class="mx-auto mt-8 max-w-5xl border border-white/[0.08] bg-black/20 px-6 py-5 sm:px-8"
		>
			<h2 class="font-mono text-[9px] tracking-[0.2em] text-white/50 uppercase">
				Donation &amp; refund policy
			</h2>
			<p class="mt-2 max-w-4xl text-[10px] leading-5 text-white/40">
				Donations support the ongoing creation and operation of Sanctyria and are generally
				non-refundable. If a payment was accidental or unauthorized, contact us through
				<a
					href="/reach-us"
					class="text-orange-100 underline decoration-orange-100/30 underline-offset-2 hover:text-white"
					>Reach Us</a
				>. This policy does not limit rights that may apply under law or a payment provider's rules.
				Card and PayPal details are entered on the provider's secure checkout; they are not stored
				by this page.
			</p>
		</section>
	</section>
</main>
<Footer />
