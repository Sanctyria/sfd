<script lang="ts">
	import { MessageSquare, Search } from '@lucide/svelte';
	import CommunityMobileSubheader from '#lib/community/components/CommunityMobileSubheader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let query = $state('');
	const chats = $derived(
		data.chats.filter((chat) =>
			`${chat.name} ${chat.lastMessageBody ?? ''}`
				.toLowerCase()
				.includes(query.trim().toLowerCase())
		)
	);

	function formatTime(value: string | null): string {
		if (!value) return '';
		const date = new Date(value);
		const now = new Date();
		if (date.toDateString() === now.toDateString()) {
			return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
		}
		return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
	}
</script>

<svelte:head
	><title>Community chats | Sanctyria Community</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>

<main
	class="mx-auto min-h-[calc(100dvh-62px)] w-full max-w-3xl px-4 pt-6 pb-28 text-[#f1efe9] max-md:pt-0 sm:px-8"
>
	<CommunityMobileSubheader
		title="Community chats"
		subtitle="Stay connected with your circles"
		backHref="/home"
	/>
	<header class="border-b border-white/[0.08] pb-5 max-md:pt-5">
		<p class="font-mono text-[9px] tracking-[0.15em] text-orange-200/70 uppercase max-md:hidden">
			Your circles
		</p>
		<h1 class="mt-1 font-display text-4xl text-white max-md:hidden">Chats</h1>
		<label
			class="mt-5 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3"
		>
			<Search size={15} class="text-white/40" />
			<input
				bind:value={query}
				aria-label="Search community chats"
				placeholder="Search messages or communities"
				class="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/35"
			/>
		</label>
	</header>
	{#if chats.length}
		<ul class="divide-y divide-white/[0.07]">
			{#each chats as chat (chat.slug)}
				<li>
					<a
						href={`/chats/${encodeURIComponent(chat.slug)}`}
						class="flex items-center gap-3 py-4 transition-colors hover:bg-white/[0.025]"
					>
						<span
							class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04] text-orange-200"
						>
							{#if chat.avatarUrl}<img
									src={chat.avatarUrl}
									alt=""
									class="h-full w-full object-cover"
								/>{:else}<MessageSquare size={18} />{/if}
						</span>
						<span class="min-w-0 flex-1">
							<span class="flex items-center justify-between gap-3"
								><strong class="truncate text-sm font-medium text-white/90">{chat.name}</strong
								><time class="shrink-0 text-[10px] text-white/35"
									>{formatTime(chat.lastMessageAt)}</time
								></span
							>
							<span class="mt-1 block truncate text-xs text-white/45"
								>{chat.lastMessageBody ??
									(chat.lastMessageMediaKind
										? 'Shared media'
										: `${chat.memberCount} members`)}</span
							>
						</span>
						{#if chat.unreadCount}<span
								class="grid h-5 min-w-5 place-items-center rounded-full bg-orange-400 px-1 text-[9px] font-semibold text-[#17100d]"
								>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</span
							>{/if}
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="py-16 text-center">
			<MessageSquare size={22} class="mx-auto text-orange-200/60" />
			<h2 class="mt-4 font-display text-2xl">
				{query ? 'No matching chats' : 'No community chats yet'}
			</h2>
			<p class="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/45">
				{query ? 'Try another community name.' : 'Join a community to take part in its chat.'}
			</p>
			{#if !query}<a
					href="/home?feed=explore"
					class="mt-5 inline-block rounded-full bg-[#ed6a36] px-5 py-3 text-xs font-medium text-[#1a100b]"
					>Explore communities</a
				>{/if}
		</div>
	{/if}
</main>
