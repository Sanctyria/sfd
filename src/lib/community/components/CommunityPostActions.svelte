<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { Bookmark, Flame, MessageCircle, Share2, Skull } from '@lucide/svelte';
	import type { CommunityPost, CommunityReply } from '../community.js';
	import { communityApi, toCommunityReply, type ApiPage, type ApiReply } from '../communityApi.js';
	import CommunityReportButton from './CommunityReportButton.svelte';
	import CommunityReplyBadges from './CommunityReplyBadges.svelte';

	interface Props {
		post: CommunityPost;
		viewerUsername?: string;
		returnTo: string;
	}

	let { post, viewerUsername, returnTo }: Props = $props();
	let voteCount = $state(0);
	let downvoteCount = $state(0);
	let replyCount = $state(0);
	let reacted = $state(false);
	let downvoted = $state(false);
	let bookmarked = $state(false);
	let repliesOpen = $state(false);
	let repliesLoaded = $state(false);
	let repliesLoading = $state(false);
	let replySubmitting = $state(false);
	let replyDraft = $state('');
	let replies = $state<CommunityReply[]>([]);
	let errorMessage = $state('');
	let statusMessage = $state('');

	$effect(() => {
		voteCount = post.votes;
		downvoteCount = post.downvotes ?? 0;
		replyCount = post.replyCount ?? 0;
		reacted = post.isReacted ?? false;
		downvoted = post.isDownvoted ?? false;
		bookmarked = post.isBookmarked ?? false;
	});

	async function setVote(direction: 'up' | 'down') {
		if (!viewerUsername) {
			void goto(`/login?returnTo=${encodeURIComponent(returnTo)}`);
			return;
		}
		errorMessage = '';
		try {
			const result = await communityApi<{
				voteDirection: 'up' | 'down' | null;
				voteCount: number;
				downvoteCount: number;
			}>(fetch, `posts/${encodeURIComponent(post.id)}/vote`, {
				method: 'POST',
				body: JSON.stringify({ direction })
			});
			reacted = result.voteDirection === 'up';
			downvoted = result.voteDirection === 'down';
			voteCount = result.voteCount;
			downvoteCount = result.downvoteCount;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not update reaction.';
		}
	}

	async function toggleBookmark() {
		if (!viewerUsername) {
			void goto(`/login?returnTo=${encodeURIComponent(returnTo)}`);
			return;
		}
		errorMessage = '';
		try {
			const result = await communityApi<{ saved: boolean }>(
				fetch,
				`posts/${encodeURIComponent(post.id)}/bookmark`,
				{ method: bookmarked ? 'DELETE' : 'POST' }
			);
			bookmarked = result.saved;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not update bookmark.';
		}
	}

	async function sharePost() {
		const url = `${window.location.origin}/p/${encodeURIComponent(post.id)}`;
		errorMessage = '';
		statusMessage = '';
		try {
			if (navigator.share) {
				await navigator.share({ title: post.text || 'Sanctyria community post', url });
				statusMessage = 'Post shared.';
			} else if (navigator.clipboard) {
				await navigator.clipboard.writeText(url);
				statusMessage = 'Post link copied.';
			} else {
				throw new Error('Sharing is unavailable in this browser.');
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			errorMessage = error instanceof Error ? error.message : 'Could not share this post.';
		}
	}

	async function toggleReplies() {
		repliesOpen = !repliesOpen;
		if (repliesOpen && !repliesLoaded) await loadReplies();
	}

	async function loadReplies() {
		if (repliesLoading) return;
		repliesLoading = true;
		errorMessage = '';
		try {
			const page = await communityApi<ApiPage<ApiReply>>(
				fetch,
				`posts/${encodeURIComponent(post.id)}/replies?limit=20`
			);
			replies = page.items.map(toCommunityReply);
			repliesLoaded = true;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not load replies.';
		} finally {
			repliesLoading = false;
		}
	}

	async function submitReply(event: SubmitEvent) {
		event.preventDefault();
		if (!viewerUsername) {
			void goto(`/login?returnTo=${encodeURIComponent(returnTo)}`);
			return;
		}
		const body = replyDraft.trim();
		if (!body || replySubmitting) return;
		replySubmitting = true;
		errorMessage = '';
		try {
			await communityApi(fetch, `posts/${encodeURIComponent(post.id)}/replies`, {
				method: 'POST',
				body: JSON.stringify({ body })
			});
			replyDraft = '';
			replyCount += 1;
			repliesLoaded = false;
			await loadReplies();
			await invalidate('app:community-content');
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not publish reply.';
		} finally {
			replySubmitting = false;
		}
	}
</script>

<div class="mt-3 border-t border-white/[0.06] pt-2">
	<div class="community-post-action-bar flex items-center gap-2 text-[10px] text-white/45">
		<button
			type="button"
			onclick={() => setVote('up')}
			aria-label={reacted ? 'Remove like' : 'Like post'}
			aria-pressed={reacted}
			class={`inline-flex h-8 items-center gap-1.5 rounded-full px-2 transition-colors ${reacted ? 'text-orange-200' : 'hover:bg-white/[0.05] hover:text-orange-100'}`}
		>
			<Flame size={14} fill={reacted ? 'currentColor' : 'none'} />{voteCount}
		</button>
		<button
			type="button"
			onclick={() => setVote('down')}
			aria-label={downvoted ? 'Remove downvote' : 'Downvote post'}
			aria-pressed={downvoted}
			class={`inline-flex h-8 items-center gap-1.5 rounded-full px-2 transition-colors ${downvoted ? 'text-red-200' : 'hover:bg-white/[0.05] hover:text-red-100'}`}
		>
			<Skull size={13} />{downvoteCount}
		</button>
		<button
			type="button"
			onclick={toggleReplies}
			aria-expanded={repliesOpen}
			class="inline-flex h-8 items-center gap-1.5 rounded-full px-2 transition-colors hover:bg-white/[0.05] hover:text-white"
		>
			<MessageCircle size={13} />{replyCount}
			{replyCount === 1 ? 'reply' : 'replies'}
		</button>
		<span class="community-post-mobile-spacer md:hidden"></span>
		<button
			type="button"
			onclick={toggleBookmark}
			aria-label={bookmarked ? 'Remove bookmark' : 'Save post'}
			aria-pressed={bookmarked}
			class={`community-post-mobile-action md:hidden ${bookmarked ? 'bookmarked' : ''}`}
			><Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} /></button
		>
		<button
			type="button"
			onclick={sharePost}
			aria-label="Share post"
			class="community-post-mobile-action md:hidden"><Share2 size={18} /></button
		>
		<span class="max-md:hidden">
			<CommunityReportButton
				targetType="post"
				targetId={post.id}
				targetLabel="post"
				{viewerUsername}
				{returnTo}
				ownContent={viewerUsername === post.handle.slice(1)}
			/>
		</span>
	</div>

	{#if statusMessage}<p role="status" class="mt-1 text-[10px] text-white/45">
			{statusMessage}
		</p>{/if}
	{#if repliesOpen}
		<div class="mt-2 space-y-3 border-l border-white/10 pl-3">
			{#if repliesLoading}
				<p class="text-[10px] text-white/40">Loading replies...</p>
			{:else if replies.length}
				{#each replies as reply (reply.id)}
					<p class="text-[11px] leading-5 text-white/65">
						<a
							href={`/u/${encodeURIComponent(reply.handle.slice(1))}`}
							class="mr-1 font-medium text-white/85 hover:text-orange-100">{reply.name}</a
						>
						<CommunityReplyBadges {reply} />
						{reply.text}
					</p>
				{/each}
			{:else}
				<p class="text-[10px] text-white/40">No replies yet.</p>
			{/if}
			<form onsubmit={submitReply} class="flex items-start gap-2">
				<textarea
					bind:value={replyDraft}
					maxlength="5000"
					rows="2"
					aria-label="Write a reply"
					placeholder={viewerUsername ? 'Write a reply...' : 'Log in to reply...'}
					class="min-w-0 flex-1 resize-y border border-white/10 bg-black/20 px-2.5 py-2 text-xs text-white outline-none placeholder:text-white/30 focus:border-orange-200/40"
				></textarea>
				<button
					type="submit"
					disabled={replySubmitting || !replyDraft.trim()}
					class="border border-white/15 px-3 py-2 text-[10px] text-white/70 hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-40"
					>{replySubmitting ? 'Sending...' : 'Reply'}</button
				>
			</form>
		</div>
	{/if}
	{#if errorMessage}<p role="alert" class="mt-2 text-[10px] text-red-200/80">{errorMessage}</p>{/if}
</div>

<style>
	@media (max-width: 767px) {
		.community-post-mobile-spacer {
			flex: 1 1 auto;
		}

		.community-post-mobile-action {
			display: grid;
			width: 40px;
			height: 40px;
			flex: 0 0 auto;
			place-items: center;
			border-radius: 999px;
			color: rgba(255, 255, 255, 0.6);
		}

		.community-post-mobile-action:active {
			background: rgba(255, 255, 255, 0.06);
		}

		.community-post-mobile-action.bookmarked {
			color: #f0a16c;
		}
	}
</style>
