<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { ArrowUpRight, Bookmark, MessageCircle } from '@lucide/svelte';
	import {
		communityApi,
		toCommunityPost,
		type ApiPage,
		type ApiPost
	} from '#lib/community/communityApi.js';
	import CommunityBottomNav from '#lib/community/components/CommunityBottomNav.svelte';
	import CommunityFollowButton from '#lib/community/components/CommunityFollowButton.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let savedPosts = $state<typeof data.posts>([]);
	let nextCursor = $state<string | null>(null);
	let loading = $state(false);
	let errorMessage = $state('');
	let toast = $state('');
	let loadedKey = '';

	$effect(() => {
		const key = data.posts.map((post) => post.id).join(':');
		if (key === loadedKey) return;
		loadedKey = key;
		savedPosts = [...data.posts];
		nextCursor = data.nextCursor;
	});

	async function loadMore() {
		if (!nextCursor || loading) return;
		loading = true;
		errorMessage = '';
		try {
			const page = await communityApi<ApiPage<ApiPost>>(
				fetch,
				`me/bookmarks?limit=50&cursor=${encodeURIComponent(nextCursor)}`
			);
			const joinedSlugs = data.communityUser?.communities.map((community) => community.slug) ?? [];
			savedPosts = [...savedPosts, ...page.items.map((post) => toCommunityPost(post, joinedSlugs))];
			nextCursor = page.nextCursor;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not load saved posts.';
		} finally {
			loading = false;
		}
	}

	async function removeBookmark(postId: string) {
		try {
			await communityApi(fetch, `posts/${encodeURIComponent(postId)}/bookmark`, {
				method: 'DELETE'
			});
			savedPosts = savedPosts.filter((post) => post.id !== postId);
			await invalidate('app:community-content');
		} catch (error) {
			toast = error instanceof Error ? error.message : 'Could not remove saved post.';
			window.setTimeout(() => (toast = ''), 2200);
		}
	}
</script>

<svelte:head>
	<title>Saved posts | Sanctyria Community</title>
	<meta name="description" content="Posts you have saved in the Sanctyria community." />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<main
	class="mx-auto min-h-screen w-full max-w-5xl px-4 pt-8 pb-28 text-[#f1efe9] sm:px-8 md:pb-12 xl:px-12"
>
	<header class="border-b border-white/[0.08] pb-5">
		<p class="font-mono text-[9px] tracking-[0.15em] text-orange-200/70 uppercase">Your library</p>
		<h1 class="mt-1 font-display text-4xl text-white">Saved posts</h1>
		<p class="mt-2 text-xs text-white/45">Posts you have kept for later.</p>
	</header>

	{#if savedPosts.length}
		<ul class="divide-y divide-white/[0.08]">
			{#each savedPosts as post (post.id)}
				<li class="flex items-start gap-3 py-5 sm:gap-4">
					<span
						class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-orange-200/15 bg-orange-200/[0.06] text-orange-100"
						><Bookmark size={15} /></span
					>
					<div class="min-w-0 flex-1">
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-white/40">
							<a
								href={`/u/${encodeURIComponent(post.handle.slice(1))}`}
								class="font-medium text-white/75 hover:text-white">{post.name}</a
							>
							<CommunityFollowButton
								authorUsername={post.handle.slice(1)}
								viewerUsername={data.communityUser?.username}
								initialFollowing={post.isFollowingAuthor}
							/>
							<span>in</span>
							<a
								href={`/r/${encodeURIComponent(post.communitySlug ?? '')}`}
								class="text-orange-100/70 hover:text-orange-100">{post.community}</a
							>
							<time>{post.postedAt}</time>
						</div>
						<a
							href={`/p/${encodeURIComponent(post.id)}`}
							class="mt-2 block text-sm leading-6 whitespace-pre-wrap text-white/80 hover:text-white"
							>{post.text || post.linkTitle || post.url}</a
						>
						<div class="mt-3 flex items-center gap-3 text-[10px] text-white/40">
							<span class="inline-flex items-center gap-1"
								><MessageCircle size={12} />{post.replyCount ?? 0}</span
							>
						</div>
					</div>
					<button
						type="button"
						onclick={() => removeBookmark(post.id)}
						class="flex h-9 w-9 shrink-0 items-center justify-center text-orange-100/70 hover:bg-white/[0.05] hover:text-orange-100"
						aria-label="Remove saved post"
						title="Remove saved post"><Bookmark size={15} fill="currentColor" /></button
					>
				</li>
			{/each}
		</ul>
		{#if nextCursor}<div class="border-t border-white/[0.08] py-5 text-center">
				<button
					type="button"
					onclick={loadMore}
					disabled={loading}
					class="border border-white/15 px-4 py-2 text-xs text-white/70 transition-colors hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
					>{loading ? 'Loading...' : 'Load more saved posts'}</button
				>
			</div>{/if}
	{:else}
		<div class="py-16 text-center">
			<span
				class="mx-auto flex h-10 w-10 items-center justify-center border border-white/10 text-white/40"
				><Bookmark size={17} /></span
			>
			<h2 class="mt-4 font-display text-2xl text-white">Nothing saved yet</h2>
			<p class="mt-2 text-xs text-white/45">Bookmark a post and it will be kept here.</p>
			<a
				href="/home"
				class="mt-5 inline-flex items-center gap-2 border border-white/15 px-3 py-2 text-xs text-white/70 hover:border-orange-200/40 hover:text-orange-100"
				>Explore the community <ArrowUpRight size={13} /></a
			>
		</div>
	{/if}
	{#if errorMessage}<p role="alert" class="border-t border-red-300/15 py-4 text-xs text-red-200">
			{errorMessage}
		</p>{/if}
</main>

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
