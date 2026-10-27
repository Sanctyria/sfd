import { error } from '@sveltejs/kit';
import { coreApi } from '#lib/core/coreApi.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		return await coreApi<{
			metrics: {
				users: { total: number; active: number; newThisMonth: number };
				communities: { total: number; active: number };
				posts: { total: number; thisMonth: number };
				openReports: number;
				publishedArticles: number;
				pageViews30Days: number;
			};
			recentCommunities: {
				id: string;
				name: string;
				slug: string;
				status: string;
				createdAt: string;
			}[];
			recentArticles: {
				slug: string;
				title: string;
				updatedAt: string;
				isPublished: boolean;
			}[];
		}>(fetch, 'overview');
	} catch (cause) {
		console.error('Could not load Core overview.', cause);
		error(503, 'The administration overview is temporarily unavailable.');
	}
};
