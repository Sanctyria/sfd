<script lang="ts">
	import {
		ChartNoAxesCombined,
		UsersRound,
		Building2,
		FileText,
		CircleAlert
	} from '@lucide/svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const maximum = $derived(Math.max(1, ...data.daily.map((item) => item.pageViews)));
	const communityMetrics = $derived([
		{ label: 'Registered accounts', value: data.community.activeUsers, icon: UsersRound },
		{ label: 'Communities', value: data.community.activeCommunities, icon: Building2 },
		{ label: 'Visible posts', value: data.community.posts, icon: FileText },
		{ label: 'Open reports', value: data.community.openReports, icon: CircleAlert }
	]);
</script>

<svelte:head><title>Analytics | Sanctyria Core</title></svelte:head>

<div class="core-page-heading">
	<div>
		<span class="core-eyebrow">SIGNALS / PERFORMANCE</span>
		<h1>Analytics</h1>
		<p>
			Community totals and first-party page-view aggregates. No IP addresses, account IDs, session
			IDs, or raw user agents are stored.
		</p>
	</div>
	<form action="/core/analytics" method="GET" class="period-form">
		<label for="period">Period</label>
		<select
			class="core-field"
			name="days"
			id="period"
			value={data.days}
			onchange={(event) => event.currentTarget.form?.requestSubmit()}
		>
			<option value="7">Last 7 days</option>
			<option value="30">Last 30 days</option>
			<option value="90">Last 90 days</option>
		</select>
	</form>
</div>

<section class="metric-grid" aria-label="Community overview">
	{#each communityMetrics as metric (metric.label)}
		<div class="metric-card core-panel">
			<div class="metric-label"><metric.icon size={15} />{metric.label}</div>
			<strong>{metric.value.toLocaleString()}</strong>
			<small>Current total</small>
		</div>
	{/each}
</section>

<div class="analytics-grid">
	<section class="core-panel chart-panel">
		<div class="core-panel-title">
			<div>
				<span class="core-eyebrow">PUBLIC SITE</span>
				<h2>Page views</h2>
			</div>
			<span class="total-value"
				>{data.pageViews.toLocaleString()} <small>in {data.days} days</small></span
			>
		</div>
		{#if data.daily.length}
			<div
				class="chart"
				role="img"
				aria-label={`${data.pageViews} page views during the last ${data.days} days`}
			>
				{#each data.daily as point (point.day)}
					<div class="bar-column" title={`${point.day}: ${point.pageViews} views`}>
						<div class="bar-track">
							<span style={`height:${Math.max(3, (point.pageViews / maximum) * 100)}%`}></span>
						</div>
						<time
							>{new Date(`${point.day}T12:00:00`).toLocaleDateString(undefined, {
								month: 'short',
								day: 'numeric'
							})}</time
						>
					</div>
				{/each}
			</div>
		{:else}
			<div class="empty-chart">
				<ChartNoAxesCombined size={23} /><strong>No page views yet</strong><span
					>First-party page-view counts will appear after the public site receives visits.</span
				>
			</div>
		{/if}
		<p class="chart-footnote">Counts are aggregated by UTC day. No individual visitor tracking.</p>
	</section>

	<section class="core-panel pages-panel">
		<div class="core-panel-title">
			<div>
				<span class="core-eyebrow">MOST VISITED</span>
				<h2>Top pages</h2>
			</div>
		</div>
		{#if data.topPages.length}
			<div class="rank-list">
				{#each data.topPages as item, index (item.path)}
					<div class="rank-row">
						<span class="rank-number">{String(index + 1).padStart(2, '0')}</span><span
							class="rank-path">{item.path}</span
						><strong>{item.pageViews.toLocaleString()}</strong>
					</div>
				{/each}
			</div>
		{:else}
			<p class="empty-note">No page totals for this period.</p>
		{/if}
	</section>
</div>

<section class="core-panel campaigns-panel">
	<div class="core-panel-title">
		<div>
			<span class="core-eyebrow">UTM ATTRIBUTION</span>
			<h2>Campaign activity</h2>
		</div>
		<span class="privacy-badge">Anonymous aggregates</span>
	</div>
	{#if data.campaigns.length}
		<div class="campaign-scroll">
			<table>
				<thead><tr><th>Campaign</th><th>Source</th><th>Medium</th><th>Page views</th></tr></thead
				><tbody
					>{#each data.campaigns as campaign (`${campaign.source}-${campaign.medium}-${campaign.campaign}`)}<tr
							><td>{campaign.campaign}</td><td>{campaign.source || '—'}</td><td
								>{campaign.medium || '—'}</td
							><td>{campaign.pageViews.toLocaleString()}</td></tr
						>{/each}</tbody
				>
			</table>
		</div>
	{:else}
		<p class="empty-note">
			No campaign-tagged visits in this period. Campaigns are attributed from UTM source, medium,
			and campaign values.
		</p>
	{/if}
</section>

<style>
	.period-form {
		display: flex;
		align-items: center;
		gap: 9px;
	}
	.period-form label {
		color: var(--core-muted);
		font-size: 9px;
	}
	.period-form select {
		width: auto;
		min-width: 130px;
	}
	.metric-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 12px;
		margin-bottom: 15px;
	}
	.metric-card {
		padding: 15px 17px;
	}
	.metric-label {
		display: flex;
		align-items: center;
		gap: 7px;
		color: var(--core-muted);
		font-size: 9px;
	}
	.metric-label :global(svg) {
		color: #e8ad85;
	}
	.metric-card > strong {
		display: block;
		margin-top: 15px;
		font-family: var(--font-display);
		font-size: 31px;
		font-weight: 400;
	}
	.metric-card > small {
		display: block;
		margin-top: 3px;
		color: var(--core-muted);
		font-size: 8px;
	}
	.analytics-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.5fr) minmax(270px, 0.75fr);
		gap: 15px;
	}
	.total-value {
		color: #efb28d;
		font-family: var(--font-display);
		font-size: 22px;
	}
	.total-value small {
		color: var(--core-muted);
		font-family: var(--font-body);
		font-size: 8px;
	}
	.chart {
		display: flex;
		min-height: 200px;
		align-items: stretch;
		gap: 4px;
		padding: 20px 17px 8px;
	}
	.bar-column {
		display: flex;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}
	.bar-track {
		display: flex;
		width: 100%;
		height: 148px;
		align-items: flex-end;
		border-bottom: 1px solid var(--core-border);
		background: linear-gradient(to top, rgba(255, 255, 255, 0.012), transparent);
	}
	.bar-track span {
		width: 100%;
		min-height: 3px;
		border-radius: 3px 3px 0 0;
		background: linear-gradient(0deg, #9d664b, #f0b28c);
		opacity: 0.84;
	}
	.bar-column time {
		overflow: hidden;
		width: 100%;
		color: var(--core-muted);
		font-size: 7px;
		text-align: center;
		text-overflow: clip;
		white-space: nowrap;
	}
	.chart-footnote {
		margin: 5px 18px 14px;
		color: var(--core-muted);
		font-size: 8px;
	}
	.empty-chart {
		display: grid;
		min-height: 185px;
		align-content: center;
		justify-items: center;
		gap: 8px;
		color: var(--core-muted);
		text-align: center;
	}
	.empty-chart :global(svg) {
		color: #e8ad85;
	}
	.empty-chart strong {
		color: rgba(255, 255, 255, 0.8);
		font-size: 11px;
		font-weight: 500;
	}
	.empty-chart span {
		max-width: 230px;
		font-size: 9px;
		line-height: 1.5;
	}
	.rank-list {
		padding: 4px 15px;
	}
	.rank-row {
		display: flex;
		align-items: center;
		gap: 10px;
		border-bottom: 1px solid var(--core-border);
		padding: 11px 0;
	}
	.rank-row:last-child {
		border-bottom: 0;
	}
	.rank-number {
		color: #d19a76;
		font-family: var(--font-anton);
		font-size: 8px;
	}
	.rank-path {
		overflow: hidden;
		flex: 1;
		color: rgba(255, 255, 255, 0.75);
		font-size: 9px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.rank-row strong {
		color: var(--core-muted);
		font-size: 9px;
		font-weight: 500;
	}
	.empty-note {
		padding: 6px 17px 16px;
		color: var(--core-muted);
		font-size: 9px;
		line-height: 1.6;
	}
	.campaigns-panel {
		margin-top: 15px;
	}
	.privacy-badge {
		border: 1px solid rgba(120, 168, 135, 0.22);
		border-radius: 99px;
		padding: 5px 8px;
		color: #a8d0b3;
		font-size: 8px;
	}
	.campaign-scroll {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}
	th {
		height: 37px;
		padding: 0 15px;
		color: var(--core-muted);
		font-family: var(--font-anton);
		font-size: 8px;
		font-weight: 400;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	td {
		height: 43px;
		border-top: 1px solid var(--core-border);
		padding: 8px 15px;
		color: rgba(255, 255, 255, 0.76);
		font-size: 9px;
	}
	@media (max-width: 1000px) {
		.metric-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.analytics-grid {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 700px) {
		.period-form {
			width: 100%;
			justify-content: space-between;
		}
		.period-form select {
			flex: 1;
		}
		.chart {
			gap: 2px;
			padding-inline: 10px;
		}
		.bar-column time {
			font-size: 6px;
		}
		.campaigns-panel .core-panel-title {
			align-items: flex-start;
			flex-direction: column;
		}
	}
</style>
