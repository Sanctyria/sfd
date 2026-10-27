import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	communityApi,
	CommunityApiError,
	type ApiPost,
	type ApiReply,
	toCommunityPost
} from '#lib/community/communityApi.js';

interface ApiPostResponse {
	post: ApiPost;
	replies: ApiReply[];
	nextRepliesCursor: string | null;
}

export const load: PageServerLoad = async ({ fetch, params, parent, depends }) => {
	depends('app:community-content');
	const parentData = await parent();
	try {
		const response = await communityApi<ApiPostResponse>(
			fetch,
			`posts/${encodeURIComponent(params.postId)}`
		);
		const joinedSlugs =
			parentData.communityUser?.communities.map((community) => community.slug) ?? [];
		return {
			post: toCommunityPost({ ...response.post, replies: response.replies }, joinedSlugs),
			replyCursor: response.nextRepliesCursor
		};
	} catch (cause) {
		if (cause instanceof CommunityApiError && [400, 404].includes(cause.status)) {
			error(404, 'That post is not available.');
		}
		error(503, 'The community service is temporarily unavailable. Please try again shortly.');
	}
};
