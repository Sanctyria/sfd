import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { communityApi, type ApiNotificationsResponse } from '#lib/community/communityApi.js';

export const load: PageServerLoad = async ({ fetch, parent, depends }) => {
	depends('app:notifications');
	const parentData = await parent();
	if (!parentData.communityUser) {
		redirect(303, `/login?returnTo=${encodeURIComponent('/notifications')}`);
	}

	try {
		return await communityApi<ApiNotificationsResponse>(fetch, 'notifications?limit=50');
	} catch {
		error(503, 'Notifications are temporarily unavailable.');
	}
};
