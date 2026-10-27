import { error } from '@sveltejs/kit';
import { communityApi, type ApiGlobalSearchResponse } from '#lib/community/communityApi.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const query = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	if (query.length < 2) {
		return {
			query,
			results: { members: [], communities: [], posts: [] } satisfies ApiGlobalSearchResponse
		};
	}

	try {
		const results = await communityApi<ApiGlobalSearchResponse>(
			fetch,
			`search?query=${encodeURIComponent(query)}`
		);
		return { query, results };
	} catch (cause) {
		console.error('Could not load global community search results.', cause);
		error(503, 'Search is temporarily unavailable. Please try again shortly.');
	}
};
