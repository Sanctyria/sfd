<script lang="ts">
	import { ArrowUpRight, MessageCircle, UsersRound } from '@lucide/svelte';
	import CommunityFollowButton from '#lib/community/components/CommunityFollowButton.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.query ? `Search: ${data.query}` : 'Search'} | Sanctyria Community</title>
	<meta name="description" content="Search Sanctyria members, communities, and conversations." />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<main class="search-page">
	<header class="search-heading">
		<p class="search-eyebrow">SANCTYRIA COMMUNITY</p>
		<h1>Search</h1>
		{#if data.query}
			<p class="search-summary">Showing matches for <strong>“{data.query}”</strong></p>
		{:else}
			<p class="search-summary">Search for people, communities, and conversations.</p>
		{/if}
	</header>

	{#if data.query.length < 2}
		<div class="search-empty">
			<span><UsersRound size={18} /></span>
			<h2>What are you looking for?</h2>
			<p>Enter at least two characters in the search bar above.</p>
		</div>
	{:else}
		{#if data.results.members.length}
			<section class="search-section" aria-labelledby="search-members-heading">
				<div class="search-section-heading">
					<h2 id="search-members-heading">People</h2>
					<span>{data.results.members.length} matches</span>
				</div>
				<div class="search-member-list">
					{#each data.results.members as member (member.username)}
						<a class="search-member" href={`/u/${encodeURIComponent(member.username)}`}>
							<span
								class="search-avatar"
								style={member.avatarUrl
									? undefined
									: `background:${member.avatarColor ?? '#66744b'}`}
							>
								{#if member.avatarUrl}
									<img src={member.avatarUrl} alt="" />
								{:else}
									{member.initials ?? member.displayName.slice(0, 1)}
								{/if}
							</span>
							<span class="search-result-copy">
								<strong>{member.displayName}</strong>
								<small>@{member.username}</small>
							</span>
							<ArrowUpRight size={14} />
						</a>
					{/each}
				</div>
			</section>
		{/if}

		{#if data.results.communities.length}
			<section class="search-section" aria-labelledby="search-communities-heading">
				<div class="search-section-heading">
					<h2 id="search-communities-heading">Communities</h2>
					<span>{data.results.communities.length} matches</span>
				</div>
				<div class="search-result-list">
					{#each data.results.communities as community (community.slug)}
						<a class="search-community" href={`/r/${encodeURIComponent(community.slug)}`}>
							<span class="search-community-mark">
								{#if community.avatarUrl}<img
										src={community.avatarUrl}
										alt=""
										class="h-full w-full object-cover"
									/>{:else}<UsersRound size={16} />{/if}
							</span>
							<span class="search-result-copy">
								<strong>{community.name}</strong>
								<small>{community.memberCount.toLocaleString()} members</small>
								{#if community.description}<span>{community.description}</span>{/if}
							</span>
							<ArrowUpRight size={14} />
						</a>
					{/each}
				</div>
			</section>
		{/if}

		{#if data.results.posts.length}
			<section class="search-section" aria-labelledby="search-posts-heading">
				<div class="search-section-heading">
					<h2 id="search-posts-heading">Posts</h2>
					<span>{data.results.posts.length} matches</span>
				</div>
				<div class="search-result-list">
					{#each data.results.posts as post (post.id)}
						<div class="search-post">
							<span class="search-post-icon"><MessageCircle size={15} /></span>
							<span class="search-result-copy">
								<strong
									><a href={`/r/${encodeURIComponent(post.community.slug)}`}
										>{post.community.name}</a
									></strong
								>
								{#if post.community.avatarUrl}<img
										src={post.community.avatarUrl}
										alt=""
										class="h-6 w-6 rounded-full object-cover"
									/>{/if}
								<span class="search-post-byline">
									<a href={`/u/${encodeURIComponent(post.author.username)}`}
										>{post.author.displayName} · @{post.author.username}</a
									>
									<CommunityFollowButton
										authorUsername={post.author.username}
										viewerUsername={data.communityUser?.username}
										initialFollowing={post.author.isFollowing}
									/>
								</span>
								<a class="search-post-body" href={`/p/${encodeURIComponent(post.id)}`}
									>{post.body}</a
								>
							</span>
							<a
								href={`/p/${encodeURIComponent(post.id)}`}
								aria-label="Open post"
								class="search-post-open"><ArrowUpRight size={14} /></a
							>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		{#if !data.results.members.length && !data.results.communities.length && !data.results.posts.length}
			<div class="search-empty">
				<span><UsersRound size={18} /></span>
				<h2>No results yet</h2>
				<p>Try a different name, community, or phrase.</p>
			</div>
		{/if}
	{/if}
</main>

<style>
	.search-page {
		width: min(100%, 760px);
		min-height: calc(100dvh - 62px);
		margin-inline: auto;
		padding: 38px clamp(16px, 4vw, 36px) 100px;
		color: #f1efe9;
	}

	.search-heading {
		border-bottom: 1px solid rgba(255, 255, 255, 0.09);
		padding-bottom: 20px;
	}

	.search-eyebrow {
		color: #f0a16c;
		font-family: var(--font-anton);
		font-size: 8px;
		letter-spacing: 0.17em;
	}

	.search-heading h1 {
		margin-top: 7px;
		font-family: var(--font-display);
		font-size: clamp(32px, 5vw, 42px);
		font-weight: 400;
	}

	.search-summary {
		margin-top: 7px;
		color: rgba(235, 235, 227, 0.48);
		font-size: 11px;
		line-height: 1.6;
	}

	.search-summary strong {
		color: rgba(255, 255, 255, 0.82);
		font-weight: 500;
	}

	.search-section {
		margin-top: 24px;
	}

	.search-section-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 9px;
	}

	.search-section-heading h2 {
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 400;
	}

	.search-section-heading > span {
		color: rgba(235, 235, 227, 0.38);
		font-size: 9px;
	}

	.search-member-list,
	.search-result-list {
		display: grid;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.018);
	}

	.search-member,
	.search-community,
	.search-post {
		display: flex;
		min-width: 0;
		align-items: center;
		gap: 11px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
		padding: 12px;
		color: rgba(255, 255, 255, 0.65);
		text-decoration: none;
		transition: background 140ms ease;
	}

	.search-member:last-child,
	.search-community:last-child,
	.search-post:last-child {
		border-bottom: 0;
	}

	.search-member:hover,
	.search-community:hover,
	.search-post:hover {
		background: rgba(255, 255, 255, 0.035);
	}

	.search-avatar,
	.search-community-mark,
	.search-post-icon {
		display: grid;
		width: 38px;
		height: 38px;
		flex: 0 0 auto;
		place-items: center;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 50%;
		color: white;
		font-size: 11px;
	}

	.search-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.search-community-mark,
	.search-post-icon {
		border-radius: 8px;
		background: rgba(240, 161, 108, 0.08);
		color: #f0b18b;
	}

	.search-result-copy {
		display: grid;
		min-width: 0;
		flex: 1;
		gap: 3px;
	}

	.search-result-copy strong {
		overflow: hidden;
		color: rgba(255, 255, 255, 0.88);
		font-size: 11px;
		font-weight: 550;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.search-result-copy small {
		overflow: hidden;
		color: rgba(235, 235, 227, 0.4);
		font-size: 9px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.search-post-byline {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.search-post-byline > a {
		overflow: hidden;
		color: rgba(235, 235, 227, 0.4);
		font-size: 9px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.search-post-body {
		display: -webkit-box;
		overflow: hidden;
		color: rgba(235, 235, 227, 0.57);
		font-size: 10px;
		line-height: 1.55;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}

	.search-post-open {
		display: grid;
		width: 28px;
		height: 28px;
		flex: 0 0 auto;
		place-items: center;
		color: rgba(255, 255, 255, 0.45);
	}

	.search-result-copy > span:not(.search-post-byline) {
		display: -webkit-box;
		overflow: hidden;
		color: rgba(235, 235, 227, 0.57);
		font-size: 10px;
		line-height: 1.55;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}

	.search-empty {
		margin-top: 26px;
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;
		padding: 34px 18px;
		text-align: center;
	}

	.search-empty > span {
		display: inline-grid;
		width: 38px;
		height: 38px;
		place-items: center;
		border-radius: 50%;
		background: rgba(240, 161, 108, 0.08);
		color: #f0b18b;
	}

	.search-empty h2 {
		margin-top: 12px;
		font-family: var(--font-display);
		font-size: 21px;
		font-weight: 400;
	}

	.search-empty p {
		margin-top: 6px;
		color: rgba(235, 235, 227, 0.45);
		font-size: 10px;
	}
</style>
