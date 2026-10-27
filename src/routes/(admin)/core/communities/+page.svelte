<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { ArrowUpRight, Building2, RotateCcw, Search } from '@lucide/svelte';
	import { coreApi } from '#lib/core/coreApi.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let reason = $state('');
	let busyId = $state('');
	let actionError = $state('');

	async function setCommunityStatus(
		community: (typeof data.items)[number],
		action: 'archive' | 'restore'
	) {
		actionError = '';
		if (reason.trim().length < 10) {
			actionError = 'Enter a moderation reason of at least 10 characters.';
			return;
		}
		const verb = action === 'archive' ? 'Archive' : 'Restore';
		if (
			!window.confirm(
				`${verb} “${community.name}”? The action will be written to the global audit log.`
			)
		)
			return;
		busyId = community.id;
		try {
			await coreApi(fetch, `communities/${community.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ action, reason: reason.trim() })
			});
			reason = '';
			await invalidateAll();
		} catch (cause) {
			actionError = cause instanceof Error ? cause.message : 'The community update failed.';
		} finally {
			busyId = '';
		}
	}
</script>

<svelte:head><title>Communities | Sanctyria Core</title></svelte:head>

<div class="core-page-heading">
	<div>
		<span class="core-eyebrow">COMMUNITY / SPACES</span>
		<h1>Communities</h1>
		<p>
			Review public spaces, ownership, and activity. Archive or restore a space with a recorded
			reason.
		</p>
	</div>
</div>

<section class="core-panel">
	<div class="toolbar">
		<form action="/core/communities" method="GET" class="search-form">
			<Search size={15} />
			<input
				class="core-field"
				type="search"
				name="query"
				value={data.query}
				placeholder="Search name or slug"
				aria-label="Search communities"
			/>
			<button class="core-button" type="submit">Search</button>
		</form>
		<p>{data.items.length} spaces shown</p>
	</div>
	{#if actionError}<div class="inline-error" role="alert">{actionError}</div>{/if}
	<div class="reason-row">
		<label for="community-reason">Admin action reason</label>
		<input
			id="community-reason"
			class="core-field"
			bind:value={reason}
			maxlength="500"
			placeholder="Required to archive or restore (10+ characters)"
		/>
	</div>
	<div class="space-list">
		{#each data.items as community (community.id)}
			<article class="space-row">
				<span class="space-icon"><Building2 size={17} /></span>
				<div class="space-main">
					<div class="space-title">
						<h2>{community.name}</h2>
						<span class={`core-pill ${community.status}`}>{community.status}</span
						>{#if !community.isPublic}<span class="core-pill">private</span>{/if}
					</div>
					<p>{community.description || 'No description has been added.'}</p>
					<div class="space-meta">
						<span>/r/{community.slug}</span>
						<span>{community.memberCount.toLocaleString()} members</span>
						<span>{community.postCount.toLocaleString()} posts</span>
						<span>Created {new Date(community.createdAt).toLocaleDateString()}</span>
					</div>
				</div>
				<div class="space-owner">
					<small>CREATED BY</small><strong>{community.ownerDisplayName ?? 'Unavailable'}</strong
					><span>@{community.ownerUsername ?? 'deleted'}</span>
				</div>
				<div class="space-actions">
					{#if community.status === 'active'}
						<button
							class="core-button danger"
							disabled={busyId === community.id || reason.trim().length < 10}
							onclick={() => setCommunityStatus(community, 'archive')}>Archive</button
						>
					{:else}
						<button
							class="core-button secondary"
							disabled={busyId === community.id || reason.trim().length < 10}
							onclick={() => setCommunityStatus(community, 'restore')}
							><RotateCcw size={13} /> Restore</button
						>
					{/if}
					<a
						class="open-community"
						href={`/r/${community.slug}`}
						target="_blank"
						rel="noreferrer"
						aria-label={`Open ${community.name} in a new tab`}><ArrowUpRight size={15} /></a
					>
				</div>
			</article>
		{:else}
			<div class="empty-state">No communities matched that search.</div>
		{/each}
	</div>
	{#if data.nextCursor}
		<div class="pagination">
			<a
				class="core-button secondary"
				href={`/core/communities?${new URLSearchParams({ ...(data.query ? { query: data.query } : {}), cursor: data.nextCursor })}`}
				>Load next page</a
			>
		</div>
	{/if}
</section>

<p class="audit-note">
	Administrative archive and restore operations are reflected in the community moderation history
	and global Core audit log.
</p>

<style>
	.toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 14px;
		padding: 16px 18px;
		border-bottom: 1px solid var(--core-border);
	}
	.toolbar p {
		margin: 0;
		color: var(--core-muted);
		font-size: 9px;
	}
	.search-form {
		display: flex;
		width: min(100%, 450px);
		align-items: center;
		gap: 8px;
	}
	.search-form > :global(svg) {
		flex: 0 0 auto;
		color: var(--core-muted);
	}
	.search-form .core-field {
		flex: 1;
	}
	.reason-row {
		display: grid;
		grid-template-columns: 160px minmax(0, 1fr);
		align-items: center;
		gap: 12px;
		padding: 14px 18px;
		border-bottom: 1px solid var(--core-border);
	}
	.reason-row label {
		color: var(--core-muted);
		font-size: 10px;
	}
	.space-row {
		display: flex;
		align-items: center;
		gap: 14px;
		min-height: 105px;
		border-bottom: 1px solid var(--core-border);
		padding: 15px 18px;
	}
	.space-row:last-child {
		border-bottom: 0;
	}
	.space-icon {
		display: grid;
		width: 35px;
		height: 35px;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid var(--core-border);
		border-radius: 8px;
		color: #efb28d;
	}
	.space-main {
		min-width: 200px;
		flex: 1;
	}
	.space-title {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.space-title h2 {
		overflow: hidden;
		margin: 0;
		font-family: var(--font-display);
		font-size: 21px;
		font-weight: 400;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.space-main > p {
		overflow: hidden;
		margin: 5px 0 8px;
		color: var(--core-muted);
		font-size: 9px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.space-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 5px 12px;
		color: rgba(235, 235, 227, 0.4);
		font-size: 8px;
	}
	.space-owner {
		display: grid;
		min-width: 100px;
		gap: 4px;
	}
	.space-owner small {
		color: var(--core-muted);
		font-family: var(--font-anton);
		font-size: 7px;
		letter-spacing: 0.12em;
	}
	.space-owner strong {
		font-size: 9px;
		font-weight: 500;
	}
	.space-owner span {
		color: var(--core-muted);
		font-size: 8px;
	}
	.space-actions {
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.space-actions .core-button {
		min-height: 31px;
		padding-inline: 9px;
	}
	.open-community {
		display: grid;
		width: 30px;
		height: 30px;
		place-items: center;
		color: var(--core-muted);
	}
	.pagination {
		display: flex;
		justify-content: center;
		border-top: 1px solid var(--core-border);
		padding: 14px;
	}
	.empty-state {
		padding: 42px 18px;
		text-align: center;
		color: var(--core-muted);
		font-size: 11px;
	}
	.audit-note {
		margin-top: 13px;
		color: var(--core-muted);
		font-size: 9px;
	}
	.inline-error {
		margin: 12px 18px 0;
		border: 1px solid rgba(234, 104, 92, 0.25);
		border-radius: 6px;
		padding: 10px;
		color: #f0a29a;
		font-size: 10px;
	}
	@media (max-width: 900px) {
		.space-row {
			align-items: flex-start;
			flex-wrap: wrap;
		}
		.space-main {
			min-width: calc(100% - 60px);
		}
		.space-owner {
			margin-left: 49px;
		}
		.space-actions {
			margin-left: auto;
		}
	}
	@media (max-width: 700px) {
		.toolbar {
			align-items: flex-start;
			flex-direction: column;
		}
		.search-form {
			width: 100%;
		}
		.reason-row {
			grid-template-columns: 1fr;
			gap: 7px;
		}
		.space-row {
			gap: 10px;
			padding: 14px 12px;
		}
		.space-main {
			min-width: calc(100% - 48px);
		}
		.space-owner {
			margin-left: 45px;
		}
		.space-actions {
			width: 100%;
			justify-content: flex-end;
		}
	}
</style>
