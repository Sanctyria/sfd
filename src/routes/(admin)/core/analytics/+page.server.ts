import { error } from '@sveltejs/kit';
import { coreApi } from '#lib/core/coreApi.js';
import type { PageServerLoad } from './$types';

interface AnalyticsResponse {
	days: number;
	pageViews: number;
	daily: { day: string; pageViews: number }[];
	topPages: { path: string; pageViews: number }[];
	campaigns: { source: string; medium: string; campaign: string; pageViews: number }[];
	community: { activeUsers: number; activeCommunities: number; posts: number; openReports: number };
}

export const load: PageServerLoad = async ({ fetch, url }) => {
	const daysValue = Number(url.searchParams.get('days') ?? '30');
	const days = [7, 30, 90].includes(daysValue) ? daysValue : 30;
	try {
		return await coreApi<AnalyticsResponse>(fetch, `analytics?days=${days}`);
	} catch (cause) {
		console.error('Could not load Core analytics.', cause);
		error(503, 'Analytics are temporarily unavailable.');
	}
};
