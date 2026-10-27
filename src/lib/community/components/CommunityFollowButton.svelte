<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { UserPlus, UserRoundCheck } from '@lucide/svelte';
	import { communityApi } from '../communityApi.js';

	interface Props {
		authorUsername: string;
		viewerUsername?: string | null;
		initialFollowing?: boolean;
	}

	let { authorUsername, viewerUsername = null, initialFollowing = false }: Props = $props();
	let following = $derived(initialFollowing);
	let saving = $state(false);

	async function toggleFollow() {
		if (!viewerUsername) {
			void goto(`/login?returnTo=${encodeURIComponent(page.url.pathname + page.url.search)}`);
			return;
		}
		if (saving || viewerUsername === authorUsername) return;
		saving = true;
		try {
			const result = await communityApi<{ following: boolean }>(
				fetch,
				`profiles/${encodeURIComponent(authorUsername)}/follow`,
				{ method: following ? 'DELETE' : 'POST' }
			);
			following = result.following;
		} catch (error) {
			console.error(`Could not update follow state for @${authorUsername}.`, error);
		} finally {
			saving = false;
		}
	}
</script>

{#if viewerUsername !== authorUsername}
	<button
		type="button"
		onclick={toggleFollow}
		disabled={saving}
		aria-pressed={following}
		aria-label={`${following ? 'Unfollow' : 'Follow'} @${authorUsername}`}
		title={`${following ? 'Unfollow' : 'Follow'} @${authorUsername}`}
		class={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] transition-colors disabled:opacity-50 ${following ? 'border-white/10 text-white/50 hover:border-red-200/25 hover:text-red-100' : 'border-orange-200/20 text-orange-100 hover:border-orange-200/45 hover:bg-orange-200/[0.07]'}`}
	>
		{#if following}<UserRoundCheck size={11} />{:else}<UserPlus size={11} />{/if}
		{following ? 'Following' : 'Follow'}
	</button>
{/if}
