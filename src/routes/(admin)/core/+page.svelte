<script lang="ts">
	import {
		ArrowUpRight,
		Activity,
		BookOpen,
		Building2,
		CircleAlert,
		UsersRound
	} from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const metrics = $derived(data.metrics);
	const cards = $derived([
		{
			label: 'Active members',
			value: metrics.users.active,
			note: `${metrics.users.newThisMonth} joined this month`,
			icon: UsersRound,
			href: '/core/users',
			tone: 'copper'
		},
		{
			label: 'Communities',
			value: metrics.communities.active,
			note: `${metrics.communities.total} total spaces`,
			icon: Building2,
			href: '/core/communities',
			tone: 'sage'
		},
		{
			label: 'CMS stories',
			value: metrics.publishedArticles,
			note: 'Published from Core',
			icon: BookOpen,
			href: '/core/marketing',
			tone: 'violet'
		},
		{
			label: 'Open reports',
			value: metrics.openReports,
			note: 'Awaiting review',
			icon: CircleAlert,
			href: '/core/moderation',
			tone: 'rose'
		}
	]);
	const modules = $derived([
		{
			title: 'Community',
			detail: 'Members, spaces, moderation and safety.',
			href: '/core/communities',
			icon: Building2,
			count: `${metrics.posts.total.toLocaleString()} active posts`
		},
		{
			title: 'Marketing',
			detail: 'Manage journal stories without changing static pages.',
			href: '/core/marketing',
			icon: BookOpen,
			count: `${metrics.publishedArticles} managed`
		},
		{
			title: 'Analytics',
			detail: 'Community health and anonymous page activity.',
			href: '/core/analytics',
			icon: Activity,
			count: `${metrics.pageViews30Days.toLocaleString()} page views / 30 days`
		}
	]);
</script>

<svelte:head>
	<title>Overview | Sanctyria Core</title>
</svelte:head>

<div class="core-page-heading">
	<div>
		<span class="core-eyebrow">SANCTYRIA / CONTROL ROOM</span>
		<h1>Good to see you.</h1>
		<p>A clear view of the community, its stories, and the work moving through Sanctyria.</p>
	</div>
	<div class="overview-live"><span></span> LIVE OVERVIEW</div>
</div>

<section class="metric-grid" aria-label="Workspace summary">
	{#each cards as card (card.label)}
		<a class="metric-card core-panel" href={card.href}>
			<div class="metric-head">
				<span>{card.label}</span>
				<span class={`metric-icon ${card.tone}`}><card.icon size={17} strokeWidth={1.7} /></span>
			</div>
			<strong>{card.value.toLocaleString()}</strong>
			<small>{card.note}</small>
		</a>
	{/each}
</section>

<section class="overview-grid">
	<div class="core-panel activity-panel">
		<div class="core-panel-title">
			<div>
				<span class="core-eyebrow">YOUR WORKSPACE</span>
				<h2>Administration modules</h2>
			</div>
			<span class="module-count">06 MODULES</span>
		</div>
		<div class="module-list">
			{#each modules as module (module.href)}
				<a class="module-row" href={module.href}>
					<span class="module-icon"><module.icon size={17} /></span>
					<span class="module-copy"
						><strong>{module.title}</strong><small>{module.detail}</small></span
					>
					<span class="module-count">{module.count}</span>
					<ArrowUpRight size={15} class="module-arrow" />
				</a>
			{/each}
			<a class="module-row" href="/core/users">
				<span class="module-icon"><UsersRound size={17} /></span>
				<span class="module-copy"
					><strong>People</strong><small>Account access, status, and member history.</small></span
				>
				<span class="module-count">{metrics.users.total.toLocaleString()} accounts</span>
				<ArrowUpRight size={15} class="module-arrow" />
			</a>
			<a class="module-row" href="/core/moderation">
				<span class="module-icon"><CircleAlert size={17} /></span>
				<span class="module-copy"
					><strong>Safety queue</strong><small>Review community reports and decisions.</small></span
				>
				<span class="module-count">{metrics.openReports} open</span>
				<ArrowUpRight size={15} class="module-arrow" />
			</a>
		</div>
	</div>

	<div class="right-stack">
		<section class="core-panel">
			<div class="core-panel-title">
				<div>
					<span class="core-eyebrow">COMMUNITY SIGNAL</span>
					<h2>Publishing rhythm</h2>
				</div>
			</div>
			<div class="signal-body">
				<div class="signal-value">
					{metrics.posts.thisMonth.toLocaleString()}<span> posts</span>
				</div>
				<p>Shared across the public community in the last 30 days.</p>
				<a href="/core/analytics" class="signal-link">Open analytics <ArrowUpRight size={14} /></a>
			</div>
		</section>
		<section class="core-panel recent-panel">
			<div class="core-panel-title">
				<div>
					<span class="core-eyebrow">RECENTLY ADDED</span>
					<h2>Communities</h2>
				</div>
			</div>
			{#if data.recentCommunities.length}
				<div class="recent-list">
					{#each data.recentCommunities as community (community.id)}
						<a href="/core/communities" class="recent-row">
							<span class="recent-bullet"></span><span
								><strong>{community.name}</strong><small>/r/{community.slug}</small></span
							>
							<span class={`core-pill ${community.status}`}>{community.status}</span>
						</a>
					{/each}
				</div>
			{:else}
				<p class="empty-note">Communities will appear here as they are created.</p>
			{/if}
		</section>
	</div>
</section>

<style>
	.overview-live {
		display: flex;
		align-items: center;
		gap: 8px;
		border: 1px solid rgba(120, 168, 135, 0.2);
		border-radius: 99px;
		padding: 8px 11px;
		color: #acd1b5;
		font-family: var(--font-anton);
		font-size: 8px;
		letter-spacing: 0.15em;
	}
	.overview-live span {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #78a887;
		box-shadow: 0 0 9px rgba(120, 168, 135, 0.6);
	}
	.metric-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 13px;
		margin-bottom: 18px;
	}
	.metric-card {
		min-width: 0;
		padding: 17px 18px 16px;
		color: inherit;
		text-decoration: none;
		transition:
			border-color 160ms ease,
			transform 160ms ease;
	}
	.metric-card:hover {
		transform: translateY(-2px);
		border-color: rgba(240, 161, 108, 0.3);
	}
	.metric-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: rgba(235, 235, 227, 0.52);
		font-size: 10px;
	}
	.metric-icon,
	.module-icon {
		display: grid;
		width: 32px;
		height: 32px;
		place-items: center;
		border: 1px solid var(--core-border);
		border-radius: 8px;
		color: #efb28d;
	}
	.metric-icon.sage {
		color: #a5c6a9;
		background: rgba(120, 168, 135, 0.08);
	}
	.metric-icon.violet {
		color: #c0a8d1;
		background: rgba(167, 132, 198, 0.08);
	}
	.metric-icon.rose {
		color: #e4a39c;
		background: rgba(234, 104, 92, 0.07);
	}
	.metric-card > strong {
		display: block;
		margin-top: 15px;
		font-family: var(--font-display);
		font-size: 37px;
		font-weight: 400;
		line-height: 1;
	}
	.metric-card > small {
		display: block;
		margin-top: 8px;
		color: var(--core-muted);
		font-size: 9px;
	}
	.overview-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.75fr);
		gap: 18px;
	}
	.core-panel-title h2 {
		margin-top: 5px;
	}
	.module-count {
		color: var(--core-muted);
		font-family: var(--font-anton);
		font-size: 8px;
		letter-spacing: 0.12em;
	}
	.module-list {
		padding: 4px 17px;
	}
	.module-row {
		display: flex;
		min-height: 70px;
		align-items: center;
		gap: 12px;
		border-bottom: 1px solid var(--core-border);
		color: inherit;
		text-decoration: none;
	}
	.module-row:last-child {
		border-bottom: 0;
	}
	.module-icon {
		width: 33px;
		height: 33px;
		flex: 0 0 auto;
		color: rgba(239, 178, 141, 0.78);
	}
	.module-copy {
		min-width: 0;
		flex: 1;
	}
	.module-copy strong,
	.module-copy small {
		display: block;
	}
	.module-copy strong {
		font-size: 11px;
		font-weight: 500;
	}
	.module-copy small {
		margin-top: 4px;
		color: var(--core-muted);
		font-size: 9px;
	}
	.module-count {
		white-space: nowrap;
	}
	.module-arrow {
		color: var(--core-muted);
	}
	.right-stack {
		display: grid;
		align-content: start;
		gap: 18px;
	}
	.signal-body {
		padding: 18px 19px 19px;
	}
	.signal-value {
		font-family: var(--font-display);
		font-size: 37px;
	}
	.signal-value span {
		color: var(--core-muted);
		font-family: var(--font-body);
		font-size: 10px;
	}
	.signal-body p {
		max-width: 240px;
		margin: 6px 0 16px;
		color: var(--core-muted);
		font-size: 10px;
		line-height: 1.65;
	}
	.signal-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		color: #efb28d;
		font-size: 10px;
		text-decoration: none;
	}
	.recent-list {
		padding: 3px 15px 8px;
	}
	.recent-row {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 9px 0;
		color: inherit;
		text-decoration: none;
	}
	.recent-row > span:nth-child(2) {
		min-width: 0;
		flex: 1;
	}
	.recent-row strong,
	.recent-row small {
		display: block;
	}
	.recent-row strong {
		overflow: hidden;
		font-size: 10px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.recent-row small {
		margin-top: 3px;
		color: var(--core-muted);
		font-size: 9px;
	}
	.recent-bullet {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #d79d76;
	}
	.empty-note {
		padding: 5px 18px 18px;
		color: var(--core-muted);
		font-size: 10px;
	}
	@media (max-width: 1050px) {
		.metric-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.overview-grid {
			grid-template-columns: 1fr;
		}
		.right-stack {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (max-width: 700px) {
		.metric-grid {
			gap: 9px;
		}
		.metric-card {
			padding: 13px;
		}
		.metric-card > strong {
			font-size: 31px;
		}
		.right-stack {
			grid-template-columns: 1fr;
		}
		.module-count {
			display: none;
		}
		.overview-live {
			align-self: flex-start;
		}
	}
</style>
