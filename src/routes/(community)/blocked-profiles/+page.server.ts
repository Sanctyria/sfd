import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { communityApi } from '#lib/community/communityApi.js';

interface BlockedProfile {
	username: string;
	displayName: string;
	initials: string | null;
	avatarColor: string | null;
	avatarUrl: string | null;
}

export const load: PageServerLoad = async ({ fetch, parent }) => {
	const { communityUser } = await parent();
	if (!communityUser) {
		redirect(303, `/login?returnTo=${encodeURIComponent('/blocked-profiles')}`);
	}
	const response = await communityApi<{ items: BlockedProfile[] }>(fetch, 'me/blocks');
	return { profiles: response.items };
};
