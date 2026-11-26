import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { communityApi } from '#lib/community/communityApi.js';
import type { CommunityChatSummary } from '../+page.server.js';

interface ChatMessage {
	id: string;
	body: string;
	mediaUrl: string | null;
	mediaKind: 'image_url' | 'audio_url' | null;
	replyToId: string | null;
	replyToBody: string | null;
	replyToAuthorName: string | null;
	editedAt: string | null;
	isPinned: boolean;
	reactions: { emoji: string; count: number; reacted: boolean }[];
	createdAt: string;
	author: {
		username: string;
		displayName: string;
		avatarUrl: string | null;
		initials: string | null;
		avatarColor: string | null;
		verified: boolean;
		role: string;
	};
}

export const load: PageServerLoad = async ({ fetch, parent, params, depends }) => {
	depends('app:community-chat');
	const { communityUser } = await parent();
	if (!communityUser)
		redirect(303, `/login?returnTo=${encodeURIComponent(`/chats/${params.slug}`)}`);
	const chatsResponse = await communityApi<{ items: CommunityChatSummary[] }>(fetch, 'me/chats');
	const community = chatsResponse.items.find((chat) => chat.slug === params.slug);
	if (!community) error(404, 'This community chat is not available.');
	const messagePage = await communityApi<{ items: ChatMessage[]; nextCursor: string | null }>(
		fetch,
		`communities/${encodeURIComponent(params.slug)}/chat/messages?limit=50`
	);
	return { community, messages: messagePage.items, nextCursor: messagePage.nextCursor };
};
