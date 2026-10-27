import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	communityApi,
	toCommunityPost,
	type ApiPage,
	type ApiPost
} from '#lib/community/communityApi.js';

export const load: PageServerLoad = async ({ fetch, parent }) => {
	const parentData = await parent();
	if (!parentData.communityUser) {
		redirect(303, `/login?returnTo=${encodeURIComponent('/saved')}`);
	}
	const page = await communityApi<ApiPage<ApiPost>>(fetch, 'me/bookmarks?limit=50');
	const joinedSlugs = parentData.communityUser.communities.map((community) => community.slug);
	return {
		posts: page.items.map((post) => toCommunityPost(post, joinedSlugs)),
		nextCursor: page.nextCursor
	};
};
