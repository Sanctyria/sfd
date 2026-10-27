export type CommunityPostKind = 'text' | 'link' | 'image' | 'video';

export interface CommunityReply {
	id?: string;
	parentReplyId?: string | null;
	removed?: boolean;
	canManage?: boolean;
	name: string;
	handle: string;
	initials: string;
	color: string;
	avatarUrl?: string | null;
	verified?: boolean;
	isCommunityOwner?: boolean;
	text: string;
	reactionCount?: number;
	reacted?: boolean;
}

export function orderRepliesThreaded<T extends CommunityReply>(replies: T[]): T[] {
	const repliesById = new Map(
		replies.flatMap((reply) => (reply.id ? [[reply.id, reply] as const] : []))
	);
	const childrenByParent = new Map<string, T[]>();
	const roots: T[] = [];

	for (const reply of replies) {
		const parentId = reply.parentReplyId;
		if (parentId && repliesById.has(parentId) && parentId !== reply.id) {
			const children = childrenByParent.get(parentId) ?? [];
			children.push(reply);
			childrenByParent.set(parentId, children);
		} else {
			roots.push(reply);
		}
	}

	const ordered: T[] = [];
	const visited = new Set<T>();
	const appendThread = (reply: T) => {
		if (visited.has(reply)) return;
		visited.add(reply);
		ordered.push(reply);
		for (const child of childrenByParent.get(reply.id ?? '') ?? []) appendThread(child);
	};

	for (const root of roots) appendThread(root);
	for (const reply of replies) appendThread(reply);
	return ordered;
}

export interface CommunityPost {
	id: string;
	name: string;
	handle: string;
	initials: string;
	avatarColor: string;
	avatarUrl?: string | null;
	verified?: boolean;
	isFollowingAuthor?: boolean;
	community: string;
	communitySlug?: string;
	communityAvatarUrl?: string | null;
	communityColor: string;
	postedAt: string;
	minutesAgo: number;
	kind: CommunityPostKind;
	text: string;
	downvotes?: number;
	url?: string;
	linkTitle?: string;
	linkDescription?: string;
	linkDomain?: string;
	votes: number;
	replyCount?: number;
	isReacted?: boolean;
	isDownvoted?: boolean;
	isBookmarked?: boolean;
	canManage?: boolean;
	replies: CommunityReply[];
	joinedCommunity: boolean;
}

export function communitySlug(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

export function videoEmbedUrl(url: string): string | null {
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== 'https:') return null;
		if (parsed.hostname === 'youtu.be') {
			const videoId = parsed.pathname.slice(1);
			return videoId
				? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`
				: null;
		}
		if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(parsed.hostname)) {
			const videoId = parsed.searchParams.get('v');
			if (videoId) return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}`;
			const shortId = parsed.pathname.match(/^\/shorts\/([\w-]+)/)?.[1];
			return shortId
				? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(shortId)}`
				: null;
		}
		if (parsed.hostname === 'vimeo.com' || parsed.hostname === 'www.vimeo.com') {
			const videoId = parsed.pathname.match(/^\/(\d+)/)?.[1];
			return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
		}
	} catch {
		return null;
	}
	return null;
}

export const demoPosts: CommunityPost[] = [
	{
		id: 'post-flame-memory',
		name: 'Mira Voss',
		handle: '@miravoss',
		initials: 'MV',
		avatarColor: '#9d5438',
		community: 'Worldbuilding',
		communityColor: '#f97316',
		postedAt: '18 min ago',
		minutesAgo: 18,
		kind: 'text',
		text: 'A world feels lived in when its people remember different versions of the same story. What small disagreement in your setting says the most about its history?',
		votes: 42,
		joinedCommunity: true,
		replies: [
			{
				name: 'Tarin Hale',
				handle: '@tarinhale',
				initials: 'TH',
				color: '#476259',
				text: 'Two villages both claim the old bridge was built by their ancestors. Their records almost agree, which makes the argument last forever.'
			},
			{
				name: 'Eli Rowan',
				handle: '@elirowan',
				initials: 'ER',
				color: '#596684',
				text: 'That “almost agree” is excellent. It lets both communities be right in the ways that matter to them.'
			}
		]
	},
	{
		id: 'post-eight-nations',
		name: 'Sanctyria Journal',
		handle: '@sanctyria',
		initials: 'S',
		avatarColor: '#ef6a32',
		verified: true,
		community: 'The Archive',
		communityColor: '#d8a37e',
		postedAt: '46 min ago',
		minutesAgo: 46,
		kind: 'link',
		text: 'A field note on the cultures, borders, and lived details behind the eight nations.',
		url: 'https://sanctyria.com/journal/eight-nations-one-sky',
		linkTitle: 'Eight Nations, One Sky',
		linkDescription:
			'A map can show where a border runs. It takes a people to tell you what that border means.',
		linkDomain: 'sanctyria.com',
		votes: 31,
		joinedCommunity: false,
		replies: []
	},
	{
		id: 'post-lake-study',
		name: 'Aren Sol',
		handle: '@arensol',
		initials: 'AS',
		avatarColor: '#466578',
		community: 'Visual Studies',
		communityColor: '#58a6a6',
		postedAt: '1 hr ago',
		minutesAgo: 60,
		kind: 'image',
		text: 'Light study for a quiet place between territories. Keeping the palette restrained helped the water feel like a boundary instead of a destination.',
		url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=85',
		votes: 27,
		joinedCommunity: true,
		replies: []
	},
	{
		id: 'post-sound-reference',
		name: 'Noor Sayegh',
		handle: '@noorsayegh',
		initials: 'NS',
		avatarColor: '#7c5a7c',
		community: 'Studio Notes',
		communityColor: '#be8ea9',
		postedAt: '2 hrs ago',
		minutesAgo: 120,
		kind: 'video',
		text: 'A sound reference for slow, atmospheric scene transitions. Curious what details you notice first.',
		url: 'https://youtu.be/ysz5S6PUM-U',
		votes: 19,
		joinedCommunity: false,
		replies: []
	},
	{
		id: 'post-world-question',
		name: 'Jules Ferren',
		handle: '@julesferren',
		initials: 'JF',
		avatarColor: '#66744b',
		community: 'Worldbuilding',
		communityColor: '#f97316',
		postedAt: '3 hrs ago',
		minutesAgo: 180,
		kind: 'text',
		text: 'Question for the mapmakers: how do you decide where a road stops being practical and starts becoming part of the story?',
		votes: 16,
		joinedCommunity: true,
		replies: []
	},
	{
		id: 'post-writing-guide',
		name: 'Lio Maren',
		handle: '@liomaren',
		initials: 'LM',
		avatarColor: '#9b704e',
		community: 'Writing Room',
		communityColor: '#84a5bd',
		postedAt: '5 hrs ago',
		minutesAgo: 300,
		kind: 'link',
		text: 'A useful reminder from the journal: a legend can be more than lore when readers recognize something human inside it.',
		url: 'https://sanctyria.com/journal/the-flame-that-remembers',
		linkTitle: 'The Flame That Remembers',
		linkDescription:
			'Memory in Sanctyria is personal and imperfect. The Flame carries choices forward.',
		linkDomain: 'sanctyria.com',
		votes: 12,
		joinedCommunity: false,
		replies: []
	}
];

export const suggestedMembers = [
	{
		name: 'Tarin Hale',
		handle: '@tarinhale',
		initials: 'TH',
		color: '#476259',
		field: 'Maps & old histories'
	},
	{
		name: 'Eli Rowan',
		handle: '@elirowan',
		initials: 'ER',
		color: '#596684',
		field: 'Writing & lore'
	},
	{
		name: 'Aren Sol',
		handle: '@arensol',
		initials: 'AS',
		color: '#466578',
		field: 'Visual studies'
	}
];

export const communityDirectory = [
	{
		name: 'The Archive',
		members: '2.1k',
		color: '#d8a37e',
		description: 'Journal dispatches and recovered records from the world.'
	},
	{
		name: 'Worldbuilding',
		members: '1.2k',
		color: '#f97316',
		description: 'Make worlds with history and texture.'
	},
	{
		name: 'Writing Room',
		members: '846',
		color: '#84a5bd',
		description: 'Drafts, prompts, and thoughtful critique.'
	},
	{
		name: 'Visual Studies',
		members: '582',
		color: '#58a6a6',
		description: 'Concepts, references, and art direction.'
	},
	{
		name: 'Studio Notes',
		members: '319',
		color: '#be8ea9',
		description: 'Music, sound, and process notes.'
	}
];
