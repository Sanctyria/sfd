<script lang="ts">
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { communityApi, type ApiPage } from '#lib/community/communityApi.js';
	import CommunityBottomNav from '#lib/community/components/CommunityBottomNav.svelte';
	import type { PageProps } from './$types';
	import type { ModerationAction, ModerationReport } from './+page.server';

	let { data }: PageProps = $props();
	type ReportStatus = ModerationReport['status'];
	const statuses: ReportStatus[] = ['open', 'reviewing', 'resolved', 'dismissed'];
	let activeView = $state<'reports' | 'history'>('reports');
	let status = $state<ReportStatus>('open');
	let reports = $state<ModerationReport[]>([]);
	let cursor = $state<string | null>(null);
	let loadedKey = '';
	let loading = $state(false);
	let selectedReport = $state<ModerationReport | null>(null);
	let decisionStatus = $state<'reviewing' | 'resolved' | 'dismissed'>('reviewing');
	let removeContent = $state(false);
	let decisionReason = $state('');
	let decisionError = $state('');
	let saving = $state(false);
	let loadError = $state('');
	let actions = $state<ModerationAction[]>([]);
	let actionsCursor = $state<string | null>(null);
	let actionsLoading = $state(false);
	let actionsLoaded = false;
	let actionsError = $state('');
	const pageKey = $derived(data.items.map((report) => report.id).join(':'));

	$effect(() => {
		if (pageKey === loadedKey) return;
		loadedKey = pageKey;
		if (status !== 'open') return;
		reports = [...data.items];
		cursor = data.nextCursor;
	});

	async function loadQueue(nextStatus = status, nextCursor: string | null = null) {
		loading = true;
		loadError = '';
		try {
			const query = new SvelteURLSearchParams({ status: nextStatus, limit: '25' });
			if (nextCursor) query.set('cursor', nextCursor);
			const page = await communityApi<ApiPage<ModerationReport>>(
				fetch,
				`moderation/reports?${query.toString()}`
			);
			status = nextStatus;
			reports = nextCursor ? [...reports, ...page.items] : page.items;
			cursor = page.nextCursor;
		} catch (error) {
			loadError = error instanceof Error ? error.message : 'Could not load moderation reports.';
		} finally {
			loading = false;
		}
	}

	async function loadAudit(nextCursor: string | null = null) {
		actionsLoading = true;
		actionsError = '';
		try {
			const query = new SvelteURLSearchParams({ limit: '25' });
			if (nextCursor) query.set('cursor', nextCursor);
			const page = await communityApi<ApiPage<ModerationAction>>(
				fetch,
				`moderation/actions?${query.toString()}`
			);
			actions = nextCursor ? [...actions, ...page.items] : page.items;
			actionsCursor = page.nextCursor;
			actionsLoaded = true;
		} catch (error) {
			actionsError = error instanceof Error ? error.message : 'Could not load audit history.';
		} finally {
			actionsLoading = false;
		}
	}

	async function openAuditHistory() {
		activeView = 'history';
		if (!actionsLoaded) await loadAudit();
	}

	function openDecision(
		report: ModerationReport,
		nextStatus: 'reviewing' | 'resolved' | 'dismissed',
		remove = false
	) {
		selectedReport = report;
		decisionStatus = nextStatus;
		removeContent = remove;
		decisionReason = '';
		decisionError = '';
	}

	async function submitDecision(event: SubmitEvent) {
		event.preventDefault();
		if (!selectedReport || decisionReason.trim().length < 10) {
			decisionError = 'Add at least 10 characters explaining this decision.';
			return;
		}
		saving = true;
		decisionError = '';
		try {
			await communityApi(fetch, `moderation/reports/${encodeURIComponent(selectedReport.id)}`, {
				method: 'PATCH',
				body: JSON.stringify({
					status: decisionStatus,
					reason: decisionReason.trim(),
					removeContent
				})
			});
			const reportId = selectedReport.id;
			selectedReport = null;
			if (status !== 'reviewing' || decisionStatus !== 'reviewing') {
				reports = reports.filter((report) => report.id !== reportId);
			}
			if (cursor && status !== 'reviewing') await loadQueue(status, cursor);
		} catch (error) {
			decisionError =
				error instanceof Error ? error.message : 'Could not save the moderation decision.';
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Moderation | Sanctyria Community</title>
	<meta name="description" content="Review reports for communities you moderate." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main
	class="mx-auto min-h-screen w-full max-w-5xl px-4 pt-8 pb-28 text-[#f1efe9] sm:px-8 md:pb-12 xl:px-12"
>
	<header class="border-b border-white/[0.08] pb-5">
		<p class="font-mono text-[9px] tracking-[0.15em] text-red-200/70 uppercase">Community safety</p>
		<h1 class="mt-1 font-display text-4xl text-white">Moderation</h1>
		<p class="mt-2 text-xs text-white/45">
			Review reports for communities where you are an owner or moderator.
		</p>
	</header>

	<nav class="flex gap-5 border-b border-white/[0.08]" aria-label="Moderation views">
		<button
			type="button"
			onclick={() => (activeView = 'reports')}
			aria-current={activeView === 'reports' ? 'page' : undefined}
			class={`border-b-2 py-3 text-xs transition-colors ${activeView === 'reports' ? 'border-orange-400 text-white' : 'border-transparent text-white/45 hover:text-white/80'}`}
			>Reports</button
		>
		<button
			type="button"
			onclick={openAuditHistory}
			aria-current={activeView === 'history' ? 'page' : undefined}
			class={`border-b-2 py-3 text-xs transition-colors ${activeView === 'history' ? 'border-orange-400 text-white' : 'border-transparent text-white/45 hover:text-white/80'}`}
			>Audit history</button
		>
	</nav>

	{#if activeView === 'reports'}
		<nav class="flex gap-5 border-b border-white/[0.08]" aria-label="Report status filter">
			{#each statuses as filter (filter)}
				<button
					type="button"
					onclick={() => loadQueue(filter)}
					aria-current={status === filter ? 'page' : undefined}
					class={`border-b-2 py-3 text-xs capitalize transition-colors ${status === filter ? 'border-orange-400 text-white' : 'border-transparent text-white/45 hover:text-white/80'}`}
					>{filter}</button
				>
			{/each}
		</nav>

		{#if reports.length}
			<ul class="divide-y divide-white/[0.08]">
				{#each reports as report (report.id)}
					<li class="py-5">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<p class="text-xs font-medium text-white/85">
								{report.targetType} report
								<span class="ml-1 text-[10px] font-normal text-white/40 capitalize"
									>{report.status}</span
								>
							</p>
							<time class="text-[10px] text-white/35"
								>{new Date(report.createdAt).toLocaleString()}</time
							>
						</div>
						<p class="mt-2 text-xs text-white/55">
							Submitted by <a
								href={`/u/${encodeURIComponent(report.reporterUsername)}`}
								class="text-white/75 hover:text-orange-100"
								>{report.reporterDisplayName} (@{report.reporterUsername})</a
							>
						</p>
						<blockquote
							class="mt-3 border-l-2 border-red-200/30 pl-3 text-xs leading-5 text-red-100/75"
						>
							{report.reason}
						</blockquote>
						<p class="mt-3 text-xs leading-5 whitespace-pre-wrap text-white/55">
							{report.targetBody ?? 'The reported content is no longer available.'}
						</p>
						<div class="mt-4 flex flex-wrap gap-2">
							{#if report.postId}<a
									href={`/p/${encodeURIComponent(report.postId)}`}
									class="border border-white/10 px-3 py-2 text-[10px] text-white/55 hover:text-white"
									>Open content</a
								>{/if}
							{#if status === 'open'}
								<button
									type="button"
									onclick={() => openDecision(report, 'reviewing')}
									class="border border-white/10 px-3 py-2 text-[10px] text-white/60 hover:border-orange-200/30 hover:text-orange-100"
									>Start review</button
								>
								<button
									type="button"
									onclick={() => openDecision(report, 'resolved')}
									class="border border-white/10 px-3 py-2 text-[10px] text-white/60 hover:border-emerald-200/30 hover:text-emerald-100"
									>Resolve</button
								>
								{#if report.targetBody}<button
										type="button"
										onclick={() => openDecision(report, 'resolved', true)}
										class="border border-red-200/15 px-3 py-2 text-[10px] text-red-100/70 hover:border-red-200/35 hover:text-red-100"
										>Remove content and resolve</button
									>{/if}
								<button
									type="button"
									onclick={() => openDecision(report, 'dismissed')}
									class="border border-white/10 px-3 py-2 text-[10px] text-white/60 hover:text-white"
									>Dismiss</button
								>
							{:else if status === 'reviewing'}
								<button
									type="button"
									onclick={() => openDecision(report, 'resolved')}
									class="border border-white/10 px-3 py-2 text-[10px] text-white/60 hover:border-emerald-200/30 hover:text-emerald-100"
									>Resolve</button
								>
								{#if report.targetBody}<button
										type="button"
										onclick={() => openDecision(report, 'resolved', true)}
										class="border border-red-200/15 px-3 py-2 text-[10px] text-red-100/70 hover:border-red-200/35 hover:text-red-100"
										>Remove content and resolve</button
									>{/if}
								<button
									type="button"
									onclick={() => openDecision(report, 'dismissed')}
									class="border border-white/10 px-3 py-2 text-[10px] text-white/60 hover:text-white"
									>Dismiss</button
								>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		{:else if !loading}
			<div class="py-16 text-center">
				<h2 class="font-display text-2xl text-white">No {status} reports</h2>
				<p class="mt-2 text-xs text-white/45">Reports for your communities will appear here.</p>
			</div>
		{/if}
		{#if loadError}<p role="alert" class="border-t border-red-300/15 py-4 text-xs text-red-200">
				{loadError}
			</p>{/if}
		{#if cursor}<div class="border-t border-white/[0.08] py-5 text-center">
				<button
					type="button"
					onclick={() => loadQueue(status, cursor)}
					disabled={loading}
					class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
					>{loading ? 'Loading...' : 'Load more reports'}</button
				>
			</div>{/if}
	{:else}
		{#if actions.length}
			<ul class="divide-y divide-white/[0.08]">
				{#each actions as action (action.id)}
					<li class="py-5">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<p class="text-xs font-medium text-white/85">
								<span class="capitalize">{action.action.replaceAll('_', ' ')}</span><span
									class="ml-2 text-[10px] font-normal text-white/40">{action.targetType}</span
								>
							</p>
							<time class="text-[10px] text-white/35"
								>{new Date(action.createdAt).toLocaleString()}</time
							>
						</div>
						<p class="mt-1 text-[10px] text-white/45">
							{action.communityName} ·
							<a
								href={`/u/${encodeURIComponent(action.actorUsername)}`}
								class="text-white/65 hover:text-orange-100"
								>{action.actorDisplayName} (@{action.actorUsername})</a
							>
						</p>
						<p class="mt-3 text-xs leading-5 text-white/65">{action.reason}</p>
						<p class="mt-2 font-mono text-[9px] text-white/30">Target ID: {action.targetId}</p>
					</li>
				{/each}
			</ul>
		{:else if !actionsLoading}
			<div class="py-16 text-center">
				<h2 class="font-display text-2xl text-white">No audit actions yet</h2>
				<p class="mt-2 text-xs text-white/45">Actions in your communities will be recorded here.</p>
			</div>
		{/if}
		{#if actionsError}<p role="alert" class="border-t border-red-300/15 py-4 text-xs text-red-200">
				{actionsError}
			</p>{/if}
		{#if actionsCursor}<div class="border-t border-white/[0.08] py-5 text-center">
				<button
					type="button"
					onclick={() => loadAudit(actionsCursor)}
					disabled={actionsLoading}
					class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
					>{actionsLoading ? 'Loading...' : 'Load more history'}</button
				>
			</div>{/if}
	{/if}
</main>

{#if selectedReport}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
		<dialog
			open
			aria-labelledby="moderation-decision-heading"
			class="m-0 w-full max-w-lg border border-white/10 bg-[#111211] p-5 text-white shadow-2xl sm:p-6"
		>
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="font-mono text-[9px] tracking-[0.12em] text-red-200/70 uppercase">
						Audit note required
					</p>
					<h2 id="moderation-decision-heading" class="mt-1 font-display text-2xl capitalize">
						{decisionStatus} report
					</h2>
				</div>
				<button
					type="button"
					onclick={() => (selectedReport = null)}
					aria-label="Close decision form"
					class="flex h-9 w-9 items-center justify-center text-white/60 hover:bg-white/5 hover:text-white"
					>×</button
				>
			</div>
			<form onsubmit={submitDecision} class="mt-5 space-y-4">
				{#if removeContent}<p
						class="border border-red-200/15 bg-red-200/[0.04] px-3 py-2.5 text-xs leading-5 text-red-100/75"
					>
						The reported {selectedReport.targetType} will be soft-deleted from public views, and this
						decision will be recorded.
					</p>{/if}
				<label class="block text-xs text-white/65"
					>Reason for decision<textarea
						bind:value={decisionReason}
						minlength="10"
						maxlength="500"
						rows="4"
						required
						class="mt-1.5 w-full resize-y border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-5 text-white outline-none focus:border-orange-200/40"
					></textarea></label
				>
				{#if decisionError}<p role="alert" class="text-xs text-red-200">{decisionError}</p>{/if}
				<div class="flex justify-end gap-2 border-t border-white/[0.08] pt-4">
					<button
						type="button"
						onclick={() => (selectedReport = null)}
						class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:text-white"
						>Cancel</button
					>
					<button
						type="submit"
						disabled={saving}
						class="bg-orange-200 px-4 py-2 text-xs font-semibold text-[#21160e] hover:bg-orange-100 disabled:opacity-50"
						>{saving ? 'Saving...' : 'Save decision'}</button
					>
				</div>
			</form>
		</dialog>
	</div>
{/if}

<CommunityBottomNav
	activeItem="Home"
	profileHref={data.communityUser ? `/u/${data.communityUser.username}` : '/login'}
	user={data.communityUser}
/>
