<script lang="ts">
	import { goto, invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		BadgeCheck,
		Bookmark,
		CornerDownRight,
		Crown,
		Flame,
		Globe,
		MessageCircle,
		MoreHorizontal,
		Pencil,
		Skull,
		Share2,
		Send,
		Trash2,
		X
	} from '@lucide/svelte';
	import {
		communitySlug,
		orderRepliesThreaded,
		videoEmbedUrl,
		type CommunityReply
	} from '#lib/community/community.js';
	import {
		communityApi,
		toCommunityReply,
		type ApiPage,
		type ApiReply
	} from '#lib/community/communityApi.js';
	import { brandedOgImageUrl } from '#lib/community/og.js';
	import CommunityBottomNav from '#lib/community/components/CommunityBottomNav.svelte';
	import CommunityFollowButton from '#lib/community/components/CommunityFollowButton.svelte';
	import CommunityLinkPreview from '#lib/community/components/CommunityLinkPreview.svelte';
	import { subscribeCommunityRealtime } from '#lib/community/communityRealtime.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let toast = $state('');
	let reacted = $state(false);
	let downvoted = $state(false);
	let saved = $state(false);
	let voteCount = $state(0);
	let downvoteCount = $state(0);
	let olderReplies = $state<CommunityReply[]>([]);
	let replyCursor = $state<string | null>(null);
	let loadingReplies = $state(false);
	let loadedReplyPageKey = '';
	let replyDraft = $state('');
	let replyTarget = $state<CommunityReply | null>(null);
	let editingReplyId = $state<string | null>(null);
	let replyEditDraft = $state('');
	let replyEditError = $state('');
	let replySaving = $state(false);
	let replyOverrides = $state<Record<string, string>>({});
	let replyReactionOverrides = $state<Record<string, { reacted: boolean; reactionCount: number }>>(
		{}
	);
	let expandedReplyIds = $state<string[]>([]);
	let deletedReplyIds = $state<string[]>([]);
	const replies = $derived(
		orderRepliesThreaded(
			[...olderReplies, ...data.post.replies]
				.filter((reply) => !reply.id || !deletedReplyIds.includes(reply.id))
				.map((reply) => ({
					...reply,
					text: reply.id ? (replyOverrides[reply.id] ?? reply.text) : reply.text,
					...(reply.id ? replyReactionOverrides[reply.id] : {})
				}))
		)
	);
	let editingPost = $state(false);
	let editDraftText = $state('');
	let editDraftUrl = $state('');
	let editError = $state('');
	let editSubmitting = $state(false);
	const postUrl = $derived(`https://sanctyria.com/p/${data.post.id}`);
	const postOgImage = $derived(
		data.post.kind === 'image' && data.post.url
			? data.post.url
			: brandedOgImageUrl(
					`${data.post.name} in ${data.post.community}`,
					data.post.text,
					'COMMUNITY POST'
				)
	);

	function replyTreeVisible(reply: CommunityReply): boolean {
		const byId = new Map(replies.flatMap((item) => (item.id ? [[item.id, item] as const] : [])));
		let parentId = reply.parentReplyId;
		while (parentId) {
			const parentReply = byId.get(parentId);
			if (!parentReply) break;
			if (!expandedReplyIds.includes(parentId)) return false;
			parentId = parentReply.parentReplyId;
		}
		return true;
	}

	function replyChildCount(replyId: string): number {
		return replies.filter((reply) => reply.parentReplyId === replyId).length;
	}

	function toggleReplyThread(replyId: string) {
		expandedReplyIds = expandedReplyIds.includes(replyId)
			? expandedReplyIds.filter((id) => id !== replyId)
			: [...expandedReplyIds, replyId];
	}

	async function toggleReplyReaction(reply: CommunityReply) {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent(`/p/${data.post.id}`)}`);
			return;
		}
		if (!reply.id) return;
		try {
			const result = await communityApi<{ reacted: boolean; reactionCount: number }>(
				fetch,
				`replies/${encodeURIComponent(reply.id)}/reaction`,
				{ method: reply.reacted ? 'DELETE' : 'POST' }
			);
			replyReactionOverrides = {
				...replyReactionOverrides,
				[reply.id]: { reacted: result.reacted, reactionCount: result.reactionCount }
			};
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not update reply reaction.');
		}
	}

	onMount(() =>
		subscribeCommunityRealtime(() => {
			void invalidate('app:community-content');
		})
	);

	$effect(() => {
		reacted = data.post.isReacted ?? false;
		downvoted = data.post.isDownvoted ?? false;
		saved = data.post.isBookmarked ?? false;
		voteCount = data.post.votes;
		downvoteCount = data.post.downvotes ?? 0;
	});

	$effect(() => {
		const pageKey = `${data.post.id}:${data.post.replies.at(-1)?.id ?? ''}:${data.replyCursor ?? ''}`;
		if (pageKey === loadedReplyPageKey) return;
		loadedReplyPageKey = pageKey;
		olderReplies = [];
		replyCursor = data.replyCursor;
	});

	function sharePost() {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(postUrl).then(
				() => showToast('Post link copied'),
				() => showToast(postUrl)
			);
		} else showToast(postUrl);
	}

	function showToast(message: string) {
		toast = message;
		window.setTimeout(() => (toast = ''), 2200);
	}

	async function setPostVote(direction: 'up' | 'down') {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent(`/p/${data.post.id}`)}`);
			return;
		}
		try {
			const result = await communityApi<{
				voteDirection: 'up' | 'down' | null;
				voteCount: number;
				downvoteCount: number;
			}>(fetch, `posts/${encodeURIComponent(data.post.id)}/vote`, {
				method: 'POST',
				body: JSON.stringify({ direction })
			});
			reacted = result.voteDirection === 'up';
			downvoted = result.voteDirection === 'down';
			voteCount = result.voteCount;
			downvoteCount = result.downvoteCount;
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not update reaction.');
		}
	}

	async function toggleBookmark() {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent(`/p/${data.post.id}`)}`);
			return;
		}
		try {
			const result = await communityApi<{ saved: boolean }>(
				fetch,
				`posts/${encodeURIComponent(data.post.id)}/bookmark`,
				{ method: saved ? 'DELETE' : 'POST' }
			);
			saved = result.saved;
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not update bookmark.');
		}
	}

	async function loadOlderReplies() {
		if (!replyCursor || loadingReplies) return;
		loadingReplies = true;
		try {
			const page = await communityApi<ApiPage<ApiReply>>(
				fetch,
				`posts/${encodeURIComponent(data.post.id)}/replies?limit=50&cursor=${encodeURIComponent(replyCursor)}`
			);
			olderReplies = [...page.items.map(toCommunityReply).reverse(), ...olderReplies];
			replyCursor = page.nextCursor;
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not load older replies.');
		} finally {
			loadingReplies = false;
		}
	}

	async function submitReply(event: SubmitEvent) {
		event.preventDefault();
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent(`/p/${data.post.id}`)}`);
			return;
		}
		const body = replyDraft.trim();
		if (!body) return;
		try {
			await communityApi(fetch, `posts/${encodeURIComponent(data.post.id)}/replies`, {
				method: 'POST',
				body: JSON.stringify({
					body,
					...(replyTarget?.id ? { parentReplyId: replyTarget.id } : {})
				})
			});
			replyDraft = '';
			replyTarget = null;
			await invalidate('app:community-content');
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not publish reply.');
		}
	}

	function openPostEditor() {
		if (!data.post.canManage) return;
		editDraftText = data.post.text;
		editDraftUrl = data.post.url ?? '';
		editError = '';
		editingPost = true;
	}

	async function submitPostEdit(event: SubmitEvent) {
		event.preventDefault();
		if (!data.post.canManage) return;
		editSubmitting = true;
		editError = '';
		try {
			await communityApi(fetch, `posts/${encodeURIComponent(data.post.id)}`, {
				method: 'PATCH',
				body: JSON.stringify({
					body: editDraftText.trim(),
					...(data.post.kind !== 'text' ? { url: editDraftUrl.trim() } : {})
				})
			});
			editingPost = false;
			await invalidate('app:community-content');
			showToast('Post updated.');
		} catch (error) {
			editError = error instanceof Error ? error.message : 'Could not update post.';
		} finally {
			editSubmitting = false;
		}
	}

	async function deletePost() {
		if (
			!data.post.canManage ||
			!window.confirm('Delete this post? It will no longer be visible in the community.')
		)
			return;
		try {
			await communityApi(fetch, `posts/${encodeURIComponent(data.post.id)}`, { method: 'DELETE' });
			await goto('/home');
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not delete post.');
		}
	}

	function openReplyEditor(reply: CommunityReply) {
		if (!reply.id || !reply.canManage) return;
		editingReplyId = reply.id;
		replyEditDraft = reply.text;
		replyEditError = '';
	}

	async function saveReply(replyId: string) {
		if (replySaving) return;
		const body = replyEditDraft.trim();
		if (!body) {
			replyEditError = 'Reply text cannot be empty.';
			return;
		}
		replySaving = true;
		replyEditError = '';
		try {
			await communityApi(fetch, `replies/${encodeURIComponent(replyId)}`, {
				method: 'PATCH',
				body: JSON.stringify({ body })
			});
			replyOverrides = { ...replyOverrides, [replyId]: body };
			editingReplyId = null;
			await invalidate('app:community-content');
		} catch (error) {
			replyEditError = error instanceof Error ? error.message : 'Could not update reply.';
		} finally {
			replySaving = false;
		}
	}

	async function deleteReply(reply: CommunityReply) {
		if (!reply.id || !reply.canManage || !window.confirm('Delete this reply?')) return;
		try {
			await communityApi(fetch, `replies/${encodeURIComponent(reply.id)}`, { method: 'DELETE' });
			deletedReplyIds = [...deletedReplyIds, reply.id];
			await invalidate('app:community-content');
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not delete reply.');
		}
	}
</script>

<svelte:head>
	<title>{data.post.name} in {data.post.community} | Sanctyria Community</title>
	<meta name="description" content={data.post.text} />
	<link rel="canonical" href={postUrl} />
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="article" />
	<meta property="og:url" content={postUrl} />
	<meta property="og:title" content={`${data.post.name} in ${data.post.community}`} />
	<meta property="og:description" content={data.post.text} />
	<meta property="og:image" content={postOgImage} />
	{#if data.post.kind !== 'image'}
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
	{/if}
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${data.post.name} in ${data.post.community}`} />
	<meta name="twitter:description" content={data.post.text} />
	<meta name="twitter:image" content={postOgImage} />
</svelte:head>

<div class="community-post-page min-h-screen bg-[#090a0a] text-[#f1efe9]">
	<main class="mx-auto w-full max-w-5xl px-2 pb-28 sm:px-8 md:pb-12 xl:px-12">
		<article class="mt-5 border-y border-white/[0.08] py-5 sm:py-7">
			<div class="flex items-start gap-2 sm:gap-3">
				<a
					href={`/u/${encodeURIComponent(data.post.handle.slice(1))}`}
					class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 font-display text-sm text-white sm:h-10 sm:w-10"
					style={data.post.avatarUrl ? undefined : `background:${data.post.avatarColor}`}
					aria-label={`View ${data.post.name}'s profile`}
				>
					{#if data.post.avatarUrl}<img
							src={data.post.avatarUrl}
							alt=""
							class="h-full w-full object-cover"
						/>{:else}{data.post.initials}{/if}
				</a>
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
						<a
							href={`/u/${encodeURIComponent(data.post.handle.slice(1))}`}
							class="font-medium text-white/90 hover:text-orange-100">{data.post.name}</a
						>{#if data.post.verified}<span
								aria-label="Verified"
								title="Verified"
								class="inline-flex text-sky-300"><BadgeCheck size={14} /></span
							>{/if}<a
							href={`/u/${encodeURIComponent(data.post.handle.slice(1))}`}
							class="text-white/35 hover:text-white/70">{data.post.handle}</a
						><span class="text-white/25">·</span><time class="text-white/35"
							>{data.post.postedAt}</time
						>
						<CommunityFollowButton
							authorUsername={data.post.handle.slice(1)}
							viewerUsername={data.communityUser?.username}
							initialFollowing={data.post.isFollowingAuthor}
						/>
					</div>
					<a
						href={`/r/${communitySlug(data.post.community)}`}
						class="mt-1 inline-flex items-center gap-1.5 text-[10px] text-white/45 hover:text-orange-100"
					>
						<span
							class="flex h-4 w-4 items-center justify-center overflow-hidden rounded-full border border-white/10"
							style={`color:${data.post.communityColor};background:${data.post.communityColor}12`}
						>
							{#if data.post.communityAvatarUrl}<img
									src={data.post.communityAvatarUrl}
									alt=""
									class="h-full w-full object-cover"
								/>{:else}<Flame size={9} />{/if}
						</span>{data.post.community}</a
					>
					<p class="mt-5 text-sm leading-7 whitespace-pre-wrap text-white/80">{data.post.text}</p>

					{#if data.post.kind === 'link' && data.post.url}
						<CommunityLinkPreview
							url={data.post.url}
							title={data.post.linkTitle}
							description={data.post.linkDescription}
							domain={data.post.linkDomain}
						/>
					{/if}
					{#if data.post.kind === 'image' && data.post.url}
						<a
							href={data.post.url}
							target="_blank"
							rel="noopener noreferrer"
							class="mt-4 block overflow-hidden border border-white/[0.08]"
							><img
								src={data.post.url}
								alt={data.post.text}
								class="max-h-[520px] w-full object-cover"
							/></a
						>
					{/if}
					{#if data.post.kind === 'video' && data.post.url}
						{@const embedUrl = videoEmbedUrl(data.post.url)}
						{#if embedUrl}
							<div class="community-video mt-4 overflow-hidden border border-white/[0.08] bg-black">
								<iframe
									src={embedUrl}
									title={`Video shared by ${data.post.name}`}
									loading="lazy"
									referrerpolicy="strict-origin-when-cross-origin"
									allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
									allowfullscreen
									class="aspect-video w-full"
								></iframe>
							</div>
						{:else}
							<a
								href={data.post.url}
								target="_blank"
								rel="noopener noreferrer"
								class="mt-4 inline-flex items-center gap-2 border border-white/[0.08] px-3 py-2 text-xs text-white/65 hover:text-orange-100"
								><Globe size={14} /> Open video link</a
							>
						{/if}
					{/if}

					<div
						class="mt-5 flex flex-nowrap items-center gap-0.5 border-t border-white/[0.07] pt-3 text-[10px] text-white/45 sm:gap-2"
					>
						<button
							type="button"
							onclick={() => setPostVote('up')}
							aria-pressed={reacted}
							class={`inline-flex h-9 shrink-0 items-center gap-1 rounded-full border px-1.5 transition-colors sm:gap-1.5 sm:px-3 ${reacted ? 'border-orange-200/30 bg-orange-200/10 text-orange-100' : 'border-transparent hover:border-white/10 hover:bg-white/[0.05]'}`}
							><Flame
								size={14}
								class={reacted ? 'fill-orange-300 text-orange-200' : 'text-white/50'}
							/>{voteCount}</button
						>
						<button
							type="button"
							onclick={() => setPostVote('down')}
							aria-label={downvoted ? 'Remove downvote' : 'Downvote post'}
							aria-pressed={downvoted}
							class={`inline-flex h-9 shrink-0 items-center gap-1 rounded-full border px-1.5 transition-colors sm:gap-1.5 sm:px-3 ${downvoted ? 'border-red-200/30 bg-red-200/10 text-red-100' : 'border-transparent hover:border-white/10 hover:bg-white/[0.05]'}`}
							><Skull size={14} />{downvoteCount}</button
						>
						<span class="inline-flex h-9 shrink-0 items-center gap-1 px-1.5 sm:gap-1.5 sm:px-3"
							><MessageCircle size={14} />{data.post.replyCount ?? replies.length} replies</span
						>
						<button
							type="button"
							onclick={toggleBookmark}
							aria-pressed={saved}
							class="ml-auto flex h-9 w-8 shrink-0 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.05]"
							aria-label={saved ? 'Remove saved post' : 'Save post'}
							><Bookmark size={14} fill={saved ? 'currentColor' : 'none'} /></button
						>
						<button
							type="button"
							onclick={sharePost}
							class="flex h-9 w-8 shrink-0 items-center justify-center rounded-full text-white/45 hover:bg-white/[0.05] hover:text-white"
							aria-label="Copy post link"><Share2 size={14} /></button
						>
						{#if data.post.canManage}
							<details class="relative">
								<summary
									aria-label="Post management actions"
									class="flex h-9 w-8 cursor-pointer list-none items-center justify-center rounded-full text-white/45 hover:bg-white/[0.05] hover:text-white"
									><MoreHorizontal size={15} /></summary
								>
								<div
									class="absolute top-full right-0 z-20 mt-1 w-40 border border-white/10 bg-[#111211] p-1 shadow-xl"
								>
									<button
										type="button"
										onclick={openPostEditor}
										class="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-white/70 hover:bg-white/5 hover:text-white"
										><Pencil size={13} />Edit post</button
									>
									<button
										type="button"
										onclick={deletePost}
										class="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-red-200/75 hover:bg-red-300/5 hover:text-red-100"
										><Trash2 size={13} />Delete post</button
									>
								</div>
							</details>
						{/if}
					</div>

					<section class="mt-6 border-t border-white/[0.07] pt-5" aria-label="Replies">
						<h2 class="font-display text-2xl">
							Replies <span class="font-body text-xs text-white/35"
								>{data.post.replyCount ?? replies.length}</span
							>
						</h2>
						{#if replyCursor}
							<button
								type="button"
								onclick={loadOlderReplies}
								disabled={loadingReplies}
								class="mt-4 border border-white/10 px-3 py-2 text-[10px] text-white/55 transition-colors hover:border-orange-200/30 hover:text-orange-100 disabled:opacity-50"
							>
								{loadingReplies ? 'Loading replies...' : 'Load older replies'}
							</button>
						{/if}
						{#if replies.length}
							<div class="mt-4 space-y-4">
								{#each replies as reply (reply.id ?? `${data.post.id}-${reply.handle}-${reply.text}`)}
									{#if replyTreeVisible(reply)}
										<div id={reply.id} class="flex items-start gap-2 sm:gap-2.5">
											{#if reply.removed}
												<p class="py-1 text-xs text-white/35 italic">Reply removed.</p>
											{:else}
												<span
													class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-[10px]"
													style={reply.avatarUrl ? undefined : `background:${reply.color}`}
												>
													{#if reply.avatarUrl}<img
															src={reply.avatarUrl}
															alt=""
															class="h-full w-full object-cover"
														/>{:else}{reply.initials}{/if}
												</span>
												<div class="min-w-0 flex-1">
													<p class="text-xs leading-5 text-white/65">
														<a
															href={`/u/${encodeURIComponent(reply.handle.slice(1))}`}
															class="mr-1 font-medium text-white/85 hover:text-orange-100"
															>{reply.name}</a
														>{#if reply.isCommunityOwner}<span
																class="mr-1 inline-flex items-center gap-0.5 text-[9px] text-orange-200/75"
																title="Community owner"><Crown size={10} />Owner</span
															>{/if}
														{#if reply.verified}<BadgeCheck
																size={12}
																class="mr-1 inline text-sky-300"
																aria-label="Verified"
															/>{/if}
														<a
															href={`/u/${encodeURIComponent(reply.handle.slice(1))}`}
															class="mr-1 text-white/35 hover:text-white/70">{reply.handle}</a
														>
														{reply.text}
													</p>
													<div class="mt-1 flex items-center gap-3">
														<button
															type="button"
															onclick={() => toggleReplyReaction(reply)}
															aria-label={`${reply.reacted ? 'Remove Ember reaction from' : 'Give Ember to'} ${reply.name}'s reply`}
															aria-pressed={reply.reacted ?? false}
															class={`inline-flex items-center gap-1 text-[10px] transition-colors ${reply.reacted ? 'text-orange-200' : 'text-white/35 hover:text-orange-100'}`}
														>
															<Flame size={12} fill={reply.reacted ? 'currentColor' : 'none'} />
															{reply.reactionCount ?? 0}
														</button>
														{#if reply.id}<button
																type="button"
																onclick={() => (replyTarget = reply)}
																aria-label={`Reply to ${reply.name}`}
																title={`Reply to ${reply.name}`}
																class="flex h-6 items-center text-white/35 hover:text-orange-100"
																><CornerDownRight size={12} /></button
															>{/if}
														{#if reply.id && replyChildCount(reply.id) > 0}
															<button
																type="button"
																onclick={() => toggleReplyThread(reply.id!)}
																aria-expanded={expandedReplyIds.includes(reply.id)}
																aria-label={`${expandedReplyIds.includes(reply.id) ? 'Hide' : 'View'} ${replyChildCount(reply.id)} replies to ${reply.name}`}
																class="inline-flex items-center gap-1 text-[10px] text-white/35 hover:text-orange-100"
															>
																<MessageCircle size={11} />{replyChildCount(reply.id)}
															</button>
														{/if}
														{#if reply.id && reply.canManage}
															<button
																type="button"
																onclick={() => openReplyEditor(reply)}
																aria-label="Edit reply"
																title="Edit reply"
																class="flex h-6 w-6 items-center justify-center text-white/35 hover:text-orange-100"
																><Pencil size={12} /></button
															>
															<button
																type="button"
																onclick={() => deleteReply(reply)}
																aria-label="Delete reply"
																title="Delete reply"
																class="flex h-6 w-6 items-center justify-center text-red-200/50 hover:text-red-100"
																><Trash2 size={12} /></button
															>
														{/if}
													</div>
													{#if editingReplyId === reply.id}
														<div class="mt-2 space-y-2">
															<textarea
																bind:value={replyEditDraft}
																maxlength="1000"
																rows="3"
																aria-label="Edit reply"
																class="w-full resize-y border border-white/10 bg-black/20 px-2.5 py-2 text-xs leading-5 text-white outline-none focus:border-orange-200/40"
															></textarea>
															{#if replyEditError}<p role="alert" class="text-[10px] text-red-200">
																	{replyEditError}
																</p>{/if}
															<div class="flex justify-end gap-2">
																<button
																	type="button"
																	onclick={() => (editingReplyId = null)}
																	class="px-2 py-1 text-[10px] text-white/45 hover:text-white"
																	>Cancel</button
																>
																<button
																	type="button"
																	onclick={() => saveReply(reply.id!)}
																	disabled={replySaving}
																	class="bg-orange-200 px-2.5 py-1 text-[10px] font-medium text-[#21160e] disabled:opacity-50"
																	>{replySaving ? 'Saving...' : 'Save'}</button
																>
															</div>
														</div>
													{/if}
												</div>
											{/if}
										</div>
									{/if}
								{/each}
							</div>
						{:else}<p class="mt-3 text-xs text-white/40">No replies yet.</p>{/if}
						{#if replyTarget}<p class="mt-4 text-[10px] text-orange-100/70">
								Replying to {replyTarget.name}<button
									type="button"
									onclick={() => (replyTarget = null)}
									class="ml-2 text-white/45 hover:text-white">Cancel</button
								>
							</p>{/if}
						<form onsubmit={submitReply} class="mt-5 flex gap-2">
							<input
								aria-label="Write a reply"
								bind:value={replyDraft}
								maxlength="1000"
								placeholder="Write a reply..."
								class="min-w-0 flex-1 border-b border-white/10 bg-transparent py-2.5 text-xs text-white outline-none placeholder:text-white/30 focus:border-orange-200/40"
							/><button
								type="submit"
								aria-label="Send reply"
								title="Send reply"
								class="flex h-9 w-9 items-center justify-center border border-white/10 text-white/65 hover:border-orange-200/30 hover:text-orange-100"
								><Send size={14} /></button
							>
						</form>
					</section>
				</div>
			</div>
		</article>
	</main>
	{#if editingPost}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
			<dialog
				open
				aria-labelledby="edit-post-heading"
				class="m-0 w-full max-w-lg border border-white/10 bg-[#111211] p-5 text-white shadow-2xl sm:p-6"
			>
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="font-mono text-[9px] tracking-[0.12em] text-orange-200/70 uppercase">
							Post settings
						</p>
						<h2 id="edit-post-heading" class="mt-1 font-display text-2xl">Edit post</h2>
					</div>
					<button
						type="button"
						onclick={() => (editingPost = false)}
						aria-label="Close edit form"
						class="flex h-9 w-9 items-center justify-center text-white/60 hover:bg-white/5 hover:text-white"
						><X size={17} /></button
					>
				</div>
				<form onsubmit={submitPostEdit} class="mt-5 space-y-4">
					<label class="block text-xs text-white/65"
						>Post text<textarea
							bind:value={editDraftText}
							maxlength="1000"
							rows="5"
							required={data.post.kind === 'text'}
							class="mt-1.5 w-full resize-y border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-5 text-white outline-none focus:border-orange-200/40"
						></textarea></label
					>
					{#if data.post.kind !== 'text'}<label class="block text-xs text-white/65"
							>HTTPS media or resource URL<input
								bind:value={editDraftUrl}
								type="url"
								inputmode="url"
								required
								placeholder="https://"
								class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-200/40"
							/></label
						>{/if}
					{#if editError}<p
							role="alert"
							class="border border-red-300/15 bg-red-300/[0.04] px-3 py-2.5 text-xs text-red-200"
						>
							{editError}
						</p>{/if}
					<div class="flex justify-end gap-2 border-t border-white/[0.08] pt-4">
						<button
							type="button"
							onclick={() => (editingPost = false)}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:text-white"
							>Cancel</button
						>
						<button
							type="submit"
							disabled={editSubmitting}
							class="bg-orange-200 px-4 py-2 text-xs font-semibold text-[#21160e] hover:bg-orange-100 disabled:opacity-50"
							>{editSubmitting ? 'Saving...' : 'Save changes'}</button
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
	{#if toast}<div
			role="status"
			class="fixed right-4 bottom-20 z-50 border border-white/10 bg-[#1b1d1b] px-4 py-2.5 text-xs text-white/85 shadow-xl"
		>
			{toast}
		</div>{/if}
</div>

<style>
	.community-post-page {
		min-height: 100dvh;
		background-image: radial-gradient(
			ellipse at 52% -24%,
			rgba(249, 115, 22, 0.075),
			transparent 56%
		);
	}
</style>
