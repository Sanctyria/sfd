import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { communityApi, CommunityApiError, type ApiPage } from '#lib/community/communityApi.js';

export interface ModerationReport {
	id: string;
	targetType: 'post' | 'reply';
	targetId: string;
	postId: string | null;
	targetBody: string | null;
	reason: string;
	status: 'open' | 'reviewing' | 'resolved' | 'dismissed';
	createdAt: string;
	reporterUsername: string;
	reporterDisplayName: string;
}

export interface ModerationAction {
	id: string;
	targetType: string;
	targetId: string;
	action: string;
	reason: string;
	createdAt: string;
	actorUsername: string;
	actorDisplayName: string;
	communitySlug: string;
	communityName: string;
}

export const load: PageServerLoad = async ({ fetch, parent }) => {
	const parentData = await parent();
	if (!parentData.communityUser)
		redirect(303, `/login?returnTo=${encodeURIComponent('/moderation')}`);
	const canModerate = parentData.communityUser.communities.some(
		(community) => community.role === 'owner' || community.role === 'moderator'
	);
	if (!canModerate) error(403, 'You do not have permission to access moderation.');
	try {
		const page = await communityApi<ApiPage<ModerationReport>>(
			fetch,
			'moderation/reports?status=open&limit=25'
		);
		return { items: page.items, nextCursor: page.nextCursor };
	} catch (cause) {
		if (cause instanceof CommunityApiError && cause.status === 401) {
			redirect(303, `/login?returnTo=${encodeURIComponent('/moderation')}`);
		}
		if (cause instanceof CommunityApiError && cause.status === 403) {
			error(403, 'You do not have permission to access moderation.');
		}
		error(503, 'The moderation queue is temporarily unavailable. Please try again shortly.');
	}
};
