import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { communityApi } from '#lib/community/communityApi.js';

export interface CommunityChatSummary {
	id: string;
	slug: string;
	name: string;
	avatarUrl: string | null;
	viewerRole: 'member' | 'moderator' | 'owner';
	chatNotificationsEnabled: boolean;
	unreadCount: number;
	memberCount: number;
	lastMessageBody: string | null;
	lastMessageMediaUrl: string | null;
	lastMessageMediaKind: string | null;
	lastMessageAt: string | null;
}

export const load: PageServerLoad = async ({ fetch, parent }) => {
	const { communityUser } = await parent();
	if (!communityUser) redirect(303, `/login?returnTo=${encodeURIComponent('/chats')}`);
	const response = await communityApi<{ items: CommunityChatSummary[] }>(fetch, 'me/chats');
	if (!response.items) error(503, 'Community chats are temporarily unavailable.');
	return { chats: response.items };
};
