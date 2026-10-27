<script lang="ts">
	import { goto } from '$app/navigation';
	import { Flame, Globe, UsersRound } from '@lucide/svelte';

	type FeedTab = 'Following' | 'Community' | 'Explore';
	interface Props {
		activeTab: FeedTab;
	}

	let { activeTab }: Props = $props();
	const tabs: FeedTab[] = ['Following', 'Community', 'Explore'];

	function selectTab(tab: FeedTab) {
		void goto(`/home?feed=${tab.toLowerCase()}`);
	}
</script>

<nav
	class="community-feed-tabs flex items-center justify-center gap-1 px-3"
	aria-label="Community feeds"
>
	{#each tabs as tab (tab)}
		<button
			type="button"
			onclick={() => selectTab(tab)}
			aria-current={activeTab === tab ? 'page' : undefined}
			class={`flex h-full items-center gap-2 border-b-2 px-5 text-[12px] transition-colors ${activeTab === tab ? 'border-orange-400 text-white' : 'border-transparent text-white/45 hover:text-white/80'}`}
		>
			{#if tab === 'Following'}<UsersRound size={15} />{:else if tab === 'Community'}<Flame
					size={15}
				/>{:else}<Globe size={15} />{/if}
			{tab}
		</button>
	{/each}
</nav>
