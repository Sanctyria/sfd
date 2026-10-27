<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { ArrowUpRight, Check, Eye, ShieldAlert, X } from '@lucide/svelte';
	import { coreApi } from '#lib/core/coreApi.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let reasons = $state<Record<string, string>>({});
	let busyId = $state('');
	let actionError = $state('');

	async function decide(
		report: (typeof data.items)[number],
		status: 'reviewing' | 'resolved' | 'dismissed',
		removeContent = false
	) {
		actionError = '';
		const reason = reasons[report.id]?.trim() ?? '';
		if (reason.length < 10) {
			actionError = 'Add a decision reason of at least 10 characters.';
			return;
		}
		if (
			removeContent &&
			!window.confirm(
				'Remove this reported post or reply from public view? This action is audited.'
			)
		)
			return;
		busyId = report.id;
		try {
			await coreApi(fetch, `moderation/reports/${report.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ status, reason, removeContent })
			});
			await invalidateAll();
		} catch (cause) {
			actionError = cause instanceof Error ? cause.message : 'The report decision failed.';
		} finally {
			busyId = '';
		}
	}
</script>

<svelte:head><title>Moderation | Sanctyria Core</title></svelte:head>

<div class="core-page-heading">
	<div>
		<span class="core-eyebrow">COMMUNITY / TRUST & SAFETY</span>
		<h1>Moderation</h1>
		<p>
			Resolve reports across communities. Every decision and content removal is recorded in the
			audit trail.
		</p>
	</div>
	<form action="/core/moderation" method="GET" class="status-filter">
		<label for="report-status">Queue</label>
		<select
			class="core-field"
			id="report-status"
			name="status"
			value={data.status}
			onchange={(event) => event.currentTarget.form?.requestSubmit()}
		>
			<option value="open">Open reports</option>
			<option value="reviewing">In review</option>
			<option value="resolved">Resolved</option>
			<option value="dismissed">Dismissed</option>
		</select>
	</form>
</div>

{#if actionError}<div class="core-error" role="alert">{actionError}</div>{/if}

<div class="moderation-grid">
	<section class="core-panel report-panel">
		<div class="core-panel-title">
			<div>
				<span class="core-eyebrow">REPORT QUEUE</span>
				<h2>{data.items.length} reports · {data.status}</h2>
			</div>
		</div>
		<div class="report-list">
			{#each data.items as report (report.id)}
				<article class="report-card">
					<div class="report-topline">
						<span class="report-kind">{report.targetType} report</span>
						<span class={`core-pill ${report.status}`}>{report.status}</span>
						<time>{new Date(report.createdAt).toLocaleString()}</time>
					</div>
					{#if report.targetBody}<blockquote>{report.targetBody}</blockquote>{:else}<p
							class="removed-note"
						>
							The reported content is no longer available.
						</p>{/if}
					<p class="report-reason"><strong>Report reason</strong>{report.reason}</p>
					<div class="report-meta">
						<span>Reported by <strong>@{report.reporterUsername}</strong></span>
						{#if report.communitySlug}<a
								href={`/r/${report.communitySlug}`}
								target="_blank"
								rel="noreferrer">/r/{report.communitySlug} <ArrowUpRight size={12} /></a
							>{/if}
						{#if report.targetPostId}<a
								href={`/p/${report.targetPostId}`}
								target="_blank"
								rel="noreferrer">Open target <ArrowUpRight size={12} /></a
							>{/if}
					</div>
					<div class="decision-row">
						<input
							class="core-field"
							bind:value={reasons[report.id]}
							maxlength="500"
							placeholder="Decision reason (required, 10+ characters)"
							aria-label="Decision reason"
						/>
						<div class="decision-actions">
							{#if report.status !== 'reviewing'}<button
									class="core-button secondary"
									disabled={busyId === report.id}
									onclick={() => decide(report, 'reviewing')}><Eye size={13} /> Review</button
								>{/if}
							{#if report.status !== 'resolved'}<button
									class="core-button"
									disabled={busyId === report.id}
									onclick={() => decide(report, 'resolved')}><Check size={13} /> Resolve</button
								>{/if}
							{#if report.status !== 'dismissed'}<button
									class="core-button secondary"
									disabled={busyId === report.id}
									onclick={() => decide(report, 'dismissed')}><X size={13} /> Dismiss</button
								>{/if}
							{#if report.targetBody && report.status !== 'resolved'}<button
									class="core-button danger"
									disabled={busyId === report.id}
									onclick={() => decide(report, 'resolved', true)}
									><ShieldAlert size={13} /> Remove content</button
								>{/if}
						</div>
					</div>
				</article>
			{:else}
				<div class="empty-reports">
					<span><Check size={18} /></span><strong>Queue clear</strong><small
						>There are no {data.status} reports right now.</small
					>
				</div>
			{/each}
		</div>
		{#if data.nextCursor}
			<div class="pagination">
				<a
					class="core-button secondary"
					href={`/core/moderation?${new URLSearchParams({ status: data.status, cursor: data.nextCursor })}`}
					>Load next reports</a
				>
			</div>
		{/if}
	</section>

	<aside class="core-panel audit-panel">
		<div class="core-panel-title">
			<div>
				<span class="core-eyebrow">GLOBAL AUDIT</span>
				<h2>Recent decisions</h2>
			</div>
		</div>
		<div class="audit-list">
			{#each data.actions as action (action.id)}
				<div class="audit-row">
					<span class="audit-marker"></span>
					<div>
						<strong>{action.action.replaceAll('_', ' ')}</strong>
						<small>{action.targetType} · {action.actorDisplayName}</small>
						<time>{new Date(action.createdAt).toLocaleString()}</time>
						{#if action.details.reason}<p>{action.details.reason}</p>{/if}
					</div>
				</div>
			{:else}
				<p class="empty-audit">No global actions have been recorded yet.</p>
			{/each}
		</div>
	</aside>
</div>

<style>
	.status-filter {
		display: flex;
		align-items: center;
		gap: 9px;
	}
	.status-filter label {
		color: var(--core-muted);
		font-size: 9px;
	}
	.status-filter select {
		width: auto;
		min-width: 135px;
	}
	.moderation-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.45fr) minmax(270px, 0.7fr);
		align-items: start;
		gap: 16px;
	}
	.report-list {
		padding: 0 17px;
	}
	.report-card {
		padding: 17px 0;
		border-bottom: 1px solid var(--core-border);
	}
	.report-card:last-child {
		border-bottom: 0;
	}
	.report-topline {
		display: flex;
		align-items: center;
		gap: 9px;
	}
	.report-kind {
		color: #efb28d;
		font-size: 10px;
		font-weight: 500;
		text-transform: capitalize;
	}
	.report-topline time {
		margin-left: auto;
		color: var(--core-muted);
		font-size: 8px;
	}
	.report-card blockquote {
		margin: 13px 0;
		border-left: 2px solid rgba(240, 161, 108, 0.44);
		padding: 3px 0 3px 12px;
		color: rgba(255, 255, 255, 0.7);
		font-size: 11px;
		line-height: 1.6;
	}
	.removed-note {
		color: var(--core-muted);
		font-size: 10px;
	}
	.report-reason {
		display: flex;
		gap: 8px;
		margin: 10px 0;
		color: var(--core-muted);
		font-size: 9px;
		line-height: 1.6;
	}
	.report-reason strong {
		color: rgba(255, 255, 255, 0.75);
		font-weight: 500;
	}
	.report-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 14px;
		color: var(--core-muted);
		font-size: 8px;
	}
	.report-meta strong {
		color: rgba(255, 255, 255, 0.7);
		font-weight: 500;
	}
	.report-meta a {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		color: #efb28d;
		text-decoration: none;
	}
	.decision-row {
		display: grid;
		gap: 9px;
		margin-top: 14px;
	}
	.decision-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.decision-actions .core-button {
		min-height: 30px;
		padding-inline: 9px;
		font-size: 9px;
	}
	.audit-list {
		padding: 6px 16px 12px;
	}
	.audit-row {
		position: relative;
		display: flex;
		gap: 10px;
		padding: 11px 0;
		border-bottom: 1px solid var(--core-border);
	}
	.audit-row:last-child {
		border-bottom: 0;
	}
	.audit-marker {
		width: 7px;
		height: 7px;
		flex: 0 0 auto;
		margin-top: 4px;
		border-radius: 50%;
		background: #bc8968;
	}
	.audit-row strong,
	.audit-row small,
	.audit-row time {
		display: block;
	}
	.audit-row strong {
		color: rgba(255, 255, 255, 0.82);
		font-size: 9px;
		font-weight: 500;
		text-transform: capitalize;
	}
	.audit-row small,
	.audit-row time {
		margin-top: 4px;
		color: var(--core-muted);
		font-size: 8px;
	}
	.audit-row p {
		margin: 6px 0 0;
		color: rgba(235, 235, 227, 0.6);
		font-size: 8px;
		line-height: 1.5;
	}
	.empty-audit {
		color: var(--core-muted);
		font-size: 9px;
	}
	.empty-reports {
		display: grid;
		justify-items: center;
		gap: 8px;
		padding: 45px 15px;
	}
	.empty-reports span {
		display: grid;
		width: 36px;
		height: 36px;
		place-items: center;
		border: 1px solid rgba(120, 168, 135, 0.3);
		border-radius: 50%;
		color: #a8d0b3;
	}
	.empty-reports strong {
		font-size: 12px;
		font-weight: 500;
	}
	.empty-reports small {
		color: var(--core-muted);
		font-size: 9px;
	}
	.core-error {
		margin-bottom: 14px;
	}
	@media (max-width: 1000px) {
		.moderation-grid {
			grid-template-columns: 1fr;
		}
		.audit-panel {
			order: 2;
		}
	}
	@media (max-width: 700px) {
		.status-filter {
			width: 100%;
			justify-content: space-between;
		}
		.status-filter select {
			flex: 1;
		}
		.report-list {
			padding-inline: 12px;
		}
		.report-card {
			padding-block: 14px;
		}
		.report-reason {
			flex-direction: column;
			gap: 2px;
		}
		.report-topline time {
			font-size: 7px;
		}
	}
</style>
