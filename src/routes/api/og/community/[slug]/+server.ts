import { CommunityApiError, communityApi } from '#lib/community/communityApi.js';
import { renderBrandedOgImage } from '#lib/server/ogImage.js';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface ApiCommunityResponse {
	community: {
		name: string;
		slug: string;
		description: string;
		avatarUrl?: string | null;
		bannerUrl?: string | null;
		updatedAt?: string;
	};
}

export const GET: RequestHandler = async ({ fetch, params }) => {
	let community: ApiCommunityResponse['community'];
	try {
		const response = await communityApi<ApiCommunityResponse>(
			fetch,
			`communities/${encodeURIComponent(params.slug)}`
		);
		community = response.community;
	} catch (cause) {
		if (cause instanceof CommunityApiError && cause.status === 404) {
			error(404, 'Community preview is unavailable.');
		}
		console.error('Could not load community social preview data.', cause);
		return new Response('Community preview is temporarily unavailable.', { status: 503 });
	}

	try {
		const image = await renderBrandedOgImage({
			title: community.name,
			description: community.description || `Join ${community.name} on the Sanctyria community.`,
			eyebrow: `COMMUNITY · /R/${community.slug.toUpperCase()}`,
			imageUrl: community.avatarUrl ?? community.bannerUrl,
			cacheVersion: community.updatedAt,
			initials: community.name
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
		console.error('Could not render community social preview.', cause);
		return new Response('Could not render community preview.', { status: 500 });
	}
};
