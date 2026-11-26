import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { communityApi } from '#lib/community/communityApi.js';

export const load: PageServerLoad = async ({ fetch, parent }) => {
	const { communityUser } = await parent();
	if (!communityUser) {
		redirect(303, `/login?returnTo=${encodeURIComponent('/notification-settings')}`);
	}
	const response = await communityApi<{ settings: Record<string, boolean> }>(
		fetch,
		'me/notification-settings'
	);
	return { settings: response.settings };
};
