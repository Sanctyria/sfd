import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	communityApi,
	type ApiCommunityBanner,
	type ApiCommunitiesResponse,
	type ApiFeedResponse,
	type ApiWeeklyEmberResponse,
	toCommunityPost
} from '#lib/community/communityApi.js';
import { loadJournalArticles } from '#lib/marketing/journalApi.js';

const communityColors: Record<string, string> = {
	'the-archive': '#d8a37e',
	worldbuilding: '#f97316',
	'writing-room': '#84a5bd',
	'visual-studies': '#58a6a6',
	'studio-notes': '#be8ea9'
};

export const load: PageServerLoad = async ({ fetch, parent, url, depends }) => {
	depends('app:community-content');
	const parentData = await parent();
	const requestedTab = url.searchParams.get('feed');
	const feedScope =
		requestedTab === 'community' || requestedTab === 'explore'
			? 'public'
			: parentData.communityUser
				? 'following'
				: 'public';
	try {
		const [feed, communities, weeklyEmber, banners, journalArticles] = await Promise.all([
			communityApi<ApiFeedResponse>(fetch, `feed?scope=${feedScope}&limit=50`),
			communityApi<ApiCommunitiesResponse>(fetch, 'communities?limit=50'),
			communityApi<ApiWeeklyEmberResponse>(fetch, 'ember/weekly?limit=3'),
			communityApi<{ items: ApiCommunityBanner[] }>(fetch, 'community/banners'),
			loadJournalArticles(fetch)
		]);
		const joinedSlugs =
			parentData.communityUser?.communities.map((community) => community.slug) ?? [];
		return {
			posts: feed.items.map((post) => toCommunityPost(post, joinedSlugs)),
			postsCursor: feed.nextCursor,
			announcements: banners.items,
			journalArticles: [...journalArticles]
				.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
				.slice(0, 3),
			feedScope,
			communities: communities.items.map((community) => ({
				name: community.name,
				slug: community.slug,
				description: community.description,
				avatarUrl: community.avatarUrl ?? null,
				members: community.memberCount.toLocaleString(),
				memberCount: community.memberCount,
				activeEmber: community.activeEmber ?? 0,
				color: communityColors[community.slug] ?? '#f97316'
			})),
			suggestedMembers: weeklyEmber.items.map((member) => ({
				name: member.displayName,
				handle: `@${member.username}`,
				initials: member.initials ?? member.displayName.slice(0, 2).toUpperCase(),
				avatarUrl: member.avatarUrl,
				color: member.avatarColor ?? '#66744b',
				field: member.bio,
				ember: member.ember
			})),
			joinedSlugs,
			isAuthenticated: Boolean(parentData.communityUser)
		};
	} catch {
		error(503, 'Community data is temporarily unavailable.');
	}
};
