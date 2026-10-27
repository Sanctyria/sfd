import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type {
	ApiNotification,
	ApiNotificationsResponse,
	ApiWeeklyEmberResponse
} from '#lib/community/communityApi.js';
import { loadJournalArticles } from '#lib/marketing/journalApi.js';
import type { JournalArticle } from '#lib/marketing/journal.js';

interface SessionUser {
	id: string;
	username: string;
	displayName: string;
	avatarUrl?: string | null;
	initials?: string | null;
	avatarColor?: string | null;
	ember?: number;
	isAdmin?: boolean;
	communities: { slug: string; name: string; role: 'member' | 'moderator' | 'owner' }[];
}

interface CommunityListResponse {
	items: {
		slug: string;
		name: string;
		description: string;
		avatarUrl?: string | null;
		memberCount: number;
		activeEmber?: number;
	}[];
}

const communityColors: Record<string, string> = {
	'the-archive': '#d8a37e',
	worldbuilding: '#f97316',
	'writing-room': '#84a5bd',
	'visual-studies': '#58a6a6',
	'studio-notes': '#be8ea9'
};

export const load: LayoutServerLoad = async ({ fetch, depends, url }) => {
	depends('app:community-content');
	const [sessionResponse, communitiesResponse] = await Promise.all([
		fetch('/api/community/me'),
		fetch('/api/community/communities?limit=50')
	]);
	let sessionPayload: { user: SessionUser } | null = null;
	if (sessionResponse.ok) {
		sessionPayload = (await sessionResponse.json()) as { user: SessionUser };
	} else if (sessionResponse.status !== 401) {
		throw error(503, 'The community service is temporarily unavailable.');
	}
	const communityPayload = communitiesResponse.ok
		? ((await communitiesResponse.json()) as CommunityListResponse)
		: { items: [] };
	let weeklyVoices: ApiWeeklyEmberResponse['items'] = [];
	let journalArticles: JournalArticle[] = [];
	if (url.pathname !== '/home') {
		const [weeklyResponse, articles] = await Promise.all([
			fetch('/api/community/ember/weekly?limit=3'),
			loadJournalArticles(fetch)
		]);
		if (weeklyResponse.ok) {
			weeklyVoices = ((await weeklyResponse.json()) as ApiWeeklyEmberResponse).items;
		} else {
			console.error('Could not load weekly community voices.', weeklyResponse.status);
		}
		journalArticles = [...articles]
			.sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
			.slice(0, 3);
	}
	let notificationPayload: ApiNotificationsResponse = {
		items: [],
		nextCursor: null,
		unreadCount: 0
	};
	if (sessionPayload) {
		try {
			const response = await fetch('/api/community/notifications?limit=5');
			if (response.ok) notificationPayload = (await response.json()) as ApiNotificationsResponse;
		} catch {
			notificationPayload = { items: [], nextCursor: null, unreadCount: 0 };
		}
	}

	return {
		communityUser: sessionPayload?.user ?? null,
		communityNotifications: notificationPayload.items as ApiNotification[],
		communityUnreadCount: notificationPayload.unreadCount,
		communityWeeklyVoices: weeklyVoices,
		communityJournalArticles: journalArticles,
		communityDirectory: communityPayload.items.map((community) => ({
			...community,
			members: community.memberCount.toLocaleString(),
			activeEmber: community.activeEmber ?? 0,
			avatarUrl: community.avatarUrl ?? null,
			color: communityColors[community.slug] ?? '#f97316'
		}))
	};
};
