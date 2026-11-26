import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { communityUser } = await parent();
	if (!communityUser) redirect(303, `/login?returnTo=${encodeURIComponent('/account')}`);
	return {};
};
