import { CommunityApiError, communityApi } from '#lib/community/communityApi.js';
import { renderBrandedOgImage } from '#lib/server/ogImage.js';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface ApiProfileResponse {
	profile: {
		username: string;
		displayName: string;
		bio: string;
		avatarUrl: string | null;
		avatarVersion: string | null;
		initials: string | null;
	};
}

export const GET: RequestHandler = async ({ fetch, params }) => {
	let profile: ApiProfileResponse['profile'];
	try {
		const response = await communityApi<ApiProfileResponse>(
			fetch,
			`profiles/${encodeURIComponent(params.username)}`
		);
		profile = response.profile;
	} catch (cause) {
		if (cause instanceof CommunityApiError && cause.status === 404) {
			error(404, 'Profile preview is unavailable.');
		}
		console.error('Could not load profile social preview data.', cause);
		return new Response('Profile preview is temporarily unavailable.', { status: 503 });
	}

	try {
		const image = await renderBrandedOgImage({
			title: profile.displayName,
			description: profile.bio || `@${profile.username} on the Sanctyria community.`,
			eyebrow: `COMMUNITY PROFILE · @${profile.username}`,
			imageUrl: profile.avatarUrl,
			cacheVersion: profile.avatarVersion ?? undefined,
			initials:
				profile.initials ??
				profile.displayName
					.split(/\s+/)
					.slice(0, 2)
					.map((part) => part[0] ?? '')
					.join('')
					.toUpperCase()
		});
		return new Response(new Uint8Array(image), {
			headers: {
				'content-type': 'image/png',
				'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
				'content-length': String(image.byteLength),
				'X-Content-Type-Options': 'nosniff'
			}
		});
	} catch (cause) {
		console.error('Could not render profile social preview.', cause);
		return new Response('Could not render profile preview.', { status: 500 });
	}
};
