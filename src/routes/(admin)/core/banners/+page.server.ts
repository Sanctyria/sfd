import { error } from '@sveltejs/kit';
import { coreApi } from '#lib/core/coreApi.js';
import type { ApiCommunityBanner } from '#lib/community/communityApi.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const banners = await coreApi<ApiCommunityBanner[]>(fetch, 'banners');
		return { banners };
	} catch (cause) {
		console.error('Could not load Core community banners.', cause);
		error(503, 'The community banner workspace is temporarily unavailable.');
	}
};
