<script lang="ts">
	import { goto, invalidate, invalidateAll } from '$app/navigation';
	import {
		BadgeCheck,
		Bookmark,
		Flame,
		LogOut,
		Mail,
		MessageCircle,
		MoreHorizontal,
		Pin,
		Pencil,
		Share2,
		Sparkles,
		ShieldCheck,
		VolumeX,
		X,
		UserRoundX
	} from '@lucide/svelte';
	import { communitySlug, videoEmbedUrl, type CommunityPost } from '#lib/community/community.js';
	import {
		communityApi,
		toCommunityPost,
		type ApiPage,
		type ApiPost,
		type ApiProfileConnection,
		type ApiProfileReply
	} from '#lib/community/communityApi.js';
	import CommunityBottomNav from '#lib/community/components/CommunityBottomNav.svelte';
	import CommunityFollowButton from '#lib/community/components/CommunityFollowButton.svelte';
	import CommunityLinkPreview from '#lib/community/components/CommunityLinkPreview.svelte';
	import CommunityPostActions from '#lib/community/components/CommunityPostActions.svelte';
	import CommunityAudioPlayer from '#lib/community/components/CommunityAudioPlayer.svelte';
	import CommunityPostOptionsSheet from '#lib/community/components/CommunityPostOptionsSheet.svelte';
	import CommunityVideoPreview from '#lib/community/components/CommunityVideoPreview.svelte';
	import { uploadCommunityMedia } from '#lib/community/communityMedia.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let activeSection = $state('Posts');
	let toast = $state('');
	let postOptionsPost = $state<CommunityPost | null>(null);
	let editingPost = $state<CommunityPost | null>(null);
	let editPostText = $state('');
	let editPostUrl = $state('');
	let editPostError = $state('');
	let editPostSaving = $state(false);
	let deletedPostIds = $state<string[]>([]);
	let profileActionsOpen = $state(false);
	let signingOut = $state(false);
	let additionalPosts = $state<CommunityPost[]>([]);
	let additionalReplies = $state<ApiProfileReply[]>([]);
	let nextPostsCursor = $state<string | null>(null);
	let nextRepliesCursor = $state<string | null>(null);
	let activityLoading = $state(false);
	let loadedActivityKey = '';
	let editOpen = $state(false);
	let profileDraft = $state({
		displayName: '',
		bio: '',
		avatarUrl: '',
		bannerUrl: '',
		indexingOptedIn: false
	});
	let profileEditError = $state('');
	let profileSaving = $state(false);
	let profileMediaUploading = $state(false);
	let cropDraft = $state<{
		purpose: 'profile-avatar' | 'profile-banner';
		file: File;
		previewUrl: string;
		scale: number;
		rotation: number;
		offsetX: number;
		offsetY: number;
	} | null>(null);
	let cropDragOrigin: {
		pointerId: number;
		x: number;
		y: number;
		offsetX: number;
		offsetY: number;
	} | null = null;
	let safetyActionLoading = $state(false);
	let connectionsKind = $state<'followers' | 'following' | null>(null);
	let connections = $state<ApiProfileConnection[]>([]);
	let connectionsCursor = $state<string | null>(null);
	let connectionsLoading = $state(false);
	const allPosts = $derived(
		[...data.posts, ...additionalPosts].filter((post) => !deletedPostIds.includes(post.id))
	);
	const allReplies = $derived([...data.replies, ...additionalReplies]);
	const visibleCommunities = $derived(data.profile.communities.slice(0, 3));
	const additionalCommunityCount = $derived(
		Math.max(0, data.profile.communities.length - visibleCommunities.length)
	);
	const profileOgImage = $derived(
		`https://sanctyria.com/api/og/profile/${encodeURIComponent(data.profile.username)}?v=${encodeURIComponent(data.profile.avatarVersion ?? '')}`
	);

	const sections = ['Posts', 'Replies', 'Media'];

	$effect(() => {
		const activityKey = [
			data.profile.username,
			...data.posts.map((post) => post.id),
			...data.replies.map((reply) => reply.id)
		].join(':');
		if (activityKey === loadedActivityKey) return;
		loadedActivityKey = activityKey;
		nextPostsCursor = data.postsCursor;
		nextRepliesCursor = data.repliesCursor;
		additionalPosts = [];
		additionalReplies = [];
	});

	async function loadMoreActivity() {
		const type = activeSection === 'Replies' ? 'replies' : 'posts';
		const cursor = type === 'replies' ? nextRepliesCursor : nextPostsCursor;
		if (!cursor || activityLoading) return;
		activityLoading = true;
		try {
			const page = await communityApi<ApiPage<ApiPost | ApiProfileReply>>(
				fetch,
				`profiles/${encodeURIComponent(data.profile.username)}/activity?type=${type}&limit=50&cursor=${encodeURIComponent(cursor)}`
			);
			if (type === 'replies') {
				additionalReplies = [...additionalReplies, ...(page.items as ApiProfileReply[])];
				nextRepliesCursor = page.nextCursor;
			} else {
				const joinedSlugs = data.profile.communities.map((community) => community.slug);
				additionalPosts = [
					...additionalPosts,
					...(page.items as ApiPost[]).map((post) => toCommunityPost(post, joinedSlugs))
				];
				nextPostsCursor = page.nextCursor;
			}
		} catch (error) {
			toast = error instanceof Error ? error.message : 'Could not load more activity.';
			window.setTimeout(() => (toast = ''), 2200);
		} finally {
			activityLoading = false;
		}
	}

	async function toggleFollow() {
		if (!data.communityUser) {
			void goto(`/login?returnTo=${encodeURIComponent(`/u/${data.profile.handle.slice(1)}`)}`);
			return;
		}
		if (data.profile.isBlocked || data.profile.isBlockedBy) return;
		try {
			await communityApi(fetch, `profiles/${encodeURIComponent(data.profile.username)}/follow`, {
				method: data.profile.isFollowing ? 'DELETE' : 'POST'
			});
			await invalidate('app:community-content');
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not update follow state.');
		}
	}

	async function updateProfileSafety(action: 'block' | 'mute') {
		if (!data.communityUser || safetyActionLoading) return;
		const currentlySet =
			action === 'block' ? data.profile.isBlocked === true : data.profile.isMuted === true;
		safetyActionLoading = true;
		try {
			await communityApi(fetch, `profiles/${encodeURIComponent(data.profile.username)}/${action}`, {
				method: currentlySet ? 'DELETE' : 'POST'
			});
			await invalidate('app:community-content');
			showToast(
				action === 'block'
					? currentlySet
						? 'Profile unblocked.'
						: 'Profile blocked.'
					: currentlySet
						? 'Profile unmuted.'
						: 'Profile muted.'
			);
		} catch (error) {
			showToast(
				error instanceof Error ? error.message : 'Could not update profile safety settings.'
			);
		} finally {
			safetyActionLoading = false;
		}
	}

	function showToast(message: string) {
		toast = message;
		window.setTimeout(() => (toast = ''), 2200);
	}

	function openProfilePostEditor(post: CommunityPost) {
		if (!post.canManage) return;
		editingPost = post;
		editPostText = post.text;
		editPostUrl = post.url ?? '';
		editPostError = '';
	}

	async function saveProfilePost(event: SubmitEvent) {
		event.preventDefault();
		if (!editingPost || editPostSaving) return;
		editPostSaving = true;
		editPostError = '';
		try {
			await communityApi(fetch, `posts/${encodeURIComponent(editingPost.id)}`, {
				method: 'PATCH',
				body: JSON.stringify({
					body: editPostText.trim(),
					...(editingPost.kind !== 'text' ? { url: editPostUrl.trim() } : {})
				})
			});
			editingPost = null;
			await invalidate('app:community-content');
			showToast('Post updated.');
		} catch (error) {
			editPostError = error instanceof Error ? error.message : 'Could not update post.';
		} finally {
			editPostSaving = false;
		}
	}

	async function deleteProfilePost(post: CommunityPost) {
		if (
			!post.canManage ||
			!window.confirm('Delete this post? It will no longer be visible in the community.')
		)
			return;
		try {
			await communityApi(fetch, `posts/${encodeURIComponent(post.id)}`, { method: 'DELETE' });
			deletedPostIds = [...new Set([...deletedPostIds, post.id])];
			await invalidate('app:community-content');
			showToast('Post deleted.');
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not delete post.');
		}
	}

	async function toggleProfilePostPin(post: CommunityPost) {
		if (!data.profile.isOwnProfile || post.handle !== `@${data.profile.username}`) return;
		try {
			await communityApi<{ pinned: boolean }>(
				fetch,
				`posts/${encodeURIComponent(post.id)}/pin/profile`,
				{ method: post.isProfilePinned ? 'DELETE' : 'POST' }
			);
			await invalidate('app:community-content');
			showToast(
				post.isProfilePinned ? 'Post unpinned from your profile.' : 'Post pinned to your profile.'
			);
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not update profile pin.');
		}
	}

	function shareProfile() {
		const url = `${window.location.origin}/u/${encodeURIComponent(data.profile.username)}`;
		if (navigator.share) {
			navigator
				.share({ title: `${data.profile.name} on Sanctyria`, url })
				.catch((error: unknown) => {
					if (!(error instanceof DOMException && error.name === 'AbortError')) {
						showToast(error instanceof Error ? error.message : 'Could not share this profile.');
					}
				});
		} else if (navigator.clipboard) {
			navigator.clipboard.writeText(url).then(
				() => showToast('Profile link copied'),
				() => showToast(url)
			);
		} else {
			showToast(url);
		}
	}

	async function signOut() {
		if (signingOut) return;
		signingOut = true;
		try {
			await communityApi(fetch, 'auth/session', { method: 'DELETE' });
			await invalidateAll();
			await goto('/home');
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not sign out.');
		} finally {
			signingOut = false;
		}
	}

	function openProfileEditor() {
		profileDraft = {
			displayName: data.profile.name,
			bio: data.profile.bio,
			avatarUrl: data.profile.avatarUrl ?? '',
			bannerUrl: data.profile.bannerUrl ?? '',
			indexingOptedIn: data.profile.indexingOptedIn
		};
		profileEditError = '';
		editOpen = true;
	}

	async function saveProfile(event: SubmitEvent) {
		event.preventDefault();
		if (profileMediaUploading) return;
		profileEditError = '';
		profileSaving = true;
		try {
			await communityApi(fetch, 'me/profile', {
				method: 'PATCH',
				body: JSON.stringify({
					displayName: profileDraft.displayName,
					bio: profileDraft.bio,
					avatarUrl: profileDraft.avatarUrl.trim() || null,
					bannerUrl: profileDraft.bannerUrl.trim() || null,
					indexingOptedIn: profileDraft.indexingOptedIn
				})
			});
			editOpen = false;
			await invalidate('app:community-content');
			showToast('Profile updated.');
		} catch (error) {
			profileEditError = error instanceof Error ? error.message : 'Could not update profile.';
		} finally {
			profileSaving = false;
		}
	}

	async function uploadProfileImage(event: Event, purpose: 'profile-avatar' | 'profile-banner') {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;
		const file = input.files[0];
		if (window.matchMedia('(max-width: 767px)').matches) {
			if (cropDraft) URL.revokeObjectURL(cropDraft.previewUrl);
			cropDraft = {
				purpose,
				file,
				previewUrl: URL.createObjectURL(file),
				scale: 1,
				rotation: 0,
				offsetX: 0,
				offsetY: 0
			};
			input.value = '';
			return;
		}
		profileMediaUploading = true;
		profileEditError = '';
		try {
			const url = await uploadCommunityMedia(file, purpose);
			profileDraft = {
				...profileDraft,
				...(purpose === 'profile-avatar' ? { avatarUrl: url } : { bannerUrl: url })
			};
		} catch (error) {
			profileEditError = error instanceof Error ? error.message : 'Could not upload this image.';
		} finally {
			profileMediaUploading = false;
		}
	}

	async function applyProfileCrop() {
		if (!cropDraft || profileMediaUploading) return;
		const draft = cropDraft;
		profileMediaUploading = true;
		profileEditError = '';
		try {
			const image = new Image();
			image.src = draft.previewUrl;
			await image.decode();
			const canvas = document.createElement('canvas');
			const isAvatar = draft.purpose === 'profile-avatar';
			canvas.width = isAvatar ? 640 : 1600;
			canvas.height = isAvatar ? 640 : 500;
			const context = canvas.getContext('2d');
			if (!context) throw new Error('Image cropping is unavailable in this browser.');

			const radians = (draft.rotation * Math.PI) / 180;
			const rotatedWidth =
				Math.abs(image.width * Math.cos(radians)) + Math.abs(image.height * Math.sin(radians));
			const rotatedHeight =
				Math.abs(image.width * Math.sin(radians)) + Math.abs(image.height * Math.cos(radians));
			const scale =
				Math.max(canvas.width / rotatedWidth, canvas.height / rotatedHeight) * draft.scale;
			context.translate(
				canvas.width / 2 + draft.offsetX * canvas.width,
				canvas.height / 2 + draft.offsetY * canvas.height
			);
			context.rotate(radians);
			context.drawImage(
				image,
				(-image.width * scale) / 2,
				(-image.height * scale) / 2,
				image.width * scale,
				image.height * scale
			);
			const blob = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob(
					(result) => (result ? resolve(result) : reject(new Error('Could not crop this image.'))),
					'image/jpeg',
					0.9
				);
			});
			const file = new File([blob], `${draft.purpose}.jpg`, { type: 'image/jpeg' });
			const url = await uploadCommunityMedia(file, draft.purpose);
			profileDraft = {
				...profileDraft,
				...(draft.purpose === 'profile-avatar' ? { avatarUrl: url } : { bannerUrl: url })
			};
			URL.revokeObjectURL(draft.previewUrl);
			cropDraft = null;
		} catch (error) {
			profileEditError = error instanceof Error ? error.message : 'Could not crop this image.';
		} finally {
			profileMediaUploading = false;
		}
	}

	function closeProfileCrop() {
		if (cropDraft) URL.revokeObjectURL(cropDraft.previewUrl);
		cropDraft = null;
		cropDragOrigin = null;
	}

	function startCropDrag(event: PointerEvent) {
		if (!cropDraft) return;
		const target = event.currentTarget;
		if (!(target instanceof HTMLElement)) return;
		target.setPointerCapture(event.pointerId);
		cropDragOrigin = {
			pointerId: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			offsetX: cropDraft.offsetX,
			offsetY: cropDraft.offsetY
		};
	}

	function moveCropDrag(event: PointerEvent) {
		if (!cropDraft || !cropDragOrigin || cropDragOrigin.pointerId !== event.pointerId) return;
		const target = event.currentTarget;
		if (!(target instanceof HTMLElement)) return;
		const bounds = target.getBoundingClientRect();
		cropDraft.offsetX = Math.max(
			-0.8,
			Math.min(0.8, cropDragOrigin.offsetX + (event.clientX - cropDragOrigin.x) / bounds.width)
		);
		cropDraft.offsetY = Math.max(
			-0.8,
			Math.min(0.8, cropDragOrigin.offsetY + (event.clientY - cropDragOrigin.y) / bounds.height)
		);
	}

	function endCropDrag() {
		cropDragOrigin = null;
	}

	function profileBadgeLabel(badge: string): string {
		const labels: Record<string, string> = {
			verified: 'Verified',
			staff: 'Sanctyria staff',
			community_creator: 'Community creator',
			early_supporter: 'Early supporter',
			beta_tester: 'Beta tester'
		};
		return labels[badge] ?? badge.replaceAll('_', ' ');
	}

	function profileBadgeIcon(badge: string) {
		if (badge === 'verified') return BadgeCheck;
		if (badge === 'staff') return ShieldCheck;
		if (badge === 'community_creator') return Flame;
		return Sparkles;
	}

	async function openConnections(kind: 'followers' | 'following') {
		connectionsKind = kind;
		connections = [];
		connectionsCursor = null;
		connectionsLoading = true;
		try {
			const page = await communityApi<ApiPage<ApiProfileConnection>>(
				fetch,
				`profiles/${encodeURIComponent(data.profile.username)}/${kind}?limit=50`
			);
			connections = page.items;
			connectionsCursor = page.nextCursor;
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not load connections.');
			connectionsKind = null;
		} finally {
			connectionsLoading = false;
		}
	}

	async function loadMoreConnections() {
		if (!connectionsKind || !connectionsCursor || connectionsLoading) return;
		connectionsLoading = true;
		try {
			const page = await communityApi<ApiPage<ApiProfileConnection>>(
				fetch,
				`profiles/${encodeURIComponent(data.profile.username)}/${connectionsKind}?limit=50&cursor=${encodeURIComponent(connectionsCursor)}`
			);
			connections = [...connections, ...page.items];
			connectionsCursor = page.nextCursor;
		} catch (error) {
			showToast(error instanceof Error ? error.message : 'Could not load more connections.');
		} finally {
			connectionsLoading = false;
		}
	}
</script>

<svelte:head>
	<title>{data.profile.name} ({data.profile.handle}) | Sanctyria Community</title>
	<meta name="description" content={data.profile.bio} />
	<link
		rel="canonical"
		href={`https://sanctyria.com/u/${encodeURIComponent(data.profile.username)}`}
	/>
	<meta name="robots" content={data.profile.indexable ? 'index, follow' : 'noindex, follow'} />
	<meta property="og:type" content="profile" />
	<meta
		property="og:url"
		content={`https://sanctyria.com/u/${encodeURIComponent(data.profile.username)}`}
	/>
	<meta property="og:title" content={`${data.profile.name} | Sanctyria Community`} />
	<meta property="og:description" content={data.profile.bio} />
	<meta property="og:image" content={profileOgImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={`${data.profile.name} | Sanctyria Community`} />
	<meta name="twitter:description" content={data.profile.bio} />
	<meta name="twitter:image" content={profileOgImage} />
</svelte:head>

<div class="community-profile-page min-h-screen bg-[#090a0a] text-[#f1efe9]">
	<main class="mx-auto w-full max-w-5xl px-2 pb-28 sm:px-8 md:pb-12 xl:px-12">
		<section class="mt-5 border-b border-white/[0.08] pb-6" aria-labelledby="profile-name">
			<div
				class="relative z-0 h-24 overflow-hidden border border-white/[0.06] bg-[linear-gradient(115deg,rgba(249,115,22,.16),rgba(9,10,10,.1)_55%,rgba(132,165,189,.12))] sm:h-32"
			>
				{#if data.profile.bannerUrl}
					<img
						src={data.profile.bannerUrl}
						alt=""
						class="absolute inset-0 h-full w-full object-cover"
					/>
					<div class="absolute inset-0 bg-black/20"></div>
				{/if}
			</div>
			<div class="flex flex-wrap items-end justify-between gap-4 px-2">
				<div class="relative z-10 -mt-7 flex items-end gap-3 sm:-mt-9 sm:gap-4">
					<span
						class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-[#090a0a] font-display text-2xl text-white sm:h-20 sm:w-20"
						style={data.profile.avatarUrl ? undefined : `background:${data.profile.avatarColor}`}
						>{#if data.profile.avatarUrl}<img
								src={data.profile.avatarUrl}
								alt=""
								class="h-full w-full object-cover"
							/>{:else}{data.profile.initials}{/if}</span
					>
					<div class="pb-1">
						<h1 id="profile-name" class="font-display text-2xl leading-none sm:text-3xl">
							{data.profile.name}
						</h1>
						<p class="mt-1.5 text-xs text-white/40">{data.profile.handle}</p>
					</div>
				</div>
				{#if data.profile.isOwnProfile}
					<div class="mb-1 hidden items-center gap-2 md:flex">
						<button
							type="button"
							onclick={shareProfile}
							aria-label="Share profile"
							title="Share profile"
							class="inline-flex h-9 w-9 items-center justify-center border border-white/20 text-white/75 transition-colors hover:border-orange-200/50 hover:text-orange-100"
							><Share2 size={16} /></button
						>
						<a
							href="/saved"
							aria-label="Saved posts"
							title="Saved posts"
							class="inline-flex h-9 w-9 items-center justify-center border border-white/20 text-white/75 transition-colors hover:border-orange-200/50 hover:text-orange-100"
							><Bookmark size={16} /></a
						>
						{#if data.communityUser?.isAdmin}
							<a
								href="/core"
								aria-label="Sanctyria Core"
								title="Sanctyria Core"
								class="inline-flex h-9 w-9 items-center justify-center border border-white/20 text-orange-100/75 transition-colors hover:border-orange-200/50 hover:text-orange-100 md:hidden"
								><ShieldCheck size={16} /></a
							>
						{/if}
						<button
							type="button"
							onclick={openProfileEditor}
							aria-label="Edit profile"
							title="Edit profile"
							class="flex h-9 w-9 items-center justify-center border border-white/20 text-white transition-colors hover:border-orange-200/50 hover:text-orange-100"
							><Pencil size={16} /></button
						>
					</div>
					<div class="mb-1 md:hidden">
						<button
							type="button"
							onclick={() => (profileActionsOpen = true)}
							aria-label="Profile actions"
							aria-expanded={profileActionsOpen}
							class="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white/75"
							><MoreHorizontal size={18} /></button
						>
					</div>
				{:else}
					<div class="mb-1 flex flex-wrap items-center justify-end gap-2">
						<button
							type="button"
							onclick={shareProfile}
							aria-label="Share profile"
							title="Share profile"
							class="flex h-9 w-9 items-center justify-center border border-white/15 text-white/60 hover:border-orange-200/40 hover:text-orange-100"
							><Share2 size={15} /></button
						>
						{#if !data.profile.isBlockedBy}
							<button
								type="button"
								onclick={toggleFollow}
								disabled={data.profile.isBlocked || safetyActionLoading}
								aria-pressed={data.profile.isFollowing}
								class={`px-5 py-2 text-xs font-medium transition-colors ${data.profile.isFollowing ? 'border border-white/20 text-white/75 hover:border-red-300/40 hover:text-red-200' : 'bg-white text-black hover:bg-orange-100'} disabled:cursor-not-allowed disabled:opacity-50`}
								>{data.profile.isFollowing ? 'Following' : 'Follow'}</button
							>
						{/if}
						{#if data.communityUser}
							<button
								type="button"
								onclick={() => updateProfileSafety('mute')}
								disabled={safetyActionLoading || data.profile.isBlockedBy}
								aria-pressed={data.profile.isMuted}
								aria-label={data.profile.isMuted ? 'Unmute profile' : 'Mute profile'}
								title={data.profile.isMuted ? 'Unmute profile' : 'Mute profile'}
								class="flex h-9 w-9 items-center justify-center border border-white/15 text-white/60 hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
								><VolumeX size={15} /></button
							>
							<button
								type="button"
								onclick={() => updateProfileSafety('block')}
								disabled={safetyActionLoading}
								aria-pressed={data.profile.isBlocked}
								aria-label={data.profile.isBlocked ? 'Unblock profile' : 'Block profile'}
								title={data.profile.isBlocked ? 'Unblock profile' : 'Block profile'}
								class="flex h-9 w-9 items-center justify-center border border-white/15 text-white/60 hover:border-red-300/40 hover:text-red-200 disabled:opacity-50"
								><UserRoundX size={15} /></button
							>
						{/if}
					</div>
				{/if}
			</div>
			<div class="mt-4 px-2">
				<p class="max-w-xl text-sm leading-6 text-white/70">{data.profile.bio}</p>
				{#if data.profile.badges.length}
					<div class="mt-3 flex flex-wrap gap-2" aria-label="Profile badges">
						{#each data.profile.badges as badge (badge)}
							{@const BadgeIcon = profileBadgeIcon(badge)}
							<span
								class="community-profile-badge"
								data-badge={badge}
								title={profileBadgeLabel(badge)}
								aria-label={profileBadgeLabel(badge)}
							>
								<BadgeIcon class="community-profile-badge-icon" size={13} strokeWidth={2} />
								<span class="community-profile-badge-label">{profileBadgeLabel(badge)}</span>
							</span>
						{/each}
					</div>
				{/if}
				<div class="community-profile-streak-card md:hidden">
					<div class="community-profile-streak-item">
						<span class="community-profile-streak-icon"><Flame size={17} /></span>
						<span>
							<small>Current streak</small>
							<strong
								>{data.profile.activityStreak}
								{data.profile.activityStreak === 1 ? 'day' : 'days'}</strong
							>
						</span>
					</div>
					<div class="community-profile-streak-divider"></div>
					<div class="community-profile-streak-item">
						<span class="community-profile-streak-icon best"><Sparkles size={16} /></span>
						<span>
							<small>Best streak</small>
							<strong
								>{data.profile.bestActivityStreak}
								{data.profile.bestActivityStreak === 1 ? 'day' : 'days'}</strong
							>
						</span>
					</div>
				</div>
				<div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-white/40">
					<span>{data.profile.joined}</span>
					<button
						type="button"
						onclick={() => openConnections('followers')}
						class="hover:text-orange-100"
						><strong class="text-white/75">{data.profile.followerCount}</strong> followers</button
					>
					<button
						type="button"
						onclick={() => openConnections('following')}
						class="hover:text-orange-100"
						><strong class="text-white/75">{data.profile.followingCount}</strong> following</button
					>
					<span class="inline-flex items-center gap-1 text-orange-200/75"
						><Flame size={12} />{data.profile.ember} Ember</span
					>
					<span class="inline-flex items-center gap-1"
						><Flame size={12} class="text-orange-200/70" />{data.profile.communities.length} communities</span
					>
				</div>
				<div class="mt-4 flex flex-wrap gap-2">
					{#each visibleCommunities as community (community.slug)}<a
							href={`/r/${community.slug}`}
							class="inline-flex items-center gap-1.5 border border-white/[0.09] px-2.5 py-1.5 text-[10px] text-white/55 transition-colors hover:border-orange-200/30 hover:text-orange-100"
						>
							{#if community.avatarUrl}<img
									src={community.avatarUrl}
									alt=""
									class="h-4 w-4 rounded-full object-cover"
								/>{:else}<Flame size={12} class="text-orange-200/70" />{/if}
							{community.name}</a
						>{/each}
					{#if additionalCommunityCount > 0}
						<span
							class="inline-flex items-center border border-white/[0.09] px-2.5 py-1.5 text-[10px] text-white/45"
							aria-label={`${additionalCommunityCount} more communities`}
							title={`${additionalCommunityCount} more communities`}
							>+{additionalCommunityCount}</span
						>
					{/if}
				</div>
			</div>
		</section>

		<nav class="grid grid-cols-3 border-b border-white/[0.08]" aria-label="Profile sections">
			{#each sections as section (section)}<button
					type="button"
					onclick={() => (activeSection = section)}
					aria-current={activeSection === section ? 'page' : undefined}
					class={`h-12 border-b-2 text-xs transition-colors ${activeSection === section ? 'border-orange-400 text-white' : 'border-transparent text-white/45 hover:text-white/80'}`}
					>{section}</button
				>{/each}
		</nav>

		{#if activeSection === 'Posts' || activeSection === 'Media'}
			{@const profilePosts =
				activeSection === 'Media'
					? allPosts.filter(
							(post) => post.kind === 'image' || post.kind === 'video' || post.kind === 'audio'
						)
					: allPosts}
			{#if profilePosts.length}
				<section
					aria-label={`${activeSection} by ${data.profile.name}`}
					class="divide-y divide-white/[0.08]"
				>
					{#each profilePosts as post (post.id)}
						<article class="profile-post-card py-5">
							<div class="flex items-start gap-2 sm:gap-3">
								<a
									href={`/u/${encodeURIComponent(data.profile.username)}`}
									class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 font-display text-sm text-white"
									style={data.profile.avatarUrl
										? undefined
										: `background:${data.profile.avatarColor}`}
									aria-label={`View ${data.profile.name}'s profile`}
								>
									{#if data.profile.avatarUrl}<img
											src={data.profile.avatarUrl}
											alt=""
											class="h-full w-full object-cover"
										/>{:else}{data.profile.initials}{/if}
								</a>
								<div class="min-w-0 flex-1">
									<div class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px]">
										<a
											href={`/u/${encodeURIComponent(data.profile.username)}`}
											class="font-medium text-white/90 hover:text-orange-100">{data.profile.name}</a
										>
										{#if data.profile.verified}<BadgeCheck
												size={13}
												class="text-sky-300"
												aria-label="Verified"
											/>{/if}
										<span class="max-md:hidden">
											<CommunityFollowButton
												authorUsername={data.profile.username}
												viewerUsername={data.communityUser?.username}
												initialFollowing={data.profile.isFollowing}
											/>
										</span>
										<a
											href={`/u/${encodeURIComponent(data.profile.username)}`}
											class="profile-post-mobile-byline md:hidden"
											>@{data.profile.username} · {post.postedAt}</a
										>
										<span class="text-white/35 max-md:hidden">{post.postedAt}</span>
									</div>
									<div class="profile-post-community-row">
										<a
											href={`/r/${post.communitySlug ?? communitySlug(post.community)}`}
											class="mt-1 inline-flex min-w-0 items-center gap-1.5 text-[10px] text-white/45 hover:text-orange-100"
										>
											<span
												class="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10"
												style={`color:${post.communityColor};background:${post.communityColor}12`}
											>
												{#if post.communityAvatarUrl}<img
														src={post.communityAvatarUrl}
														alt=""
														class="h-full w-full object-cover"
													/>{:else}<Flame size={9} />{/if}
											</span><span class="truncate">{post.community}</span></a
										>
										<div class="profile-post-mobile-options md:hidden">
											<button
												type="button"
												onclick={() => (postOptionsPost = post)}
												aria-label="Post options"
												aria-expanded={postOptionsPost?.id === post.id}
												class="profile-post-icon-button"><MoreHorizontal size={20} /></button
											>
											{#if data.profile.isOwnProfile && post.handle === `@${data.profile.username}`}
												<button
													type="button"
													onclick={() => toggleProfilePostPin(post)}
													aria-label={post.isProfilePinned
														? 'Unpin post from profile'
														: 'Pin post to profile'}
													aria-pressed={post.isProfilePinned}
													class={`profile-post-icon-button ${post.isProfilePinned ? 'pinned' : ''}`}
													><Pin
														size={20}
														fill={post.isProfilePinned ? 'currentColor' : 'none'}
													/></button
												>
											{/if}
										</div>
									</div>
									<a
										href={`/p/${encodeURIComponent(post.id)}`}
										class="mt-3 block text-[13px] leading-[1.7] whitespace-pre-wrap text-white/80 hover:text-white"
									>
										{post.text}
									</a>
									{#if post.kind === 'image' && post.url}
										<a
											href={post.url}
											target="_blank"
											rel="noopener noreferrer"
											class="mt-3 block overflow-hidden border border-white/[0.08]"
										>
											<img
												src={post.url}
												alt={post.text}
												loading="lazy"
												class="max-h-[420px] w-full object-cover"
											/>
										</a>
									{:else if post.kind === 'video' && post.url}
										{@const embedUrl = videoEmbedUrl(post.url)}
										{#if embedUrl}
											<div
												class="community-video mt-3 overflow-hidden border border-white/[0.08] bg-black"
											>
												<CommunityVideoPreview
													url={post.url}
													title={post.text || `Video shared by ${data.profile.name}`}
												/>
											</div>
										{:else}
											<a
												href={post.url}
												target="_blank"
												rel="noopener noreferrer"
												class="mt-3 inline-flex border border-white/10 px-3 py-2 text-xs text-white/65 hover:text-orange-100"
												>Open video link</a
											>
										{/if}
									{:else if post.kind === 'audio' && post.url}
										<div class="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
											{#if post.audioCoverUrl}<img
													src={post.audioCoverUrl}
													alt=""
													class="mb-3 aspect-square max-h-56 w-full rounded-lg object-cover"
													loading="lazy"
												/>{/if}
											<CommunityAudioPlayer
												src={post.url}
												coverUrl={post.audioCoverUrl}
												title={post.name}
												subtitle={`${post.handle} · ${post.community}`}
											/>
										</div>
									{:else if post.kind === 'link' && post.url}
										<CommunityLinkPreview
											url={post.url}
											title={post.linkTitle}
											description={post.linkDescription}
											domain={post.linkDomain}
										/>
									{/if}
									<CommunityPostActions
										{post}
										viewerUsername={data.communityUser?.username}
										returnTo={`/u/${encodeURIComponent(data.profile.username)}`}
									/>
								</div>
							</div>
						</article>
					{/each}
				</section>
				{#if nextPostsCursor}<div class="border-t border-white/[0.08] py-5 text-center">
						<button
							type="button"
							onclick={loadMoreActivity}
							disabled={activityLoading}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 transition-colors hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
							>{activityLoading ? 'Loading...' : 'Load more posts'}</button
						>
					</div>{/if}
			{:else}
				<div class="py-12 text-center">
					<div
						class="mx-auto flex h-10 w-10 items-center justify-center border border-white/[0.09] text-white/45"
					>
						<MessageCircle size={17} />
					</div>
					<h2 class="mt-4 font-display text-2xl">No {activeSection.toLowerCase()} yet</h2>
					<p class="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/45">
						{activeSection === 'Media'
							? 'Image, video, and audio posts from this profile will appear here.'
							: 'Posts shared by this profile will appear here.'}
					</p>
					{#if activeSection === 'Media' && nextPostsCursor}<button
							type="button"
							onclick={loadMoreActivity}
							disabled={activityLoading}
							class="mt-5 border border-white/15 px-4 py-2 text-xs text-white/70 transition-colors hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
							>{activityLoading ? 'Loading...' : 'Load older media'}</button
						>{/if}
				</div>
			{/if}
		{:else if allReplies.length}
			<section aria-label={`Replies by ${data.profile.name}`} class="divide-y divide-white/[0.08]">
				{#each allReplies as reply (reply.id)}
					<article class="py-5">
						<p class="text-sm leading-6 whitespace-pre-wrap text-white/80">{reply.body}</p>
						<div class="mt-3 border-l border-white/15 pl-3 text-xs leading-5 text-white/45">
							<p>
								Replying to a post in <a
									href={`/r/${reply.post.communitySlug}`}
									class="text-white/70 hover:text-orange-100">{reply.post.communityName}</a
								>
							</p>
							<p class="mt-1 line-clamp-2">{reply.post.body}</p>
							<a
								href={`/p/${reply.post.id}`}
								class="mt-2 inline-block text-orange-200 hover:text-orange-100">Open conversation</a
							>
						</div>
					</article>
				{/each}
			</section>
			{#if nextRepliesCursor}<div class="border-t border-white/[0.08] py-5 text-center">
					<button
						type="button"
						onclick={loadMoreActivity}
						disabled={activityLoading}
						class="border border-white/15 px-4 py-2 text-xs text-white/70 transition-colors hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
						>{activityLoading ? 'Loading...' : 'Load more replies'}</button
					>
				</div>{/if}
		{:else}
			<div class="py-12 text-center">
				<div
					class="mx-auto flex h-10 w-10 items-center justify-center border border-white/[0.09] text-white/45"
				>
					<MessageCircle size={17} />
				</div>
				<h2 class="mt-4 font-display text-2xl">No replies yet</h2>
				<p class="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/45">
					Replies written by this profile will appear here.
				</p>
			</div>
		{/if}
	</main>
	{#if editOpen}
		<div
			class="community-profile-editor-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
		>
			<dialog
				open
				aria-labelledby="edit-profile-heading"
				class="community-profile-editor-dialog fixed inset-0 m-auto max-h-[min(88vh,760px)] w-full max-w-xl overflow-y-auto border border-white/10 bg-[#111211] p-5 text-white shadow-2xl sm:p-7"
			>
				<header class="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
					<div>
						<p class="font-mono text-[9px] tracking-[0.14em] text-orange-200/70 uppercase">
							Your account
						</p>
						<h2 id="edit-profile-heading" class="mt-1 font-display text-2xl">Edit profile</h2>
						<p class="mt-1 text-xs text-white/40">Shape how people see you across Sanctyria.</p>
					</div>
					<button
						type="button"
						onclick={() => (editOpen = false)}
						aria-label="Close profile editor"
						class="flex h-9 w-9 shrink-0 items-center justify-center text-white/55 hover:bg-white/5 hover:text-white"
						><X size={17} /></button
					>
				</header>
				<div class="mt-5 flex items-center gap-3 border border-white/[0.08] bg-black/20 p-3">
					<span
						class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 font-display text-sm text-white"
						style={profileDraft.avatarUrl ? undefined : `background:${data.profile.avatarColor}`}
					>
						{#if profileDraft.avatarUrl}<img
								src={profileDraft.avatarUrl}
								alt=""
								class="h-full w-full object-cover"
							/>{:else}{profileDraft.displayName
								.trim()
								.split(/\s+/)
								.slice(0, 2)
								.map((part) => part[0]?.toUpperCase() ?? '')
								.join('') || data.profile.initials}{/if}
					</span>
					<div class="min-w-0">
						<p class="truncate text-sm font-medium text-white/90">
							{profileDraft.displayName || 'Your display name'}
						</p>
						<p class="mt-0.5 truncate text-[10px] text-white/40">@{data.profile.username}</p>
					</div>
				</div>
				<div
					class="relative mt-4 h-20 overflow-hidden border border-white/[0.08] bg-[linear-gradient(115deg,rgba(249,115,22,.16),rgba(9,10,10,.1)_55%,rgba(132,165,189,.12))]"
				>
					{#if profileDraft.bannerUrl}
						<img
							src={profileDraft.bannerUrl}
							alt="Profile banner preview"
							class="absolute inset-0 h-full w-full object-cover"
						/>
						<div class="absolute inset-0 bg-black/20"></div>
					{/if}
				</div>
				<form onsubmit={saveProfile} class="mt-5 space-y-4">
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<label class="block text-xs text-white/65"
							>Display name<input
								bind:value={profileDraft.displayName}
								maxlength="60"
								required
								autocomplete="name"
								class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-200/40"
							/></label
						>
						<label class="block text-xs text-white/65"
							>Username<input
								value={`@${data.profile.username}`}
								disabled
								class="mt-1.5 w-full border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-sm text-white/40"
							/></label
						>
					</div>
					<label class="block text-xs text-white/65"
						>Bio<textarea
							bind:value={profileDraft.bio}
							maxlength="300"
							rows="4"
							placeholder="A few words about what you make or care about..."
							class="mt-1.5 w-full resize-y border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-white/25 focus:border-orange-200/40"
						></textarea><span class="mt-1 block text-right text-[10px] text-white/30"
							>{profileDraft.bio.length}/300</span
						></label
					>
					<label
						class="flex items-start gap-3 border border-white/[0.08] bg-black/20 p-3 text-xs text-white/70"
					>
						<input
							type="checkbox"
							bind:checked={profileDraft.indexingOptedIn}
							class="mt-0.5 accent-orange-300"
						/>
						<span>
							<strong class="font-medium text-white/90"
								>Allow search engines to index my profile</strong
							>
							<span class="mt-1 block leading-5 text-white/45">
								Your profile is eligible only while your account is active, your bio has at least 20
								characters, and you have a public post in an approved community. You can turn this
								off at any time.
							</span>
						</span>
					</label>
					<label class="block text-xs text-white/65">
						Avatar image URL
						<input
							bind:value={profileDraft.avatarUrl}
							type="url"
							inputmode="url"
							placeholder="https://"
							class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-200/40"
						/>
						<span class="mt-1 block text-[10px] text-white/35">
							Use a secure HTTPS image address or upload an image. Leave blank to use your initials.
						</span>
					</label>
					<label class="block text-xs text-white/65">
						Upload avatar
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							onchange={(event) => uploadProfileImage(event, 'profile-avatar')}
							disabled={profileMediaUploading}
							class="mt-2 w-full text-xs text-white/55 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:text-white"
						/>
					</label>
					<label class="block text-xs text-white/65">
						Profile banner image URL
						<input
							bind:value={profileDraft.bannerUrl}
							type="url"
							inputmode="url"
							placeholder="https://"
							class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-200/40"
						/>
						<span class="mt-1 block text-[10px] text-white/35">
							Use a secure HTTPS image address or upload an image. Leave blank to remove your
							banner.
						</span>
					</label>
					<label class="block text-xs text-white/65">
						Upload banner
						<input
							type="file"
							accept="image/jpeg,image/png,image/webp,image/gif"
							onchange={(event) => uploadProfileImage(event, 'profile-banner')}
							disabled={profileMediaUploading}
							class="mt-2 w-full text-xs text-white/55 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:text-white"
						/>
					</label>
					{#if profileMediaUploading}<p role="status" class="text-xs text-orange-200/75">
							Uploading image…
						</p>{/if}
					{#if profileEditError}<p
							role="alert"
							class="border border-red-300/15 bg-red-300/[0.04] px-3 py-2.5 text-xs text-red-200"
						>
							{profileEditError}
						</p>{/if}
					<div class="flex justify-end gap-2 border-t border-white/[0.08] pt-4">
						<button
							type="button"
							onclick={() => (editOpen = false)}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:text-white"
							>Cancel</button
						>
						<button
							type="submit"
							disabled={profileSaving || profileMediaUploading}
							class="bg-orange-300 px-4 py-2 text-xs font-semibold text-[#17110e] hover:bg-orange-200 disabled:opacity-50"
							>{profileSaving ? 'Saving...' : 'Save changes'}</button
						>
					</div>
				</form>
			</dialog>
		</div>
	{/if}
	{#if cropDraft}
		<div
			class="community-profile-crop-overlay"
			role="dialog"
			aria-modal="true"
			aria-labelledby="crop-heading"
		>
			<header class="flex items-center justify-between border-b border-white/10 pb-4">
				<button
					type="button"
					onclick={closeProfileCrop}
					disabled={profileMediaUploading}
					aria-label="Cancel image crop"
					class="grid h-10 w-10 place-items-center rounded-full text-white/65 hover:bg-white/5"
					><X size={19} /></button
				>
				<h2 id="crop-heading" class="font-display text-xl">
					{cropDraft.purpose === 'profile-avatar' ? 'Crop profile photo' : 'Crop profile banner'}
				</h2>
				<span class="w-10"></span>
			</header>
			<div
				class="community-profile-crop-preview"
				class:banner={cropDraft.purpose === 'profile-banner'}
				onpointerdown={startCropDrag}
				onpointermove={moveCropDrag}
				onpointerup={endCropDrag}
				onpointercancel={endCropDrag}
				role="application"
				aria-label="Drag image to adjust crop"
			>
				<img
					src={cropDraft.previewUrl}
					alt=""
					style={`transform: translate(${cropDraft.offsetX * 100}%, ${cropDraft.offsetY * 100}%) rotate(${cropDraft.rotation}deg) scale(${cropDraft.scale})`}
				/>
			</div>
			<div class="mx-auto mt-7 w-full max-w-sm">
				<label class="block text-xs text-white/70">
					Zoom
					<input
						type="range"
						min="1"
						max="3"
						step="0.05"
						value={cropDraft.scale}
						oninput={(event) => {
							if (cropDraft) cropDraft.scale = Number(event.currentTarget.value);
						}}
						class="mt-3 w-full accent-orange-300"
					/>
				</label>
				<div class="mt-5 flex items-center justify-center gap-3">
					<button
						type="button"
						onclick={() => {
							if (cropDraft) cropDraft.rotation = (cropDraft.rotation + 270) % 360;
						}}
						class="rounded-full border border-white/15 px-4 py-2.5 text-xs text-white/75"
						>Rotate left</button
					>
					<button
						type="button"
						onclick={() => {
							if (cropDraft) cropDraft.rotation = (cropDraft.rotation + 90) % 360;
						}}
						class="rounded-full border border-white/15 px-4 py-2.5 text-xs text-white/75"
						>Rotate right</button
					>
				</div>
			</div>
			{#if profileEditError}<p role="alert" class="mt-5 text-center text-xs text-red-200">
					{profileEditError}
				</p>{/if}
			<button
				type="button"
				onclick={applyProfileCrop}
				disabled={profileMediaUploading}
				class="mt-auto w-full rounded-full bg-orange-300 px-5 py-3.5 text-sm font-semibold text-[#17110e] disabled:opacity-50"
			>
				{profileMediaUploading ? 'Uploading…' : 'Use this photo'}
			</button>
		</div>
	{/if}
	{#if connectionsKind}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
			<dialog
				open
				aria-labelledby="connections-heading"
				class="m-0 flex max-h-[min(80vh,640px)] w-full max-w-md flex-col border border-white/10 bg-[#111211] p-0 text-white shadow-2xl"
			>
				<header class="flex items-center justify-between border-b border-white/10 px-5 py-4">
					<h2 id="connections-heading" class="font-display text-xl">
						{connectionsKind === 'followers' ? 'Followers' : 'Following'}
					</h2>
					<button
						type="button"
						onclick={() => (connectionsKind = null)}
						aria-label="Close connections"
						class="flex h-9 w-9 items-center justify-center text-white/60 hover:bg-white/5 hover:text-white"
						><X size={17} /></button
					>
				</header>
				<div class="min-h-0 flex-1 overflow-y-auto px-5 py-2">
					{#if connectionsLoading && !connections.length}<p
							class="py-8 text-center text-xs text-white/45"
						>
							Loading connections...
						</p>
					{:else if !connections.length}<p class="py-8 text-center text-xs text-white/45">
							No {connectionsKind} yet.
						</p>
					{:else}
						{#each connections as connection (connection.id)}
							<a
								href={`/u/${encodeURIComponent(connection.username)}`}
								onclick={() => (connectionsKind = null)}
								class="flex items-center gap-3 border-b border-white/[0.07] py-3 hover:bg-white/[0.025]"
							>
								<span
									class="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs text-white"
									style={connection.avatarUrl
										? undefined
										: `background:${connection.avatarColor ?? '#66744b'}`}
									>{#if connection.avatarUrl}<img
											src={connection.avatarUrl}
											alt=""
											class="h-full w-full object-cover"
										/>{:else}{connection.initials ??
											connection.displayName.slice(0, 1).toUpperCase()}{/if}</span
								>
								<span class="min-w-0"
									><span class="block truncate text-xs text-white/85">{connection.displayName}</span
									><span class="block truncate text-[10px] text-white/40"
										>@{connection.username}</span
									></span
								>
							</a>
						{/each}
					{/if}
				</div>
				{#if connectionsCursor}<footer class="border-t border-white/10 p-4 text-center">
						<button
							type="button"
							onclick={loadMoreConnections}
							disabled={connectionsLoading}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:border-orange-200/40 hover:text-orange-100 disabled:opacity-50"
							>{connectionsLoading ? 'Loading...' : 'Load more'}</button
						>
					</footer>{/if}
			</dialog>
		</div>
	{/if}

	{#if profileActionsOpen}
		<div class="fixed inset-0 z-[70] md:hidden">
			<button
				type="button"
				class="absolute inset-0 h-full w-full bg-black/70"
				onclick={() => (profileActionsOpen = false)}
				aria-label="Close profile actions"
			></button>
			<dialog
				open
				aria-modal="true"
				aria-label="Profile actions"
				class="profile-actions-sheet absolute inset-x-0 bottom-0 m-0 w-full max-w-none border border-white/10 bg-[#111211] px-5 pt-3 pb-[max(22px,env(safe-area-inset-bottom))] text-white shadow-2xl"
			>
				<div class="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20"></div>
				<div>
					<button
						type="button"
						onclick={() => {
							profileActionsOpen = false;
							shareProfile();
						}}
						class="profile-action-row"><Share2 size={17} />Share profile</button
					>
					<a href="/saved" onclick={() => (profileActionsOpen = false)} class="profile-action-row"
						><Bookmark size={17} />Saved</a
					>
					<button
						type="button"
						onclick={() => {
							profileActionsOpen = false;
							openProfileEditor();
						}}
						class="profile-action-row"><Pencil size={17} />Edit profile</button
					>
					<a href="/account" onclick={() => (profileActionsOpen = false)} class="profile-action-row"
						><Mail size={17} />Account email</a
					>
					<a
						href="/blocked-profiles"
						onclick={() => (profileActionsOpen = false)}
						class="profile-action-row"><UserRoundX size={17} />Blocked profiles</a
					>
					{#if data.communityUser?.isAdmin}
						<a href="/core" onclick={() => (profileActionsOpen = false)} class="profile-action-row"
							><ShieldCheck size={17} />Sanctyria Core</a
						>
					{/if}
					<button
						type="button"
						onclick={signOut}
						disabled={signingOut}
						class="profile-action-row border-t border-white/[0.08] text-red-200/80 disabled:opacity-50"
						><LogOut size={17} />{signingOut ? 'Signing out…' : 'Sign out'}</button
					>
				</div>
			</dialog>
		</div>
	{/if}
	{#if postOptionsPost}
		{@const selectedPost = postOptionsPost}
		<CommunityPostOptionsSheet
			post={selectedPost}
			viewerUsername={data.communityUser?.username}
			returnTo={`/u/${encodeURIComponent(data.profile.username)}`}
			onClose={() => (postOptionsPost = null)}
			onEdit={() => openProfilePostEditor(selectedPost)}
			onDelete={() => deleteProfilePost(selectedPost)}
			onToast={showToast}
		/>
	{/if}
	{#if editingPost}
		<div class="fixed inset-0 z-[90] flex items-end justify-center bg-black/75 md:hidden">
			<dialog
				open
				aria-labelledby="profile-edit-post-heading"
				class="profile-post-edit-sheet absolute inset-x-0 bottom-0 m-0 w-full max-w-none border border-white/10 bg-[#111211] px-5 pt-4 pb-[max(22px,env(safe-area-inset-bottom))] text-white shadow-2xl"
			>
				<div class="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20"></div>
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="font-mono text-[9px] tracking-[0.12em] text-orange-200/70 uppercase">
							Post settings
						</p>
						<h2 id="profile-edit-post-heading" class="mt-1 font-display text-2xl">Edit post</h2>
					</div>
					<button
						type="button"
						onclick={() => (editingPost = null)}
						aria-label="Close post editor"
						class="grid h-9 w-9 place-items-center text-white/60 hover:bg-white/5 hover:text-white"
						><X size={17} /></button
					>
				</div>
				<form onsubmit={saveProfilePost} class="mt-5 space-y-4">
					<label class="block text-xs text-white/65">
						Post text
						<textarea
							bind:value={editPostText}
							maxlength="1000"
							rows="5"
							required={editingPost.kind === 'text'}
							class="mt-1.5 w-full resize-y border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-5 text-white outline-none focus:border-orange-200/40"
						></textarea>
					</label>
					{#if editingPost.kind !== 'text'}
						<label class="block text-xs text-white/65">
							HTTPS media or resource URL
							<input
								bind:value={editPostUrl}
								type="url"
								inputmode="url"
								required
								placeholder="https://"
								class="mt-1.5 w-full border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-200/40"
							/>
						</label>
					{/if}
					{#if editPostError}
						<p
							role="alert"
							class="border border-red-300/15 bg-red-300/[0.04] px-3 py-2.5 text-xs text-red-200"
						>
							{editPostError}
						</p>
					{/if}
					<div class="flex justify-end gap-2 border-t border-white/[0.08] pt-4">
						<button
							type="button"
							onclick={() => (editingPost = null)}
							class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:text-white"
							>Cancel</button
						>
						<button
							type="submit"
							disabled={editPostSaving}
							class="bg-orange-200 px-4 py-2 text-xs font-semibold text-[#21160e] hover:bg-orange-100 disabled:opacity-50"
							>{editPostSaving ? 'Saving...' : 'Save changes'}</button
						>
					</div>
				</form>
			</dialog>
		</div>
	{/if}
	<CommunityBottomNav
		activeItem="Profile"
		profileHref={data.communityUser ? `/u/${data.communityUser.username}` : '/login'}
		user={data.communityUser}
	/>
	{#if toast}<div
			role="status"
			class="fixed right-4 bottom-20 z-50 border border-white/10 bg-[#1b1d1b] px-4 py-2.5 text-xs text-white/85 shadow-xl"
		>
			{toast}
		</div>{/if}
</div>

<style>
	.community-profile-editor-overlay {
		display: flex;
	}

	.community-profile-badge {
		display: inline-flex;
		align-items: center;
		border: 1px solid rgba(255, 215, 187, 0.2);
		border-radius: 999px;
		background: rgba(255, 215, 187, 0.04);
		padding: 4px 10px;
		color: rgba(255, 215, 187, 0.8);
		font-size: 9px;
	}

	.community-profile-badge-icon,
	.community-profile-badge[data-badge='verified'] {
		display: none;
	}

	.community-profile-crop-overlay {
		display: none;
	}

	@media (max-width: 767px) {
		.community-profile-editor-overlay {
			display: block;
			overflow-y: auto;
			background: #090a0a;
			padding: 0;
		}

		.community-profile-editor-dialog {
			position: static;
			display: block;
			width: 100%;
			max-width: none;
			max-height: none;
			min-height: 100dvh;
			margin: 0;
			border: 0;
			padding: max(18px, env(safe-area-inset-top)) 18px max(24px, env(safe-area-inset-bottom));
		}

		.community-profile-editor-dialog > header {
			position: sticky;
			z-index: 1;
			top: calc(-1 * max(18px, env(safe-area-inset-top)));
			margin: calc(-1 * max(18px, env(safe-area-inset-top))) -18px 0;
			background: #111211;
			padding: max(18px, env(safe-area-inset-top)) 18px 14px;
		}

		.community-profile-editor-dialog form > div:last-child {
			position: sticky;
			bottom: 0;
			background: #111211;
			padding-bottom: max(12px, env(safe-area-inset-bottom));
		}

		.community-profile-badge {
			display: grid;
			width: 34px;
			height: 34px;
			place-items: center;
			border-color: rgba(242, 160, 119, 0.25);
			background: rgba(242, 160, 119, 0.06);
			padding: 0;
			color: rgba(255, 215, 187, 0.88);
		}

		.community-profile-badge-icon {
			display: inline-flex;
		}

		.community-profile-badge-label {
			display: none;
		}

		.community-profile-badge[data-badge='verified'] {
			display: inline-flex;
			align-items: center;
			justify-content: center;
		}

		.community-profile-crop-overlay {
			position: fixed;
			z-index: 75;
			inset: 0;
			display: flex;
			flex-direction: column;
			background: #090a0a;
			padding: max(18px, env(safe-area-inset-top)) 20px max(22px, env(safe-area-inset-bottom));
			color: #f1efe9;
		}

		.community-profile-crop-preview {
			display: grid;
			width: min(78vw, 340px);
			aspect-ratio: 1;
			place-items: center;
			overflow: hidden;
			margin: 36px auto 0;
			border: 1px solid rgba(255, 255, 255, 0.2);
			border-radius: 50%;
			background: #171817;
			touch-action: none;
			cursor: grab;
		}

		.community-profile-crop-preview:active {
			cursor: grabbing;
		}

		.community-profile-crop-preview.banner {
			width: 100%;
			aspect-ratio: 16 / 5;
			border-radius: 12px;
		}

		.community-profile-crop-preview img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.community-profile-page {
		min-height: 100dvh;
		background-image: radial-gradient(
			ellipse at 52% -24%,
			rgba(249, 115, 22, 0.075),
			transparent 56%
		);
	}

	@media (max-width: 767px) {
		.profile-post-mobile-byline {
			color: rgba(255, 255, 255, 0.38);
			font-size: 10px;
		}

		.profile-post-community-row {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;
		}

		.profile-post-mobile-options {
			display: flex;
			flex: 0 0 auto;
			align-items: center;
			gap: 4px;
		}

		.profile-post-icon-button {
			display: grid;
			width: 36px;
			height: 36px;
			place-items: center;
			border-radius: 999px;
			color: rgba(255, 255, 255, 0.48);
		}

		.profile-post-icon-button:active {
			background: rgba(255, 255, 255, 0.07);
			color: rgba(255, 255, 255, 0.9);
		}

		.profile-post-icon-button.pinned {
			color: #f0a16c;
		}

		.profile-actions-sheet {
			border-right: 0;
			border-bottom: 0;
			border-left: 0;
			border-radius: 20px 20px 0 0;
		}

		.profile-post-edit-sheet {
			border-right: 0;
			border-bottom: 0;
			border-left: 0;
			border-radius: 20px 20px 0 0;
		}

		.community-profile-streak-card {
			display: grid;
			grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
			align-items: center;
			margin-top: 16px;
			border: 1px solid rgba(255, 255, 255, 0.09);
			border-radius: 12px;
			background: linear-gradient(110deg, rgba(239, 117, 65, 0.1), rgba(255, 255, 255, 0.025));
			padding: 12px;
		}

		.community-profile-streak-item {
			display: flex;
			align-items: center;
			gap: 9px;
		}

		.community-profile-streak-item > span:last-child {
			display: grid;
			gap: 3px;
		}

		.community-profile-streak-item small {
			color: rgba(235, 235, 227, 0.48);
			font-size: 8px;
		}

		.community-profile-streak-item strong {
			color: rgba(255, 255, 255, 0.9);
			font-size: 11px;
			font-weight: 600;
		}

		.community-profile-streak-icon {
			display: grid;
			width: 31px;
			height: 31px;
			flex: 0 0 auto;
			place-items: center;
			border: 1px solid rgba(240, 161, 108, 0.24);
			border-radius: 9px;
			background: rgba(240, 161, 108, 0.09);
			color: #f0a16c;
		}

		.community-profile-streak-icon.best {
			border-color: rgba(235, 235, 227, 0.13);
			background: rgba(255, 255, 255, 0.04);
			color: rgba(255, 255, 255, 0.7);
		}

		.community-profile-streak-divider {
			width: 1px;
			height: 31px;
			background: rgba(255, 255, 255, 0.1);
		}

		.profile-action-row {
			display: flex;
			width: 100%;
			min-height: 48px;
			align-items: center;
			gap: 12px;
			border-bottom: 1px solid rgba(255, 255, 255, 0.06);
			padding: 0 4px;
			color: rgba(255, 255, 255, 0.78);
			font-size: 13px;
			text-align: left;
		}

		.profile-action-row :global(svg) {
			color: rgba(255, 255, 255, 0.48);
		}
	}
</style>
