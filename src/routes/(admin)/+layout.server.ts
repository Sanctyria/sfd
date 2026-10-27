import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

interface SessionResponse {
	user: {
		isAdmin?: boolean;
		isSuperAdmin?: boolean;
		displayName?: string;
		username?: string;
	};
}

export const load: LayoutServerLoad = async ({ fetch }) => {
	const response = await fetch('/api/community/me');
	if (response.status === 401) error(404, 'Not Found');
	if (!response.ok) error(503, 'Admin access could not be verified. Please try again shortly.');

	const { user } = (await response.json()) as SessionResponse;
	if (user.isAdmin !== true) error(404, 'Not Found');

	return {
		adminUser: {
			displayName: user.displayName ?? 'Administrator',
			username: user.username ?? '',
			isSuperAdmin: user.isSuperAdmin === true
		}
	};
};
