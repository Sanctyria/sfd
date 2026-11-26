<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import {
		ArrowLeft,
		Bell,
		Bookmark,
		Compass,
		Flame,
		LogOut,
		Menu,
		MessageSquare,
		Search,
		UserRound,
		UserRoundX,
		X
	} from '@lucide/svelte';
	import { page } from '$app/state';
	import {
		communityApi,
		type ApiNotification,
		type ApiNotificationsResponse
	} from '../communityApi';

	interface CommunityUser {
		username: string;
		displayName: string;
		initials?: string | null;
		avatarColor?: string | null;
	}
	interface Props {
		communityUser?: CommunityUser | null;
		notifications?: ApiNotification[];
		unreadCount?: number;
		notificationsOpen?: boolean;
	}

	let {
		communityUser = null,
		notifications = [],
		unreadCount = 0,
		notificationsOpen = $bindable(false)
	}: Props = $props();
	let previewItems = $state<ApiNotification[]>([]);
	let previewUnreadCount = $state(0);
	let accountMenuOpen = $state(false);
	let signingOut = $state(false);
	let accountError = $state('');
	let mobileNavigationOpen = $state(false);
	let searchInput = $state<HTMLInputElement>();
	const isHome = $derived(page.url.pathname === '/home');
	const isMobileMenuPage = $derived(
		page.url.pathname === '/search' || page.url.pathname === '/saved'
	);

	$effect(() => {
		previewItems = notifications;
		previewUnreadCount = unreadCount;
	});

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();
		const query = searchInput?.value.trim() ?? '';
		void goto(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
	}

	function handleNotificationsClick() {
		if (window.matchMedia('(max-width: 767px)').matches) {
			void goto('/notifications');
			return;
		}
		void toggleNotifications();
	}

	async function toggleNotifications() {
		notificationsOpen = !notificationsOpen;
		accountMenuOpen = false;
		if (!notificationsOpen || !communityUser) return;
		try {
			const latest = await communityApi<ApiNotificationsResponse>(fetch, 'notifications?limit=5');
			previewItems = latest.items;
			previewUnreadCount = latest.unreadCount;
		} catch {
			previewItems = notifications;
			previewUnreadCount = unreadCount;
		}
	}

	async function signOut() {
		if (signingOut) return;
		signingOut = true;
		accountError = '';
		try {
			await communityApi(fetch, 'auth/session', { method: 'DELETE' });
			accountMenuOpen = false;
			await invalidateAll();
			await goto('/home');
		} catch (error) {
			accountError = error instanceof Error ? error.message : 'Could not sign out.';
		} finally {
			signingOut = false;
		}
	}

	function notificationText(notification: ApiNotification): {
		title: string;
		detail: string;
		href: string;
	} {
		const actorName = payloadString(notification, 'actorName') ?? 'A community member';
		const preview = payloadString(notification, 'preview');
		const communitySlug = payloadString(notification, 'communitySlug');
		const targetKind = payloadString(notification, 'targetKind');
		const replyId = payloadString(notification, 'replyId');
		let title = 'Community update';
		let href = '/notifications';
		if (notification.type === 'reply') {
			title =
				targetKind === 'reply'
					? `${actorName} replied to your reply`
					: `${actorName} replied to your post`;
			if (notification.entityId) {
				href = `/p/${encodeURIComponent(notification.entityId)}${targetKind === 'reply' && replyId ? `#${encodeURIComponent(replyId)}` : ''}`;
			}
		} else if (notification.type === 'reaction') {
			title = `${actorName} reacted to your post`;
			if (notification.entityId) href = `/p/${encodeURIComponent(notification.entityId)}`;
		} else if (notification.type === 'mention') {
			title = `${actorName} mentioned you`;
			if (notification.entityId) href = `/p/${encodeURIComponent(notification.entityId)}`;
		} else if (notification.type === 'community' && communitySlug) {
			title = payloadString(notification, 'title') ?? 'Community membership updated';
			href = `/r/${encodeURIComponent(communitySlug)}`;
		} else if (notification.type === 'system') {
			const username = payloadString(notification, 'actorUsername');
			title =
				payloadString(notification, 'action') === 'follow'
					? `${actorName} followed you`
					: 'Account update';
			if (username) href = `/u/${encodeURIComponent(username)}`;
		}
		return {
			title,
			detail:
				preview ?? payloadString(notification, 'detail') ?? 'Open to view this community update.',
			href
		};
	}

	function payloadString(notification: ApiNotification, key: string): string | null {
		const value = notification.payload[key];
		return typeof value === 'string' ? value : null;
	}

	function timeSince(createdAt: string): string {
		const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(createdAt)) / 60_000));
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h`;
		return `${Math.floor(hours / 24)}d`;
	}
</script>

<header
	class="community-header border-b border-white/[0.07] bg-[#090a0a]/95 backdrop-blur-xl"
	class:mobile-menu-page={isMobileMenuPage}
>
	<div class="community-header-main flex items-center gap-4 px-4 sm:px-6">
		<a
			href="/home"
			class="community-header-brand flex w-[200px] shrink-0 items-center gap-2"
			aria-label="Sanctyria Community home"
		>
			{#if isHome}
				<img src="/assets/dlst.gif" alt="" class="h-7 w-7 object-contain" />
			{:else}
				<ArrowLeft size={22} class="mobile-back-icon" />
				<img src="/assets/dlst.gif" alt="" class="desktop-home-mark h-7 w-7 object-contain" />
			{/if}
			<span class="font-display text-[22px] leading-none">Sanctyria</span>
			<span class="hidden font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase lg:inline"
				>Community</span
			>
		</a>
		{#if isMobileMenuPage}
			<button
				type="button"
				onclick={() => (mobileNavigationOpen = true)}
				aria-label="Open community navigation"
				aria-expanded={mobileNavigationOpen}
				aria-controls="mobile-community-navigation"
				class="mobile-menu-trigger"><Menu size={23} strokeWidth={2} /></button
			>
		{/if}

		<form
			class="community-header-search mx-auto flex max-w-xl min-w-0 flex-1 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.06] px-4 py-2"
			onsubmit={submitSearch}
			role="search"
		>
			<Search size={16} class="shrink-0 text-white/45" />
			<input
				bind:this={searchInput}
				value={page.url.searchParams.get('q') ?? ''}
				aria-label="Search Sanctyria users, communities, and posts"
				placeholder="Search users, communities, and posts"
				class="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/40"
			/>
			<button type="submit" class="sr-only">Search</button>
		</form>

		{#if communityUser}
			<div class="community-header-actions ml-auto flex shrink-0 items-center gap-2">
				<a
					href="/chats"
					class="mobile-header-action"
					aria-label="Community chats"
					title="Community chats"><MessageSquare size={19} /></a
				>
				<button
					type="button"
					onclick={handleNotificationsClick}
					class="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
					aria-label="Notifications"
					aria-expanded={notificationsOpen}
					aria-controls="community-notification-preview"
				>
					<Bell size={16} />
					{#if previewUnreadCount > 0}
						<span
							class="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-orange-400 max-md:hidden"
						></span>
						<span class="mobile-notification-count md:hidden"
							>{previewUnreadCount > 99 ? '99+' : previewUnreadCount}</span
						>
					{/if}
				</button>
				<button
					type="button"
					onclick={() => {
						accountMenuOpen = !accountMenuOpen;
						notificationsOpen = false;
					}}
					class="community-account-trigger shrink-0 border border-white/10 px-3 py-2 text-[11px] text-white/65 transition-colors hover:border-white/25 hover:text-white"
					aria-label="Account menu"
					aria-expanded={accountMenuOpen}
					aria-controls="community-account-menu"
					><UserRound size={16} class="md:hidden" /><span class="hidden md:inline">Account</span
					></button
				>
			</div>
		{:else}
			<div class="community-header-actions ml-auto flex shrink-0 items-center gap-2">
				<a href="/signup" class="community-header-signup">Sign up</a>
				<a href="/login" class="community-header-login">Log in</a>
			</div>
		{/if}
	</div>
</header>

{#if mobileNavigationOpen}
	<div class="mobile-navigation-overlay fixed inset-0 z-[80] md:hidden">
		<button
			type="button"
			class="absolute inset-0 h-full w-full bg-black/70"
			onclick={() => (mobileNavigationOpen = false)}
			aria-label="Close community navigation"
		></button>
		<div
			id="mobile-community-navigation"
			role="dialog"
			aria-modal="true"
			aria-label="Community navigation"
			class="mobile-navigation-drawer absolute inset-y-0 left-0 flex w-[min(84vw,340px)] flex-col border-r border-white/10 bg-[#101110] px-5 pt-[max(18px,env(safe-area-inset-top))] pb-[max(18px,env(safe-area-inset-bottom))] text-white shadow-2xl"
		>
			<div class="flex items-center justify-between border-b border-white/[0.08] pb-4">
				<a
					href="/home"
					onclick={() => (mobileNavigationOpen = false)}
					class="flex items-center gap-2 font-display text-xl"
				>
					<img src="/assets/dlst.gif" alt="" class="h-7 w-7 object-contain" />
					Sanctyria
				</a>
				<button
					type="button"
					onclick={() => (mobileNavigationOpen = false)}
					aria-label="Close community navigation"
					class="grid h-9 w-9 place-items-center rounded-full text-white/60"><X size={18} /></button
				>
			</div>
			<nav class="mt-4 grid gap-1" aria-label="Community pages">
				<a
					href="/home"
					onclick={() => (mobileNavigationOpen = false)}
					class="mobile-navigation-link"><Flame size={17} />Home</a
				>
				<a
					href="/home?feed=explore&view=communities"
					onclick={() => (mobileNavigationOpen = false)}
					class="mobile-navigation-link"><Compass size={17} />Explore communities</a
				>
				<a
					href="/search"
					onclick={() => (mobileNavigationOpen = false)}
					class="mobile-navigation-link"><Search size={17} />Search</a
				>
				<a
					href="/notifications"
					onclick={() => (mobileNavigationOpen = false)}
					class="mobile-navigation-link"><Bell size={17} />Notifications</a
				>
				<a
					href="/saved"
					onclick={() => (mobileNavigationOpen = false)}
					class="mobile-navigation-link"><Bookmark size={17} />Saved posts</a
				>
				{#if communityUser}
					<a
						href="/chats"
						onclick={() => (mobileNavigationOpen = false)}
						class="mobile-navigation-link"><MessageSquare size={17} />Community chats</a
					>
					<a
						href={`/u/${encodeURIComponent(communityUser.username)}`}
						onclick={() => (mobileNavigationOpen = false)}
						class="mobile-navigation-link"><UserRound size={17} />Profile and settings</a
					>
					<a
						href="/blocked-profiles"
						onclick={() => (mobileNavigationOpen = false)}
						class="mobile-navigation-link"><UserRoundX size={17} />Blocked profiles</a
					>
				{:else}
					<a
						href="/login"
						onclick={() => (mobileNavigationOpen = false)}
						class="mobile-navigation-link"><UserRound size={17} />Sign in</a
					>
				{/if}
			</nav>
		</div>
	</div>
{/if}

{#if accountMenuOpen && communityUser}
	<button
		type="button"
		class="fixed inset-0 z-40 cursor-default"
		aria-label="Close account menu"
		onclick={() => (accountMenuOpen = false)}
	></button>
	<div
		id="community-account-menu"
		class="community-header-popover fixed right-4 z-50 w-[min(280px,calc(100vw-2rem))] border border-white/10 bg-[#111211] p-3 shadow-2xl sm:right-6"
	>
		<div class="border-b border-white/[0.07] px-2 pb-3">
			<p class="truncate text-xs font-medium text-white/90">{communityUser.displayName}</p>
			<p class="mt-1 truncate text-[10px] text-white/40">@{communityUser.username}</p>
		</div>
		<a
			href={`/u/${encodeURIComponent(communityUser.username)}`}
			onclick={() => (accountMenuOpen = false)}
			class="mt-2 flex items-center gap-2.5 px-2 py-2.5 text-xs text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white"
			><UserRound size={14} />Profile and settings</a
		>
		<a
			href="/account"
			onclick={() => (accountMenuOpen = false)}
			class="flex items-center gap-2.5 px-2 py-2.5 text-xs text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white"
			>Account email</a
		>
		<a
			href="/notification-settings"
			onclick={() => (accountMenuOpen = false)}
			class="flex items-center gap-2.5 px-2 py-2.5 text-xs text-white/65 transition-colors hover:bg-white/[0.05] hover:text-white"
			>Notification settings</a
		>
		{#if accountError}<p class="px-2 py-1 text-[10px] text-red-300" role="alert">
				{accountError}
			</p>{/if}
		<button
			type="button"
			onclick={signOut}
			disabled={signingOut}
			class="flex w-full items-center gap-2.5 border-t border-white/[0.07] px-2 py-2.5 text-left text-xs text-white/55 transition-colors hover:text-white disabled:opacity-50"
			><LogOut size={14} />{signingOut ? 'Signing out...' : 'Sign out'}</button
		>
	</div>
{/if}

{#if notificationsOpen}
	<div
		id="community-notification-preview"
		class="community-header-popover fixed right-4 z-50 w-[min(340px,calc(100vw-2rem))] border border-white/10 bg-[#111211] p-4 shadow-2xl sm:right-6"
	>
		<div class="mb-3 flex items-center justify-between">
			<h2 class="font-display text-xl">Recent activity</h2>
			<button
				type="button"
				onclick={() => (notificationsOpen = false)}
				aria-label="Close notifications"
				class="text-white/45 hover:text-white"><X size={16} /></button
			>
		</div>
		{#if !communityUser}
			<p class="border-t border-white/[0.07] py-3 text-xs leading-5 text-white/55">
				<a
					href="/login"
					onclick={() => (notificationsOpen = false)}
					class="text-orange-100 hover:text-white">Sign in</a
				> to see your notifications.
			</p>
		{:else if previewItems.length}
			{#each previewItems as notification (notification.id)}
				{@const item = notificationText(notification)}
				<a
					href={item.href}
					onclick={() => (notificationsOpen = false)}
					class="flex items-start gap-3 border-t border-white/[0.07] py-3 transition-colors hover:bg-white/[0.025]"
				>
					<span
						class={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${notification.readAt ? 'bg-white/20' : 'bg-orange-300'}`}
					></span>
					<span class="min-w-0 flex-1">
						<span class="block text-xs leading-5 text-white/80">{item.title}</span>
						<span class="mt-0.5 block truncate text-[10px] text-white/40">{item.detail}</span>
					</span>
					<time class="shrink-0 text-[9px] text-white/35">{timeSince(notification.createdAt)}</time>
				</a>
			{/each}
		{:else}
			<p class="border-t border-white/[0.07] py-3 text-xs leading-5 text-white/45">
				No notifications yet.
			</p>
		{/if}
		<a
			href="/notifications"
			onclick={() => (notificationsOpen = false)}
			class="mt-2 block border-t border-white/[0.07] pt-3 text-[10px] text-orange-100/70 hover:text-orange-100"
			>View all notifications</a
		>
	</div>
{/if}

<style>
	.mobile-menu-trigger {
		display: none;
	}

	.mobile-notification-count {
		position: absolute;
		top: -4px;
		right: -4px;
		display: grid;
		min-width: 20px;
		height: 20px;
		place-items: center;
		border-radius: 999px;
		background: #f97316;
		padding-inline: 4px;
		color: #17110e;
		font-size: 9px;
		font-weight: 700;
	}

	.mobile-navigation-drawer {
		max-height: 100dvh;
		overflow-y: auto;
	}

	.mobile-navigation-link {
		display: flex;
		min-height: 48px;
		align-items: center;
		gap: 12px;
		border-radius: 10px;
		padding: 0 12px;
		color: rgba(255, 255, 255, 0.72);
		font-size: 13px;
	}

	.mobile-navigation-link:active,
	.mobile-navigation-link:hover {
		background: rgba(255, 255, 255, 0.06);
		color: white;
	}

	@media (max-width: 767px) {
		.community-header.mobile-menu-page .community-header-brand {
			display: none;
		}

		.community-header.mobile-menu-page .community-account-trigger {
			display: none;
		}

		.community-header.mobile-menu-page .mobile-menu-trigger {
			display: grid;
			width: 28px;
			height: 40px;
			flex: 0 0 auto;
			place-items: center;
			color: rgba(255, 255, 255, 0.9);
		}
	}
</style>
