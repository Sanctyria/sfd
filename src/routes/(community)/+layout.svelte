<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';
	import CommunityHeader from '#lib/community/components/CommunityHeader.svelte';
	import CommunityFeedTabs from '#lib/community/components/CommunityFeedTabs.svelte';
	import CommunityRightRail from '#lib/community/components/CommunityRightRail.svelte';
	import CommunitySidebar from '#lib/community/components/CommunitySidebar.svelte';

	let { children, data }: LayoutProps = $props();
	let sidebarCollapsed = $state(false);
	let notificationsOpen = $state(false);
	const showFeedTabs = $derived(Boolean(data.communityUser && page.url.pathname === '/home'));
	const showGlobalRightRail = $derived(page.url.pathname !== '/home');
	const activeTab = $derived(
		data.communityUser
			? page.url.searchParams.get('feed') === 'explore'
				? 'Explore'
				: page.url.searchParams.get('feed') === 'community'
					? 'Community'
					: 'Following'
			: page.url.searchParams.get('feed') === 'explore'
				? 'Explore'
				: 'Community'
	);
</script>

<div
	class="community-route-layout"
	class:sidebar-collapsed={sidebarCollapsed}
	class:has-community-user={Boolean(data.communityUser)}
	class:has-feed-tabs={showFeedTabs}
	class:community-home-layout={!showGlobalRightRail}
>
	<CommunitySidebar
		bind:collapsed={sidebarCollapsed}
		communityUser={data.communityUser}
		communities={data.communityDirectory}
		unreadCount={data.communityUnreadCount}
	/>
	<div class="community-route-header">
		<CommunityHeader
			communityUser={data.communityUser}
			notifications={data.communityNotifications}
			unreadCount={data.communityUnreadCount}
			bind:notificationsOpen
		/>
	</div>
	{#if showFeedTabs}
		<CommunityFeedTabs {activeTab} />
	{/if}
	<div class="community-route-body">
		<div class="community-route-main">
			{@render children()}
		</div>
		{#if showGlobalRightRail}
			<CommunityRightRail
				user={data.communityUser}
				communities={data.communityDirectory}
				weeklyVoices={data.communityWeeklyVoices}
				journalArticles={data.communityJournalArticles}
			/>
		{/if}
	</div>
</div>
