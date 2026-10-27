<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		ArrowUpRight,
		BadgeCheck,
		Bookmark,
		Check,
		ChevronDown,
		ChevronLeft,
		ChevronRight,
		CornerDownRight,
		Crown,
		Flame,
		Grid2X2,
		Image,
		Link,
		List,
		MessageCircle,
		MoreHorizontal,
		PenLine,
		Pencil,
		Plus,
		Search,
		Send,
		Skull,
		Share2,
		Trash2,
		Video,
		X
	} from '@lucide/svelte';
	import {
		communitySlug,
		orderRepliesThreaded,
		type CommunityPost,
		type CommunityPostKind,
		type CommunityReply,
		videoEmbedUrl
	} from '#lib/community/community.js';
	import { brandedOgImageUrl } from '#lib/community/og.js';
	import {
		communityApi,
		toCommunityPost,
		toCommunityReply,
		type ApiFeedResponse,
		type ApiPage,
		type ApiReply
	} from '#lib/community/communityApi.js';
	import CommunityBottomNav from '#lib/community/components/CommunityBottomNav.svelte';
	import CommunityFollowButton from '#lib/community/components/CommunityFollowButton.svelte';
	import CommunityLinkPreview from '#lib/community/components/CommunityLinkPreview.svelte';
	import { subscribeCommunityRealtime } from '#lib/community/communityRealtime.js';
	import type { PageProps } from './$types';

	type PostFilter = 'All' | 'Discussions' | 'Links' | 'Media';
	type SortOrder = 'Hot' | 'New';

	let { data }: PageProps = $props();
	const homeOgImage = brandedOgImageUrl(
		'Sanctyria Community',
		'Explore public conversations, creative work, and communities across Sanctyria.',
		'COMMUNITY'
	);
	let additionalPosts = $state<CommunityPost[]>([]);
	let feedCursor = $state<string | null>(null);
	let feedLoading = $state(false);
	let loadedFeedKey = '';
	let posts = $derived([...data.posts, ...additionalPosts]);
	const activeCircles = $derived(
		[...data.communities].sort((a, b) => (b.activeEmber ?? 0) - (a.activeEmber ?? 0)).slice(0, 3)
	);
	const popularCircles = $derived(
		[...data.communities].sort((a, b) => b.memberCount - a.memberCount).slice(0, 3)
	);
	const activeTab = $derived.by(() => {
		const feed = page.url.searchParams.get('feed');
		if (!data.communityUser) return feed === 'explore' ? 'Explore' : 'Community';
		if (feed === 'community') return 'Community';
		if (feed === 'explore') return 'Explore';
		return 'Following';
	});
	let activeFilter = $state<PostFilter>('All');
	let sortOrder = $state<SortOrder>('Hot');
	let compactFeed = $state(false);
	let searchTerm = $state('');
	let composerOpen = $state(false);
	let composerKind = $state<CommunityPostKind>('text');
	let activeAnnouncement = $state(0);
	let announcementRotationPaused = $state(false);
	const announcements = $derived(data.announcements);
	let draftText = $state('');
	let draftUrl = $state('');
	let draftCommunity = $state('worldbuilding');
	let composerError = $state('');
	let toast = $state('');
	let openReplies = $state<string[]>([]);
	let expandedReplyIds = $state<string[]>([]);
	let loadedReplies = $state<Record<string, CommunityReply[] | undefined>>({});
	let replyCursors = $state<Record<string, string | null>>({});
	let replyLoading = $state<string[]>([]);
	let votedPosts = $state<string[]>([]);
	let downvotedPosts = $state<string[]>([]);
	let voteCounts = $state<Record<string, number>>({});
	let downvoteCounts = $state<Record<string, number>>({});
	let savedPosts = $state<string[]>([]);
	let replyDrafts = $state<Record<string, string>>({});
	let replyTargets = $state<Record<string, CommunityReply | null>>({});
	let editingReplyId = $state<string | null>(null);
	let replyEditDraft = $state('');
	let replyEditError = $state('');
	let replySaving = $state(false);
	let reportingPost = $state<string | null>(null);
	let editingPost = $state<CommunityPost | null>(null);
	let editDraftText = $state('');
	let editDraftUrl = $state('');
	let editError = $state('');
	let editSubmitting = $state(false);
	let reportReason = $state('');
	let reportError = $state('');
	let reportSubmitting = $state(false);
	let communityCreateOpen = $state(false);
	let newCommunityName = $state('');
	let newCommunityDescription = $state('');
	let communityCreateError = $state('');
	let communityCreateLoading = $state(false);
	let joinedCommunities = $derived(data.joinedSlugs);
	let searchInput = $state<HTMLInputElement>();
	let toastTimer: ReturnType<typeof setTimeout>;

	const postKinds: { kind: CommunityPostKind; label: string; icon: typeof Link }[] = [
		{ kind: 'text', label: 'Text', icon: MessageCircle },
		{ kind: 'link', label: 'Link', icon: Link },
		{ kind: 'image', label: 'Image link', icon: Image },
		{ kind: 'video', label: 'Video link', icon: Video }
	];

	onMount(() =>
		subscribeCommunityRealtime(() => {
			voteCounts = {};
			void invalidate('app:community-content');
		})
	);

	const filteredPosts = $derived.by(() => {
		let result = [...posts];
		if (activeTab === 'Following' && data.communityUser) {
			result = result.filter((post) => post.joinedCommunity);
		}
		if (activeFilter === 'Discussions') {
			result = result.filter((post) => post.kind === 'text');
		} else if (activeFilter === 'Links') {
			result = result.filter((post) => post.kind === 'link');
		} else if (activeFilter === 'Media') {
			result = result.filter((post) => post.kind === 'image' || post.kind === 'video');
		}
		const normalizedQuery = searchTerm.trim().toLowerCase();
		if (normalizedQuery) {
			result = result.filter((post) =>
				`${post.name} ${post.handle} ${post.community} ${post.text} ${post.linkTitle ?? ''}`
					.toLowerCase()
					.includes(normalizedQuery)
			);
		}
		return result.sort((left, right) =>
			sortOrder === 'Hot' ? right.votes - left.votes : left.minutesAgo - right.minutesAgo
		);
	});

	const exploreDirectory = $derived.by(() => {
		const normalizedQuery = searchTerm.trim().toLowerCase();
		if (!normalizedQuery) return data.communities;
		return data.communities.filter((community) =>
			`${community.name} ${community.description}`.toLowerCase().includes(normalizedQuery)
		);
	});

	$effect(() => {
		const feedKey = `${data.feedScope}:${data.posts.map((post) => post.id).join(':')}`;
		if (feedKey === loadedFeedKey) return;
		loadedFeedKey = feedKey;
		additionalPosts = [];
		feedCursor = data.postsCursor;
		votedPosts = data.posts.filter((post) => post.isReacted).map((post) => post.id);
		downvotedPosts = data.posts.filter((post) => post.isDownvoted).map((post) => post.id);
		savedPosts = data.posts.filter((post) => post.isBookmarked).map((post) => post.id);
		voteCounts = Object.fromEntries(data.posts.map((post) => [post.id, post.votes]));
		downvoteCounts = Object.fromEntries(data.posts.map((post) => [post.id, post.downvotes ?? 0]));
	});

	async function loadMoreFeed() {
		if (!feedCursor || feedLoading) return;
		feedLoading = true;
		try {
			const page = await communityApi<ApiFeedResponse>(
				fetch,
				`feed?scope=${data.feedScope}&limit=50&cursor=${encodeURIComponent(feedCursor)}`
			);
			const loadedPosts = page.items.map((post) => toCommunityPost(post, data.joinedSlugs));
			additionalPosts = [...additionalPosts, ...loadedPosts];
			votedPosts = [
				...new Set([
					...votedPosts,
					...loadedPosts.filter((post) => post.isReacted).map((post) => post.id)
				])
			];
			downvotedPosts = [
				...new Set([
					...downvotedPosts,
					...loadedPosts.filter((post) => post.isDownvoted).map((post) => post.id)
				])
			];
			savedPosts = [
				...new Set([
					...savedPosts,
					...loadedPosts.filter((post) => post.isBookmarked).map((post) => post.id)
				])
			];
			voteCounts = {
				...voteCounts,
				...Object.fromEntries(loadedPosts.map((post) => [post.id, post.votes]))
			};
			downvoteCounts = {
				...downvoteCounts,
				...Object.fromEntries(loadedPosts.map((post) => [post.id, post.downvotes ?? 0]))
			};
			feedCursor = page.nextCursor;
		} catch (error) {
			displayToast(error instanceof Error ? error.message : 'Could not load more posts.');
		} finally {
			feedLoading = false;
		}
	}

	$effect(() => {
		searchTerm = page.url.searchParams.get('search') ?? '';
		const requestedCommunity = page.url.searchParams.get('community');
		if (
			requestedCommunity &&
			data.communities.some((community) => community.slug === requestedCommunity)
		) {
			draftCommunity = requestedCommunity;
		}
		if (page.url.searchParams.get('compose') === '1' && data.communityUser) composerOpen = true;
		if (page.url.searchParams.get('focus') === 'search') requestAnimationFrame(focusSearch);
	});

	$effect(() => {
		if (!announcements.length || announcementRotationPaused) return;
		const rotation = window.setInterval(() => {
			activeAnnouncement = (activeAnnouncement + 1) % announcements.length;
		}, 6000);
		return () => window.clearInterval(rotation);
	});

	$effect(() => {
		if (activeAnnouncement >= announcements.length) activeAnnouncement = 0;
	});

	function resumeAnnouncementRotation(event: FocusEvent) {
		const carousel = event.currentTarget as HTMLElement;
		if (!carousel.contains(event.relatedTarget as Node | null)) announcementRotationPaused = false;
	}

	function moveAnnouncement(direction: number) {
		activeAnnouncement =
			(activeAnnouncement + direction + announcements.length) % announcements.length;
	}

	function displayToast(message: string) {
		toast = message;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => (toast = ''), 2400);
	}

	function focusSearch() {
		searchInput?.focus();
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	async function toggleReplies(postId: string) {
		if (openReplies.includes(postId)) {
			openReplies = openReplies.filter((id) => id !== postId);
			return;
		}
		openReplies = [...openReplies, postId];
		if (loadedReplies[postId] === undefined) await loadReplies(postId);
	}

	async function loadReplies(postId: string, refresh = false) {
		if (replyLoading.includes(postId)) return;
		replyLoading = [...replyLoading, postId];
		try {
			const cursor = refresh ? null : replyCursors[postId];
			const query = cursor ? `&cursor=${encodeURIComponent(cursor)}` : '';
			const page = await communityApi<ApiPage<ApiReply>>(
				fetch,
				`posts/${encodeURIComponent(postId)}/replies?limit=20${query}`
			);
			const mapped = page.items.map(toCommunityReply);
			loadedReplies = {
				...loadedReplies,
				[postId]: refresh ? mapped : [...(loadedReplies[postId] ?? []), ...mapped]
			};
			replyCursors = { ...replyCursors, [postId]: page.nextCursor };
		} catch (error) {
			displayToast(error instanceof Error ? error.message : 'Could not load replies.');
		} finally {
			replyLoading = replyLoading.filter((id) => id !== postId);
		}
	}

	async function setPostVote(postId: string, direction: 'up' | 'down') {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent('/home')}`);
			return;
		}
		try {
			const result = await communityApi<{
				voteDirection: 'up' | 'down' | null;
				voteCount: number;
				downvoteCount: number;
			}>(fetch, `posts/${encodeURIComponent(postId)}/vote`, {
				method: 'POST',
				body: JSON.stringify({ direction })
			});
			votedPosts =
				result.voteDirection === 'up'
					? [...new Set([...votedPosts, postId])]
					: votedPosts.filter((id) => id !== postId);
			downvotedPosts =
				result.voteDirection === 'down'
					? [...new Set([...downvotedPosts, postId])]
					: downvotedPosts.filter((id) => id !== postId);
			voteCounts = { ...voteCounts, [postId]: result.voteCount };
			downvoteCounts = { ...downvoteCounts, [postId]: result.downvoteCount };
		} catch (error) {
			displayToast(error instanceof Error ? error.message : 'Could not update reaction.');
		}
	}

	async function toggleReplyReaction(postId: string, reply: CommunityReply) {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent('/home')}`);
			return;
		}
		if (!reply.id) return;
		try {
			const result = await communityApi<{ reacted: boolean; reactionCount: number }>(
				fetch,
				`replies/${encodeURIComponent(reply.id)}/reaction`,
				{ method: reply.reacted ? 'DELETE' : 'POST' }
			);
			loadedReplies = {
				...loadedReplies,
				[postId]: (loadedReplies[postId] ?? []).map((item) =>
					item.id === reply.id
						? { ...item, reacted: result.reacted, reactionCount: result.reactionCount }
						: item
				)
			};
		} catch (error) {
			displayToast(error instanceof Error ? error.message : 'Could not update reply reaction.');
		}
	}

	async function toggleSave(postId: string) {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent('/home')}`);
			return;
		}
		try {
			const result = await communityApi<{ saved: boolean }>(
				fetch,
				`posts/${encodeURIComponent(postId)}/bookmark`,
				{ method: savedPosts.includes(postId) ? 'DELETE' : 'POST' }
			);
			savedPosts = result.saved
				? [...new Set([...savedPosts, postId])]
				: savedPosts.filter((id) => id !== postId);
		} catch (error) {
			displayToast(error instanceof Error ? error.message : 'Could not update bookmark.');
		}
	}

	function openPostReport(postId: string) {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent('/home')}`);
			return;
		}
		reportingPost = postId;
		reportReason = '';
		reportError = '';
	}

	async function submitPostReport(event: SubmitEvent) {
		event.preventDefault();
		if (!reportingPost) return;
		reportSubmitting = true;
		reportError = '';
		try {
			await communityApi(fetch, 'reports', {
				method: 'POST',
				body: JSON.stringify({
					targetType: 'post',
					targetId: reportingPost,
					reason: reportReason
				})
			});
			reportingPost = null;
			displayToast('Report submitted for review.');
		} catch (error) {
			reportError = error instanceof Error ? error.message : 'Could not submit report.';
		} finally {
			reportSubmitting = false;
		}
	}

	function openReplyEditor(reply: CommunityReply) {
		if (!reply.id || !reply.canManage) return;
		editingReplyId = reply.id;
		replyEditDraft = reply.text;
		replyEditError = '';
	}

	async function saveReply(postId: string, replyId: string) {
		if (replySaving) return;
		const body = replyEditDraft.trim();
		if (!body) {
			replyEditError = 'Reply text cannot be empty.';
			return;
		}
		replySaving = true;
		replyEditError = '';
		try {
			await communityApi(fetch, `replies/${encodeURIComponent(replyId)}`, {
				method: 'PATCH',
				body: JSON.stringify({ body })
			});
			loadedReplies = {
				...loadedReplies,
				[postId]: (loadedReplies[postId] ?? []).map((reply) =>
					reply.id === replyId ? { ...reply, text: body } : reply
				)
			};
			editingReplyId = null;
			await invalidate('app:community-content');
		} catch (error) {
			replyEditError = error instanceof Error ? error.message : 'Could not update reply.';
		} finally {
			replySaving = false;
		}
	}

	async function deleteReply(postId: string, reply: CommunityReply) {
		if (!reply.id || !reply.canManage || !window.confirm('Delete this reply?')) return;
		try {
			await communityApi(fetch, `replies/${encodeURIComponent(reply.id)}`, { method: 'DELETE' });
			loadedReplies = {
				...loadedReplies,
				[postId]: (loadedReplies[postId] ?? []).filter((item) => item.id !== reply.id)
			};
			await invalidate('app:community-content');
		} catch (error) {
			displayToast(error instanceof Error ? error.message : 'Could not delete reply.');
		}
	}

	function openPostEditor(post: CommunityPost) {
		if (!post.canManage) return;
		editingPost = post;
		editDraftText = post.text;
		editDraftUrl = post.url ?? '';
		editError = '';
	}

	async function submitPostEdit(event: SubmitEvent) {
		event.preventDefault();
		if (!editingPost) return;
		editSubmitting = true;
		editError = '';
		try {
			const body = editDraftText.trim();
			const url = editDraftUrl.trim();
			await communityApi(fetch, `posts/${encodeURIComponent(editingPost.id)}`, {
				method: 'PATCH',
				body: JSON.stringify({
					body,
					...(editingPost.kind !== 'text' ? { url } : {})
				})
			});
			editingPost = null;
			await invalidate('app:community-content');
			displayToast('Post updated.');
		} catch (error) {
			editError = error instanceof Error ? error.message : 'Could not update post.';
		} finally {
			editSubmitting = false;
		}
	}

	async function deletePost(post: CommunityPost) {
		if (
			!post.canManage ||
			!window.confirm('Delete this post? It will no longer be visible in the community.')
		)
			return;
		try {
			await communityApi(fetch, `posts/${encodeURIComponent(post.id)}`, { method: 'DELETE' });
			additionalPosts = additionalPosts.filter((item) => item.id !== post.id);
			await invalidate('app:community-content');
			displayToast('Post deleted.');
		} catch (error) {
			displayToast(error instanceof Error ? error.message : 'Could not delete post.');
		}
	}

	async function toggleCommunity(name: string) {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent('/home')}`);
			return;
		}
		const slug = communitySlug(name);
		const joined = joinedCommunities.includes(slug);
		try {
			await communityApi<void>(fetch, `communities/${encodeURIComponent(slug)}/membership`, {
				method: joined ? 'DELETE' : 'POST'
			});
			await invalidate('app:community-content');
		} catch (error) {
			displayToast(error instanceof Error ? error.message : 'Could not update membership.');
		}
	}

	function openCommunityCreator() {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent('/home?feed=explore')}`);
			return;
		}
		newCommunityName = '';
		newCommunityDescription = '';
		communityCreateError = '';
		communityCreateOpen = true;
	}

	async function createCommunity(event: SubmitEvent) {
		event.preventDefault();
		communityCreateError = '';
		communityCreateLoading = true;
		try {
			const result = await communityApi<{ community: { slug: string } }>(fetch, 'communities', {
				method: 'POST',
				body: JSON.stringify({ name: newCommunityName, description: newCommunityDescription })
			});
			communityCreateOpen = false;
			await invalidate('app:community-content');
			await goto(`/r/${result.community.slug}`);
		} catch (error) {
			communityCreateError = error instanceof Error ? error.message : 'Could not create community.';
		} finally {
			communityCreateLoading = false;
		}
	}

	function isHttpsUrl(value: string): boolean {
		try {
			return new URL(value).protocol === 'https:';
		} catch {
			return false;
		}
	}

	function sharePost(post: CommunityPost) {
		const url = `${window.location.origin}/p/${post.id}`;
		if (navigator.clipboard) {
			navigator.clipboard.writeText(url).then(
				() => displayToast('Post link copied'),
				() => displayToast(url)
			);
		} else {
			displayToast(url);
		}
	}

	async function publishPost(event: SubmitEvent) {
		event.preventDefault();
		composerError = '';
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent('/home')}`);
			return;
		}
		const text = draftText.trim();
		const url = draftUrl.trim();
		if (!text && !url) {
			composerError = 'Add some words or a link to your post.';
			return;
		}
		if (composerKind !== 'text' && !isHttpsUrl(url)) {
			composerError = 'Use a valid HTTPS link.';
			return;
		}
		const kind =
			composerKind === 'image'
				? 'image_url'
				: composerKind === 'video'
					? 'video_url'
					: composerKind;
		try {
			await communityApi(fetch, 'posts', {
				method: 'POST',
				body: JSON.stringify({ community: draftCommunity, kind, body: text, url: url || undefined })
			});
			draftText = '';
			draftUrl = '';
			composerOpen = false;
			displayToast('Post published.');
			await invalidate('app:community-content');
		} catch (error) {
			composerError = error instanceof Error ? error.message : 'Could not publish this post.';
		}
	}

	function selectReplyTarget(postId: string, reply: CommunityReply) {
		if (!reply.id) return;
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent('/home')}`);
			return;
		}
		replyTargets = { ...replyTargets, [postId]: reply };
	}

	function threadedReplies(postId: string): CommunityReply[] {
		return orderRepliesThreaded(loadedReplies[postId] ?? []);
	}

	function replyTreeVisible(postId: string, reply: CommunityReply): boolean {
		const replies = threadedReplies(postId);
		const byId = new Map(replies.flatMap((item) => (item.id ? [[item.id, item] as const] : [])));
		let parentId = reply.parentReplyId;
		while (parentId) {
			const parentReply = byId.get(parentId);
			if (!parentReply) break;
			if (!expandedReplyIds.includes(parentId)) return false;
			parentId = parentReply.parentReplyId;
		}
		return true;
	}

	function replyChildCount(postId: string, replyId: string): number {
		return threadedReplies(postId).filter((reply) => reply.parentReplyId === replyId).length;
	}

	function toggleReplyThread(replyId: string) {
		expandedReplyIds = expandedReplyIds.includes(replyId)
			? expandedReplyIds.filter((id) => id !== replyId)
			: [...expandedReplyIds, replyId];
	}

	async function submitReply(event: SubmitEvent, postId: string) {
		event.preventDefault();
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent('/home')}`);
			return;
		}
		const body = replyDrafts[postId]?.trim();
		if (!body) return;
		try {
			await communityApi(fetch, `posts/${encodeURIComponent(postId)}/replies`, {
				method: 'POST',
				body: JSON.stringify({
					body,
					...(replyTargets[postId]?.id ? { parentReplyId: replyTargets[postId].id } : {})
				})
			});
			replyDrafts = { ...replyDrafts, [postId]: '' };
			replyTargets = { ...replyTargets, [postId]: null };
			await loadReplies(postId, true);
			await invalidate('app:community-content');
		} catch (error) {
			displayToast(error instanceof Error ? error.message : 'Could not publish reply.');
		}
	}
</script>

<svelte:head>
	<title>Community | Sanctyria</title>
	<meta
		name="description"
		content="Explore public conversations, creative work, and communities across Sanctyria."
	/>
	<link rel="canonical" href="https://sanctyria.com/home" />
	<meta name="robots" content="noindex, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://sanctyria.com/home" />
	<meta property="og:title" content="Sanctyria Community" />
	<meta
		property="og:description"
		content="Explore public conversations, creative work, and communities across Sanctyria."
	/>
	<meta property="og:image" content={homeOgImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="Sanctyria Community" />
	<meta
		name="twitter:description"
		content="Explore public conversations, creative work, and communities across Sanctyria."
	/>
	<meta name="twitter:image" content={homeOgImage} />
</svelte:head>

<div class="community-app min-h-screen bg-[#090a0a] text-[#f1efe9]">
	<div
		class="community-layout mx-auto grid w-full max-w-7xl grid-cols-1 gap-0 px-0 md:gap-8 md:px-6 xl:gap-10"
	>
		<main class="community-main min-w-0 px-2 pb-28 sm:px-6 md:px-0 md:pb-10">
			{#if announcements.length}
				<section
					class="community-announcement relative mt-2 mb-6 overflow-hidden border border-white/[0.09] bg-[#111514]"
					aria-label="Community announcements"
					aria-roledescription="carousel"
					onmouseenter={() => (announcementRotationPaused = true)}
					onmouseleave={() => (announcementRotationPaused = false)}
					onfocusin={() => (announcementRotationPaused = true)}
					onfocusout={resumeAnnouncementRotation}
				>
					<span
						class="absolute inset-y-0 left-0 z-20 w-1"
						style={`background:${announcements[activeAnnouncement].accent}`}
					></span>
					<a
						href={announcements[activeAnnouncement].href}
						class="group relative flex min-h-44 sm:min-h-48"
					>
						<span class="flex min-w-0 flex-1 flex-col justify-center px-5 py-5 sm:px-7 sm:py-6">
							<span
								class="font-mono text-[9px] tracking-[0.14em] uppercase"
								style={`color:${announcements[activeAnnouncement].accent}`}
							>
								{announcements[activeAnnouncement].eyebrow}
							</span>
							<span
								class="mt-2 max-w-2xl font-display text-2xl leading-tight text-white sm:text-3xl"
							>
								{announcements[activeAnnouncement].title}
							</span>
							<span class="mt-2 max-w-xl text-xs leading-5 text-white/55">
								{announcements[activeAnnouncement].description}
							</span>
							<span
								class="mt-3 inline-flex items-center gap-1.5 text-[10px] text-white/80 transition-colors group-hover:text-white"
							>
								{announcements[activeAnnouncement].action}<ArrowUpRight size={13} />
							</span>
						</span>
						<span
							class="relative block w-24 shrink-0 overflow-hidden border-l border-white/[0.08] sm:w-48 lg:w-56"
						>
							<img
								src={announcements[activeAnnouncement].image}
								alt={announcements[activeAnnouncement].imageAlt}
								class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
							/>
							<span
								class="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#111514] to-transparent"
							></span>
						</span>
					</a>
					<div
						class="absolute right-3 bottom-3 z-10 flex flex-col items-end gap-3 sm:right-4 sm:bottom-4"
					>
						<div class="flex gap-1.5">
							<button
								type="button"
								onclick={() => moveAnnouncement(-1)}
								aria-label="Previous announcement"
								class="flex h-8 w-8 items-center justify-center border border-white/10 bg-[#090a0a]/75 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
								><ChevronLeft size={15} /></button
							>
							<button
								type="button"
								onclick={() => moveAnnouncement(1)}
								aria-label="Next announcement"
								class="flex h-8 w-8 items-center justify-center border border-white/10 bg-[#090a0a]/75 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
								><ChevronRight size={15} /></button
							>
						</div>
						<div class="flex items-center gap-1.5" aria-label="Choose announcement">
							{#each announcements as announcement, index (announcement.id)}
								<button
									type="button"
									onclick={() => (activeAnnouncement = index)}
									aria-label={`Show announcement ${index + 1}`}
									aria-current={activeAnnouncement === index ? 'true' : undefined}
									class={`h-1.5 transition-all ${activeAnnouncement === index ? 'w-5 bg-white/80' : 'w-1.5 bg-white/30 hover:bg-white/60'}`}
								></button>
							{/each}
						</div>
					</div>
				</section>
			{/if}

			<div class="community-create-byline flex items-center gap-2.5 py-5">
				<span
					class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-200/25 font-display text-xs text-white"
					style={data.communityUser?.avatarUrl
						? undefined
						: `background:${data.communityUser?.avatarColor ?? '#cf6f65'}`}
				>
					{#if data.communityUser?.avatarUrl}<img
							src={data.communityUser.avatarUrl}
							alt=""
							class="h-full w-full object-cover"
						/>{:else}{data.communityUser?.initials ?? 'G'}{/if}
				</span>
				<button
					type="button"
					onclick={() => (composerOpen = !composerOpen)}
					class="text-xs font-medium text-white/80"
					>{data.communityUser?.displayName ?? 'Guest'}</button
				>
				<span class="text-[10px] text-white/25">·</span>
				<button
					type="button"
					onclick={() =>
						data.communityUser ? (composerOpen = true) : goto('/signup?returnTo=%2Fhome')}
					class="text-xs text-orange-200 transition-colors hover:text-orange-100"
					>{data.communityUser ? 'Create a post' : 'Sign up to post'}</button
				>
			</div>
			<button
				type="button"
				onclick={() =>
					data.communityUser ? (composerOpen = !composerOpen) : goto('/login?returnTo=%2Fhome')}
				class="flex min-h-12 w-full items-center rounded-xl border border-white/[0.08] bg-white/[0.045] px-4 text-left text-xs text-white/45 transition-colors hover:border-orange-200/25 hover:bg-white/[0.06]"
			>
				{data.communityUser
					? 'Share a thought, a link, or a piece of work...'
					: 'Sign in to share a thought...'}
			</button>
			{#if composerOpen && data.communityUser}
				<form onsubmit={publishPost} class="my-5 border border-white/10 bg-[#111211] p-4 sm:p-5">
					<div class="mb-4 flex items-start justify-between gap-3">
						<div class="flex items-center gap-2.5">
							<span
								class="flex h-8 w-8 items-center justify-center rounded-full bg-[#cf6f65] font-display text-sm"
								>G</span
							>
							<div>
								<p class="text-xs font-medium">Sanctyria Guest</p>
								<label class="mt-0.5 flex items-center gap-1 text-[10px] text-white/35">
									<span>Posting to</span>
									<select
										bind:value={draftCommunity}
										aria-label="Choose community"
										class="bg-transparent text-orange-100 outline-none"
									>
										{#each data.communities as community (community.slug)}
											<option value={community.slug} class="bg-[#111211] text-white"
												>{community.name}</option
											>
										{/each}
									</select>
								</label>
							</div>
						</div>
						<button
							type="button"
							onclick={() => (composerOpen = false)}
							aria-label="Close composer"
							class="p-1 text-white/40 hover:text-white"><X size={16} /></button
						>
					</div>
					<div
						role="tablist"
						aria-label="Post type"
						class="mb-3 flex flex-wrap gap-1 border-b border-white/[0.07]"
					>
						{#each postKinds as item (item.kind)}
							<button
								type="button"
								role="tab"
								aria-selected={composerKind === item.kind}
								onclick={() => {
									composerKind = item.kind;
									composerError = '';
								}}
								class={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-[11px] transition-colors ${composerKind === item.kind ? 'border-orange-400 text-orange-100' : 'border-transparent text-white/45 hover:text-white/80'}`}
							>
								<item.icon size={13} />
								{item.label}
							</button>
						{/each}
					</div>
					<textarea
						bind:value={draftText}
						rows="3"
						maxlength="1000"
						class="w-full resize-y bg-transparent py-2 text-sm leading-6 text-white outline-none placeholder:text-white/35"
						placeholder="Share a question, idea, or resource..."
						aria-label="Post text"></textarea>
					{#if composerKind !== 'text'}
						<label class="mt-2 block">
							<span
								class="mb-1.5 block font-mono text-[9px] tracking-[0.12em] text-white/40 uppercase"
								>{composerKind === 'image'
									? 'Image URL'
									: composerKind === 'video'
										? 'Video URL'
										: 'Link URL'}</span
							>
							<input
								bind:value={draftUrl}
								type="url"
								inputmode="url"
								placeholder="https://"
								class="w-full border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-white outline-none placeholder:text-white/30 focus:border-orange-200/40"
								aria-label="External media or link URL"
							/>
						</label>
					{/if}
					{#if composerError}<p role="alert" class="mt-2 text-xs text-red-300">
							{composerError}
						</p>{/if}
					<div class="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-3">
						<p class="text-[10px] text-white/35">Public post · Links only, no uploads</p>
						<button
							type="submit"
							class="inline-flex items-center gap-2 bg-orange-400 px-4 py-2 text-xs font-semibold text-[#17110e] transition-colors hover:bg-orange-300"
							><Send size={13} /> Publish</button
						>
					</div>
				</form>
			{/if}
			{#if activeTab === 'Explore'}
				<section class="py-5" aria-labelledby="explore-heading">
					<div class="mb-5 flex items-end justify-between gap-4">
						<div>
							<p class="font-mono text-[9px] tracking-[0.15em] text-orange-200/70 uppercase">
								Find your circle
							</p>
							<h1 id="explore-heading" class="mt-1 font-display text-3xl sm:text-4xl">
								Explore Communities
							</h1>
						</div>
						<div class="flex items-center gap-3">
							<span class="hidden text-[10px] text-white/35 sm:inline"
								>{exploreDirectory.length} open communities</span
							>
							<button
								type="button"
								onclick={openCommunityCreator}
								class="inline-flex items-center gap-1.5 border border-white/15 px-3 py-2 text-[10px] text-white/75 transition-colors hover:border-orange-200/40 hover:text-orange-100"
								><Plus size={13} /> Create community</button
							>
						</div>
					</div>
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
						{#each exploreDirectory as community (community.name)}
							<article
								class="community-directory-item relative border border-white/[0.08] bg-white/[0.025] transition-colors hover:border-white/[0.16]"
							>
								<a href={`/r/${communitySlug(community.name)}`} class="group block p-4 pr-24">
									<span
										class="flex h-9 w-9 items-center justify-center overflow-hidden border border-white/10"
										style={`color:${community.color};background:${community.color}12`}
									>
										{#if community.avatarUrl}<img
												src={community.avatarUrl}
												alt=""
												class="h-full w-full object-cover"
											/>{:else}<Flame size={16} />{/if}
									</span>
									<h2
										class="mt-4 text-sm font-medium transition-colors group-hover:text-orange-100"
									>
										{community.name}
									</h2>
									<p class="mt-1 text-xs leading-5 text-white/45">{community.description}</p>
									<p class="mt-4 font-mono text-[9px] tracking-[0.1em] text-white/35 uppercase">
										{community.members} members
									</p>
								</a>
								<button
									type="button"
									onclick={() => toggleCommunity(community.name)}
									class={`absolute top-4 right-4 z-10 min-w-[78px] px-3 py-1.5 text-[10px] transition-colors ${joinedCommunities.includes(community.slug) ? 'border border-white/10 text-white/65 hover:border-red-300/30 hover:text-red-200' : 'bg-white text-black hover:bg-orange-100'}`}
									>{joinedCommunities.includes(community.slug) ? 'Joined' : 'Join'}</button
								>
							</article>
						{/each}
					</div>
					{#if !exploreDirectory.length}<p
							class="border-t border-white/[0.07] py-8 text-sm text-white/45"
						>
							No communities match that search.
						</p>{/if}
				</section>
				{#if communityCreateOpen}
					<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
						<dialog
							open
							aria-labelledby="create-community-heading"
							class="m-0 w-full max-w-lg border border-white/10 bg-[#111211] p-5 text-white shadow-2xl sm:p-6"
						>
							<div class="flex items-center justify-between gap-4">
								<h2 id="create-community-heading" class="font-display text-2xl">
									Create a community
								</h2>
								<button
									type="button"
									onclick={() => (communityCreateOpen = false)}
									aria-label="Close community form"
									class="flex h-9 w-9 items-center justify-center text-white/60 hover:bg-white/5 hover:text-white"
									><X size={17} /></button
								>
							</div>
							<form onsubmit={createCommunity} class="mt-5 space-y-4">
								<label class="block text-xs text-white/65"
									>Community name<input
										bind:value={newCommunityName}
										minlength="3"
										maxlength="60"
										required
										class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-200/40"
									/></label
								>
								<label class="block text-xs text-white/65"
									>Description<textarea
										bind:value={newCommunityDescription}
										maxlength="500"
										rows="3"
										class="mt-1.5 w-full resize-y border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-5 text-white outline-none focus:border-orange-200/40"
									></textarea></label
								>
								{#if communityCreateError}<p role="alert" class="text-xs text-red-300">
										{communityCreateError}
									</p>{/if}
								<div class="flex justify-end gap-2 border-t border-white/[0.08] pt-4">
									<button
										type="button"
										onclick={() => (communityCreateOpen = false)}
										class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:text-white"
										>Cancel</button
									>
									<button
										type="submit"
										disabled={communityCreateLoading}
										class="bg-orange-300 px-4 py-2 text-xs font-semibold text-[#17110e] hover:bg-orange-200 disabled:opacity-50"
										>{communityCreateLoading ? 'Creating...' : 'Create community'}</button
									>
								</div>
							</form>
						</dialog>
					</div>
				{/if}
			{:else}
				<div
					class="community-feed-toolbar flex min-h-12 items-center justify-between gap-2 border-b border-white/[0.07]"
				>
					<details class="relative">
						<summary
							class="flex cursor-pointer list-none items-center gap-1.5 py-2 text-[11px] text-white/55 hover:text-white"
							><Grid2X2 size={13} /> {activeFilter} <ChevronDown size={12} /></summary
						>
						<div
							class="absolute top-full left-0 z-20 mt-2 w-36 border border-white/10 bg-[#111211] p-1 shadow-xl"
						>
							{#each ['All', 'Discussions', 'Links', 'Media'] as filter (filter)}<button
									type="button"
									onclick={() => (activeFilter = filter as PostFilter)}
									class="flex w-full items-center justify-between px-2.5 py-2 text-left text-[11px] text-white/65 hover:bg-white/[0.06] hover:text-white"
									>{filter}{#if activeFilter === filter}<Check
											size={13}
											class="text-orange-300"
										/>{/if}</button
								>{/each}
						</div>
					</details>
					<div class="flex items-center gap-2">
						<label
							class="community-feed-search flex max-w-[220px] min-w-0 flex-1 items-center gap-1.5 border border-white/[0.08] bg-white/[0.025] px-2 py-1.5"
						>
							<Search size={13} class="shrink-0 text-white/35" />
							<input
								bind:this={searchInput}
								bind:value={searchTerm}
								class="min-w-0 flex-1 bg-transparent text-[10px] text-white outline-none placeholder:text-white/35"
								placeholder="Search"
								aria-label="Search community posts and groups"
							/>
						</label>
						<details class="relative">
							<summary
								class="flex cursor-pointer list-none items-center gap-1 py-2 text-[11px] text-white/50 hover:text-white"
								><span class="hidden sm:inline">Sort:</span>
								{sortOrder}
								<ChevronDown size={12} /></summary
							>
							<div
								class="absolute top-full right-0 z-20 mt-2 w-28 border border-white/10 bg-[#111211] p-1 shadow-xl"
							>
								{#each ['Hot', 'New'] as order (order)}<button
										type="button"
										onclick={() => (sortOrder = order as SortOrder)}
										class="flex w-full items-center justify-between px-2.5 py-2 text-left text-[11px] text-white/65 hover:bg-white/[0.06] hover:text-white"
										>{order}{#if sortOrder === order}<Check
												size={13}
												class="text-orange-300"
											/>{/if}</button
									>{/each}
							</div>
						</details>
						<button
							type="button"
							onclick={() => (compactFeed = !compactFeed)}
							aria-label={compactFeed ? 'Use comfortable feed density' : 'Use compact feed density'}
							class="hidden p-1.5 text-white/40 transition-colors hover:text-white sm:block"
							>{#if compactFeed}<List size={15} />{:else}<Grid2X2 size={15} />{/if}</button
						>
					</div>
				</div>

				{#if !filteredPosts.length}
					<div class="border-b border-white/[0.07] py-14 text-center">
						<Flame size={22} class="mx-auto text-orange-200/60" />
						<h1 class="mt-4 font-display text-2xl">Build your feed</h1>
						<p class="mx-auto mt-2 max-w-xs text-xs leading-5 text-white/45">
							Join communities or adjust your search to find public conversations.
						</p>
						<button
							type="button"
							onclick={() => goto('/home?feed=explore')}
							class="mt-5 border border-white/15 px-4 py-2 text-xs text-white/75 transition-colors hover:border-orange-200/40 hover:text-orange-100"
							>Explore communities</button
						>
						{#if feedCursor}<button
								type="button"
								onclick={loadMoreFeed}
								disabled={feedLoading}
								class="mt-3 border border-white/15 px-4 py-2 text-xs text-white/70 hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
								>{feedLoading ? 'Loading...' : 'Load more posts'}</button
							>{/if}
					</div>
				{:else}
					<div class="divide-y divide-white/[0.08]">
						{#each filteredPosts as post (post.id)}
							<article
								id={post.id}
								class={`community-post relative py-5 ${compactFeed ? 'sm:py-3' : ''}`}
							>
								<div class="flex items-start gap-2 sm:gap-3">
									<a
										href={`/u/${encodeURIComponent(post.handle.slice(1))}`}
										class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 font-display text-sm text-white"
										style={post.avatarUrl ? undefined : `background:${post.avatarColor}`}
										aria-label={`View ${post.name}'s profile`}
									>
										{#if post.avatarUrl}<img
												src={post.avatarUrl}
												alt=""
												class="h-full w-full object-cover"
											/>{:else}{post.initials}{/if}
									</a>
									<div class="min-w-0 flex-1">
										<div class="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
											<a
												href={`/u/${encodeURIComponent(post.handle.slice(1))}`}
												class="font-medium text-white/90 hover:text-orange-100">{post.name}</a
											>
											{#if post.verified}<span
													class="inline-flex text-sky-300"
													aria-label="Verified"
													title="Verified"><BadgeCheck size={14} /></span
												>{/if}
											<CommunityFollowButton
												authorUsername={post.handle.slice(1)}
												viewerUsername={data.communityUser?.username}
												initialFollowing={post.isFollowingAuthor}
											/>
											<a
												href={`/u/${encodeURIComponent(post.handle.slice(1))}`}
												class="text-white/35 hover:text-white/70">{post.handle}</a
											><span class="text-white/25">·</span><time class="text-white/35"
												>{post.postedAt}</time
											>
										</div>
										<div class="mt-1 flex items-center gap-1.5 text-[10px]">
											<span
												class="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10"
												style={`color:${post.communityColor};background:${post.communityColor}12`}
											>
												{#if post.communityAvatarUrl}<img
														src={post.communityAvatarUrl}
														alt=""
														class="h-full w-full object-cover"
													/>{:else}<Flame size={9} />{/if}
											</span>
											<a
												href={`/r/${communitySlug(post.community)}`}
												class="text-white/45 transition-colors hover:text-white/80"
												>{post.community}</a
											>
										</div>
										<details class="absolute top-0 right-0">
											<summary
												aria-label={`More options for ${post.name}'s post`}
												class="flex h-8 w-8 cursor-pointer list-none items-center justify-center text-white/40 hover:bg-white/5 hover:text-white"
												><MoreHorizontal size={16} /></summary
											>
											<div
												class="absolute top-full right-0 z-20 mt-1 w-40 border border-white/10 bg-[#111211] p-1 shadow-xl"
											>
												<button
													type="button"
													onclick={() => sharePost(post)}
													class="w-full px-3 py-2 text-left text-[11px] text-white/70 hover:bg-white/5 hover:text-white"
													>Copy post link</button
												>
												<button
													type="button"
													onclick={() => toggleSave(post.id)}
													class="w-full px-3 py-2 text-left text-[11px] text-white/70 hover:bg-white/5 hover:text-white"
													>{savedPosts.includes(post.id) ? 'Remove bookmark' : 'Save post'}</button
												>
												{#if post.canManage}
													<button
														type="button"
														onclick={() => openPostEditor(post)}
														class="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-white/70 hover:bg-white/5 hover:text-white"
														><Pencil size={13} />Edit post</button
													>
													<button
														type="button"
														onclick={() => deletePost(post)}
														class="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-red-200/75 hover:bg-red-300/5 hover:text-red-100"
														><Trash2 size={13} />Delete post</button
													>
												{:else}
													<button
														type="button"
														onclick={() => openPostReport(post.id)}
														class="w-full px-3 py-2 text-left text-[11px] text-red-200/75 hover:bg-red-300/5 hover:text-red-100"
														>Report post</button
													>
												{/if}
											</div>
										</details>
										<a
											href={`/p/${encodeURIComponent(post.id)}`}
											class="mt-3 block text-[13px] leading-[1.7] whitespace-pre-wrap text-white/80 hover:text-white"
										>
											{post.text}
										</a>

										{#if post.kind === 'link' && post.url}
											<CommunityLinkPreview
												url={post.url}
												title={post.linkTitle}
												description={post.linkDescription}
												domain={post.linkDomain}
											/>
										{/if}
										{#if post.kind === 'image' && post.url && isHttpsUrl(post.url)}
											<a
												href={post.url}
												target="_blank"
												rel="noopener noreferrer"
												class="community-media-link mt-3 block overflow-hidden border border-white/[0.08] bg-black/20"
											>
												<img
													src={post.url}
													alt={post.text}
													loading="lazy"
													class="max-h-[420px] w-full object-cover"
												/>
												<span
													class="flex items-center justify-between gap-3 px-3 py-2 text-[10px] text-white/45"
													><span class="inline-flex items-center gap-1.5"
														><Image size={12} /> Linked image</span
													><span class="truncate"
														>Open original <ArrowUpRight size={11} class="inline" /></span
													></span
												>
											</a>
										{/if}
										{#if post.kind === 'video' && post.url && isHttpsUrl(post.url)}
											{@const embedUrl = videoEmbedUrl(post.url)}
											{#if embedUrl}<div
													class="community-video mt-3 overflow-hidden border border-white/[0.08] bg-black"
												>
													<iframe
														src={embedUrl}
														title={`Video shared by ${post.name}`}
														loading="lazy"
														referrerpolicy="strict-origin-when-cross-origin"
														allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
														allowfullscreen
														class="aspect-video w-full"
													></iframe>
												</div>{:else}<a
													href={post.url}
													target="_blank"
													rel="noopener noreferrer"
													class="mt-3 flex items-center justify-between gap-4 border border-white/[0.08] bg-white/[0.025] p-4 text-xs text-white/70 hover:border-orange-200/25"
													><span class="flex items-center gap-2"
														><Video size={15} class="text-orange-200" /> Open external video</span
													><ArrowUpRight size={14} /></a
												>{/if}
										{/if}

										<div
											class="mt-3 flex flex-nowrap items-center gap-0.5 text-[10px] text-white/40 sm:gap-1"
										>
											<button
												type="button"
												onclick={() => setPostVote(post.id, 'up')}
												aria-pressed={votedPosts.includes(post.id)}
												class={`flex h-8 shrink-0 items-center gap-1 rounded-full border px-1.5 transition-colors sm:gap-1.5 sm:px-2.5 ${votedPosts.includes(post.id) ? 'border-orange-200/30 bg-orange-200/10 text-orange-100' : 'border-transparent hover:border-white/10 hover:bg-white/[0.05] hover:text-white'}`}
												><Flame
													size={14}
													class={votedPosts.includes(post.id)
														? 'community-flame-voted fill-orange-300 text-orange-200'
														: 'text-white/50'}
													fill={votedPosts.includes(post.id) ? 'currentColor' : 'none'}
												/>{voteCounts[post.id] ?? post.votes}</button
											>
											<button
												type="button"
												onclick={() => setPostVote(post.id, 'down')}
												aria-label={downvotedPosts.includes(post.id)
													? 'Remove downvote'
													: 'Downvote post'}
												aria-pressed={downvotedPosts.includes(post.id)}
												class={`flex h-8 shrink-0 items-center gap-1 rounded-full border px-1.5 transition-colors sm:gap-1.5 sm:px-2.5 ${downvotedPosts.includes(post.id) ? 'border-red-200/30 bg-red-200/10 text-red-100' : 'border-transparent hover:border-white/10 hover:bg-white/[0.05] hover:text-white'}`}
												><Skull size={14} />{downvoteCounts[post.id] ?? post.downvotes ?? 0}</button
											>
											<button
												type="button"
												onclick={() => toggleReplies(post.id)}
												aria-expanded={openReplies.includes(post.id)}
												class="flex h-8 shrink-0 items-center gap-1 rounded-full border border-transparent px-1.5 transition-colors hover:border-white/10 hover:bg-white/[0.05] hover:text-white sm:gap-1.5 sm:px-2.5"
												><MessageCircle size={14} />{post.replyCount ?? post.replies.length} replies</button
											>
											<button
												type="button"
												onclick={() => toggleSave(post.id)}
												aria-pressed={savedPosts.includes(post.id)}
												aria-label={savedPosts.includes(post.id)
													? 'Remove saved post'
													: 'Save post'}
												class={`ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-transparent transition-colors hover:border-white/10 hover:bg-white/[0.05] ${savedPosts.includes(post.id) ? 'text-orange-200' : 'hover:text-white'}`}
												><Bookmark
													size={14}
													fill={savedPosts.includes(post.id) ? 'currentColor' : 'none'}
												/></button
											>
											<button
												type="button"
												onclick={() => sharePost(post)}
												aria-label="Copy post link"
												class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-transparent transition-colors hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
												><Share2 size={14} /></button
											>
										</div>
										{#if openReplies.includes(post.id)}
											<div class="mt-3 space-y-3">
												{#if replyLoading.includes(post.id) && !loadedReplies[post.id]?.length}<p
														class="py-2 text-[10px] text-white/40"
													>
														Loading replies...
													</p>{/if}
												{#each threadedReplies(post.id) as reply (reply.id ?? `${post.id}-${reply.handle}-${reply.text.slice(0, 16)}`)}
													{#if replyTreeVisible(post.id, reply)}
														<div class="flex items-start gap-2 sm:gap-2.5">
															{#if reply.removed}
																<p class="py-1 text-[10px] text-white/35 italic">Reply removed.</p>
															{:else}
																<span
																	class="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full font-display text-[10px]"
																	style={reply.avatarUrl ? undefined : `background:${reply.color}`}
																>
																	{#if reply.avatarUrl}<img
																			src={reply.avatarUrl}
																			alt=""
																			class="h-full w-full object-cover"
																		/>{:else}{reply.initials}{/if}
																</span>
																<div class="min-w-0 flex-1">
																	<p class="text-[11px] leading-5 text-white/65">
																		<a
																			href={`/u/${encodeURIComponent(reply.handle.slice(1))}`}
																			class="mr-1 font-medium text-white/85 hover:text-orange-100"
																			>{reply.name}</a
																		>{#if reply.isPostAuthor}<span
																				class="mr-1 inline-flex items-center gap-0.5 text-[9px] text-sky-200/75"
																				title="Author of this post"
																				><PenLine size={10} />Author</span
																			>{/if}
																		{#if reply.isCommunityOwner}<span
																				class="mr-1 inline-flex items-center gap-0.5 text-[9px] text-orange-200/75"
																				title="Community owner"><Crown size={10} />Owner</span
																			>{/if}
																		{#if reply.verified}<BadgeCheck
																				size={12}
																				class="mr-1 inline text-sky-300"
																				aria-label="Verified"
																			/>{/if}
																		<a
																			href={`/u/${encodeURIComponent(reply.handle.slice(1))}`}
																			class="mr-1 text-white/35 hover:text-white/70"
																			>{reply.handle}</a
																		>{reply.text}
																	</p>
																	<div class="mt-1 flex items-center gap-3">
																		<button
																			type="button"
																			onclick={() => toggleReplyReaction(post.id, reply)}
																			aria-label={`${reply.reacted ? 'Remove Ember reaction from' : 'Give Ember to'} ${reply.name}'s reply`}
																			aria-pressed={reply.reacted ?? false}
																			class={`inline-flex items-center gap-1 text-[9px] transition-colors ${reply.reacted ? 'text-orange-200' : 'text-white/35 hover:text-orange-100'}`}
																		>
																			<Flame
																				size={11}
																				fill={reply.reacted ? 'currentColor' : 'none'}
																			/>
																			{reply.reactionCount ?? 0}
																		</button>
																		{#if reply.id}<button
																				type="button"
																				onclick={() => selectReplyTarget(post.id, reply)}
																				aria-label={`Reply to ${reply.name}`}
																				title={`Reply to ${reply.name}`}
																				class="flex h-6 items-center gap-1 text-[10px] text-white/35 hover:text-orange-100"
																				><CornerDownRight size={12} /></button
																			>{/if}
																		{#if reply.id && replyChildCount(post.id, reply.id) > 0}
																			<button
																				type="button"
																				onclick={() => toggleReplyThread(reply.id!)}
																				aria-expanded={expandedReplyIds.includes(reply.id)}
																				aria-label={`${expandedReplyIds.includes(reply.id) ? 'Hide' : 'View'} ${replyChildCount(post.id, reply.id)} replies to ${reply.name}`}
																				class="inline-flex items-center gap-1 text-[10px] text-white/35 hover:text-orange-100"
																			>
																				<MessageCircle size={11} />{replyChildCount(
																					post.id,
																					reply.id
																				)}
																			</button>
																		{/if}
																		{#if reply.id && reply.canManage}
																			<button
																				type="button"
																				onclick={() => openReplyEditor(reply)}
																				aria-label="Edit reply"
																				title="Edit reply"
																				class="flex h-6 w-6 items-center justify-center text-white/35 hover:text-orange-100"
																				><Pencil size={12} /></button
																			>
																			<button
																				type="button"
																				onclick={() => deleteReply(post.id, reply)}
																				aria-label="Delete reply"
																				title="Delete reply"
																				class="flex h-6 w-6 items-center justify-center text-red-200/50 hover:text-red-100"
																				><Trash2 size={12} /></button
																			>
																		{/if}
																	</div>
																	{#if editingReplyId === reply.id}
																		<div class="mt-2 space-y-2">
																			<textarea
																				bind:value={replyEditDraft}
																				maxlength="1000"
																				rows="3"
																				aria-label="Edit reply"
																				class="w-full resize-y border border-white/10 bg-black/20 px-2.5 py-2 text-xs leading-5 text-white outline-none focus:border-orange-200/40"
																			></textarea>
																			{#if replyEditError}<p
																					role="alert"
																					class="text-[10px] text-red-200"
																				>
																					{replyEditError}
																				</p>{/if}
																			<div class="flex justify-end gap-2">
																				<button
																					type="button"
																					onclick={() => (editingReplyId = null)}
																					class="px-2 py-1 text-[10px] text-white/45 hover:text-white"
																					>Cancel</button
																				>
																				<button
																					type="button"
																					onclick={() => saveReply(post.id, reply.id!)}
																					disabled={replySaving}
																					class="bg-orange-200 px-2.5 py-1 text-[10px] font-medium text-[#21160e] disabled:opacity-50"
																					>{replySaving ? 'Saving...' : 'Save'}</button
																				>
																			</div>
																		</div>
																	{/if}
																</div>
															{/if}
														</div>
													{/if}
												{/each}
												{#if !replyLoading.includes(post.id) && !loadedReplies[post.id]?.length}<p
														class="py-1 text-[10px] text-white/40"
													>
														No replies yet.
													</p>{/if}
												{#if replyCursors[post.id]}<button
														type="button"
														onclick={() => loadReplies(post.id)}
														disabled={replyLoading.includes(post.id)}
														class="text-[10px] text-white/50 hover:text-orange-100 disabled:opacity-50"
														>{replyLoading.includes(post.id)
															? 'Loading...'
															: 'Load older replies'}</button
													>{/if}
												{#if replyTargets[post.id]}<p class="text-[10px] text-orange-100/70">
														Replying to {replyTargets[post.id]?.name}<button
															type="button"
															onclick={() => (replyTargets = { ...replyTargets, [post.id]: null })}
															class="ml-2 text-white/45 hover:text-white">Cancel</button
														>
													</p>{/if}
												<form
													onsubmit={(event) => submitReply(event, post.id)}
													class="flex gap-2 pt-1"
												>
													<input
														aria-label="Write a reply"
														bind:value={replyDrafts[post.id]}
														maxlength="1000"
														placeholder="Write a reply..."
														class="min-w-0 flex-1 border-b border-white/10 bg-transparent py-2 text-[11px] text-white outline-none placeholder:text-white/30 focus:border-orange-200/40"
													/>
													<button
														type="submit"
														aria-label="Send reply"
														title="Send reply"
														class="flex h-8 w-8 items-center justify-center text-orange-200 hover:text-orange-100"
														><Send size={14} /></button
													>
												</form>
											</div>
										{/if}
									</div>
								</div>
							</article>
						{/each}
					</div>
				{/if}
				{#if feedCursor}<div class="border-b border-white/[0.07] py-5 text-center">
						<button
							type="button"
							onclick={loadMoreFeed}
							disabled={feedLoading}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
							>{feedLoading ? 'Loading...' : 'Load more posts'}</button
						>
					</div>{/if}
			{/if}
		</main>

		<aside
			class="community-right-rail sticky top-[62px] hidden h-[calc(100dvh-62px)] flex-col gap-6 overflow-y-auto py-5 xl:flex"
		>
			{#if !data.communityUser}
				<section class="guest-community-card" aria-labelledby="guest-community-title">
					<span class="guest-community-mark"><img src="/assets/dlst.gif" alt="" /></span>
					<h2 id="guest-community-title">Sanctyria Community</h2>
					<p>
						A quieter corner for worldbuilders, artists, and curious minds to share what they’re
						making.
					</p>
					<div class="guest-community-stats">
						<span><strong>{data.communities.length}</strong> public circles</span>
						<span><strong>{data.posts.length}</strong> conversations</span>
					</div>
					<a href="/signup">Join the conversation <ArrowUpRight size={13} /></a>
				</section>
			{/if}
			<label
				class="flex items-center gap-2 border border-white/[0.08] bg-white/[0.035] px-3 py-2.5 lg:hidden"
			>
				<Search size={14} class="text-white/35" /><input
					bind:value={searchTerm}
					class="min-w-0 bg-transparent text-xs outline-none placeholder:text-white/35"
					placeholder="Search community"
					aria-label="Search community"
				/>
			</label>
			<section aria-labelledby="weekly-heading">
				<div class="mb-3 flex items-center justify-between">
					<h2
						id="weekly-heading"
						class="font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase"
					>
						Weekly voices
					</h2>
					<span class="text-[9px] text-orange-200/45">Ember · 7 days</span>
				</div>
				{#if data.suggestedMembers.length}
					<ol class="space-y-1.5">
						{#each data.suggestedMembers as member, index (member.handle)}
							<li class="flex items-center gap-2.5 py-1.5">
								<span class="w-3 text-right font-mono text-[9px] text-white/25">{index + 1}</span>
								<span
									class="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full text-[9px] text-white"
									style={member.avatarUrl ? undefined : `background:${member.color}`}
								>
									{#if member.avatarUrl}<img
											src={member.avatarUrl}
											alt=""
											class="h-full w-full object-cover"
										/>{:else}{member.initials}{/if}
								</span>
								<a class="min-w-0 flex-1" href={`/u/${encodeURIComponent(member.handle.slice(1))}`}
									><span class="block truncate text-[10px] text-white/80">{member.name}</span><span
										class="block truncate text-[9px] text-white/35"
										>{member.field || 'Community contributor'}</span
									></a
								>
								<span class="font-mono text-[9px] whitespace-nowrap text-orange-200/75"
									>{member.ember} Ember</span
								>
							</li>
						{/each}
					</ol>
				{:else}
					<p class="py-3 text-[10px] leading-5 text-white/35">
						Weekly voices will appear as members earn Ember from community reactions.
					</p>
				{/if}
			</section>

			<section aria-labelledby="active-circles-heading" class="border-t border-white/[0.07] pt-5">
				<div class="mb-3 flex items-center justify-between">
					<h2
						id="active-circles-heading"
						class="font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase"
					>
						Active circles
					</h2>
					<button
						type="button"
						onclick={() => goto('/home?feed=explore')}
						class="text-[9px] text-orange-200/75 hover:text-orange-100">Explore</button
					>
				</div>
				<div class="space-y-3">
					{#each activeCircles as community (community.slug)}
						<div class="flex items-center gap-2.5">
							<span
								class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden border border-white/10"
								style={`color:${community.color};background:${community.color}12`}
							>
								{#if community.avatarUrl}<img
										src={community.avatarUrl}
										alt=""
										class="h-full w-full object-cover"
									/>{:else}<Flame size={13} />{/if}
							</span>
							<span class="min-w-0 flex-1"
								><span class="block truncate text-[10px] text-white/80">{community.name}</span><span
									class="block text-[9px] text-white/35"
									>{community.members} members · {community.activeEmber} Ember</span
								></span
							>
							<button
								type="button"
								onclick={() => toggleCommunity(community.name)}
								aria-label={`${joinedCommunities.includes(community.slug) ? 'Leave' : 'Join'} ${community.name}`}
								class={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors ${joinedCommunities.includes(community.slug) ? 'border-white/10 text-white/55 hover:border-red-300/30 hover:text-red-200' : 'border-white/15 text-white/75 hover:border-orange-200/40 hover:text-orange-100'}`}
								>{#if joinedCommunities.includes(community.slug)}<Check size={12} />{:else}<Plus
										size={13}
									/>{/if}</button
							>
						</div>
					{/each}
				</div>
			</section>

			<section aria-labelledby="popular-circles-heading" class="border-t border-white/[0.07] pt-5">
				<h2
					id="popular-circles-heading"
					class="mb-3 font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase"
				>
					Popular circles
				</h2>
				<div class="space-y-3">
					{#each popularCircles as community (community.slug)}
						<a
							href={`/r/${community.slug}`}
							class="flex items-center gap-2.5 transition-colors hover:text-orange-100"
						>
							<span
								class="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden border border-white/10"
								style={`color:${community.color};background:${community.color}12`}
							>
								{#if community.avatarUrl}<img
										src={community.avatarUrl}
										alt=""
										class="h-full w-full object-cover"
									/>{:else}<Flame size={13} />{/if}
							</span>
							<span class="min-w-0 flex-1"
								><span class="block truncate text-[10px] text-white/80">{community.name}</span><span
									class="block text-[9px] text-white/35">{community.members} members</span
								></span
							>
							<ArrowUpRight size={12} class="text-white/30" />
						</a>
					{/each}
				</div>
			</section>

			<section class="border-t border-white/[0.07] pt-5">
				<div class="mb-3 flex items-center justify-between">
					<h2 class="font-mono text-[9px] tracking-[0.14em] text-white/35 uppercase">
						From the journal
					</h2>
					<a href="/journal" class="text-[9px] text-orange-200/75 hover:text-orange-100"
						>All stories</a
					>
				</div>
				<div class="space-y-3">
					{#each data.journalArticles as article (article.slug)}
						<a
							href={`/journal/${encodeURIComponent(article.slug)}`}
							class="group flex items-center gap-2.5"
						>
							<span
								class="h-12 w-12 shrink-0 overflow-hidden border border-white/[0.08] bg-white/[0.03]"
							>
								<img
									src={article.image}
									alt={article.imageAlt}
									loading="lazy"
									class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
							</span>
							<span class="min-w-0 flex-1">
								<span
									class="block truncate font-display text-sm leading-5 text-white/80 transition-colors group-hover:text-orange-100"
									>{article.title}</span
								>
								<span class="mt-0.5 block truncate text-[9px] text-white/35"
									>{article.category} · {article.date}</span
								>
							</span>
							<ArrowUpRight
								size={12}
								class="shrink-0 text-white/25 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
							/>
						</a>
					{/each}
				</div>
			</section>
		</aside>
	</div>

	{#if editingPost}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
			<dialog
				open
				aria-labelledby="edit-post-heading"
				class="m-0 w-full max-w-lg border border-white/10 bg-[#111211] p-5 text-white shadow-2xl sm:p-6"
			>
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="font-mono text-[9px] tracking-[0.12em] text-orange-200/70 uppercase">
							Post settings
						</p>
						<h2 id="edit-post-heading" class="mt-1 font-display text-2xl">Edit post</h2>
					</div>
					<button
						type="button"
						onclick={() => (editingPost = null)}
						aria-label="Close edit form"
						class="flex h-9 w-9 items-center justify-center text-white/60 hover:bg-white/5 hover:text-white"
						><X size={17} /></button
					>
				</div>
				<form onsubmit={submitPostEdit} class="mt-5 space-y-4">
					<label class="block text-xs text-white/65"
						>Post text<textarea
							bind:value={editDraftText}
							maxlength="1000"
							rows="5"
							required={editingPost.kind === 'text'}
							class="mt-1.5 w-full resize-y border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-5 text-white outline-none focus:border-orange-200/40"
						></textarea></label
					>
					{#if editingPost.kind !== 'text'}<label class="block text-xs text-white/65"
							>HTTPS media or resource URL<input
								bind:value={editDraftUrl}
								type="url"
								inputmode="url"
								required
								placeholder="https://"
								class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-200/40"
							/></label
						>{/if}
					{#if editError}<p
							role="alert"
							class="border border-red-300/15 bg-red-300/[0.04] px-3 py-2.5 text-xs text-red-200"
						>
							{editError}
						</p>{/if}
					<div class="flex justify-end gap-2 border-t border-white/[0.08] pt-4">
						<button
							type="button"
							onclick={() => (editingPost = null)}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:text-white"
							>Cancel</button
						>
						<button
							type="submit"
							disabled={editSubmitting}
							class="bg-orange-200 px-4 py-2 text-xs font-semibold text-[#21160e] hover:bg-orange-100 disabled:opacity-50"
							>{editSubmitting ? 'Saving...' : 'Save changes'}</button
						>
					</div>
				</form>
			</dialog>
		</div>
	{/if}

	{#if reportingPost}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
			<dialog
				open
				aria-labelledby="report-post-heading"
				class="m-0 w-full max-w-lg border border-white/10 bg-[#111211] p-5 text-white shadow-2xl sm:p-6"
			>
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="font-mono text-[9px] tracking-[0.12em] text-red-200/70 uppercase">
							Community safety
						</p>
						<h2 id="report-post-heading" class="mt-1 font-display text-2xl">Report post</h2>
						<p class="mt-1 text-xs leading-5 text-white/45">
							Reports are reviewed by the community team.
						</p>
					</div>
					<button
						type="button"
						onclick={() => (reportingPost = null)}
						aria-label="Close report form"
						class="flex h-9 w-9 items-center justify-center text-white/60 hover:bg-white/5 hover:text-white"
						><X size={17} /></button
					>
				</div>
				<form onsubmit={submitPostReport} class="mt-5 space-y-4">
					<label class="block text-xs text-white/65"
						>Reason<textarea
							bind:value={reportReason}
							minlength="10"
							maxlength="500"
							rows="4"
							required
							placeholder="Describe the issue so it can be reviewed..."
							class="mt-1.5 w-full resize-y border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-white/25 focus:border-orange-200/40"
						></textarea></label
					>
					{#if reportError}<p
							role="alert"
							class="border border-red-300/15 bg-red-300/[0.04] px-3 py-2.5 text-xs text-red-200"
						>
							{reportError}
						</p>{/if}
					<div class="flex justify-end gap-2 border-t border-white/[0.08] pt-4">
						<button
							type="button"
							onclick={() => (reportingPost = null)}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:text-white"
							>Cancel</button
						>
						<button
							type="submit"
							disabled={reportSubmitting}
							class="bg-red-300 px-4 py-2 text-xs font-semibold text-[#211010] hover:bg-red-200 disabled:opacity-50"
							>{reportSubmitting ? 'Submitting...' : 'Submit report'}</button
						>
					</div>
				</form>
			</dialog>
		</div>
	{/if}

	<CommunityBottomNav
		activeItem={activeTab === 'Explore' ? 'Explore' : 'Home'}
		profileHref={data.communityUser ? `/u/${data.communityUser.username}` : '/login'}
		user={data.communityUser}
	/>

	{#if toast}<div
			role="status"
			class="community-toast fixed right-4 bottom-20 z-50 border border-white/10 bg-[#1b1d1b] px-4 py-2.5 text-xs text-white/85 shadow-xl md:right-8 md:bottom-6"
		>
			{toast}
		</div>{/if}
</div>

<style>
	@media (min-width: 768px) {
		.community-layout {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (min-width: 1280px) {
		.community-layout {
			grid-template-columns: minmax(0, 1fr) minmax(240px, 300px);
		}
	}

	.community-app {
		background-image: radial-gradient(
			ellipse at 52% -24%,
			rgba(249, 115, 22, 0.075),
			transparent 56%
		);
	}

	.community-main {
		min-height: calc(100dvh - 62px);
	}

	.community-post {
		position: relative;
		animation: community-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.community-directory-item,
	.community-link-preview,
	.community-media-link,
	.community-video {
		border-radius: 5px;
	}

	.community-toast {
		max-width: min(24rem, calc(100vw - 2rem));
		overflow-wrap: anywhere;
		animation: community-in 0.2s ease-out both;
	}

	@keyframes community-in {
		from {
			opacity: 0;
			transform: translateY(7px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes community-flame-burn {
		0% {
			filter: drop-shadow(0 0 0 rgba(251, 146, 60, 0));
			transform: scale(0.85);
		}
		45% {
			filter: drop-shadow(0 0 8px rgba(251, 146, 60, 0.9));
			transform: scale(1.18);
		}
		100% {
			filter: drop-shadow(0 0 3px rgba(251, 146, 60, 0.45));
			transform: scale(1);
		}
	}

	.community-flame-voted {
		animation: community-flame-burn 0.55s ease-out both;
	}

	.guest-community-card {
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 9px;
		background: linear-gradient(150deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.015));
		padding: 16px;
	}

	.guest-community-mark {
		display: grid;
		width: 34px;
		height: 34px;
		place-items: center;
		border: 1px solid rgba(240, 161, 108, 0.2);
		border-radius: 50%;
		background: rgba(240, 161, 108, 0.07);
	}

	.guest-community-mark img {
		width: 22px;
		height: 22px;
		object-fit: contain;
	}

	.guest-community-card h2 {
		margin-top: 12px;
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 400;
	}

	.guest-community-card > p {
		margin-top: 6px;
		color: rgba(235, 235, 227, 0.52);
		font-size: 10px;
		line-height: 1.65;
	}

	.guest-community-stats {
		display: grid;
		gap: 5px;
		margin-top: 12px;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
		padding-top: 10px;
		color: rgba(235, 235, 227, 0.4);
		font-size: 9px;
	}

	.guest-community-stats strong {
		color: rgba(255, 255, 255, 0.8);
		font-weight: 600;
	}

	.guest-community-card > a {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 12px;
		border-radius: 999px;
		background: #f1eee6;
		padding: 8px 12px;
		color: #151613;
		font-size: 10px;
		font-weight: 600;
		text-decoration: none;
	}

	@media (max-width: 767px) {
		.community-layout {
			grid-template-columns: minmax(0, 1fr);
		}

		.community-main {
			min-height: calc(100dvh - 54px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.community-post,
		.community-toast {
			animation-duration: 0.01ms;
		}
	}
</style>
