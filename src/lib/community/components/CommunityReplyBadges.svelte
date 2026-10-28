<script lang="ts">
	import { Crown, PenLine, ShieldCheck } from '@lucide/svelte';
	import type { CommunityReply } from '../community.js';

	let { reply }: { reply: CommunityReply } = $props();
</script>

{#if reply.isPostAuthor}
	<span
		class="mr-1 inline-flex items-center gap-0.5 text-[9px] text-sky-200/75"
		title="Author of this post"><PenLine size={10} />Author</span
	>
{/if}
{#if reply.isCommunityOwner}
	<span
		class="mr-1 inline-flex items-center gap-0.5 text-[9px] text-orange-200/75"
		title="Community owner"><Crown size={10} />Owner</span
	>
{/if}
{#if reply.isCommunityModerator}
	<span
		class="mr-1 inline-flex items-center gap-0.5 text-[9px] text-emerald-200/75"
		title="Community moderator"><ShieldCheck size={10} />Mod</span
	>
{/if}
