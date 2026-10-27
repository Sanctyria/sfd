<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { goto } from '$app/navigation';
	import { ArrowUpRight, Check, Flame, Plus } from '@lucide/svelte';
	import { communityApi } from '../communityApi.js';
	import type { JournalArticle } from '#lib/marketing/journal.js';

	interface CommunityItem {
		slug: string;
		name: string;
		members: string;
		memberCount: number;
		activeEmber: number;
		avatarUrl?: string | null;
		color: string;
	}

	interface MemberItem {
		username: string;
		displayName: string;
		bio: string;
		avatarUrl: string | null;
		initials: string | null;
		avatarColor: string | null;
		ember: number;
	}

	interface CommunityUser {
		username: string;
		communities: { slug: string }[];
	}

	interface Props {
		user: CommunityUser | null;
		communities: CommunityItem[];
		weeklyVoices: MemberItem[];
		journalArticles: JournalArticle[];
	}

	let { user, communities, weeklyVoices, journalArticles }: Props = $props();
	let joinedOverrides = $state<Record<string, boolean>>({});
	let busyCommunity = $state('');
	const activeCircles = $derived(
		[...communities].sort((a, b) => b.activeEmber - a.activeEmber).slice(0, 3)
	);
	const popularCircles = $derived(
		[...communities].sort((a, b) => b.memberCount - a.memberCount).slice(0, 3)
	);

	function isJoined(slug: string) {
		return joinedOverrides[slug] ?? user?.communities.some((item) => item.slug === slug) ?? false;
	}

	async function toggleCommunity(community: CommunityItem) {
		if (!user) {
			void goto('/signup?returnTo=%2Fhome');
			return;
		}
		if (busyCommunity) return;
		busyCommunity = community.slug;
		const wasJoined = isJoined(community.slug);
		try {
			await communityApi<void>(
				fetch,
				`communities/${encodeURIComponent(community.slug)}/membership`,
				{ method: wasJoined ? 'DELETE' : 'POST' }
			);
			joinedOverrides = { ...joinedOverrides, [community.slug]: !wasJoined };
			await invalidate('app:community-content');
		} catch (error) {
			console.error('Could not update community membership from the right rail.', error);
		} finally {
			busyCommunity = '';
		}
	}
</script>

<aside
	class="community-right-rail sticky hidden flex-col gap-6 overflow-y-auto px-1 py-5 lg:flex"
	aria-label="Community highlights"
>
	{#if !user}
		<section class="guest-community-card" aria-labelledby="guest-community-title">
			<span class="guest-community-mark"><img src="/assets/dlst.gif" alt="" /></span>
			<h2 id="guest-community-title">Sanctyria Community</h2>
			<p>
				A quieter corner for worldbuilders, artists, and curious minds to share what they’re making.
			</p>
			<div class="guest-community-stats">
				<span><strong>{communities.length}</strong> public circles</span>
				<span><strong>{weeklyVoices.length}</strong> weekly voices</span>
			</div>
			<a href="/signup">Join the conversation <ArrowUpRight size={13} /></a>
		</section>
	{/if}

	<section aria-labelledby="weekly-heading">
		<div class="mb-3 flex items-center justify-between">
			<h2
				id="weekly-heading"
				class="font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase"
			>
				Weekly voices
			</h2>
			<span class="text-[9px] text-orange-200/45">Ember · 7 days</span>
		</div>
		{#if weeklyVoices.length}
			<ol class="space-y-1.5">
				{#each weeklyVoices as member, index (member.username)}
					<li class="flex items-center gap-2.5 py-1.5">
						<span class="w-3 text-right font-mono text-[9px] text-white/25">{index + 1}</span>
						<span
							class="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-[9px] text-white"
							style={member.avatarUrl ? undefined : `background:${member.avatarColor ?? '#66744b'}`}
						>
							{#if member.avatarUrl}<img
									src={member.avatarUrl}
									alt=""
									class="h-full w-full object-cover"
								/>{:else}{member.initials ?? member.displayName.slice(0, 2).toUpperCase()}{/if}
						</span>
						<a class="min-w-0 flex-1" href={`/u/${encodeURIComponent(member.username)}`}
							><span class="block truncate text-[10px] text-white/80">{member.displayName}</span
							><span class="block truncate text-[9px] text-white/35"
								>{member.bio || 'Community contributor'}</span
							></a
						>
						<span class="font-mono text-[9px] whitespace-nowrap text-orange-200/75"
							>{member.ember} Ember</span
						>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="py-3 text-[10px] leading-5 text-white/35">
				Weekly voices will appear as members earn Ember from community reactions.
			</p>
		{/if}
	</section>

	<section aria-labelledby="active-circles-heading" class="border-t border-white/[0.07] pt-5">
		<div class="mb-3 flex items-center justify-between">
			<h2
				id="active-circles-heading"
				class="font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase"
			>
				Active circles
			</h2>
			<a href="/home?feed=explore" class="text-[9px] text-orange-200/75 hover:text-orange-100"
				>Explore</a
			>
		</div>
		<div class="space-y-3">
			{#each activeCircles as community (community.slug)}
				<div class="flex items-center gap-2.5">
					<a
						href={`/r/${community.slug}`}
						class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden border border-white/10"
						style={`color:${community.color};background:${community.color}12`}
						aria-label={`Visit ${community.name}`}
					>
						{#if community.avatarUrl}<img
								src={community.avatarUrl}
								alt=""
								class="h-full w-full object-cover"
							/>{:else}<Flame size={13} />{/if}
					</a>
					<a class="min-w-0 flex-1" href={`/r/${community.slug}`}
						><span class="block truncate text-[10px] text-white/80">{community.name}</span><span
							class="block text-[9px] text-white/35"
							>{community.members} members · {community.activeEmber} Ember</span
						></a
					>
					<button
						type="button"
						onclick={() => toggleCommunity(community)}
						disabled={busyCommunity === community.slug}
						aria-label={`${isJoined(community.slug) ? 'Leave' : 'Join'} ${community.name}`}
						aria-pressed={isJoined(community.slug)}
						class={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${isJoined(community.slug) ? 'border-white/10 text-white/55 hover:border-red-300/30 hover:text-red-200' : 'border-white/15 text-white/75 hover:border-orange-200/40 hover:text-orange-100'}`}
					>
						{#if isJoined(community.slug)}<Check size={12} />{:else}<Plus size={13} />{/if}
					</button>
				</div>
			{/each}
		</div>
	</section>

	<section aria-labelledby="popular-circles-heading" class="border-t border-white/[0.07] pt-5">
		<h2
			id="popular-circles-heading"
			class="mb-3 font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase"
		>
			Popular circles
		</h2>
		<div class="space-y-3">
			{#each popularCircles as community (community.slug)}
				<a
					href={`/r/${community.slug}`}
					class="flex items-center gap-2.5 transition-colors hover:text-orange-100"
				>
					<span
						class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden border border-white/10"
						style={`color:${community.color};background:${community.color}12`}
					>
						{#if community.avatarUrl}<img
								src={community.avatarUrl}
								alt=""
								class="h-full w-full object-cover"
							/>{:else}<Flame size={13} />{/if}
					</span>
					<span class="min-w-0 flex-1"
						><span class="block truncate text-[10px] text-white/80">{community.name}</span><span
							class="block text-[9px] text-white/35">{community.members} members</span
						></span
					>
					<ArrowUpRight size={12} class="text-white/30" />
				</a>
			{/each}
		</div>
	</section>

	<section class="border-t border-white/[0.07] pt-5">
		<div class="mb-3 flex items-center justify-between">
			<h2 class="font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase">
				From the journal
			</h2>
			<a href="/journal" class="text-[9px] text-orange-200/75 hover:text-orange-100">All stories</a>
		</div>
		<div class="space-y-3">
			{#each journalArticles as article (article.slug)}
				<a
					href={`/journal/${encodeURIComponent(article.slug)}`}
					class="group flex items-center gap-2.5"
				>
					<span
						class="h-12 w-12 shrink-0 overflow-hidden border border-white/[0.08] bg-white/[0.03]"
					>
						<img
							src={article.image}
							alt={article.imageAlt}
							loading="lazy"
							class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					</span>
					<span class="min-w-0 flex-1">
						<span
							class="block truncate font-display text-sm leading-5 text-white/80 transition-colors group-hover:text-orange-100"
							>{article.title}</span
						>
						<span class="mt-0.5 block truncate text-[9px] text-white/35"
							>{article.category} · {article.date}</span
						>
					</span>
					<ArrowUpRight size={12} class="shrink-0 text-white/25" />
				</a>
			{/each}
		</div>
	</section>
</aside>

<style>
	.guest-community-card {
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 9px;
		background: linear-gradient(150deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.015));
		padding: 16px;
	}

	.guest-community-mark {
		display: grid;
		width: 34px;
		height: 34px;
		place-items: center;
		border: 1px solid rgba(240, 161, 108, 0.2);
		border-radius: 50%;
		background: rgba(240, 161, 108, 0.07);
	}

	.guest-community-mark img {
		width: 22px;
		height: 22px;
		object-fit: contain;
	}

	.guest-community-card h2 {
		margin-top: 12px;
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 400;
	}

	.guest-community-card > p {
		margin-top: 6px;
		color: rgba(235, 235, 227, 0.52);
		font-size: 10px;
		line-height: 1.65;
	}

	.guest-community-stats {
		display: grid;
		gap: 5px;
		margin-top: 12px;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
		padding-top: 10px;
		color: rgba(235, 235, 227, 0.4);
		font-size: 9px;
	}

	.guest-community-stats strong {
		color: rgba(255, 255, 255, 0.8);
		font-weight: 600;
	}

	.guest-community-card > a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 12px;
		border-radius: 999px;
		background: #f1eee6;
		padding: 8px 12px;
		color: #151613;
		font-size: 10px;
		font-weight: 600;
		text-decoration: none;
	}
</style>
