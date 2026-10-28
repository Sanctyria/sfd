import type { CommunityPost, CommunityReply } from './community';

export interface ApiProfile {
	username: string;
	displayName: string;
	bio: string;
	avatarUrl: string | null;
	avatarVersion: string | null;
	bannerUrl?: string | null;
	initials: string | null;
	avatarColor: string | null;
	ember: number;
	verified: boolean;
	indexingOptedIn?: boolean;
	indexable?: boolean;
	createdAt: string;
	followerCount: number;
	followingCount: number;
	isFollowing: boolean;
	isBlocked?: boolean;
	isBlockedBy?: boolean;
	isMuted?: boolean;
	communities: { slug: string; name: string; avatarUrl?: string | null }[];
}

export interface ApiProfileConnection {
	id: string;
	username: string;
	displayName: string;
	bio: string;
	avatarUrl: string | null;
	avatarVersion: string | null;
	initials: string | null;
	avatarColor: string | null;
	verified: boolean;
	createdAt: string;
}

export interface ApiCommunity {
	id: string;
	creatorId?: string | null;
	viewerRole?: 'member' | 'moderator' | 'owner' | null;
	slug: string;
	name: string;
	description: string;
	avatarUrl?: string | null;
	bannerUrl?: string | null;
	websiteUrl?: string | null;
	indexable?: boolean;
	memberCount: number;
	activeEmber?: number;
	createdAt: string;
	updatedAt?: string;
}

export interface ApiWeeklyEmberResponse {
	periodDays: number;
	items: {
		username: string;
		displayName: string;
		bio: string;
		avatarUrl: string | null;
		initials: string | null;
		avatarColor: string | null;
		ember: number;
	}[];
}

export interface ApiCommunityBanner {
	id: string;
	eyebrow: string;
	title: string;
	description: string;
	action: string;
	href: string;
	image: string;
	imageAlt: string;
	accent: string;
}

export interface ApiGlobalSearchResponse {
	members: {
		username: string;
		displayName: string;
		avatarUrl: string | null;
		avatarVersion: string | null;
		initials: string | null;
		avatarColor: string | null;
	}[];
	communities: {
		slug: string;
		name: string;
		description: string;
		avatarUrl?: string | null;
		memberCount: number;
	}[];
	posts: {
		id: string;
		body: string;
		createdAt: string;
		community: { slug: string; name: string; avatarUrl?: string | null };
		author: { username: string; displayName: string; isFollowing?: boolean };
	}[];
}

export interface ApiReply {
	id: string;
	parentReplyId: string | null;
	body: string;
	createdAt: string;
	removed?: boolean;
	canManage?: boolean;
	reactionCount?: number;
	reacted?: boolean;
	isPostAuthor?: boolean;
	isCommunityOwner?: boolean;
	isCommunityModerator?: boolean;
	author: ApiAuthor;
}

export interface ApiAuthor {
	id: string;
	username: string;
	displayName: string;
	avatarUrl: string | null;
	avatarVersion: string | null;
	initials: string | null;
	avatarColor: string | null;
	verified: boolean;
	isFollowing?: boolean;
}

export interface ApiPost {
	id: string;
	kind: 'text' | 'link' | 'image_url' | 'video_url';
	body: string;
	url: string | null;
	linkTitle: string | null;
	linkDescription: string | null;
	linkDomain: string | null;
	voteCount: number;
	downvoteCount: number;
	replyCount?: number;
	isReacted?: boolean;
	isDownvoted?: boolean;
	isBookmarked?: boolean;
	canManage?: boolean;
	indexable?: boolean;
	createdAt: string;
	community: Pick<ApiCommunity, 'id' | 'slug' | 'name' | 'avatarUrl'>;
	author: ApiAuthor;
	replies?: ApiReply[];
}

export interface ApiFeedResponse {
	items: ApiPost[];
	personalized: boolean;
	nextCursor: string | null;
}

export interface ApiCommunitiesResponse {
	items: ApiCommunity[];
	nextCursor: string | null;
}

export interface ApiProfilesResponse {
	items: Omit<ApiProfile, 'communities'>[];
	nextCursor: string | null;
}

export interface ApiPage<T> {
	items: T[];
	nextCursor: string | null;
}

export interface ApiProfileReply {
	id: string;
	body: string;
	createdAt: string;
	post: {
		id: string;
		body: string;
		kind: ApiPost['kind'];
		url: string | null;
		communitySlug: string;
		communityName: string;
	};
}

export async function communityApi<T>(
	fetcher: typeof fetch,
	path: string,
	init?: RequestInit
): Promise<T> {
	const method = init?.method?.toUpperCase() ?? 'GET';
	const response = await fetcher(`/api/community/${path.replace(/^\//, '')}`, {
		...init,
		...(init?.body === undefined && ['POST', 'PUT', 'PATCH'].includes(method)
			? { body: '{}' }
			: {}),
		credentials: 'same-origin',
		headers: {
			accept: 'application/json',
			...(init?.body || ['POST', 'PUT', 'PATCH'].includes(method)
				? { 'content-type': 'application/json' }
				: {}),
			...init?.headers
		}
	});

	if (!response.ok) {
		if (response.status === 401 && typeof window !== 'undefined') {
			window.dispatchEvent(new Event('community:session-expired'));
		}
		const payload = (await response.json().catch(() => null)) as {
			error?: { message?: string; code?: string };
		} | null;
		throw new CommunityApiError(
			response.status,
			payload?.error?.message ?? 'The community request failed.',
			payload?.error?.code
		);
	}

	if (response.status === 204) return undefined as T;
	return (await response.json()) as T;
}

function timeSince(isoDate: string): { minutes: number; label: string } {
	const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(isoDate)) / 60_000));
	if (minutes < 60) return { minutes, label: `${minutes} min ago` };
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return { minutes, label: `${hours} hr${hours === 1 ? '' : 's'} ago` };
	const days = Math.floor(hours / 24);
	return { minutes, label: `${days} day${days === 1 ? '' : 's'} ago` };
}

export function toCommunityReply(reply: ApiReply): CommunityReply {
	return {
		id: reply.id,
		parentReplyId: reply.parentReplyId,
		removed: reply.removed ?? false,
		canManage: reply.canManage ?? false,
		name: reply.author.displayName,
		handle: `@${reply.author.username}`,
		initials: reply.author.initials ?? reply.author.displayName.slice(0, 2).toUpperCase(),
		color: reply.author.avatarColor ?? '#66744b',
		avatarUrl: reply.author.avatarUrl,
		verified: reply.author.verified,
		isPostAuthor: reply.isPostAuthor ?? false,
		isCommunityOwner: reply.isCommunityOwner ?? false,
		isCommunityModerator: reply.isCommunityModerator ?? false,
		text: reply.body,
		reactionCount: reply.reactionCount ?? 0,
		reacted: reply.reacted ?? false
	};
}

export function toCommunityPost(post: ApiPost, joinedSlugs: string[] = []): CommunityPost {
	const age = timeSince(post.createdAt);
	return {
		id: post.id,
		name: post.author.displayName,
		handle: `@${post.author.username}`,
		initials: post.author.initials ?? post.author.displayName.slice(0, 2).toUpperCase(),
		avatarColor: post.author.avatarColor ?? '#66744b',
		avatarUrl: post.author.avatarUrl,
		verified: post.author.verified,
		isFollowingAuthor: post.author.isFollowing ?? false,
		community: post.community.name,
		communitySlug: post.community.slug,
		communityAvatarUrl: post.community.avatarUrl,
		communityColor: '#f97316',
		postedAt: age.label,
		minutesAgo: age.minutes,
		kind: post.kind === 'image_url' ? 'image' : post.kind === 'video_url' ? 'video' : post.kind,
		text: post.body,
		url: post.url ?? undefined,
		linkTitle: post.linkTitle ?? undefined,
		linkDescription: post.linkDescription ?? undefined,
		linkDomain: post.linkDomain ?? undefined,
		votes: post.voteCount,
		downvotes: post.downvoteCount ?? 0,
		replyCount: post.replyCount,
		isReacted: post.isReacted ?? false,
		isDownvoted: post.isDownvoted ?? false,
		isBookmarked: post.isBookmarked ?? false,
		canManage: post.canManage ?? false,
		indexable: post.indexable ?? false,
		replies: post.replies?.map(toCommunityReply) ?? [],
		joinedCommunity: joinedSlugs.includes(post.community.slug)
	};
}

export interface ApiCommunityMember {
	id: string;
	username: string;
	displayName: string;
	bio: string;
	avatarUrl: string | null;
	avatarVersion: string | null;
	initials: string | null;
	avatarColor: string | null;
	verified: boolean;
	createdAt: string;
	role?: 'member' | 'moderator' | 'owner' | null;
	isMuted?: boolean;
}

export interface ApiNotification {
	id: string;
	type: 'reply' | 'mention' | 'reaction' | 'community' | 'system';
	entityId: string | null;
	payload: Record<string, unknown>;
	createdAt: string;
	readAt: string | null;
}

export interface ApiNotificationsResponse {
	items: ApiNotification[];
	nextCursor: string | null;
	unreadCount: number;
}

export class CommunityApiError extends Error {
	constructor(
		public readonly status: number,
		message: string,
		public readonly code?: string
	) {
		super(message);
		this.name = 'CommunityApiError';
	}
}
