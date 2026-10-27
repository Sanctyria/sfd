import { error } from '@sveltejs/kit';
import { coreApi } from '#lib/core/coreApi.js';
import type { PageServerLoad } from './$types';

interface UsersResponse {
	items: {
		id: string;
		username: string;
		displayName: string;
		createdAt: string;
		deletedAt: string | null;
		suspendedAt: string | null;
		ember: number;
		communityCount: number;
		status: 'active' | 'suspended' | 'deleted';
	}[];
	nextCursor: string | null;
}

export const load: PageServerLoad = async ({ fetch, url, parent }) => {
	const { adminUser } = await parent();
	const query = url.searchParams.get('query')?.trim().slice(0, 100) ?? '';
	const cursor = url.searchParams.get('cursor');
	try {
		const params = new URLSearchParams({ limit: '25' });
		if (query) params.set('query', query);
		if (cursor) params.set('cursor', cursor);
		return {
			...(await coreApi<UsersResponse>(fetch, `users?${params}`)),
			query,
			canDeleteUsers: adminUser.isSuperAdmin
		};
	} catch (cause) {
		console.error('Could not load Core users.', cause);
		error(503, 'The user directory is temporarily unavailable.');
	}
};
