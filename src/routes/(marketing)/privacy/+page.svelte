<script lang="ts">
	import Footer from '#lib/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>Privacy Notice | Sanctyria</title>
	<meta
		name="description"
		content="Learn what information Sanctyria and Sanctity use, why it is used, and the privacy choices available to you."
	/>
	<link rel="canonical" href="https://sanctyria.com/privacy" />
	<meta property="og:title" content="Privacy Notice | Sanctyria" />
	<meta
		property="og:description"
		content="How Sanctyria and Sanctity handle account information, community content, analytics, and privacy choices."
	/>
</svelte:head>

<main class="min-h-screen bg-[#080809] px-5 pt-32 pb-20 text-white sm:px-8 sm:pt-40">
	<div class="mx-auto max-w-5xl">
		<header class="border-b border-white/10 pb-10 sm:pb-14">
			<p class="font-mono text-[10px] tracking-[0.24em] text-emerald-300 uppercase">
				Legal / Your information
			</p>
			<h1 class="mt-5 font-display text-5xl leading-tight sm:text-7xl">Privacy Notice</h1>
			<p class="mt-5 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
				A plain-language guide to information used by Sanctyria.com and Sanctity, and the choices
				you can make about it.
			</p>
			<p class="mt-6 font-mono text-[10px] tracking-wider text-white/35 uppercase">
				Effective November 26, 2026 · Last reviewed with the current product implementation
			</p>
		</header>

		<div class="grid gap-12 pt-10 md:grid-cols-[200px_minmax(0,1fr)] md:gap-16 md:pt-14">
			<nav aria-label="Privacy notice contents" class="h-fit md:sticky md:top-24">
				<p class="font-mono text-[10px] tracking-widest text-white/35 uppercase">On this page</p>
				<ul class="mt-4 space-y-3 text-xs text-white/55">
					<li><a class="hover:text-emerald-200" href="#operator">Who we are</a></li>
					<li><a class="hover:text-emerald-200" href="#information">Information we use</a></li>
					<li><a class="hover:text-emerald-200" href="#use">How we use it</a></li>
					<li><a class="hover:text-emerald-200" href="#choices">Cookies and choices</a></li>
					<li><a class="hover:text-emerald-200" href="#sharing">When information is shared</a></li>
					<li><a class="hover:text-emerald-200" href="#retention">Retention and deletion</a></li>
					<li><a class="hover:text-emerald-200" href="#rights">Your choices and rights</a></li>
					<li><a class="hover:text-emerald-200" href="#children">Age requirements</a></li>
					<li><a class="hover:text-emerald-200" href="#security">Security and updates</a></li>
				</ul>
			</nav>

			<article class="space-y-12 text-sm leading-7 text-white/65">
				<section id="operator" class="scroll-mt-24">
					<h2 class="font-display text-3xl text-white">1. Who we are</h2>
					<p class="mt-4">
						Sanctyria is a brand and project managed by Eonrisia and the Sanctyria community. This
						notice covers the Sanctyria website and Sanctity, our creator-focused community service.
						For privacy questions or requests, email <a
							class="text-emerald-200 underline decoration-white/20 underline-offset-4"
							href="mailto:sanctyria@gmail.com">sanctyria@gmail.com</a
						>.
					</p>
				</section>

				<section id="information" class="scroll-mt-24">
					<h2 class="font-display text-3xl text-white">2. Information we use</h2>
					<div class="mt-4 space-y-4">
						<p>
							<strong class="font-medium text-white">Account and profile information.</strong>
							Username, display name, email address, password credentials (stored as a protected password
							hash), and optional profile details such as biography, avatar, and banner.
						</p>
						<p>
							<strong class="font-medium text-white">Content and community activity.</strong>
							Posts, replies, messages, uploads or media links, reactions, follows, memberships, bookmarks,
							preferences, and information in reports or moderation records.
						</p>
						<p>
							<strong class="font-medium text-white">Service and device information.</strong>
							Session identifiers, device push-notification tokens when you enable notifications, and
							information needed to authenticate, protect, and operate the service. Anti-abuse checks
							may process technical information such as network or browser signals.
						</p>
						<p>
							<strong class="font-medium text-white">Optional website analytics.</strong>
							If you opt in, the marketing site records aggregated page-view counts by day, page path,
							and campaign source/medium. These aggregates are not stored with your Sanctity account or
							a direct account identifier.
						</p>
						<p>
							<strong class="font-medium text-white">Payment information.</strong>
							If you choose an optional donation or payment, the payment provider shown at checkout collects
							the details needed to process it. We may receive limited transaction and confirmation information;
							the provider’s privacy notice also applies.
						</p>
					</div>
				</section>

				<section id="use" class="scroll-mt-24">
					<h2 class="font-display text-3xl text-white">3. How we use information</h2>
					<p class="mt-4">We use information as needed to:</p>
					<ul class="mt-4 list-disc space-y-2 pl-5 marker:text-emerald-300">
						<li>Create and secure accounts, verify email addresses, and help recover access.</li>
						<li>
							Provide profiles, posts, community features, messaging, notifications, and media
							uploads.
						</li>
						<li>Respond to support requests, reports, and safety or moderation concerns.</li>
						<li>
							Prevent abuse, enforce our <a
								class="text-emerald-200 underline underline-offset-4"
								href="/terms">Terms</a
							>, and maintain service reliability.
						</li>
						<li>
							Measure use of public marketing pages when you have opted in to optional analytics.
						</li>
						<li>Process a donation or payment that you choose to make.</li>
					</ul>
				</section>

				<section id="choices" class="scroll-mt-24">
					<h2 class="font-display text-3xl text-white">
						4. Cookies, local storage, and privacy choices
					</h2>
					<p class="mt-4">
						Essential browser storage and session mechanisms support sign-in, security, and core
						site features. The privacy-choice banner saves your optional analytics choice in your
						browser’s local storage.
					</p>
					<p class="mt-4">
						Optional first-party page-view analytics and browser error diagnostics are off until you
						allow them. The browser diagnostics are configured to remove user, request, cookie,
						header, and query-string details before sending events. Do Not Track is honored. You can
						reopen your choices with the “Privacy choices” link in the footer, or clear the saved
						choice in your browser.
					</p>
					<button
						type="button"
						class="mt-5 rounded-full border border-emerald-200/30 px-4 py-2 text-xs text-emerald-100 transition-colors hover:bg-emerald-200/10"
						onclick={() => window.dispatchEvent(new Event('sanctyria:open-privacy-settings'))}
					>
						Open privacy choices
					</button>
				</section>

				<section id="sharing" class="scroll-mt-24">
					<h2 class="font-display text-3xl text-white">5. When information is shared</h2>
					<p class="mt-4">
						We do not make account information public unless you or a feature you use makes it
						visible. We may share the information needed with infrastructure and feature providers
						that help us run the service. Depending on production configuration and the feature you
						use, these may include:
					</p>
					<ul class="mt-4 list-disc space-y-2 pl-5 marker:text-emerald-300">
						<li>Cloudinary for uploaded media storage and delivery.</li>
						<li>Cloudflare Turnstile for anti-abuse checks.</li>
						<li>Firebase Cloud Messaging for push notifications.</li>
						<li>Resend for account verification and recovery emails.</li>
						<li>Sentry for error diagnostics, where configured.</li>
						<li>Stripe or PayPal for optional donations or payments, where offered.</li>
						<li>Hosting, database, and security providers needed to operate the service.</li>
					</ul>
					<p class="mt-4">
						These integrations may not all be active in every deployment. Providers may process
						information under their own privacy notices and may store or process it in the countries
						where they operate. We may also disclose information when reasonably necessary to comply
						with law, protect users, investigate abuse, or respond to a valid legal request.
					</p>
					<p class="mt-4">
						Profiles and community content are shown to other users according to the service’s
						features and settings. Some eligible content may be made available to search engines
						according to your indexing choices. Public content may be copied or shared by others.
					</p>
				</section>

				<section id="retention" class="scroll-mt-24">
					<h2 class="font-display text-3xl text-white">6. Retention and account deletion</h2>
					<p class="mt-4">
						We keep information while needed to provide the service, protect users, resolve
						disputes, and meet legal obligations. We do not currently have a fixed numeric retention
						schedule for all operational logs, backups, or aggregated analytics.
					</p>
					<p class="mt-4">
						When an account is deleted, the service removes login credentials, email address, active
						sessions, push-device registrations, and direct profile details. The profile is changed
						to a “Deleted account” identity. Posts, replies, community messages, and some moderation
						or audit history may remain so conversations and community records continue to work.
						Material you included in retained content may still identify you; please remove
						sensitive details from content before requesting deletion.
					</p>
					<p class="mt-4">
						Some copies may persist in operational backups or records kept for safety, security, or
						legal reasons and may not be removed immediately when an account is deleted. We do not
						currently publish a fixed period for these copies.
					</p>
				</section>

				<section id="rights" class="scroll-mt-24">
					<h2 class="font-display text-3xl text-white">7. Your choices and rights</h2>
					<p class="mt-4">
						Depending on where you live, you may have rights to request access to, correction of, or
						deletion of personal information, or to object to or restrict certain uses. You can
						withdraw consent for optional website analytics at any time through the footer’s
						“Privacy choices” control. Withdrawing consent does not affect processing that already
						took place.
					</p>
					<p class="mt-4">
						To make a privacy request, email <a
							class="text-emerald-200 underline decoration-white/20 underline-offset-4"
							href="mailto:sanctyria@gmail.com">sanctyria@gmail.com</a
						>. We may ask for information needed to verify that the request relates to you.
					</p>
				</section>

				<section id="children" class="scroll-mt-24">
					<h2 class="font-display text-3xl text-white">8. Age requirements</h2>
					<p class="mt-4">
						Sanctity is for people aged 16 and older. We do not knowingly seek personal information
						from anyone under 16. If you believe someone under 16 has provided information or
						created an account, contact us at <a
							class="text-emerald-200 underline decoration-white/20 underline-offset-4"
							href="mailto:sanctyria@gmail.com">sanctyria@gmail.com</a
						>.
					</p>
				</section>

				<section id="security" class="scroll-mt-24">
					<h2 class="font-display text-3xl text-white">9. Security and updates</h2>
					<p class="mt-4">
						We use technical and organizational measures intended to protect information, but no
						online service can guarantee absolute security. We may update this Notice when our
						services or practices change. The latest version will be published on this page.
					</p>
					<p class="mt-4">
						For questions, requests, or concerns, contact <a
							class="text-emerald-200 underline decoration-white/20 underline-offset-4"
							href="mailto:sanctyria@gmail.com">sanctyria@gmail.com</a
						>.
					</p>
				</section>
			</article>
		</div>
	</div>
</main>

<Footer />
