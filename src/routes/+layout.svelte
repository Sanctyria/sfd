<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import type { LayoutProps } from './$types';
	import PrivacyConsent from '#lib/marketing/PrivacyConsent.svelte';
	import './layout.css';

	let { children }: LayoutProps = $props();
	let analyticsAllowed = $state(false);
	let currentUrl: URL | null = null;
	let lastTrackedLocation = '';
	let sentrySdk: typeof import('@sentry/browser') | undefined;
	let sentryInitialization: Promise<void> | undefined;
	const publicMarketingRoutes = new Set([
		'/',
		'/about',
		'/flameborns',
		'/nations',
		'/studio',
		'/journal',
		'/partnership',
		'/roadmap',
		'/reach-us'
	]);

	function trackPageView(url: URL | null) {
		if (!analyticsAllowed || !url || navigator.doNotTrack === '1') return;
		const path = url.pathname;
		if (!publicMarketingRoutes.has(path) && !path.startsWith('/journal/')) return;
		const locationKey = `${path}?${url.searchParams.toString()}`;
		if (locationKey === lastTrackedLocation) return;
		lastTrackedLocation = locationKey;
		const params = url.searchParams;
		const analyticsEvent = {
			path,
			source: params.get('utm_source') ?? '',
			medium: params.get('utm_medium') ?? '',
			campaign: params.get('utm_campaign') ?? ''
		};
		void fetch('/api/community/analytics/pageview', {
			method: 'POST',
			credentials: 'same-origin',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(analyticsEvent)
		}).catch((cause: unknown) => {
			console.error('Could not record anonymous page-view analytics.', cause);
		});
	}

	afterNavigate(({ to }) => {
		currentUrl = to?.url ?? null;
		trackPageView(currentUrl);
	});

	function updateAnalyticsConsent(allowed: boolean) {
		analyticsAllowed = allowed;
		if (allowed) trackPageView(currentUrl);
		void updateSentryConsent(allowed);
	}

	async function updateSentryConsent(allowed: boolean) {
		if (!allowed) {
			const sdk = sentrySdk;
			sentrySdk = undefined;
			if (sdk) {
				try {
					await sdk.close(2_000);
				} catch (cause) {
					console.error('Could not stop error monitoring after consent was withdrawn.', cause);
				}
			}
			return;
		}
		const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
		if (!sentryDsn || navigator.doNotTrack === '1' || sentrySdk) return;
		if (!sentryInitialization) {
			sentryInitialization = import('@sentry/browser')
				.then((sdk) => {
					if (!analyticsAllowed || navigator.doNotTrack === '1') return;
					sdk.init({
						dsn: sentryDsn,
						dataCollection: {
							userInfo: false,
							cookies: false,
							httpHeaders: false,
							httpBodies: [],
							urlQueryParams: false
						},
						tracesSampleRate: 0,
						beforeSend(event) {
							delete event.user;
							delete event.request;
							delete event.breadcrumbs;
							delete event.extra;
							delete event.contexts;
							delete event.message;
							delete event.logentry;
							for (const exception of event.exception?.values ?? []) {
								exception.value = exception.type ?? 'Error';
							}
							return event;
						}
					});
					sentrySdk = sdk;
				})
				.catch((cause: unknown) => {
					console.error('Could not initialize error monitoring.', cause);
				})
				.finally(() => {
					sentryInitialization = undefined;
				});
		}
		await sentryInitialization;
	}
</script>

<svelte:head>
	<link rel="icon" href="/assets/dlst.gif?v=2" type="image/gif" />
	<meta name="theme-color" content="#10110f" />
</svelte:head>

{@render children()}
<PrivacyConsent onConsentChange={updateAnalyticsConsent} />
