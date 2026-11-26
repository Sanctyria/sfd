<script lang="ts">
	import { ArrowUpRight, Copy, MessageCircle, Share2, X } from '@lucide/svelte';
	import { communityApi } from '../communityApi.js';

	interface CommunityOption {
		slug: string;
		name: string;
		avatarUrl?: string | null;
	}

	interface Props {
		postId: string;
		communities: CommunityOption[];
		onClose: () => void;
		onToast: (message: string) => void;
	}

	let { postId, communities, onClose, onToast }: Props = $props();
	let sendingTo = $state('');
	let errorMessage = $state('');

	function postUrl(): string {
		return `${window.location.origin}/p/${encodeURIComponent(postId)}`;
	}

	async function shareOutside() {
		errorMessage = '';
		try {
			if (navigator.share) {
				await navigator.share({ title: 'Share this post', url: postUrl() });
			} else if (navigator.clipboard) {
				await navigator.clipboard.writeText(postUrl());
				onToast('Post link copied');
			} else {
				onToast(postUrl());
			}
			onClose();
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			errorMessage = error instanceof Error ? error.message : 'Could not share this post.';
		}
	}

	async function sendToCommunity(slug: string) {
		if (sendingTo) return;
		sendingTo = slug;
		errorMessage = '';
		try {
			await communityApi(fetch, `communities/${encodeURIComponent(slug)}/chat/messages`, {
				method: 'POST',
				body: JSON.stringify({ sharedItemType: 'post', sharedItemId: postId })
			});
			onToast(
				`Post shared to ${communities.find((community) => community.slug === slug)?.name ?? 'community'}`
			);
			onClose();
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not share this post.';
		} finally {
			sendingTo = '';
		}
	}
</script>

<div
	class="share-sheet-overlay fixed inset-0 z-[90] flex items-end justify-center bg-black/70 md:items-center md:p-4"
>
	<button
		type="button"
		class="absolute inset-0 cursor-default"
		onclick={onClose}
		aria-label="Close share options"
	></button>
	<dialog
		open
		aria-modal="true"
		aria-labelledby="post-share-heading"
		class="share-sheet-panel relative z-10 m-0 w-full max-w-lg border border-white/10 bg-[#111211] px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] text-white shadow-2xl md:rounded-2xl md:pb-5"
	>
		<div class="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 md:hidden"></div>
		<header class="flex items-center justify-between border-b border-white/[0.08] pb-4">
			<h2 id="post-share-heading" class="font-display text-2xl">Share post</h2>
			<button
				type="button"
				onclick={onClose}
				aria-label="Close share options"
				class="grid h-9 w-9 place-items-center rounded-full text-white/55 hover:bg-white/5 hover:text-white"
				><X size={18} /></button
			>
		</header>
		<p class="mt-4 text-[10px] font-medium tracking-[0.12em] text-white/40 uppercase">
			Share outside Sanctity
		</p>
		<div class="mt-2 grid grid-cols-2 gap-2">
			<button
				type="button"
				onclick={shareOutside}
				class="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white/80"
				><Share2 size={15} />Share link <ArrowUpRight size={13} /></button
			>
			<button
				type="button"
				onclick={async () => {
					try {
						if (!navigator.clipboard) {
							errorMessage = 'Copying links is not available in this browser.';
							return;
						}
						await navigator.clipboard.writeText(postUrl());
						onToast('Post link copied');
						onClose();
					} catch (error) {
						errorMessage = error instanceof Error ? error.message : 'Could not copy this link.';
					}
				}}
				class="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs text-white/80"
				><Copy size={15} />Copy link</button
			>
		</div>
		<p class="mt-5 text-[10px] font-medium tracking-[0.12em] text-white/40 uppercase">
			Send to community channel
		</p>
		{#if communities.length}
			<div class="mt-2 max-h-56 divide-y divide-white/[0.07] overflow-y-auto">
				{#each communities as community (community.slug)}
					<button
						type="button"
						onclick={() => sendToCommunity(community.slug)}
						disabled={Boolean(sendingTo)}
						class="flex w-full items-center gap-3 py-3 text-left disabled:opacity-50"
					>
						<span
							class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04] text-orange-200"
						>
							{#if community.avatarUrl}<img
									src={community.avatarUrl}
									alt=""
									class="h-full w-full object-cover"
								/>{:else}<MessageCircle size={16} />{/if}
						</span>
						<span class="min-w-0 flex-1 truncate text-sm text-white/85">{community.name}</span>
						<span class="text-[10px] text-orange-100/70"
							>{sendingTo === community.slug ? 'Sending…' : 'Share'}</span
						>
					</button>
				{/each}
			</div>
		{:else}
			<p
				class="mt-2 rounded-xl border border-white/[0.08] px-3 py-4 text-xs leading-5 text-white/45"
			>
				Join a community to share this post in its chat.
			</p>
		{/if}
		{#if errorMessage}<p role="alert" class="mt-3 text-xs break-words text-red-200">
				{errorMessage}
			</p>{/if}
	</dialog>
</div>

<style>
	@media (max-width: 767px) {
		.share-sheet-panel {
			border-right: 0;
			border-bottom: 0;
			border-left: 0;
			border-radius: 20px 20px 0 0;
		}
	}
</style>
