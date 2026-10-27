import { error } from '@sveltejs/kit';
import { coreApi } from '#lib/core/coreApi.js';
import type { PageServerLoad } from './$types';

interface PageResponse<T> {
	items: T[];
	nextCursor: string | null;
}

interface Report {
	id: string;
	targetType: string;
	targetId: string;
	reason: string;
	status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
	createdAt: string;
	reporterUsername: string;
	reporterDisplayName: string;
	targetPostId: string | null;
	targetBody: string | null;
	communitySlug: string | null;
}

interface AdminAction {
	id: string;
	targetType: string;
	targetId: string;
	action: string;
	details: Record<string, string | number | boolean | null>;
	createdAt: string;
	actorUsername: string;
	actorDisplayName: string;
}

export const load: PageServerLoad = async ({ fetch, url }) => {
	const status = url.searchParams.get('status') ?? 'open';
	const cursor = url.searchParams.get('cursor');
	if (!['open', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
		error(400, 'Choose a valid report status.');
	}
	try {
		const reportParams = new URLSearchParams({ status, limit: '25' });
		if (cursor) reportParams.set('cursor', cursor);
		const [reports, actions] = await Promise.all([
			coreApi<PageResponse<Report>>(fetch, `moderation/reports?${reportParams}`),
			coreApi<PageResponse<AdminAction>>(fetch, 'moderation/actions?limit=12')
		]);
		return { ...reports, actions: actions.items, status };
	} catch (cause) {
		console.error('Could not load Core moderation.', cause);
		error(503, 'The global moderation workspace is temporarily unavailable.');
	}
};
