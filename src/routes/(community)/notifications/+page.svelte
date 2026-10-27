<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { AtSign, Bell, BookOpen, Flame, MessageCircle, UsersRound } from '@lucide/svelte';
	import {
		communityApi,
		type ApiNotification,
		type ApiNotificationsResponse
	} from '#lib/community/communityApi.js';
	import CommunityBottomNav from '#lib/community/components/CommunityBottomNav.svelte';
	import { subscribeCommunityRealtime } from '#lib/community/communityRealtime.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type NotificationFilter = 'All' | 'Unread';

	let filter = $state<NotificationFilter>('All');
	let readIds = $state<string[]>([]);
	let additionalNotifications = $state<ApiNotification[]>([]);
	let notificationsCursor = $state<string | null>(null);
	let loadingMore = $state(false);
	let allReadLocally = $state(false);
	let toast = $state('');
	let loadedPageKey = '';
	const allNotifications = $derived([...data.items, ...additionalNotifications]);
	const notifications = $derived(allNotifications.map(toNotificationView));
	const unreadCount = $derived(
		allReadLocally
			? 0
			: Math.max(
					0,
					data.unreadCount -
						allNotifications.filter(
							(notification) => notification.readAt === null && readIds.includes(notification.id)
						).length
				)
	);
	const filteredNotifications = $derived(
		notifications.filter(
			(notification) =>
				filter === 'All' || (!notification.read && !readIds.includes(notification.id))
		)
	);

	$effect(() => {
		const pageKey = data.items.map((notification) => notification.id).join(':');
		if (pageKey === loadedPageKey) return;
		loadedPageKey = pageKey;
		additionalNotifications = [];
		notificationsCursor = data.nextCursor;
		readIds = [];
		allReadLocally = false;
	});

	onMount(() =>
		subscribeCommunityRealtime(() => {
			void invalidate('app:notifications');
		})
	);

	function payloadString(notification: ApiNotification, key: string): string | null {
		const value = notification.payload[key];
		return typeof value === 'string' ? value : null;
	}

	function toNotificationView(notification: ApiNotification) {
		const actorName = payloadString(notification, 'actorName') ?? 'A community member';
		const preview = payloadString(notification, 'preview');
		const action = payloadString(notification, 'action');
		const actorUsername = payloadString(notification, 'actorUsername');
		const communitySlug = payloadString(notification, 'communitySlug');
		const targetKind = payloadString(notification, 'targetKind');
		const replyId = payloadString(notification, 'replyId');
		let title = 'Community update';
		let href = '/home';
		if (notification.type === 'reply') {
			title =
				targetKind === 'reply'
					? `${actorName} replied to your reply`
					: `${actorName} replied to your post`;
			if (notification.entityId) {
				href = `/p/${notification.entityId}${targetKind === 'reply' && replyId ? `#${encodeURIComponent(replyId)}` : ''}`;
			}
		} else if (notification.type === 'reaction') {
			title = `${actorName} reacted to your post`;
			if (notification.entityId) href = `/p/${notification.entityId}`;
		} else if (notification.type === 'mention') {
			title = `${actorName} mentioned you`;
			if (notification.entityId) href = `/p/${notification.entityId}`;
		} else if (notification.type === 'community' && communitySlug) {
			title = payloadString(notification, 'title') ?? 'Community membership updated';
			href = `/r/${communitySlug}`;
		} else if (notification.type === 'system' && actorUsername) {
			title = action === 'follow' ? `${actorName} followed you` : 'Account update';
			href = `/u/${encodeURIComponent(actorUsername)}`;
		}
		return {
			id: notification.id,
			kind: notification.type,
			title,
			detail:
				preview ?? payloadString(notification, 'detail') ?? 'Open to view this community update.',
			time: timeSince(notification.createdAt),
			href,
			read: notification.readAt !== null
		};
	}

	function timeSince(createdAt: string): string {
		const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(createdAt)) / 60_000));
		if (minutes < 60) return `${minutes} min ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
		const days = Math.floor(hours / 24);
		return days === 1 ? 'Yesterday' : `${days} days ago`;
	}

	async function markAllRead() {
		const previous = readIds;
		readIds = allNotifications.map((notification) => notification.id);
		allReadLocally = true;
		try {
			await communityApi(fetch, 'notifications/read-all', { method: 'POST' });
			await invalidate('app:notifications');
		} catch (error) {
			readIds = previous;
			allReadLocally = false;
			showToast(error instanceof Error ? error.message : 'Could not mark notifications read.');
		}
	}

	async function markRead(id: string) {
		if (readIds.includes(id) || allNotifications.find((item) => item.id === id)?.readAt) return;
		readIds = [...readIds, id];
		try {
			await communityApi(fetch, `notifications/${encodeURIComponent(id)}`, {
				method: 'PATCH',
				body: JSON.stringify({ read: true })
			});
		} catch (error) {
			readIds = readIds.filter((readId) => readId !== id);
			showToast(error instanceof Error ? error.message : 'Could not mark notification read.');
		}
	}

	async function loadMore() {
		if (!notificationsCursor || loadingMore) return;
		loadingMore = true;
		try {
			const page = await communityApi<ApiNotificationsResponse>(
				fetch,
				`notifications?limit=50&cursor=${encodeURIComponent(notificationsCursor)}`
			);
			additionalNotifications = [...additionalNotifications, ...page.items];
			notificationsCursor = page.nextCursor;
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not load notifications.');
		} finally {
			loadingMore = false;
		}
	}

	function showToast(message: string) {
		toast = message;
		window.setTimeout(() => (toast = ''), 2200);
	}
</script>

<svelte:head>
	<title>Notifications | Sanctyria Community</title>
	<meta name="description" content="Recent replies, mentions, and community activity." />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<div class="min-h-screen bg-[#090a0a] text-[#f1efe9]">
	<main class="mx-auto w-full max-w-6xl px-4 pt-7 pb-28 sm:px-8 md:pt-10 md:pb-12 xl:px-12">
		<header
			class="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-5"
		>
			<div>
				<p class="font-mono text-[9px] tracking-[0.15em] text-orange-200/70 uppercase">
					Community activity
				</p>
				<h1 class="mt-1 font-display text-4xl text-white">Notifications</h1>
				<p class="mt-2 text-xs text-white/45">Replies, mentions, and updates from your circles.</p>
			</div>
			<button
				type="button"
				onclick={markAllRead}
				disabled={!unreadCount}
				class="inline-flex items-center gap-2 border border-white/10 px-3 py-2 text-[11px] text-white/65 transition-colors hover:border-white/20 hover:text-white disabled:cursor-default disabled:opacity-40"
			>
				<Bell size={14} /> Mark all as read
			</button>
		</header>

		<div class="flex items-center justify-between border-b border-white/[0.08]">
			<nav class="flex gap-5" aria-label="Notification filters">
				{#each ['All', 'Unread'] as item (item)}
					<button
						type="button"
						onclick={() => (filter = item as NotificationFilter)}
						aria-current={filter === item ? 'page' : undefined}
						class={`border-b-2 py-3 text-xs transition-colors ${filter === item ? 'border-orange-400 text-white' : 'border-transparent text-white/45 hover:text-white/80'}`}
					>
						{item}
						{#if item === 'Unread' && unreadCount}<span class="ml-1.5 text-[10px] text-orange-200"
								>{unreadCount}</span
							>{/if}
					</button>
				{/each}
			</nav>
			<span class="text-[10px] text-white/35">{unreadCount} unread</span>
		</div>

		{#if filteredNotifications.length}
			<ul class="divide-y divide-white/[0.08]">
				{#each filteredNotifications as notification (notification.id)}
					{@const isRead = notification.read || readIds.includes(notification.id)}
					<li>
						<a
							href={notification.href}
							onclick={() => markRead(notification.id)}
							class={`flex items-start gap-3 py-5 transition-colors hover:bg-white/[0.025] sm:gap-4 sm:px-3 ${isRead ? 'opacity-65' : ''}`}
						>
							<span
								class={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border ${isRead ? 'border-white/10 bg-white/[0.03] text-white/45' : 'border-orange-200/20 bg-orange-200/[0.07] text-orange-100'}`}
							>
								{#if notification.kind === 'reply'}<MessageCircle size={16} />
								{:else if notification.kind === 'community'}<UsersRound size={16} />
								{:else if notification.kind === 'mention'}<AtSign size={16} />
								{:else if notification.kind === 'system'}<BookOpen size={16} />
								{:else}<Flame size={16} />{/if}
							</span>
							<span class="min-w-0 flex-1">
								<span class="flex flex-wrap items-center gap-x-2 gap-y-1">
									<span class="text-xs font-medium text-white/90">{notification.title}</span>
									<time class="text-[10px] text-white/35">{notification.time}</time>
								</span>
								<span class="mt-1 block text-xs leading-5 text-white/50">{notification.detail}</span
								>
							</span>
							{#if !isRead}<span
									class="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-300"
									aria-label="Unread"
								></span>{/if}
						</a>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="py-16 text-center">
				<span
					class="mx-auto flex h-10 w-10 items-center justify-center border border-white/10 text-white/40"
				>
					<Bell size={17} />
				</span>
				<h2 class="mt-4 font-display text-2xl text-white">You’re all caught up</h2>
				<p class="mt-2 text-xs text-white/45">New activity will show up here.</p>
			</div>
		{/if}
		{#if notificationsCursor}
			<div class="flex justify-center border-t border-white/[0.08] py-5">
				<button
					type="button"
					onclick={loadMore}
					disabled={loadingMore}
					class="border border-white/10 px-4 py-2 text-xs text-white/65 transition-colors hover:border-white/25 hover:text-white disabled:opacity-50"
				>
					{loadingMore ? 'Loading…' : 'Load more'}
				</button>
			</div>
		{/if}
	</main>
	{#if toast}
		<div
			role="status"
			aria-live="polite"
			class="fixed right-4 bottom-20 z-50 border border-white/15 bg-[#111312] px-4 py-3 text-xs text-white shadow-xl md:bottom-6"
		>
			{toast}
		</div>
	{/if}
	<CommunityBottomNav
		activeItem="Notifications"
		profileHref={data.communityUser ? `/u/${data.communityUser.username}` : '/login'}
		user={data.communityUser}
	/>
</div>
