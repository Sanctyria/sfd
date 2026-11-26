<script lang="ts">
	import { Flame, Plus } from '@lucide/svelte';

	interface Props {
		activeItem?: 'Home' | 'Explore' | 'Notifications' | 'Profile';
		profileHref?: string;
		user?: {
			displayName: string;
			initials?: string | null;
			avatarColor?: string | null;
			avatarUrl?: string | null;
			communities?: { role: 'member' | 'moderator' | 'owner' }[];
		} | null;
	}

	let { activeItem = 'Home', profileHref = '/login', user = null }: Props = $props();
	const homeIsActive = $derived(activeItem === 'Home' || activeItem === 'Explore');
</script>

<nav
	class="community-mobile-nav fixed right-3 bottom-3 left-3 z-40 grid border border-white/10 bg-[#101110]/95 p-1.5 shadow-2xl backdrop-blur-xl md:hidden"
	aria-label="Mobile community navigation"
>
	<a
		href="/home"
		aria-label="Home"
		aria-current={homeIsActive ? 'page' : undefined}
		class:active={homeIsActive}
		class="community-mobile-nav-home"><Flame size={23} strokeWidth={1.8} /></a
	>
	<a href="/home?compose=1" aria-label="Create a post" class="community-mobile-nav-create"
		><Plus size={24} strokeWidth={2.25} /></a
	>
	<a
		href={profileHref}
		aria-label="Profile"
		aria-current={activeItem === 'Profile' ? 'page' : undefined}
		class:active={activeItem === 'Profile'}
		class="community-mobile-nav-profile"
	>
		<span
			class="community-mobile-nav-avatar"
			style={user?.avatarUrl ? undefined : `background:${user?.avatarColor ?? '#cf6f65'}`}
		>
			{#if user?.avatarUrl}<img
					src={user.avatarUrl}
					alt=""
					class="h-full w-full object-cover"
				/>{:else}{user?.initials ?? user?.displayName.slice(0, 1).toUpperCase() ?? 'G'}{/if}
		</span>
	</a>
</nav>

<style>
	.community-mobile-nav {
		grid-template-columns: repeat(3, minmax(0, 1fr));
		border-radius: 999px;
		padding: 5px;
	}

	.community-mobile-nav > a {
		display: grid;
		height: 48px;
		border-radius: 999px;
		place-items: center;
		color: rgba(255, 255, 255, 0.55);
	}

	.community-mobile-nav-home.active {
		color: #ff6a42;
	}

	.community-mobile-nav-profile.active {
		background: rgba(255, 255, 255, 0.09);
	}

	.community-mobile-nav-avatar {
		display: grid;
		width: 48px;
		height: 48px;
		place-items: center;
		border-radius: 50%;
		border: 2px solid rgba(237, 106, 54, 0.38);
		overflow: hidden;
		font-family: var(--font-display);
		font-size: 15px;
		color: white;
	}

	.community-mobile-nav-create {
		width: 48px;
		height: 48px;
		justify-self: center;
		background: #ed6a36;
		color: #1a100b;
		border-radius: 50%;
		box-shadow: 0 8px 26px rgba(0, 0, 0, 0.28);
	}
</style>
