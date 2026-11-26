<script lang="ts">
	import { Copy, Link, Pencil, Trash2 } from '@lucide/svelte';
	import type { CommunityPost } from '../community.js';
	import CommunityReportButton from './CommunityReportButton.svelte';

	interface Props {
		post: CommunityPost;
		viewerUsername?: string;
		returnTo: string;
		onClose: () => void;
		onEdit: () => void;
		onDelete: () => void;
		onToast: (message: string) => void;
	}

	let { post, viewerUsername, returnTo, onClose, onEdit, onDelete, onToast }: Props = $props();

	async function copyText(value: string, successMessage: string) {
		try {
			if (!navigator.clipboard) throw new Error('Clipboard access is unavailable.');
			await navigator.clipboard.writeText(value);
			onClose();
			onToast(successMessage);
		} catch (error) {
			onToast(error instanceof Error ? error.message : 'Could not copy to clipboard.');
		}
	}

	function copyPostText() {
		if (!post.text) {
			onToast('This post has no text to copy.');
			return;
		}
		void copyText(post.text, 'Post text copied.');
	}

	function copyPostLink() {
		void copyText(
			`${window.location.origin}/p/${encodeURIComponent(post.id)}`,
			'Post link copied.'
		);
	}
</script>

<div class="community-post-options-overlay fixed inset-0 z-[80] md:hidden">
	<button
		type="button"
		class="absolute inset-0 h-full w-full bg-black/70"
		onclick={onClose}
		aria-label="Close post options"
	></button>
	<div
		class="community-post-options-sheet absolute inset-x-0 bottom-0 m-0 border border-white/10 bg-[#111211] px-5 pt-3 pb-[max(22px,env(safe-area-inset-bottom))] text-white shadow-2xl"
		role="dialog"
		aria-modal="true"
		aria-label="Post options"
	>
		<div class="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20"></div>
		<div>
			{#if post.canManage}
				<button
					type="button"
					onclick={() => {
						onClose();
						onEdit();
					}}
					class="community-post-option-row"><Pencil size={19} />Edit post</button
				>
			{/if}
			<button type="button" onclick={copyPostText} class="community-post-option-row"
				><Copy size={19} />Copy post text</button
			>
			<button type="button" onclick={copyPostLink} class="community-post-option-row"
				><Link size={19} />Copy post link</button
			>
			{#if post.canManage}
				<button
					type="button"
					onclick={() => {
						onClose();
						onDelete();
					}}
					class="community-post-option-row danger"><Trash2 size={19} />Delete post</button
				>
			{/if}
			<CommunityReportButton
				targetType="post"
				targetId={post.id}
				targetLabel="post"
				{viewerUsername}
				{returnTo}
				variant="menu"
			/>
		</div>
	</div>
</div>

<style>
	.community-post-options-overlay {
		display: none;
	}

	.community-post-options-sheet {
		border-right: 0;
		border-bottom: 0;
		border-left: 0;
		border-radius: 28px 28px 0 0;
	}

	.community-post-option-row {
		display: flex;
		width: 100%;
		height: 64px;
		align-items: center;
		gap: 18px;
		border-radius: 0;
		padding: 0 8px;
		color: rgba(255, 255, 255, 0.9);
		font-size: 15px;
		text-align: left;
	}

	.community-post-option-row:active {
		background: rgba(255, 255, 255, 0.06);
	}

	.community-post-option-row.danger {
		color: rgba(255, 185, 194, 0.9);
	}

	.community-post-option-row.danger:active {
		background: rgba(248, 113, 113, 0.07);
	}

	@media (max-width: 767px) {
		.community-post-options-overlay {
			display: flex;
		}
	}
</style>
