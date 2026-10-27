<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import {
		BadgeCheck,
		Bookmark,
		Flame,
		MessageCircle,
		Pencil,
		Skull,
		ShieldCheck,
		VolumeX,
		X,
		UserRoundX
	} from '@lucide/svelte';
	import { communitySlug, videoEmbedUrl, type CommunityPost } from '#lib/community/community.js';
	import {
		communityApi,
		toCommunityPost,
		type ApiPage,
		type ApiPost,
		type ApiProfileConnection,
		type ApiProfileReply
	} from '#lib/community/communityApi.js';
	import CommunityBottomNav from '#lib/community/components/CommunityBottomNav.svelte';
	import CommunityFollowButton from '#lib/community/components/CommunityFollowButton.svelte';
	import CommunityLinkPreview from '#lib/community/components/CommunityLinkPreview.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let activeSection = $state('Posts');
	let toast = $state('');
	let additionalPosts = $state<CommunityPost[]>([]);
	let additionalReplies = $state<ApiProfileReply[]>([]);
	let nextPostsCursor = $state<string | null>(null);
	let nextRepliesCursor = $state<string | null>(null);
	let activityLoading = $state(false);
	let loadedActivityKey = '';
	let editOpen = $state(false);
	let profileDraft = $state({ displayName: '', bio: '', avatarUrl: '' });
	let profileEditError = $state('');
	let profileSaving = $state(false);
	let safetyActionLoading = $state(false);
	let connectionsKind = $state<'followers' | 'following' | null>(null);
	let connections = $state<ApiProfileConnection[]>([]);
	let connectionsCursor = $state<string | null>(null);
	let connectionsLoading = $state(false);
	const allPosts = $derived([...data.posts, ...additionalPosts]);
	const allReplies = $derived([...data.replies, ...additionalReplies]);
	const visibleCommunities = $derived(data.profile.communities.slice(0, 3));
	const additionalCommunityCount = $derived(
		Math.max(0, data.profile.communities.length - visibleCommunities.length)
	);
	const profileOgImage = $derived(
		`https://sanctyria.com/api/og/profile/${encodeURIComponent(data.profile.username)}?v=${encodeURIComponent(data.profile.avatarVersion ?? '')}`
	);

	const sections = ['Posts', 'Replies', 'Media'];

	$effect(() => {
		const activityKey = [
			data.profile.username,
			...data.posts.map((post) => post.id),
			...data.replies.map((reply) => reply.id)
		].join(':');
		if (activityKey === loadedActivityKey) return;
		loadedActivityKey = activityKey;
		nextPostsCursor = data.postsCursor;
		nextRepliesCursor = data.repliesCursor;
		additionalPosts = [];
		additionalReplies = [];
	});

	async function loadMoreActivity() {
		const type = activeSection === 'Replies' ? 'replies' : 'posts';
		const cursor = type === 'replies' ? nextRepliesCursor : nextPostsCursor;
		if (!cursor || activityLoading) return;
		activityLoading = true;
		try {
			const page = await communityApi<ApiPage<ApiPost | ApiProfileReply>>(
				fetch,
				`profiles/${encodeURIComponent(data.profile.username)}/activity?type=${type}&limit=50&cursor=${encodeURIComponent(cursor)}`
			);
			if (type === 'replies') {
				additionalReplies = [...additionalReplies, ...(page.items as ApiProfileReply[])];
				nextRepliesCursor = page.nextCursor;
			} else {
				const joinedSlugs = data.profile.communities.map((community) => community.slug);
				additionalPosts = [
					...additionalPosts,
					...(page.items as ApiPost[]).map((post) => toCommunityPost(post, joinedSlugs))
				];
				nextPostsCursor = page.nextCursor;
			}
		} catch (error) {
			toast = error instanceof Error ? error.message : 'Could not load more activity.';
			window.setTimeout(() => (toast = ''), 2200);
		} finally {
			activityLoading = false;
		}
	}

	async function toggleFollow() {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent(`/u/${data.profile.handle.slice(1)}`)}`);
			return;
		}
		if (data.profile.isBlocked || data.profile.isBlockedBy) return;
		try {
			await communityApi(fetch, `profiles/${encodeURIComponent(data.profile.username)}/follow`, {
				method: data.profile.isFollowing ? 'DELETE' : 'POST'
			});
			await invalidate('app:community-content');
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not update follow state.');
		}
	}

	async function updateProfileSafety(action: 'block' | 'mute') {
		if (!data.communityUser || safetyActionLoading) return;
		const currentlySet =
			action === 'block' ? data.profile.isBlocked === true : data.profile.isMuted === true;
		safetyActionLoading = true;
		try {
			await communityApi(fetch, `profiles/${encodeURIComponent(data.profile.username)}/${action}`, {
				method: currentlySet ? 'DELETE' : 'POST'
			});
			await invalidate('app:community-content');
			showToast(
				action === 'block'
					? currentlySet
						? 'Profile unblocked.'
						: 'Profile blocked.'
					: currentlySet
						? 'Profile unmuted.'
						: 'Profile muted.'
			);
		} catch (error) {
			showToast(
				error instanceof Error ? error.message : 'Could not update profile safety settings.'
			);
		} finally {
			safetyActionLoading = false;
		}
	}

	function showToast(message: string) {
		toast = message;
		window.setTimeout(() => (toast = ''), 2200);
	}

	function openProfileEditor() {
		profileDraft = {
			displayName: data.profile.name,
			bio: data.profile.bio,
			avatarUrl: data.profile.avatarUrl ?? ''
		};
		profileEditError = '';
		editOpen = true;
	}

	async function saveProfile(event: SubmitEvent) {
		event.preventDefault();
		profileEditError = '';
		profileSaving = true;
		try {
			await communityApi(fetch, 'me/profile', {
				method: 'PATCH',
				body: JSON.stringify({
					displayName: profileDraft.displayName,
					bio: profileDraft.bio,
					avatarUrl: profileDraft.avatarUrl.trim() || null
				})
			});
			editOpen = false;
			await invalidate('app:community-content');
			showToast('Profile updated.');
		} catch (error) {
			profileEditError = error instanceof Error ? error.message : 'Could not update profile.';
		} finally {
			profileSaving = false;
		}
	}

	async function openConnections(kind: 'followers' | 'following') {
		connectionsKind = kind;
		connections = [];
		connectionsCursor = null;
		connectionsLoading = true;
		try {
			const page = await communityApi<ApiPage<ApiProfileConnection>>(
				fetch,
				`profiles/${encodeURIComponent(data.profile.username)}/${kind}?limit=50`
			);
			connections = page.items;
			connectionsCursor = page.nextCursor;
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not load connections.');
			connectionsKind = null;
		} finally {
			connectionsLoading = false;
		}
	}

	async function loadMoreConnections() {
		if (!connectionsKind || !connectionsCursor || connectionsLoading) return;
		connectionsLoading = true;
		try {
			const page = await communityApi<ApiPage<ApiProfileConnection>>(
				fetch,
				`profiles/${encodeURIComponent(data.profile.username)}/${connectionsKind}?limit=50&cursor=${encodeURIComponent(connectionsCursor)}`
			);
			connections = [...connections, ...page.items];
			connectionsCursor = page.nextCursor;
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not load more connections.');
		} finally {
			connectionsLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{data.profile.name} ({data.profile.handle}) | Sanctyria Community</title>
	<meta name="description" content={data.profile.bio} />
	<link
		rel="canonical"
		href={`https://sanctyria.com/u/${encodeURIComponent(data.profile.username)}`}
	/>
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="profile" />
	<meta
		property="og:url"
		content={`https://sanctyria.com/u/${encodeURIComponent(data.profile.username)}`}
	/>
	<meta property="og:title" content={`${data.profile.name} | Sanctyria Community`} />
	<meta property="og:description" content={data.profile.bio} />
	<meta property="og:image" content={profileOgImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${data.profile.name} | Sanctyria Community`} />
	<meta name="twitter:description" content={data.profile.bio} />
	<meta name="twitter:image" content={profileOgImage} />
</svelte:head>

<div class="community-profile-page min-h-screen bg-[#090a0a] text-[#f1efe9]">
	<main class="mx-auto w-full max-w-5xl px-2 pb-28 sm:px-8 md:pb-12 xl:px-12">
		<section class="mt-5 border-b border-white/[0.08] pb-6" aria-labelledby="profile-name">
			<div
				class="h-24 border border-white/[0.06] bg-[linear-gradient(115deg,rgba(249,115,22,.16),rgba(9,10,10,.1)_55%,rgba(132,165,189,.12))] sm:h-32"
			></div>
			<div class="flex flex-wrap items-end justify-between gap-4 px-2">
				<div class="-mt-7 flex items-end gap-3 sm:-mt-9 sm:gap-4">
					<span
						class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-[#090a0a] font-display text-2xl text-white sm:h-20 sm:w-20"
						style={data.profile.avatarUrl ? undefined : `background:${data.profile.avatarColor}`}
						>{#if data.profile.avatarUrl}<img
								src={data.profile.avatarUrl}
								alt=""
								class="h-full w-full object-cover"
							/>{:else}{data.profile.initials}{/if}</span
					>
					<div class="pb-1">
						<h1 id="profile-name" class="font-display text-2xl leading-none sm:text-3xl">
							{data.profile.name}
						</h1>
						<p class="mt-1.5 text-xs text-white/40">{data.profile.handle}</p>
					</div>
				</div>
				{#if data.profile.isOwnProfile}
					<div class="mb-1 flex items-center gap-2">
						<a
							href="/saved"
							aria-label="Saved posts"
							title="Saved posts"
							class="inline-flex h-9 w-9 items-center justify-center border border-white/20 text-white/75 transition-colors hover:border-orange-200/50 hover:text-orange-100"
							><Bookmark size={16} /></a
						>
						{#if data.communityUser?.isAdmin}
							<a
								href="/core"
								aria-label="Sanctyria Core"
								title="Sanctyria Core"
								class="inline-flex h-9 w-9 items-center justify-center border border-white/20 text-orange-100/75 transition-colors hover:border-orange-200/50 hover:text-orange-100 md:hidden"
								><ShieldCheck size={16} /></a
							>
						{/if}
						<button
							type="button"
							onclick={openProfileEditor}
							aria-label="Edit profile"
							title="Edit profile"
							class="flex h-9 w-9 items-center justify-center border border-white/20 text-white transition-colors hover:border-orange-200/50 hover:text-orange-100"
							><Pencil size={16} /></button
						>
					</div>
				{:else}
					<div class="mb-1 flex flex-wrap items-center justify-end gap-2">
						{#if !data.profile.isBlockedBy}
							<button
								type="button"
								onclick={toggleFollow}
								disabled={data.profile.isBlocked || safetyActionLoading}
								aria-pressed={data.profile.isFollowing}
								class={`px-5 py-2 text-xs font-medium transition-colors ${data.profile.isFollowing ? 'border border-white/20 text-white/75 hover:border-red-300/40 hover:text-red-200' : 'bg-white text-black hover:bg-orange-100'} disabled:cursor-not-allowed disabled:opacity-50`}
								>{data.profile.isFollowing ? 'Following' : 'Follow'}</button
							>
						{/if}
						{#if data.communityUser}
							<button
								type="button"
								onclick={() => updateProfileSafety('mute')}
								disabled={safetyActionLoading || data.profile.isBlockedBy}
								aria-pressed={data.profile.isMuted}
								aria-label={data.profile.isMuted ? 'Unmute profile' : 'Mute profile'}
								title={data.profile.isMuted ? 'Unmute profile' : 'Mute profile'}
								class="flex h-9 w-9 items-center justify-center border border-white/15 text-white/60 hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
								><VolumeX size={15} /></button
							>
							<button
								type="button"
								onclick={() => updateProfileSafety('block')}
								disabled={safetyActionLoading}
								aria-pressed={data.profile.isBlocked}
								aria-label={data.profile.isBlocked ? 'Unblock profile' : 'Block profile'}
								title={data.profile.isBlocked ? 'Unblock profile' : 'Block profile'}
								class="flex h-9 w-9 items-center justify-center border border-white/15 text-white/60 hover:border-red-300/40 hover:text-red-200 disabled:opacity-50"
								><UserRoundX size={15} /></button
							>
						{/if}
					</div>
				{/if}
			</div>
			<div class="mt-4 px-2">
				<p class="max-w-xl text-sm leading-6 text-white/70">{data.profile.bio}</p>
				<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-white/40">
					<span>{data.profile.joined}</span>
					<button
						type="button"
						onclick={() => openConnections('followers')}
						class="hover:text-orange-100"
						><strong class="text-white/75">{data.profile.followerCount}</strong> followers</button
					>
					<button
						type="button"
						onclick={() => openConnections('following')}
						class="hover:text-orange-100"
						><strong class="text-white/75">{data.profile.followingCount}</strong> following</button
					>
					<span class="inline-flex items-center gap-1 text-orange-200/75"
						><Flame size={12} />{data.profile.ember} Ember</span
					>
					<span class="inline-flex items-center gap-1"
						><Flame size={12} class="text-orange-200/70" />{data.profile.communities.length} communities</span
					>
				</div>
				<div class="mt-4 flex flex-wrap gap-2">
					{#each visibleCommunities as community (community.slug)}<a
							href={`/r/${community.slug}`}
							class="inline-flex items-center gap-1.5 border border-white/[0.09] px-2.5 py-1.5 text-[10px] text-white/55 transition-colors hover:border-orange-200/30 hover:text-orange-100"
						>
							{#if community.avatarUrl}<img
									src={community.avatarUrl}
									alt=""
									class="h-4 w-4 rounded-full object-cover"
								/>{:else}<Flame size={12} class="text-orange-200/70" />{/if}
							{community.name}</a
						>{/each}
					{#if additionalCommunityCount > 0}
						<span
							class="inline-flex items-center border border-white/[0.09] px-2.5 py-1.5 text-[10px] text-white/45"
							aria-label={`${additionalCommunityCount} more communities`}
							title={`${additionalCommunityCount} more communities`}
							>+{additionalCommunityCount}</span
						>
					{/if}
				</div>
			</div>
		</section>

		<nav class="grid grid-cols-3 border-b border-white/[0.08]" aria-label="Profile sections">
			{#each sections as section (section)}<button
					type="button"
					onclick={() => (activeSection = section)}
					aria-current={activeSection === section ? 'page' : undefined}
					class={`h-12 border-b-2 text-xs transition-colors ${activeSection === section ? 'border-orange-400 text-white' : 'border-transparent text-white/45 hover:text-white/80'}`}
					>{section}</button
				>{/each}
		</nav>

		{#if activeSection === 'Posts' || activeSection === 'Media'}
			{@const profilePosts =
				activeSection === 'Media'
					? allPosts.filter((post) => post.kind === 'image' || post.kind === 'video')
					: allPosts}
			{#if profilePosts.length}
				<section
					aria-label={`${activeSection} by ${data.profile.name}`}
					class="divide-y divide-white/[0.08]"
				>
					{#each profilePosts as post (post.id)}
						<article class="py-5">
							<div class="flex items-start gap-2 sm:gap-3">
								<a
									href={`/u/${encodeURIComponent(data.profile.username)}`}
									class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 font-display text-sm text-white"
									style={data.profile.avatarUrl
										? undefined
										: `background:${data.profile.avatarColor}`}
									aria-label={`View ${data.profile.name}'s profile`}
								>
									{#if data.profile.avatarUrl}<img
											src={data.profile.avatarUrl}
											alt=""
											class="h-full w-full object-cover"
										/>{:else}{data.profile.initials}{/if}
								</a>
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
										<a
											href={`/u/${encodeURIComponent(data.profile.username)}`}
											class="font-medium text-white/90 hover:text-orange-100">{data.profile.name}</a
										>
										{#if data.profile.verified}<BadgeCheck
												size={13}
												class="text-sky-300"
												aria-label="Verified"
											/>{/if}
										<CommunityFollowButton
											authorUsername={data.profile.username}
											viewerUsername={data.communityUser?.username}
											initialFollowing={data.profile.isFollowing}
										/>
										<span class="text-white/35">{post.postedAt}</span>
									</div>
									<a
										href={`/r/${post.communitySlug ?? communitySlug(post.community)}`}
										class="mt-1 inline-flex items-center gap-1.5 text-[10px] text-white/45 hover:text-orange-100"
									>
										<span
											class="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full border border-white/10"
											style={`color:${post.communityColor};background:${post.communityColor}12`}
										>
											{#if post.communityAvatarUrl}<img
													src={post.communityAvatarUrl}
													alt=""
													class="h-full w-full object-cover"
												/>{:else}<Flame size={9} />{/if}
										</span>{post.community}</a
									>
									<a
										href={`/p/${encodeURIComponent(post.id)}`}
										class="mt-3 block text-[13px] leading-[1.7] whitespace-pre-wrap text-white/80 hover:text-white"
									>
										{post.text}
									</a>
									{#if post.kind === 'image' && post.url}
										<a
											href={post.url}
											target="_blank"
											rel="noopener noreferrer"
											class="mt-3 block overflow-hidden border border-white/[0.08]"
										>
											<img
												src={post.url}
												alt={post.text}
												loading="lazy"
												class="max-h-[420px] w-full object-cover"
											/>
										</a>
									{:else if post.kind === 'video' && post.url}
										{@const embedUrl = videoEmbedUrl(post.url)}
										{#if embedUrl}
											<div
												class="community-video mt-3 overflow-hidden border border-white/[0.08] bg-black"
											>
												<iframe
													src={embedUrl}
													title={`Video shared by ${data.profile.name}`}
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
												class="mt-3 inline-flex border border-white/10 px-3 py-2 text-xs text-white/65 hover:text-orange-100"
												>Open video link</a
											>
										{/if}
									{:else if post.kind === 'link' && post.url}
										<CommunityLinkPreview
											url={post.url}
											title={post.linkTitle}
											description={post.linkDescription}
											domain={post.linkDomain}
										/>
									{/if}
									<div class="mt-3 flex items-center gap-4 text-[10px] text-white/40">
										<span class="inline-flex items-center gap-1"
											><Flame size={13} />{post.votes}</span
										>
										<span class="inline-flex items-center gap-1"
											><Skull size={12} />{post.downvotes ?? 0}</span
										>
										<span class="inline-flex items-center gap-1"
											><MessageCircle size={12} />{post.replyCount ?? 0}</span
										>
									</div>
								</div>
							</div>
						</article>
					{/each}
				</section>
				{#if nextPostsCursor}<div class="border-t border-white/[0.08] py-5 text-center">
						<button
							type="button"
							onclick={loadMoreActivity}
							disabled={activityLoading}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 transition-colors hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
							>{activityLoading ? 'Loading...' : 'Load more posts'}</button
						>
					</div>{/if}
			{:else}
				<div class="py-12 text-center">
					<div
						class="mx-auto flex h-10 w-10 items-center justify-center border border-white/[0.09] text-white/45"
					>
						<MessageCircle size={17} />
					</div>
					<h2 class="mt-4 font-display text-2xl">No {activeSection.toLowerCase()} yet</h2>
					<p class="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/45">
						{activeSection === 'Media'
							? 'Image and video posts from this profile will appear here.'
							: 'Posts shared by this profile will appear here.'}
					</p>
					{#if activeSection === 'Media' && nextPostsCursor}<button
							type="button"
							onclick={loadMoreActivity}
							disabled={activityLoading}
							class="mt-5 border border-white/15 px-4 py-2 text-xs text-white/70 transition-colors hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
							>{activityLoading ? 'Loading...' : 'Load older media'}</button
						>{/if}
				</div>
			{/if}
		{:else if allReplies.length}
			<section aria-label={`Replies by ${data.profile.name}`} class="divide-y divide-white/[0.08]">
				{#each allReplies as reply (reply.id)}
					<article class="py-5">
						<p class="text-sm leading-6 whitespace-pre-wrap text-white/80">{reply.body}</p>
						<div class="mt-3 border-l border-white/15 pl-3 text-xs leading-5 text-white/45">
							<p>
								Replying to a post in <a
									href={`/r/${reply.post.communitySlug}`}
									class="text-white/70 hover:text-orange-100">{reply.post.communityName}</a
								>
							</p>
							<p class="mt-1 line-clamp-2">{reply.post.body}</p>
							<a
								href={`/p/${reply.post.id}`}
								class="mt-2 inline-block text-orange-200 hover:text-orange-100">Open conversation</a
							>
						</div>
					</article>
				{/each}
			</section>
			{#if nextRepliesCursor}<div class="border-t border-white/[0.08] py-5 text-center">
					<button
						type="button"
						onclick={loadMoreActivity}
						disabled={activityLoading}
						class="border border-white/15 px-4 py-2 text-xs text-white/70 transition-colors hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
						>{activityLoading ? 'Loading...' : 'Load more replies'}</button
					>
				</div>{/if}
		{:else}
			<div class="py-12 text-center">
				<div
					class="mx-auto flex h-10 w-10 items-center justify-center border border-white/[0.09] text-white/45"
				>
					<MessageCircle size={17} />
				</div>
				<h2 class="mt-4 font-display text-2xl">No replies yet</h2>
				<p class="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/45">
					Replies written by this profile will appear here.
				</p>
			</div>
		{/if}
	</main>
	{#if editOpen}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
			<dialog
				open
				aria-labelledby="edit-profile-heading"
				class="fixed inset-0 m-auto max-h-[min(88vh,760px)] w-full max-w-xl overflow-y-auto border border-white/10 bg-[#111211] p-5 text-white shadow-2xl sm:p-7"
			>
				<header class="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
					<div>
						<p class="font-mono text-[9px] tracking-[0.14em] text-orange-200/70 uppercase">
							Your account
						</p>
						<h2 id="edit-profile-heading" class="mt-1 font-display text-2xl">Edit profile</h2>
						<p class="mt-1 text-xs text-white/40">Shape how people see you across Sanctyria.</p>
					</div>
					<button
						type="button"
						onclick={() => (editOpen = false)}
						aria-label="Close profile editor"
						class="flex h-9 w-9 shrink-0 items-center justify-center text-white/55 hover:bg-white/5 hover:text-white"
						><X size={17} /></button
					>
				</header>
				<div class="mt-5 flex items-center gap-3 border border-white/[0.08] bg-black/20 p-3">
					<span
						class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 font-display text-sm text-white"
						style={profileDraft.avatarUrl ? undefined : `background:${data.profile.avatarColor}`}
					>
						{#if profileDraft.avatarUrl}<img
								src={profileDraft.avatarUrl}
								alt=""
								class="h-full w-full object-cover"
							/>{:else}{profileDraft.displayName
								.trim()
								.split(/\s+/)
								.slice(0, 2)
								.map((part) => part[0]?.toUpperCase() ?? '')
								.join('') || data.profile.initials}{/if}
					</span>
					<div class="min-w-0">
						<p class="truncate text-sm font-medium text-white/90">
							{profileDraft.displayName || 'Your display name'}
						</p>
						<p class="mt-0.5 truncate text-[10px] text-white/40">@{data.profile.username}</p>
					</div>
				</div>
				<form onsubmit={saveProfile} class="mt-5 space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<label class="block text-xs text-white/65"
							>Display name<input
								bind:value={profileDraft.displayName}
								maxlength="60"
								required
								autocomplete="name"
								class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-200/40"
							/></label
						>
						<label class="block text-xs text-white/65"
							>Username<input
								value={`@${data.profile.username}`}
								disabled
								class="mt-1.5 w-full border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-sm text-white/40"
							/></label
						>
					</div>
					<label class="block text-xs text-white/65"
						>Bio<textarea
							bind:value={profileDraft.bio}
							maxlength="300"
							rows="4"
							placeholder="A few words about what you make or care about..."
							class="mt-1.5 w-full resize-y border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-white/25 focus:border-orange-200/40"
						></textarea><span class="mt-1 block text-right text-[10px] text-white/30"
							>{profileDraft.bio.length}/300</span
						></label
					>
					<label class="block text-xs text-white/65"
						>Avatar image URL<input
							bind:value={profileDraft.avatarUrl}
							type="url"
							inputmode="url"
							placeholder="https://"
							class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-200/40"
						/><span class="mt-1 block text-[10px] text-white/35"
							>Use a secure HTTPS image address. Leave blank to use your initials.</span
						></label
					>
					{#if profileEditError}<p
							role="alert"
							class="border border-red-300/15 bg-red-300/[0.04] px-3 py-2.5 text-xs text-red-200"
						>
							{profileEditError}
						</p>{/if}
					<div class="flex justify-end gap-2 border-t border-white/[0.08] pt-4">
						<button
							type="button"
							onclick={() => (editOpen = false)}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:text-white"
							>Cancel</button
						>
						<button
							type="submit"
							disabled={profileSaving}
							class="bg-orange-300 px-4 py-2 text-xs font-semibold text-[#17110e] hover:bg-orange-200 disabled:opacity-50"
							>{profileSaving ? 'Saving...' : 'Save changes'}</button
						>
					</div>
				</form>
			</dialog>
		</div>
	{/if}
	{#if connectionsKind}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
			<dialog
				open
				aria-labelledby="connections-heading"
				class="m-0 flex max-h-[min(80vh,640px)] w-full max-w-md flex-col border border-white/10 bg-[#111211] p-0 text-white shadow-2xl"
			>
				<header class="flex items-center justify-between border-b border-white/10 px-5 py-4">
					<h2 id="connections-heading" class="font-display text-xl">
						{connectionsKind === 'followers' ? 'Followers' : 'Following'}
					</h2>
					<button
						type="button"
						onclick={() => (connectionsKind = null)}
						aria-label="Close connections"
						class="flex h-9 w-9 items-center justify-center text-white/60 hover:bg-white/5 hover:text-white"
						><X size={17} /></button
					>
				</header>
				<div class="min-h-0 flex-1 overflow-y-auto px-5 py-2">
					{#if connectionsLoading && !connections.length}<p
							class="py-8 text-center text-xs text-white/45"
						>
							Loading connections...
						</p>
					{:else if !connections.length}<p class="py-8 text-center text-xs text-white/45">
							No {connectionsKind} yet.
						</p>
					{:else}
						{#each connections as connection (connection.id)}
							<a
								href={`/u/${encodeURIComponent(connection.username)}`}
								onclick={() => (connectionsKind = null)}
								class="flex items-center gap-3 border-b border-white/[0.07] py-3 hover:bg-white/[0.025]"
							>
								<span
									class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs text-white"
									style={connection.avatarUrl
										? undefined
										: `background:${connection.avatarColor ?? '#66744b'}`}
									>{#if connection.avatarUrl}<img
											src={connection.avatarUrl}
											alt=""
											class="h-full w-full object-cover"
										/>{:else}{connection.initials ??
											connection.displayName.slice(0, 1).toUpperCase()}{/if}</span
								>
								<span class="min-w-0"
									><span class="block truncate text-xs text-white/85">{connection.displayName}</span
									><span class="block truncate text-[10px] text-white/40"
										>@{connection.username}</span
									></span
								>
							</a>
						{/each}
					{/if}
				</div>
				{#if connectionsCursor}<footer class="border-t border-white/10 p-4 text-center">
						<button
							type="button"
							onclick={loadMoreConnections}
							disabled={connectionsLoading}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
							>{connectionsLoading ? 'Loading...' : 'Load more'}</button
						>
					</footer>{/if}
			</dialog>
		</div>
	{/if}

	<CommunityBottomNav
		activeItem="Profile"
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
	.community-profile-page {
		min-height: 100dvh;
		background-image: radial-gradient(
			ellipse at 52% -24%,
			rgba(249, 115, 22, 0.075),
			transparent 56%
		);
	}
</style>
