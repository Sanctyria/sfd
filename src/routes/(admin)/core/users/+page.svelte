<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Search, ShieldAlert } from '@lucide/svelte';
	import { coreApi } from '#lib/core/coreApi.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let reason = $state('');
	let busyId = $state('');
	let actionError = $state('');

	async function updateUser(
		user: (typeof data.items)[number],
		action: 'suspend' | 'reactivate' | 'delete'
	) {
		actionError = '';
		if (reason.trim().length < 10) {
			actionError = 'Add a reason of at least 10 characters before making an account change.';
			return;
		}
		const message =
			action === 'delete'
				? `Permanently delete ${user.displayName}? Their identity and credentials will be erased, authored content will no longer appear in active-user public views, and owned communities will be transferred or archived. This cannot be undone.`
				: `${action === 'suspend' ? 'Suspend' : 'Reactivate'} ${user.displayName}?`;
		if (!window.confirm(message)) return;
		busyId = user.id;
		try {
			await coreApi(fetch, `users/${user.id}`, {
				method: 'PATCH',
				body: JSON.stringify({ action, reason: reason.trim() })
			});
			reason = '';
			await invalidateAll();
		} catch (cause) {
			actionError = cause instanceof Error ? cause.message : 'The account update failed.';
		} finally {
			busyId = '';
		}
	}
</script>

<svelte:head><title>Users | Sanctyria Core</title></svelte:head>

<div class="core-page-heading">
	<div>
		<span class="core-eyebrow">COMMUNITY / PEOPLE</span>
		<h1>Users</h1>
		<p>
			Review account status and community participation. Sensitive account changes are audited and
			revoke active sessions.
		</p>
	</div>
</div>

<section class="core-panel">
	<div class="directory-tools">
		<form action="/core/users" method="GET" class="search-form">
			<Search size={15} />
			<input
				class="core-field"
				type="search"
				name="query"
				value={data.query}
				placeholder="Find by name or username"
				aria-label="Search users"
			/>
			<button class="core-button" type="submit">Search</button>
		</form>
		<p>{data.items.length} accounts shown · usernames and profile fields only</p>
	</div>
	{#if actionError}<div class="inline-error" role="alert">{actionError}</div>{/if}
	<div class="reason-row">
		<label for="action-reason">Admin action reason</label>
		<input
			id="action-reason"
			class="core-field"
			bind:value={reason}
			maxlength="500"
			placeholder="Required for suspend, restore, and delete (10+ characters)"
		/>
	</div>
	<div class="table-scroll">
		<table>
			<thead
				><tr
					><th>Member</th><th>Joined</th><th>Communities</th><th>Ember</th><th>Status</th><th
						><span class="sr-only">Actions</span></th
					></tr
				></thead
			>
			<tbody>
				{#each data.items as user (user.id)}
					<tr>
						<td>
							<div class="member-cell">
								<span class="member-fallback">{user.displayName.slice(0, 1).toUpperCase()}</span>
								<span><strong>{user.displayName}</strong><small>@{user.username}</small></span>
							</div>
						</td>
						<td class="secondary-cell">{new Date(user.createdAt).toLocaleDateString()}</td>
						<td class="secondary-cell">{user.communityCount}</td>
						<td class="secondary-cell">{user.ember.toLocaleString()}</td>
						<td><span class={`core-pill ${user.status}`}>{user.status}</span></td>
						<td class="actions-cell">
							{#if user.status === 'active'}
								<button
									class="text-button"
									disabled={busyId === user.id || reason.trim().length < 10}
									onclick={() => updateUser(user, 'suspend')}>Suspend</button
								>
								<button
									class="text-button danger-text"
									disabled={!data.canDeleteUsers || busyId === user.id || reason.trim().length < 10}
									title={data.canDeleteUsers
										? 'Permanently delete user'
										: 'Super administrator access required'}
									onclick={() => updateUser(user, 'delete')}
									><ShieldAlert size={13} /> Delete</button
								>
							{:else if user.status === 'suspended'}
								<button
									class="text-button"
									disabled={busyId === user.id || reason.trim().length < 10}
									onclick={() => updateUser(user, 'reactivate')}>Reactivate</button
								>
								<button
									class="text-button danger-text"
									disabled={!data.canDeleteUsers || busyId === user.id || reason.trim().length < 10}
									title={data.canDeleteUsers
										? 'Permanently delete user'
										: 'Super administrator access required'}
									onclick={() => updateUser(user, 'delete')}
									><ShieldAlert size={13} /> Delete</button
								>
							{:else}
								<span class="muted-action">Anonymized</span>
							{/if}
						</td>
					</tr>
				{:else}
					<tr
						><td colspan="6" class="empty-cell">No matching accounts. Try a different search.</td
						></tr
					>
				{/each}
			</tbody>
		</table>
	</div>
	{#if data.nextCursor}
		<div class="pagination">
			<a
				class="core-button secondary"
				href={`/core/users?${new URLSearchParams({ ...(data.query ? { query: data.query } : {}), cursor: data.nextCursor })}`}
				>Load next page</a
			>
		</div>
	{/if}
</section>

<div class="privacy-note">
	<ShieldAlert size={15} /><span
		>Deletion is irreversible. Profile identity, credentials, sessions, and personal relationships
		are erased. Authored content and moderation references remain in tombstone-preserving records;
		public views that require an active account stop showing that content.</span
	>
</div>

<style>
	.directory-tools {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 16px 18px;
		border-bottom: 1px solid var(--core-border);
	}
	.directory-tools p {
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
	.table-scroll {
		overflow-x: auto;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}
	th {
		height: 39px;
		padding: 0 14px;
		color: var(--core-muted);
		font-family: var(--font-anton);
		font-size: 8px;
		font-weight: 400;
		letter-spacing: 0.13em;
		text-transform: uppercase;
	}
	td {
		height: 61px;
		border-top: 1px solid var(--core-border);
		padding: 9px 14px;
		font-size: 10px;
	}
	tbody tr:hover {
		background: rgba(255, 255, 255, 0.015);
	}
	.member-cell {
		display: flex;
		min-width: 180px;
		align-items: center;
		gap: 10px;
	}
	.member-fallback {
		display: grid;
		width: 32px;
		height: 32px;
		flex: 0 0 auto;
		place-items: center;
		overflow: hidden;
		border-radius: 50%;
		object-fit: cover;
		background: rgba(240, 161, 108, 0.1);
		color: #f0b28c;
	}
	.member-cell strong,
	.member-cell small {
		display: block;
	}
	.member-cell strong {
		font-weight: 500;
	}
	.member-cell small {
		margin-top: 4px;
		color: var(--core-muted);
	}
	.secondary-cell {
		color: var(--core-muted);
		white-space: nowrap;
	}
	.actions-cell {
		white-space: nowrap;
	}
	.text-button {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		border: 0;
		padding: 5px;
		background: transparent;
		color: #efb28d;
		font-size: 9px;
		cursor: pointer;
	}
	.text-button:disabled {
		cursor: not-allowed;
		opacity: 0.35;
	}
	.danger-text {
		margin-left: 8px;
		color: #e5a29a;
	}
	.muted-action {
		color: var(--core-muted);
		font-size: 9px;
	}
	.empty-cell {
		text-align: center;
		color: var(--core-muted);
	}
	.pagination {
		display: flex;
		justify-content: center;
		border-top: 1px solid var(--core-border);
		padding: 14px;
	}
	.privacy-note {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		margin-top: 14px;
		color: var(--core-muted);
		font-size: 9px;
		line-height: 1.6;
	}
	.privacy-note :global(svg) {
		flex: 0 0 auto;
		color: #e8a19a;
	}
	.inline-error {
		margin: 12px 18px 0;
		border: 1px solid rgba(234, 104, 92, 0.25);
		border-radius: 6px;
		padding: 10px;
		color: #f0a29a;
		font-size: 10px;
	}
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
	}
	@media (max-width: 700px) {
		.directory-tools {
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
		th,
		td {
			padding-inline: 10px;
		}
		.member-cell {
			min-width: 150px;
		}
		.actions-cell {
			min-width: 135px;
		}
	}
</style>
