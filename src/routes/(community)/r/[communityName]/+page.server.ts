import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	communityApi,
	CommunityApiError,
	type ApiPage,
	type ApiCommunityMember,
	type ApiCommunity,
	type ApiFeedResponse,
	toCommunityPost
} from '#lib/community/communityApi.js';

interface ApiCommunityResponse {
	community: ApiCommunity;
}

const communityColors: Record<string, string> = {
	'the-archive': '#d8a37e',
	worldbuilding: '#f97316',
	'writing-room': '#84a5bd',
	'visual-studies': '#58a6a6',
	'studio-notes': '#be8ea9'
};

export const load: PageServerLoad = async ({ fetch, params, parent, depends }) => {
	depends('app:community-content');
	const parentData = await parent();
	let communityResponse: ApiCommunityResponse;
	let feed: ApiFeedResponse;
	let memberPage: ApiPage<ApiCommunityMember>;
	try {
		[communityResponse, feed, memberPage] = await Promise.all([
			communityApi<ApiCommunityResponse>(
				fetch,
				`communities/${encodeURIComponent(params.communityName)}`
			),
			communityApi<ApiFeedResponse>(
				fetch,
				`feed?scope=community&community=${encodeURIComponent(params.communityName)}&limit=50`
			),
			communityApi<ApiPage<ApiCommunityMember>>(
				fetch,
				`communities/${encodeURIComponent(params.communityName)}/members?limit=50`
			)
		]);
	} catch (cause) {
		if (cause instanceof CommunityApiError && [400, 404].includes(cause.status)) {
			error(404, 'That community is not available.');
		}
		error(503, 'The community service is temporarily unavailable. Please try again shortly.');
	}
	const community = communityResponse.community;
	if (community.slug !== params.communityName) {
		redirect(308, `/r/${encodeURIComponent(community.slug)}`);
	}
	const joinedSlugs =
		parentData.communityUser?.communities.map((community) => community.slug) ?? [];
	return {
		community: {
			...community,
			isOwner:
				community.viewerRole === 'owner' || parentData.communityUser?.id === community.creatorId,
			viewerRole: community.viewerRole ?? null,
			members: community.memberCount.toLocaleString(),
			color: communityColors[community.slug] ?? '#f97316'
		},
		posts: feed.items.map((post) => toCommunityPost(post, joinedSlugs)),
		members: memberPage.items,
		membersCursor: memberPage.nextCursor
	};
};
