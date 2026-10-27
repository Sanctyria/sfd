<script lang="ts">
	import { Bell, ShieldCheck, Sparkles } from '@lucide/svelte';

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
	const items = $derived([
		{ label: 'Home', href: '/home', icon: null, logo: true },
		{ label: 'Explore communities', href: '/home?feed=explore', icon: Sparkles, logo: false },
		{ label: 'Notifications', href: '/notifications', icon: Bell, logo: false },
		...(user?.communities?.some(
			(community) => community.role === 'owner' || community.role === 'moderator'
		)
			? [{ label: 'Moderation', href: '/moderation', icon: ShieldCheck, logo: false }]
			: []),
		{ label: 'My profile', href: profileHref, icon: null, logo: false }
	]);
</script>

<nav
	class="community-mobile-nav fixed right-3 bottom-3 left-3 z-40 grid border border-white/10 bg-[#101110]/95 p-1.5 shadow-2xl backdrop-blur-xl md:hidden"
	aria-label="Mobile community navigation"
	style={`grid-template-columns: repeat(${items.length}, minmax(0, 1fr))`}
>
	{#each items as item (item.label)}
		<a
			href={item.href}
			aria-label={item.label}
			aria-current={item.label === activeItem ||
			(item.label === 'Explore communities' && activeItem === 'Explore')
				? 'page'
				: undefined}
			class={`flex h-11 items-center justify-center transition-colors ${item.label === activeItem || (item.label === 'Explore communities' && activeItem === 'Explore') ? 'bg-white/[0.09] text-orange-200' : 'text-white/50 hover:text-white'}`}
		>
			{#if item.logo}<img
					src="/assets/dlst.gif"
					alt=""
					class="h-6 w-6 object-contain"
				/>{:else if item.icon}<item.icon size={18} />{:else}<span
					class="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-orange-200/25 font-display text-xs text-white"
					style={user?.avatarUrl ? undefined : `background:${user?.avatarColor ?? '#cf6f65'}`}
					>{#if user?.avatarUrl}<img
							src={user.avatarUrl}
							alt=""
							class="h-full w-full object-cover"
						/>{:else}{user?.initials ??
							user?.displayName.slice(0, 1).toUpperCase() ??
							'G'}{/if}</span
				>{/if}
		</a>
	{/each}
</nav>

<style>
	.community-mobile-nav {
		border-radius: 999px;
	}

	.community-mobile-nav a {
		border-radius: 999px;
	}
</style>
