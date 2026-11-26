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
	const savedCountLabel = $derived(nextCursor ? `${savedPosts.length}+` : `${savedPosts.length}`);

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
	class="saved-page mx-auto min-h-screen w-full max-w-5xl px-4 pt-8 pb-28 text-[#f1efe9] sm:px-8 md:pb-12 xl:px-12"
>
	<header class="saved-mobile-hero">
		<div class="saved-mobile-hero-copy">
			<p>YOUR SAVED POSTS</p>
			<h1>Your Library</h1>
			<span>Everything you want to return to, in one place.</span>
		</div>
		<div class="saved-mobile-count" aria-label={`${savedCountLabel} saved posts`}>
			<Bookmark size={19} strokeWidth={1.7} />
			<strong>{savedCountLabel}</strong>
			<span>saved</span>
		</div>
	</header>
	<header class="saved-desktop-heading border-b border-white/[0.08] pb-5">
		<p class="font-mono text-[9px] tracking-[0.15em] text-orange-200/70 uppercase">Your library</p>
		<h1 class="mt-1 font-display text-4xl text-white">Saved posts</h1>
		<p class="mt-2 text-xs text-white/45">Posts you have kept for later.</p>
	</header>

	{#if savedPosts.length}
		<ul class="saved-post-list divide-y divide-white/[0.08]">
			{#each savedPosts as post (post.id)}
				<li class="saved-post-card flex items-start gap-3 py-5 sm:gap-4">
					<span
						class="saved-post-mark mt-1 flex h-8 w-8 shrink-0 items-center justify-center border border-orange-200/15 bg-orange-200/[0.06] text-orange-100"
						><Bookmark size={15} /></span
					>
					<div class="min-w-0 flex-1">
						<div
							class="saved-post-desktop-byline flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-white/40 max-md:hidden"
						>
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
						<div class="saved-post-byline md:hidden">
							<a
								href={`/u/${encodeURIComponent(post.handle.slice(1))}`}
								class="saved-post-avatar"
								style={post.avatarUrl ? undefined : `background:${post.avatarColor ?? '#cf6f65'}`}
							>
								{#if post.avatarUrl}<img src={post.avatarUrl} alt="" />{:else}{post.initials}{/if}
							</a>
							<div class="saved-post-author">
								<a
									href={`/u/${encodeURIComponent(post.handle.slice(1))}`}
									class="font-medium text-white/80 hover:text-white">{post.name}</a
								>
								<span>{post.handle} · {post.postedAt}</span>
							</div>
						</div>
						<a
							href={`/p/${encodeURIComponent(post.id)}`}
							class="saved-post-text mt-2 block text-sm leading-6 whitespace-pre-wrap text-white/80 hover:text-white"
							>{post.text || post.linkTitle || post.url}</a
						>
						<div class="saved-post-meta mt-3 flex items-center gap-3 text-[10px] text-white/40">
							<a
								href={`/r/${encodeURIComponent(post.communitySlug ?? '')}`}
								class="saved-post-community md:hidden">{post.community}</a
							>
							<span class="inline-flex items-center gap-1"
								><MessageCircle size={12} />{post.replyCount ?? 0}</span
							>
						</div>
					</div>
					<button
						type="button"
						onclick={() => removeBookmark(post.id)}
						class="saved-post-remove flex h-9 w-9 shrink-0 items-center justify-center text-orange-100/70 hover:bg-white/[0.05] hover:text-orange-100"
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

	<style>
		.saved-mobile-hero {
			position: relative;
			display: none;
			min-height: 182px;
			align-items: flex-end;
			justify-content: space-between;
			overflow: hidden;
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 16px;
			background:
				radial-gradient(ellipse at 86% 20%, rgba(244, 125, 68, 0.25), transparent 40%),
				linear-gradient(135deg, #29201c 0%, #171716 58%, #101110 100%);
			padding: 21px 18px;
		}

		.saved-mobile-hero::before {
			position: absolute;
			top: -33px;
			right: 15%;
			width: 130px;
			height: 130px;
			border: 1px solid rgba(240, 161, 108, 0.13);
			border-radius: 50%;
			content: '';
		}

		.saved-mobile-hero-copy {
			position: relative;
			z-index: 1;
			max-width: 225px;
		}

		.saved-mobile-hero-copy > p {
			color: #f0a16c;
			font-family: var(--font-anton);
			font-size: 9px;
			letter-spacing: 0.16em;
			text-transform: uppercase;
		}

		.saved-mobile-hero-copy h1 {
			margin-top: 6px;
			font-family: var(--font-display);
			font-size: 32px;
			font-weight: 400;
			line-height: 1.05;
		}

		.saved-mobile-hero-copy > span {
			display: block;
			margin-top: 8px;
			color: rgba(235, 235, 227, 0.52);
			font-size: 10px;
			line-height: 1.5;
		}

		.saved-mobile-count {
			position: relative;
			z-index: 1;
			display: grid;
			width: 65px;
			height: 76px;
			flex: 0 0 auto;
			align-content: center;
			justify-items: center;
			border: 1px solid rgba(240, 161, 108, 0.25);
			border-radius: 11px;
			background: rgba(8, 9, 8, 0.36);
			color: #f2ad82;
		}

		.saved-mobile-count strong {
			margin-top: 4px;
			color: white;
			font-family: var(--font-display);
			font-size: 20px;
			font-weight: 400;
			line-height: 1;
		}

		.saved-mobile-count span {
			margin-top: 3px;
			color: rgba(235, 235, 227, 0.48);
			font-size: 8px;
		}

		@media (max-width: 767px) {
			.saved-page {
				padding: 24px 14px 112px;
			}

			.saved-mobile-hero {
				display: flex;
			}

			.saved-desktop-heading {
				display: none;
			}

			.saved-post-list {
				display: grid;
				gap: 12px;
				margin-top: 17px;
				border: 0;
			}

			.saved-post-card {
				gap: 10px;
				border: 1px solid rgba(255, 255, 255, 0.09);
				border-radius: 12px;
				background: linear-gradient(145deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.012));
				padding: 14px 12px;
			}

			.saved-post-mark {
				display: none;
			}

			.saved-post-byline {
				display: flex;
				min-width: 0;
				align-items: center;
				gap: 9px;
			}

			.saved-post-avatar {
				display: grid;
				width: 34px;
				height: 34px;
				flex: 0 0 auto;
				place-items: center;
				overflow: hidden;
				border: 1px solid rgba(255, 255, 255, 0.13);
				border-radius: 50%;
				color: white;
				font-size: 10px;
			}

			.saved-post-avatar img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.saved-post-author {
				display: grid;
				min-width: 0;
				flex: 1;
				gap: 2px;
				font-size: 10px;
			}

			.saved-post-author > a,
			.saved-post-author > span {
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.saved-post-author > span {
				color: rgba(235, 235, 227, 0.42);
				font-size: 9px;
			}

			.saved-post-byline :global(button) {
				min-height: 27px;
				padding: 0 9px;
				font-size: 9px;
			}

			.saved-post-remove {
				width: 31px;
				height: 31px;
				color: rgba(255, 255, 255, 0.45);
			}

			.saved-post-text {
				margin-top: 11px;
				color: rgba(255, 255, 255, 0.9);
				font-size: 12px;
				line-height: 1.55;
			}

			.saved-post-meta {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-top: 12px;
				color: rgba(235, 235, 227, 0.46);
				font-size: 9px;
			}

			.saved-post-community {
				overflow: hidden;
				max-width: 60%;
				border: 1px solid rgba(240, 161, 108, 0.2);
				border-radius: 999px;
				padding: 4px 8px;
				color: rgba(255, 215, 187, 0.78);
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.saved-post-meta > span {
				display: inline-flex;
				align-items: center;
				gap: 4px;
			}
		}
	</style>
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
