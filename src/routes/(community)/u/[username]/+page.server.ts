import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	communityApi,
	CommunityApiError,
	toCommunityPost,
	type ApiPage,
	type ApiPost,
	type ApiProfile,
	type ApiProfileReply
} from '#lib/community/communityApi.js';

interface ApiProfileResponse {
	profile: ApiProfile;
}

export const load: PageServerLoad = async ({ fetch, params, depends, parent }) => {
	depends('app:community-content');
	try {
		const parentData = await parent();
		const username = encodeURIComponent(params.username);
		const [profileResponse, postActivity, replyActivity] = await Promise.all([
			communityApi<ApiProfileResponse>(fetch, `profiles/${username}`),
			communityApi<ApiPage<ApiPost>>(fetch, `profiles/${username}/activity?type=posts&limit=50`),
			communityApi<ApiPage<ApiProfileReply>>(
				fetch,
				`profiles/${username}/activity?type=replies&limit=50`
			)
		]);
		const { profile } = profileResponse;
		const joinedSlugs = profile.communities.map((community) => community.slug);
		return {
			profile: {
				username: profile.username,
				name: profile.displayName,
				handle: `@${profile.username}`,
				initials: profile.initials ?? profile.displayName.slice(0, 1).toUpperCase(),
				avatarColor: profile.avatarColor ?? '#cf6f65',
				avatarUrl: profile.avatarUrl,
				bio: profile.bio,
				verified: profile.verified,
				ember: profile.ember,
				followerCount: profile.followerCount,
				followingCount: profile.followingCount,
				isFollowing: profile.isFollowing,
				isBlocked: profile.isBlocked ?? false,
				isBlockedBy: profile.isBlockedBy ?? false,
				isMuted: profile.isMuted ?? false,
				isOwnProfile: parentData.communityUser?.username === profile.username,
				joined: `Joined ${new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
				communities: profile.communities
			},
			posts: postActivity.items.map((post) => toCommunityPost(post, joinedSlugs)),
			replies: replyActivity.items,
			postsCursor: postActivity.nextCursor,
			repliesCursor: replyActivity.nextCursor
		};
	} catch (cause) {
		if (cause instanceof CommunityApiError && [400, 404].includes(cause.status)) {
			error(404, 'That profile is not available.');
		}
		error(503, 'The community service is temporarily unavailable. Please try again shortly.');
	}
};
