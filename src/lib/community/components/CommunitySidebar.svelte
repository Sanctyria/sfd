<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		ArrowUpRight,
		Bell,
		Bookmark,
		Flame,
		PanelLeftClose,
		PanelLeftOpen,
		Search,
		ShieldCheck,
		UserRound
	} from '@lucide/svelte';
	import { communityDirectory, communitySlug } from '../community';

	interface CommunityItem {
		slug: string;
		name: string;
		color?: string;
		avatarUrl?: string | null;
		memberCount?: number;
	}

	interface CommunityUser {
		username: string;
		displayName: string;
		initials?: string | null;
		avatarColor?: string | null;
		avatarUrl?: string | null;
		isAdmin?: boolean;
		ember?: number;
		communities?: { role: 'member' | 'moderator' | 'owner' }[];
	}

	interface Props {
		collapsed?: boolean;
		communityUser?: CommunityUser | null;
		communities?: CommunityItem[];
		unreadCount?: number;
	}

	let {
		collapsed = $bindable(false),
		communityUser = null,
		communities = [],
		unreadCount = 0
	}: Props = $props();
	const pathname = $derived(page.url.pathname);
	const communityItems = $derived.by(() => {
		const items: CommunityItem[] = communities.length
			? communities
			: communityDirectory.map((community) => ({
					...community,
					slug: communitySlug(community.name),
					memberCount: 0
				}));
		return [...items].sort((a, b) => (b.memberCount ?? 0) - (a.memberCount ?? 0)).slice(0, 5);
	});
	const canModerate = $derived(
		communityUser?.communities?.some(
			(community) => community.role === 'owner' || community.role === 'moderator'
		) ?? false
	);

	async function signOut() {
		await fetch('/api/community/auth/session', { method: 'DELETE' });
		await goto('/home');
		window.location.reload();
	}
</script>

<aside
	class="community-shared-sidebar sticky top-0 hidden h-dvh max-h-dvh flex-col overflow-y-auto border-r border-white/[0.06] px-3 pb-4 md:flex"
	aria-label="Community sidebar"
>
	<div class="group relative flex h-[62px] shrink-0 items-center border-b border-white/[0.06] px-1">
		<a
			href="/home"
			aria-label="Sanctyria Community home"
			class={`flex min-w-0 items-center gap-2 ${collapsed ? 'justify-center px-0' : 'px-2'}`}
		>
			<img
				src="/assets/dlst.gif"
				alt=""
				class={`shrink-0 object-contain ${collapsed ? 'h-9 w-9' : 'h-7 w-7'}`}
			/>
			{#if !collapsed}<span class="truncate font-display text-lg text-white">Sanctyria</span>{/if}
		</a>
		<button
			type="button"
			onclick={() => (collapsed = !collapsed)}
			aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			aria-expanded={!collapsed}
			title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
			class={`absolute right-1 flex h-8 w-8 shrink-0 items-center justify-center bg-[#090a0a]/90 text-white/60 transition-colors hover:text-white ${collapsed ? '' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}`}
		>
			{#if collapsed}<PanelLeftOpen size={16} />{:else}<PanelLeftClose size={16} />{/if}
		</button>
	</div>
	{#if !communityUser && !collapsed}
		<section class="guest-join-card" aria-labelledby="guest-join-title">
			<div class="guest-join-art" aria-hidden="true"></div>
			<div class="guest-join-content">
				<p class="guest-join-eyebrow"><span></span> A community for makers</p>
				<h2 id="guest-join-title">Make a little space for wonder.</h2>
				<p>
					Share what you’re building, find thoughtful feedback, and meet people who love the details
					as much as you do.
				</p>
				<div class="guest-join-stats" aria-label="Community highlights">
					<div><strong>Make</strong><span>Share work in progress</span></div>
					<div><strong>Connect</strong><span>Find your creative circle</span></div>
				</div>
				<div class="guest-join-interests" aria-label="Community interests">
					<span>Worldbuilding</span><span>Art &amp; craft</span><span>Stories</span>
				</div>
			</div>
			<div class="guest-join-actions">
				<a href="/signup" class="guest-join-button">Join the community <ArrowUpRight size={13} /></a
				>
				<a href="/login" class="guest-join-login">Already a member? Sign in</a>
			</div>
		</section>
	{/if}
	{#if communityUser}
		<nav aria-label="Main community navigation" class="mt-5 space-y-1">
			<a
				href="/home?feed=following"
				aria-current={pathname === '/home' ? 'page' : undefined}
				title={collapsed ? 'Home' : undefined}
				class={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 text-[13px] transition-colors ${pathname === '/home' ? 'bg-white/[0.07] text-white' : 'text-white/55 hover:bg-white/[0.04] hover:text-white'}`}
			>
				<Flame size={16} class="shrink-0 text-orange-300" />{#if !collapsed}<span>Home</span>{/if}
			</a>
			<a
				href="/search"
				title={collapsed ? 'Search' : undefined}
				class={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 text-[13px] text-white/55 transition-colors hover:bg-white/[0.04] hover:text-white`}
			>
				<Search size={16} class="shrink-0" />{#if !collapsed}<span>Search</span>{/if}
			</a>
			<a
				href="/notifications"
				aria-current={pathname === '/notifications' ? 'page' : undefined}
				title={collapsed ? 'Notifications' : undefined}
				class={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 text-[13px] transition-colors ${pathname === '/notifications' ? 'bg-white/[0.07] text-white' : 'text-white/55 hover:bg-white/[0.04] hover:text-white'}`}
			>
				<Bell size={16} class="shrink-0" />{#if !collapsed}<span>Notifications</span
					>{#if unreadCount}<span
							class="ml-auto min-w-4 border border-orange-200/15 bg-orange-200/[0.07] px-1 text-center text-[9px] text-orange-100"
							>{unreadCount > 99 ? '99+' : unreadCount}</span
						>{/if}{/if}
			</a>
			<a
				href="/saved"
				aria-current={pathname === '/saved' ? 'page' : undefined}
				title={collapsed ? 'Saved posts' : undefined}
				class={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 text-[13px] transition-colors ${pathname === '/saved' ? 'bg-white/[0.07] text-white' : 'text-white/55 hover:bg-white/[0.04] hover:text-white'}`}
			>
				<Bookmark size={16} class="shrink-0" />{#if !collapsed}<span>Saved posts</span>{/if}
			</a>
			{#if canModerate}
				<a
					href="/moderation"
					aria-current={pathname === '/moderation' ? 'page' : undefined}
					title={collapsed ? 'Moderation' : undefined}
					class={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 text-[13px] transition-colors ${pathname === '/moderation' ? 'bg-white/[0.07] text-white' : 'text-white/55 hover:bg-white/[0.04] hover:text-white'}`}
				>
					<UserRound size={16} class="shrink-0" />{#if !collapsed}<span>Moderation</span>{/if}
				</a>
			{/if}
			{#if communityUser.isAdmin}
				<a
					href="/core"
					aria-current={pathname.startsWith('/core') ? 'page' : undefined}
					title={collapsed ? 'Sanctyria Core' : undefined}
					class={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 text-[13px] transition-colors ${pathname.startsWith('/core') ? 'bg-white/[0.07] text-white' : 'text-orange-100/70 hover:bg-white/[0.04] hover:text-orange-100'}`}
				>
					<ShieldCheck size={16} class="shrink-0" />{#if !collapsed}<span>Sanctyria Core</span>{/if}
				</a>
			{/if}
		</nav>
		{#if !collapsed}
			<div class="mt-8 mb-2 px-3">
				<h2 class="font-mono text-[9px] tracking-[0.16em] text-white/35 uppercase">
					Explore circles
				</h2>
			</div>
			<nav aria-label="Community directory" class="space-y-1">
				{#each communityItems as community (community.slug)}
					<a
						href={`/r/${community.slug}`}
						title={collapsed ? community.name : undefined}
						class={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-3'} py-2 text-xs text-white/65 transition-colors hover:bg-white/[0.04] hover:text-white`}
					>
						<span
							class="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10"
							style={`color:${community.color ?? '#f97316'};background:${community.color ?? '#f97316'}12`}
						>
							{#if community.avatarUrl}<img
									src={community.avatarUrl}
									alt=""
									class="h-full w-full object-cover"
								/>{:else}<Flame size={11} />{/if}
						</span>
						{#if !collapsed}<span class="truncate">{community.name}</span>{/if}
					</a>
				{/each}
			</nav>
		{/if}
	{/if}

	{#if communityUser}
		<div class="mt-auto border-t border-white/[0.07] pt-3">
			<a
				href={`/u/${communityUser.username}`}
				aria-current={pathname.startsWith('/u/') ? 'page' : undefined}
				title={collapsed ? communityUser.displayName : undefined}
				class={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-2'} py-2 transition-colors hover:bg-white/[0.05]`}
			>
				<span
					class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-200/25 font-display text-sm text-white"
					style={communityUser.avatarUrl
						? undefined
						: `background:${communityUser.avatarColor ?? '#cf6f65'}`}
				>
					{#if communityUser.avatarUrl}<img
							src={communityUser.avatarUrl}
							alt=""
							class="h-full w-full object-cover"
						/>{:else}{communityUser.initials ?? communityUser.displayName.slice(0, 1)}{/if}
				</span>
				{#if !collapsed}<span class="min-w-0 flex-1"
						><span class="block truncate text-[11px] font-medium text-white/85"
							>{communityUser.displayName}</span
						><span class="mt-0.5 block truncate text-[9px] text-white/40"
							>@{communityUser.username} · {communityUser.ember ?? 0} Ember</span
						></span
					><UserRound size={14} class="shrink-0 text-white/35" />{/if}
			</a>
			{#if !collapsed}<button
					type="button"
					onclick={signOut}
					class="mt-1 w-full px-3 py-2 text-left text-[10px] text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white"
					>Sign out</button
				>{/if}
			<a
				href="/"
				class={`mt-1 flex items-center ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-3'} py-2 text-[10px] text-white/40 transition-colors hover:bg-white/[0.04] hover:text-white`}
				title={collapsed ? 'Return to Sanctyria' : undefined}
			>
				<ArrowUpRight size={14} />{#if !collapsed}<span>Return to Sanctyria</span>{/if}
			</a>
		</div>
	{:else if collapsed}
		<div class="guest-sidebar-compact-actions mt-auto border-t border-white/[0.07] pt-3">
			<a href="/signup" aria-label="Sign up" title="Sign up"><ArrowUpRight size={16} /></a>
			<a href="/login" aria-label="Sign in" title="Sign in"><UserRound size={16} /></a>
		</div>
	{/if}
</aside>

<style>
	.guest-join-card {
		position: relative;
		overflow: hidden;
		display: flex;
		height: max(420px, calc(90dvh - 56px));
		flex: 0 0 auto;
		flex-direction: column;
		margin: auto 2px 8px;
		border: 1px solid rgba(231, 161, 119, 0.22);
		border-radius: 13px;
		background:
			radial-gradient(ellipse at 100% 4%, rgba(194, 103, 62, 0.2), transparent 47%),
			linear-gradient(160deg, #1b1c18 0%, #111311 64%, #0d100f 100%);
		padding: 24px 16px 18px;
		box-shadow:
			0 16px 38px rgba(0, 0, 0, 0.2),
			inset 0 1px rgba(255, 255, 255, 0.04);
	}

	.guest-join-art {
		position: absolute;
		right: -11px;
		bottom: 100px;
		width: 175px;
		height: 190px;
		background: url('/assets/characters/ember.png') center / contain no-repeat;
		opacity: 0.2;
		pointer-events: none;
	}

	.guest-join-content,
	.guest-join-actions {
		position: relative;
		z-index: 1;
	}

	.guest-join-content {
		flex: 1;
	}

	.guest-join-eyebrow,
	.guest-join-content h2,
	.guest-join-content > p:not(.guest-join-eyebrow),
	.guest-join-interests {
		position: relative;
		z-index: 1;
	}

	.guest-join-eyebrow {
		display: flex;
		align-items: center;
		gap: 7px;
		margin: 0;
		color: #f2bd9d;
		font-family: var(--font-anton);
		font-size: 8px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.guest-join-eyebrow span {
		height: 6px;
		width: 6px;
		border-radius: 50%;
		background: #f08b5d;
		box-shadow: 0 0 10px rgba(240, 139, 93, 0.7);
	}

	.guest-join-content h2 {
		max-width: 12ch;
		margin: 20px 0 12px;
		font-family: var(--font-display);
		font-size: 34px;
		font-weight: 400;
		line-height: 1.02;
		color: #f1efe9;
	}

	.guest-join-content > p:not(.guest-join-eyebrow) {
		max-width: 30ch;
		margin: 0;
		color: rgba(235, 235, 227, 0.55);
		font-size: 10px;
		line-height: 1.7;
	}

	.guest-join-stats {
		display: grid;
		grid-template-columns: 1fr;
		gap: 8px;
		margin-top: 28px;
	}

	.guest-join-stats div {
		display: flex;
		min-height: 62px;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		gap: 10px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		background: rgba(255, 255, 255, 0.025);
		padding: 10px;
	}

	.guest-join-stats strong {
		min-width: 58px;
		color: rgba(245, 237, 222, 0.88);
		font-family: var(--font-display);
		font-size: 16px;
		font-weight: 400;
	}

	.guest-join-stats span {
		margin-left: auto;
		color: rgba(235, 235, 227, 0.4);
		font-size: 8px;
	}

	.guest-join-button,
	.guest-join-login {
		position: relative;
		z-index: 1;
		display: block;
		text-align: center;
		text-decoration: none;
	}

	.guest-join-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		margin-top: 12px;
		border-radius: 999px;
		background: #f1eee6;
		padding: 11px 10px;
		color: #151613;
		font-size: 10px;
		font-weight: 650;
		transition:
			background 150ms ease,
			transform 150ms ease;
	}

	.guest-join-button:hover {
		transform: translateY(-1px);
		background: #fffaf0;
	}

	.guest-join-login {
		margin-top: 12px;
		color: rgba(235, 235, 227, 0.5);
		font-size: 9px;
	}

	.guest-join-login:hover {
		color: #f2bd9d;
	}

	.guest-join-interests {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin-top: 23px;
		border-top: 1px solid rgba(255, 255, 255, 0.08);
		padding-top: 11px;
	}

	.guest-join-interests span {
		border: 1px solid rgba(255, 255, 255, 0.09);
		border-radius: 999px;
		padding: 4px 7px;
		color: rgba(235, 235, 227, 0.5);
		font-size: 8px;
	}

	.guest-sidebar-compact-actions {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.guest-sidebar-compact-actions a {
		display: flex;
		height: 34px;
		width: 34px;
		align-items: center;
		justify-content: center;
		color: rgba(255, 255, 255, 0.7);
		transition:
			background 150ms ease,
			color 150ms ease;
	}

	.guest-sidebar-compact-actions a:hover {
		background: rgba(255, 255, 255, 0.08);
		color: white;
	}
</style>
