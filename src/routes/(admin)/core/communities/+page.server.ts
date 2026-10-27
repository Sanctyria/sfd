import { error } from '@sveltejs/kit';
import { coreApi } from '#lib/core/coreApi.js';
import type { PageServerLoad } from './$types';

interface CommunitiesResponse {
	items: {
		id: string;
		name: string;
		slug: string;
		description: string;
		status: 'active' | 'archived';
		isPublic: boolean;
		indexingApproved: boolean;
		createdAt: string;
		ownerUsername: string | null;
		ownerDisplayName: string | null;
		memberCount: number;
		postCount: number;
		eligiblePostCount: number;
		eligibleAuthorCount: number;
	}[];
	nextCursor: string | null;
}

export const load: PageServerLoad = async ({ fetch, url }) => {
	const query = url.searchParams.get('query')?.trim().slice(0, 100) ?? '';
	const params = new URLSearchParams({ limit: '25' });
	if (query) params.set('query', query);
	const cursor = url.searchParams.get('cursor');
	if (cursor) params.set('cursor', cursor);
	try {
		return { ...(await coreApi<CommunitiesResponse>(fetch, `communities?${params}`)), query };
	} catch (cause) {
		console.error('Could not load Core communities.', cause);
		error(503, 'The community directory is temporarily unavailable.');
	}
};
