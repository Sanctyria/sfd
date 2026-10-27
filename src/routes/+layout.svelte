<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import type { LayoutProps } from './$types';
	import './layout.css';

	let { children }: LayoutProps = $props();
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

	afterNavigate(({ to }) => {
		if (!to || navigator.doNotTrack === '1') return;
		const path = to.url.pathname;
		if (!publicMarketingRoutes.has(path) && !path.startsWith('/journal/')) return;
		const params = to.url.searchParams;
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
	});
</script>

<svelte:head>
	<link rel="icon" href="/assets/dlst.gif?v=2" type="image/gif" />
	<meta name="theme-color" content="#10110f" />
</svelte:head>

{@render children()}
