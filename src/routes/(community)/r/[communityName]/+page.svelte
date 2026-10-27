<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		ArrowUpRight,
		BadgeCheck,
		Flame,
		Globe,
		MessageCircle,
		Pencil,
		Plus,
		X
	} from '@lucide/svelte';
	import { communitySlug, videoEmbedUrl } from '#lib/community/community.js';
	import {
		communityApi,
		type ApiCommunityMember,
		type ApiPage
	} from '#lib/community/communityApi.js';
	import CommunityBottomNav from '#lib/community/components/CommunityBottomNav.svelte';
	import CommunityFollowButton from '#lib/community/components/CommunityFollowButton.svelte';
	import CommunityLinkPreview from '#lib/community/components/CommunityLinkPreview.svelte';
	import { subscribeCommunityRealtime } from '#lib/community/communityRealtime.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let activeSection = $state('Posts');
	let toast = $state('');
	let editOpen = $state(false);
	let editName = $state('');
	let editDescription = $state('');
	let editAvatarUrl = $state('');
	let editBannerUrl = $state('');
	let editWebsiteUrl = $state('');
	let editError = $state('');
	let editLoading = $state(false);
	let ownerTransferUsername = $state('');
	let ownerTransferError = $state('');
	let ownerTransferLoading = $state(false);
	let communityDeleteError = $state('');
	let communityDeleteLoading = $state(false);
	let additionalMembers = $state<ApiCommunityMember[]>([]);
	let membersCursor = $state<string | null>(null);
	let membersLoading = $state(false);
	let roleSavingUsername = $state<string | null>(null);
	let roleError = $state('');
	let memberActionUsername = $state<string | null>(null);
	let memberRoleOverrides = $state<Record<string, 'member' | 'moderator' | 'owner'>>({});
	let loadedMembersKey = '';
	const allMembers = $derived([...data.members, ...additionalMembers]);
	const isCommunityOwner = $derived(
		data.community.isOwner || data.community.viewerRole === 'owner'
	);
	const canModerateMembers = $derived(
		isCommunityOwner || data.community.viewerRole === 'moderator'
	);
	let joined = $derived(
		Boolean(
			data.communityUser?.communities.some((community) => community.slug === data.community.slug)
		)
	);
	const sections = ['Posts', 'About', 'Members'];

	$effect(() => {
		const membersKey = data.members.map((member) => member.id).join(':');
		if (membersKey === loadedMembersKey) return;
		loadedMembersKey = membersKey;
		additionalMembers = [];
		membersCursor = data.membersCursor;
	});

	onMount(() =>
		subscribeCommunityRealtime(() => {
			void invalidate('app:community-content');
		})
	);

	async function toggleJoin() {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent(`/r/${data.community.slug}`)}`);
			return;
		}
		try {
			await communityApi<void>(
				fetch,
				`communities/${encodeURIComponent(data.community.slug)}/membership`,
				{ method: joined ? 'DELETE' : 'POST' }
			);
			await invalidate('app:community-content');
		} catch (error) {
			toast = error instanceof Error ? error.message : 'Could not update membership.';
			window.setTimeout(() => (toast = ''), 2200);
		}
	}

	function openComposer() {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent(`/r/${data.community.slug}`)}`);
			return;
		}
		void goto(
			`/home?feed=community&compose=1&community=${encodeURIComponent(data.community.slug)}`
		);
	}

	function openEditor() {
		editName = data.community.name;
		editDescription = data.community.description;
		editAvatarUrl = data.community.avatarUrl ?? '';
		editBannerUrl = data.community.bannerUrl ?? '';
		editWebsiteUrl = data.community.websiteUrl ?? '';
		editError = '';
		editOpen = true;
	}

	async function saveCommunity(event: SubmitEvent) {
		event.preventDefault();
		editError = '';
		editLoading = true;
		try {
			const previousSlug = data.community.slug;
			const result = await communityApi<{ community: { slug: string } }>(
				fetch,
				`communities/${encodeURIComponent(data.community.slug)}`,
				{
					method: 'PATCH',
					body: JSON.stringify({
						name: editName,
						description: editDescription,
						avatarUrl: editAvatarUrl.trim() || null,
						bannerUrl: editBannerUrl.trim() || null,
						websiteUrl: editWebsiteUrl.trim() || null
					})
				}
			);
			editOpen = false;
			await invalidate('app:community-content');
			if (result.community.slug !== previousSlug) {
				await goto(`/r/${encodeURIComponent(result.community.slug)}`);
			}
		} catch (error) {
			editError = error instanceof Error ? error.message : 'Could not update this community.';
		} finally {
			editLoading = false;
		}
	}

	async function transferOwnership(event: SubmitEvent) {
		event.preventDefault();
		ownerTransferError = '';
		if (
			!window.confirm(`Transfer ownership of ${data.community.name} to @${ownerTransferUsername}?`)
		) {
			return;
		}
		ownerTransferLoading = true;
		try {
			await communityApi(fetch, `communities/${encodeURIComponent(data.community.slug)}/owner`, {
				method: 'POST',
				body: JSON.stringify({ username: ownerTransferUsername.trim().toLowerCase() })
			});
			ownerTransferUsername = '';
			editOpen = false;
			await invalidate('app:community-content');
			toast = 'Community ownership transferred.';
			window.setTimeout(() => (toast = ''), 2200);
		} catch (error) {
			ownerTransferError = error instanceof Error ? error.message : 'Could not transfer ownership.';
		} finally {
			ownerTransferLoading = false;
		}
	}

	async function deleteCommunity() {
		if (
			!window.confirm(
				`Delete ${data.community.name}? It will be archived, hidden from public pages, and its posts and audit history will be retained.`
			)
		) {
			return;
		}
		communityDeleteError = '';
		communityDeleteLoading = true;
		try {
			await communityApi(fetch, `communities/${encodeURIComponent(data.community.slug)}`, {
				method: 'DELETE'
			});
			await goto('/home');
		} catch (error) {
			communityDeleteError =
				error instanceof Error ? error.message : 'Could not delete this community.';
		} finally {
			communityDeleteLoading = false;
		}
	}

	async function loadMoreMembers() {
		if (!membersCursor || membersLoading) return;
		membersLoading = true;
		try {
			const page = await communityApi<ApiPage<ApiCommunityMember>>(
				fetch,
				`communities/${encodeURIComponent(data.community.slug)}/members?limit=50&cursor=${encodeURIComponent(membersCursor)}`
			);
			additionalMembers = [...additionalMembers, ...page.items];
			membersCursor = page.nextCursor;
		} catch (error) {
			toast = error instanceof Error ? error.message : 'Could not load community members.';
			window.setTimeout(() => (toast = ''), 2200);
		} finally {
			membersLoading = false;
		}
	}

	async function toggleModeratorRole(member: ApiCommunityMember) {
		const viewerIsOwner = data.community.viewerRole === 'owner' || data.community.isOwner;
		if (!viewerIsOwner || member.role === 'owner' || roleSavingUsername) return;
		const currentRole = memberRoleOverrides[member.id] ?? member.role ?? 'member';
		const nextRole = currentRole === 'moderator' ? 'member' : 'moderator';
		roleSavingUsername = member.username;
		roleError = '';
		try {
			const result = await communityApi<{
				member: { username: string; role: 'member' | 'moderator' };
			}>(
				fetch,
				`communities/${encodeURIComponent(data.community.slug)}/members/${encodeURIComponent(member.username)}/role`,
				{ method: 'PATCH', body: JSON.stringify({ role: nextRole }) }
			);
			memberRoleOverrides = { ...memberRoleOverrides, [member.id]: result.member.role };
			await invalidate('app:community-content');
		} catch (error) {
			roleError = error instanceof Error ? error.message : 'Could not update this member role.';
		} finally {
			roleSavingUsername = null;
		}
	}

	async function moderateMember(
		member: ApiCommunityMember,
		action: 'warn' | 'mute' | 'unmute' | 'remove'
	) {
		if (!canModerateMembers || memberActionUsername) return;
		const actionLabel = {
			warn: 'warning',
			mute: 'muting',
			unmute: 'lifting the mute for',
			remove: 'removing'
		}[action];
		const reason = window.prompt(
			`Enter a reason for ${actionLabel} @${member.username} (at least 10 characters):`
		);
		if (reason === null) return;
		if (reason.trim().length < 10) {
			toast = 'Please provide a reason with at least 10 characters.';
			window.setTimeout(() => (toast = ''), 2200);
			return;
		}
		if (
			action === 'remove' &&
			!window.confirm(`Remove @${member.username} from ${data.community.name}?`)
		) {
			return;
		}
		memberActionUsername = member.username;
		roleError = '';
		try {
			await communityApi(
				fetch,
				`communities/${encodeURIComponent(data.community.slug)}/members/${encodeURIComponent(member.username)}/actions`,
				{ method: 'POST', body: JSON.stringify({ action, reason: reason.trim() }) }
			);
			await invalidate('app:community-content');
			toast =
				action === 'warn'
					? 'Member warned.'
					: action === 'remove'
						? 'Member removed.'
						: action === 'mute'
							? 'Member muted.'
							: 'Member mute lifted.';
			window.setTimeout(() => (toast = ''), 2200);
		} catch (error) {
			roleError = error instanceof Error ? error.message : 'Could not moderate this member.';
		} finally {
			memberActionUsername = null;
		}
	}
</script>

<svelte:head>
	<title>{data.community.name} | Sanctyria Community</title>
	<meta name="description" content={data.community.description} />
	<link rel="canonical" href={`https://sanctyria.com/r/${data.community.slug}`} />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={`https://sanctyria.com/r/${data.community.slug}`} />
	<meta property="og:title" content={`${data.community.name} | Sanctyria Community`} />
	<meta property="og:description" content={data.community.description} />
	<meta
		property="og:image"
		content={`https://sanctyria.com/api/og/community/${encodeURIComponent(data.community.slug)}?v=${encodeURIComponent(data.community.updatedAt ?? '')}`}
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${data.community.name} | Sanctyria Community`} />
	<meta name="twitter:description" content={data.community.description} />
	<meta
		name="twitter:image"
		content={`https://sanctyria.com/api/og/community/${encodeURIComponent(data.community.slug)}?v=${encodeURIComponent(data.community.updatedAt ?? '')}`}
	/>
</svelte:head>

<div class="community-detail min-h-screen bg-[#090a0a] text-[#f1efe9]">
	<main class="mx-auto w-full max-w-5xl px-4 pb-28 sm:px-8 md:pb-12 xl:px-12">
		<section class="mt-5 border-b border-white/[0.08] pb-5" aria-labelledby="community-name">
			<div class="relative h-24 overflow-hidden border border-white/[0.06] sm:h-36">
				{#if data.community.bannerUrl}<img
						src={data.community.bannerUrl}
						alt=""
						class="absolute inset-0 h-full w-full object-cover"
					/>{/if}
				<div
					class="absolute inset-0"
					style={`background:linear-gradient(115deg,${data.community.color}55,rgba(9,10,10,.35) 58%,rgba(132,165,189,.22))`}
				></div>
			</div>
			<div class="flex flex-wrap items-start justify-between gap-4 px-2 pt-4">
				<div class="flex min-w-0 items-start gap-3">
					<span
						class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-[#111211]"
						style={`color:${data.community.color};background:${data.community.color}12`}
					>
						{#if data.community.avatarUrl}<img
								src={data.community.avatarUrl}
								alt=""
								class="h-full w-full object-cover"
							/>{:else}<Flame size={19} />{/if}
					</span>
					<div class="min-w-0">
						<h1 id="community-name" class="font-display text-3xl leading-none sm:text-4xl">
							{data.community.name}
						</h1>
						<p class="mt-2 text-xs text-white/40">
							{data.community.members} members · Public community{#if data.community.viewerRole}
								· Your role: {data.community.viewerRole}{/if}
						</p>
					</div>
				</div>
				{#if !isCommunityOwner}
					<button
						type="button"
						onclick={toggleJoin}
						aria-pressed={joined}
						class="min-w-[88px] border border-white/15 px-4 py-2 text-xs font-medium text-white transition-colors hover:border-orange-200/40 hover:text-orange-100"
						>{joined ? 'Joined' : 'Join'}</button
					>
				{/if}
				{#if isCommunityOwner}
					<button
						type="button"
						onclick={openEditor}
						aria-label="Edit community details"
						class="flex h-9 w-9 items-center justify-center border border-white/15 text-white/70 hover:border-orange-200/40 hover:text-orange-100"
						><Pencil size={15} /></button
					>
				{/if}
			</div>
			<p class="mt-4 max-w-2xl px-2 text-sm leading-6 text-white/65">
				{data.community.description}
			</p>
			<div class="mt-5 flex items-center justify-between gap-3 px-2">
				<nav aria-label="Community sections" class="flex gap-5">
					{#each sections as section (section)}<button
							type="button"
							onclick={() => (activeSection = section)}
							aria-current={activeSection === section ? 'page' : undefined}
							class={`border-b-2 pb-2 text-xs transition-colors ${activeSection === section ? 'border-orange-400 text-white' : 'border-transparent text-white/45 hover:text-white'}`}
							>{section}</button
						>{/each}
				</nav>
				<button
					type="button"
					onclick={openComposer}
					class="inline-flex items-center gap-1.5 pb-2 text-[10px] text-orange-200/75 hover:text-orange-100"
					><Plus size={13} /> Create Post</button
				>
			</div>
		</section>

		{#if activeSection === 'Posts'}
			<section
				aria-label={`Public posts in ${data.community.name}`}
				class="divide-y divide-white/[0.08]"
			>
				{#each data.posts as post (post.id)}
					<article class="py-5">
						<div class="flex items-start gap-3">
							<a
								href={`/u/${encodeURIComponent(post.handle.slice(1))}`}
								class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 font-display text-sm text-white"
								style={post.avatarUrl ? undefined : `background:${post.avatarColor}`}
								aria-label={`View ${post.name}'s profile`}
							>
								{#if post.avatarUrl}<img
										src={post.avatarUrl}
										alt=""
										class="h-full w-full object-cover"
									/>{:else}{post.initials}{/if}
							</a>
							<div class="min-w-0 flex-1">
								<div class="flex flex-wrap items-center gap-1.5 text-[11px]">
									<a
										href={`/u/${encodeURIComponent(post.handle.slice(1))}`}
										class="font-medium text-white/90 hover:text-orange-100">{post.name}</a
									>{#if post.verified}<BadgeCheck
											size={13}
											class="text-sky-300"
											aria-label="Verified"
										/>{/if}
									<CommunityFollowButton
										authorUsername={post.handle.slice(1)}
										viewerUsername={data.communityUser?.username}
										initialFollowing={post.isFollowingAuthor}
									/><a
										href={`/u/${encodeURIComponent(post.handle.slice(1))}`}
										class="text-white/35 hover:text-white/70">{post.handle}</a
									><span class="text-white/25">·</span><time class="text-white/35"
										>{post.postedAt}</time
									>
								</div>
								<a
									href={`/p/${encodeURIComponent(post.id)}`}
									class="mt-3 block text-[13px] leading-[1.7] text-white/80 hover:text-white"
									>{post.text}</a
								>
								{#if post.kind === 'link' && post.url}
									<CommunityLinkPreview
										url={post.url}
										title={post.linkTitle}
										description={post.linkDescription}
										domain={post.linkDomain}
									/>
								{/if}
								{#if post.kind === 'image' && post.url}<a
										href={post.url}
										target="_blank"
										rel="noopener noreferrer"
										class="mt-3 block overflow-hidden border border-white/[0.08]"
										><img
											src={post.url}
											alt={post.text}
											loading="lazy"
											class="max-h-[420px] w-full object-cover"
										/></a
									>{/if}
								{#if post.kind === 'video' && post.url}
									{@const embedUrl = videoEmbedUrl(post.url)}
									{#if embedUrl}
										<div
											class="community-video mt-3 overflow-hidden border border-white/[0.08] bg-black"
										>
											<iframe
												src={embedUrl}
												title={`Video shared by ${post.name}`}
												loading="lazy"
												referrerpolicy="strict-origin-when-cross-origin"
												allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
												allowfullscreen
												class="aspect-video w-full"
											></iframe>
										</div>
									{:else}
										<a
											href={post.url}
											target="_blank"
											rel="noopener noreferrer"
											class="mt-3 inline-flex items-center gap-2 border border-white/[0.08] px-3 py-2 text-xs text-white/65 hover:text-orange-100"
											><Globe size={14} /> Open video link <ArrowUpRight size={13} /></a
										>
									{/if}
								{/if}
								<div class="mt-3 flex items-center gap-4 text-[10px] text-white/40">
									<span class="inline-flex items-center gap-1"><Flame size={13} />{post.votes}</span
									><span class="inline-flex items-center gap-1"
										><MessageCircle size={13} />{post.replyCount ?? post.replies.length} replies</span
									>
								</div>
							</div>
						</div>
					</article>
				{/each}
				{#if !data.posts.length}<p class="py-12 text-center text-sm text-white/45">
						No posts here yet. Check back soon.
					</p>{/if}
			</section>
		{:else if activeSection === 'About'}
			<section class="max-w-2xl py-8">
				<p class="text-sm leading-7 text-white/65">{data.community.description}</p>
				{#if data.community.websiteUrl}
					<a
						href={data.community.websiteUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="mt-5 inline-flex items-center gap-2 text-xs text-orange-200 transition-colors hover:text-orange-100"
					>
						<Globe size={14} />{data.community.websiteUrl}<ArrowUpRight size={13} />
					</a>
				{/if}
				<p class="mt-5 text-xs text-white/40">
					This is a public circle for shared work, thoughtful questions, and useful references.
				</p>
			</section>
		{:else}
			<section class="py-5" aria-labelledby="members-heading">
				<header class="mb-4 border-b border-white/[0.08] pb-4">
					<h2 id="members-heading" class="font-display text-2xl">
						Members <span class="font-body text-xs text-white/40">{data.community.memberCount}</span
						>
					</h2>
					<p class="mt-1 text-xs text-white/45">People who are part of {data.community.name}.</p>
				</header>
				{#if allMembers.length}
					{#if roleError}<p
							role="alert"
							class="mb-3 border border-red-300/15 px-3 py-2 text-xs text-red-200"
						>
							{roleError}
						</p>{/if}
					<ul class="divide-y divide-white/[0.07]">
						{#each allMembers as member (member.id)}
							<li>
								<div class="flex items-center gap-3 py-3">
									<a
										href={`/u/${encodeURIComponent(member.username)}`}
										class="flex min-w-0 flex-1 items-center gap-3 hover:bg-white/[0.025]"
									>
										<span
											class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 text-xs text-white"
											style={member.avatarUrl
												? undefined
												: `background:${member.avatarColor ?? '#66744b'}`}
										>
											{#if member.avatarUrl}<img
													src={member.avatarUrl}
													alt=""
													class="h-full w-full object-cover"
												/>{:else}{member.initials ??
													member.displayName.slice(0, 1).toUpperCase()}{/if}
										</span>
										<span class="min-w-0 flex-1"
											><span class="block truncate text-xs font-medium text-white/85"
												>{member.displayName}{#if member.verified}<BadgeCheck
														size={12}
														class="ml-1 inline text-sky-300"
														aria-label="Verified"
													/>{/if}</span
											><span class="mt-0.5 block truncate text-[10px] text-white/40"
												>@{member.username}</span
											></span
										>
										<ArrowUpRight size={14} class="text-white/30" />
									</a>
									{#if data.community.viewerRole === 'owner' || data.community.viewerRole === 'moderator' || data.community.isOwner}
										<span class="hidden text-[9px] text-white/35 capitalize sm:inline"
											>{memberRoleOverrides[member.id] ?? member.role ?? 'member'}</span
										>
										{#if (data.community.viewerRole === 'owner' || data.community.isOwner) && member.role !== 'owner'}
											<button
												type="button"
												onclick={() => toggleModeratorRole(member)}
												disabled={roleSavingUsername !== null}
												class="border border-white/10 px-2 py-1.5 text-[9px] text-white/55 hover:border-orange-200/30 hover:text-orange-100 disabled:opacity-50"
											>
												{roleSavingUsername === member.username
													? 'Saving...'
													: (memberRoleOverrides[member.id] ?? member.role) === 'moderator'
														? 'Remove moderator'
														: 'Make moderator'}
											</button>
										{/if}
										{#if member.username !== data.communityUser?.username && member.role !== 'owner' && (member.role !== 'moderator' || isCommunityOwner)}
											<button
												type="button"
												onclick={() => moderateMember(member, 'warn')}
												disabled={memberActionUsername !== null}
												class="border border-white/10 px-2 py-1.5 text-[9px] text-white/55 hover:border-orange-200/30 hover:text-orange-100 disabled:opacity-50"
											>
												{memberActionUsername === member.username ? 'Saving...' : 'Warn'}
											</button>
											<button
												type="button"
												onclick={() => moderateMember(member, 'remove')}
												disabled={memberActionUsername !== null}
												class="border border-red-300/15 px-2 py-1.5 text-[9px] text-red-200/65 hover:border-red-300/35 hover:text-red-100 disabled:opacity-50"
											>
												Remove
											</button>
											<button
												type="button"
												onclick={() => moderateMember(member, member.isMuted ? 'unmute' : 'mute')}
												disabled={memberActionUsername !== null}
												class="border border-white/10 px-2 py-1.5 text-[9px] text-white/55 hover:border-orange-200/30 hover:text-orange-100 disabled:opacity-50"
											>
												{member.isMuted ? 'Unmute' : 'Mute'}
											</button>
										{/if}
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="py-12 text-center text-sm text-white/45">No members yet.</p>
				{/if}
				{#if membersCursor}<div class="border-t border-white/[0.08] py-5 text-center">
						<button
							type="button"
							onclick={loadMoreMembers}
							disabled={membersLoading}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
							>{membersLoading ? 'Loading...' : 'Load more members'}</button
						>
					</div>{/if}
			</section>
		{/if}
	</main>
	{#if editOpen}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
			<dialog
				open
				aria-labelledby="edit-community-heading"
				class="fixed inset-0 m-auto max-h-[min(88vh,760px)] w-full max-w-lg overflow-y-auto border border-white/10 bg-[#111211] p-5 text-white shadow-2xl sm:p-6"
			>
				<div class="flex items-center justify-between gap-4">
					<div>
						<p class="font-mono text-[9px] tracking-[0.12em] text-orange-200/70 uppercase">
							Community settings
						</p>
						<h2 id="edit-community-heading" class="mt-1 font-display text-2xl">Edit community</h2>
					</div>
					<button
						type="button"
						onclick={() => (editOpen = false)}
						aria-label="Close community editor"
						class="flex h-9 w-9 items-center justify-center text-white/60 hover:bg-white/5 hover:text-white"
						><X size={17} /></button
					>
				</div>
				<form onsubmit={saveCommunity} class="mt-5 space-y-4">
					<label class="block text-xs text-white/65"
						>Community name<input
							bind:value={editName}
							minlength="3"
							maxlength="60"
							required
							class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-200/40"
						/></label
					>
					<p class="-mt-2 text-[10px] text-white/35">
						Community URL: /r/{communitySlug(editName) || data.community.slug} (updates when the name
						changes)
					</p>
					<label class="block text-xs text-white/65"
						>Description<textarea
							bind:value={editDescription}
							maxlength="500"
							rows="4"
							class="mt-1.5 w-full resize-y border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-5 text-white outline-none focus:border-orange-200/40"
						></textarea></label
					>
					<label class="block text-xs text-white/65"
						>Community image URL<input
							bind:value={editAvatarUrl}
							type="text"
							inputmode="url"
							placeholder="https://"
							maxlength="1400000"
							class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-200/40"
						/></label
					>
					<p class="-mt-1 text-[10px] text-white/35">
						Use an HTTPS image URL or paste JPEG, PNG, WebP, or GIF data (up to 1 MB).
					</p>
					<label class="block text-xs text-white/65"
						>Banner image URL<input
							bind:value={editBannerUrl}
							type="text"
							inputmode="url"
							placeholder="https://"
							maxlength="1400000"
							class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-200/40"
						/></label
					>
					<p class="-mt-1 text-[10px] text-white/35">
						Use an HTTPS image URL or paste JPEG, PNG, WebP, or GIF data (up to 1 MB).
					</p>
					<label class="block text-xs text-white/65"
						>External community link<input
							bind:value={editWebsiteUrl}
							type="url"
							inputmode="url"
							placeholder="https://example.com"
							class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-200/40"
						/></label
					>
					{#if editError}<p role="alert" class="text-xs text-red-300">{editError}</p>{/if}
					<div class="flex justify-end gap-2 border-t border-white/[0.08] pt-4">
						<button
							type="button"
							onclick={() => (editOpen = false)}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:text-white"
							>Cancel</button
						>
						<button
							type="submit"
							disabled={editLoading}
							class="bg-orange-300 px-4 py-2 text-xs font-semibold text-[#17110e] hover:bg-orange-200 disabled:opacity-50"
							>{editLoading ? 'Saving...' : 'Save details'}</button
						>
					</div>
				</form>
				{#if isCommunityOwner}
					<form
						onsubmit={transferOwnership}
						class="mt-6 space-y-3 border-t border-white/[0.08] pt-5"
					>
						<div>
							<h3 class="text-xs font-medium text-white/85">Transfer ownership</h3>
							<p class="mt-1 text-[10px] leading-4 text-white/40">
								The new owner must already be a member. You will become a regular member.
							</p>
						</div>
						<label class="block text-xs text-white/65"
							>Member username<input
								bind:value={ownerTransferUsername}
								autocomplete="off"
								minlength="3"
								maxlength="30"
								required
								class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-200/40"
							/></label
						>
						{#if ownerTransferError}<p role="alert" class="text-xs text-red-300">
								{ownerTransferError}
							</p>{/if}
						<button
							type="submit"
							disabled={ownerTransferLoading}
							class="border border-white/15 px-3 py-2 text-xs text-white/70 hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
							>{ownerTransferLoading ? 'Transferring...' : 'Transfer ownership'}</button
						>
					</form>
					<div class="mt-6 border-t border-red-300/15 pt-5">
						<h3 class="text-xs font-medium text-red-200">Delete community</h3>
						<p class="mt-1 text-[10px] leading-4 text-white/40">
							This archives the community and hides it publicly. Posts, memberships, and audit
							history are retained.
						</p>
						{#if communityDeleteError}<p role="alert" class="mt-2 text-xs text-red-300">
								{communityDeleteError}
							</p>{/if}
						<button
							type="button"
							onclick={deleteCommunity}
							disabled={communityDeleteLoading}
							class="mt-3 border border-red-300/30 px-3 py-2 text-xs text-red-200 hover:bg-red-300/10 disabled:opacity-50"
							>{communityDeleteLoading ? 'Deleting...' : 'Delete community'}</button
						>
					</div>
				{/if}
			</dialog>
		</div>
	{/if}

	<CommunityBottomNav
		activeItem="Explore"
		profileHref={data.communityUser ? `/u/${data.communityUser.username}` : '/login'}
		user={data.communityUser}
	/>
	{#if toast}<div
			role="status"
			class="fixed right-4 bottom-20 z-50 border border-white/10 bg-[#1b1d1b] px-4 py-2.5 text-xs text-white/85 shadow-xl"
		>
			{toast}
		</div>{/if}
</div>

<style>
	.community-detail {
		min-height: 100dvh;
		background-image: radial-gradient(
			ellipse at 52% -24%,
			rgba(249, 115, 22, 0.075),
			transparent 56%
		);
	}
</style>
