<script lang="ts">
	import {
		ArrowLeft,
		Camera,
		FileText,
		Image,
		Link,
		MessageCircle,
		Mic,
		MoreHorizontal,
		Music2,
		Pin,
		Plus,
		Search,
		Send,
		Smile,
		Users,
		Volume2,
		X
	} from '@lucide/svelte';
	import { invalidate } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { communityApi } from '#lib/community/communityApi.js';
	import { uploadCommunityMedia } from '#lib/community/communityMedia.js';
	import { subscribeCommunityRealtime } from '#lib/community/communityRealtime.js';
	import CommunityAudioPlayer from '#lib/community/components/CommunityAudioPlayer.svelte';
	import type { PageProps } from './$types';

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

	let { data }: PageProps = $props();
	let messages = $derived<ChatMessage[]>([...data.messages]);
	let body = $state('');
	let mediaUrl = $state('');
	let mediaKind = $state<'image_url' | 'audio_url' | ''>('');
	let replyTo = $state<ChatMessage | null>(null);
	let sending = $state(false);
	let uploading = $state(false);
	let savingNotifications = $state(false);
	let attachmentMenuOpen = $state(false);
	let emojiPickerOpen = $state(false);
	let communityInfoOpen = $state(false);
	let messageSearchQuery = $state('');
	let searchResults = $state<ChatMessage[] | null>(null);
	let searching = $state(false);
	let recording = $state(false);
	let recordingSeconds = $state(0);
	let voiceRecorder: MediaRecorder | null = null;
	let voiceStream: MediaStream | null = null;
	let voiceChunks: Blob[] = [];
	let recordingTimer: ReturnType<typeof setInterval> | null = null;
	let notificationsEnabled = $derived(data.community.chatNotificationsEnabled);
	let errorMessage = $state('');
	const canModerate = $derived(
		data.community.viewerRole === 'owner' || data.community.viewerRole === 'moderator'
	);

	onMount(() =>
		subscribeCommunityRealtime(() => {
			void invalidate('app:community-chat');
		})
	);
	onDestroy(() => {
		if (recordingTimer) clearInterval(recordingTimer);
		if (voiceRecorder && voiceRecorder.state !== 'inactive') {
			voiceRecorder.onstop = null;
			voiceRecorder.stop();
		}
		voiceStream?.getTracks().forEach((track) => track.stop());
	});

	async function uploadChatMedia(event: Event, kind: 'image' | 'audio') {
		const input = event.currentTarget;
		if (!(input instanceof HTMLInputElement) || !input.files?.[0]) return;
		await uploadChatFile(input.files[0], kind);
		input.value = '';
	}

	async function uploadChatFile(file: File, kind: 'image' | 'audio') {
		uploading = true;
		errorMessage = '';
		try {
			mediaUrl = await uploadCommunityMedia(file, kind === 'image' ? 'chat-image' : 'chat-audio', {
				communitySlug: data.community.slug
			});
			mediaKind = kind === 'image' ? 'image_url' : 'audio_url';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not upload this file.';
		} finally {
			uploading = false;
		}
	}

	async function toggleVoiceRecording() {
		if (recording && voiceRecorder) {
			voiceRecorder.stop();
			recording = false;
			if (recordingTimer) clearInterval(recordingTimer);
			recordingTimer = null;
			return;
		}
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
			errorMessage = 'Voice recording is not supported in this browser.';
			return;
		}
		const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(
			(candidate) => MediaRecorder.isTypeSupported(candidate)
		);
		if (!mimeType) {
			errorMessage = 'This browser cannot record a supported audio format.';
			return;
		}
		try {
			voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			voiceChunks = [];
			voiceRecorder = new MediaRecorder(voiceStream, { mimeType });
			voiceRecorder.ondataavailable = (event) => {
				if (event.data.size) voiceChunks.push(event.data);
			};
			voiceRecorder.onstop = () => {
				voiceStream?.getTracks().forEach((track) => track.stop());
				voiceStream = null;
				voiceRecorder = null;
				recording = false;
				if (recordingTimer) clearInterval(recordingTimer);
				recordingTimer = null;
				const blob = new Blob(voiceChunks, { type: mimeType });
				voiceChunks = [];
				if (!blob.size) {
					errorMessage = 'No audio was recorded. Try again.';
					return;
				}
				const extension = mimeType.includes('ogg')
					? 'ogg'
					: mimeType.includes('mp4')
						? 'm4a'
						: 'webm';
				void uploadChatFile(
					new File([blob], `voice-message-${Date.now()}.${extension}`, { type: mimeType }),
					'audio'
				);
			};
			voiceRecorder.start();
			recording = true;
			recordingSeconds = 0;
			recordingTimer = setInterval(() => recordingSeconds++, 1000);
			errorMessage = '';
		} catch (error) {
			voiceStream?.getTracks().forEach((track) => track.stop());
			voiceStream = null;
			errorMessage =
				error instanceof Error ? error.message : 'Microphone access was not available.';
		}
	}

	function addEmoji(emoji: string) {
		body += emoji;
		emojiPickerOpen = false;
	}

	async function sendMessage(event: SubmitEvent) {
		event.preventDefault();
		const messageText = body.trim();
		if ((!messageText && !mediaUrl) || sending || uploading) return;
		sending = true;
		errorMessage = '';
		try {
			const result = await communityApi<{ message: ChatMessage }>(
				fetch,
				`communities/${encodeURIComponent(data.community.slug)}/chat/messages`,
				{
					method: 'POST',
					body: JSON.stringify({
						body: messageText,
						...(mediaUrl ? { mediaUrl, mediaKind } : {}),
						...(replyTo ? { replyToId: replyTo.id } : {})
					})
				}
			);
			if (result.message) messages = [...messages, result.message];
			body = '';
			mediaUrl = '';
			mediaKind = '';
			replyTo = null;
			await invalidate('app:community-chat');
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not send this message.';
		} finally {
			sending = false;
		}
	}

	async function react(message: ChatMessage) {
		const reaction = message.reactions.find((item) => item.emoji === '🔥');
		try {
			await communityApi(
				fetch,
				`communities/${encodeURIComponent(data.community.slug)}/chat/messages/${encodeURIComponent(message.id)}/reactions${reaction?.reacted ? '?emoji=%F0%9F%94%A5' : ''}`,
				{
					method: reaction?.reacted ? 'DELETE' : 'POST',
					...(reaction?.reacted ? {} : { body: JSON.stringify({ emoji: '🔥' }) })
				}
			);
			await invalidate('app:community-chat');
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not react to this message.';
		}
	}

	async function togglePin(message: ChatMessage) {
		try {
			await communityApi(
				fetch,
				`communities/${encodeURIComponent(data.community.slug)}/chat/messages/${encodeURIComponent(message.id)}/pin`,
				{ method: 'PATCH', body: JSON.stringify({ pinned: !message.isPinned }) }
			);
			await invalidate('app:community-chat');
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not update pinned message.';
		}
	}

	async function toggleNotifications() {
		if (savingNotifications) return;
		savingNotifications = true;
		const previous = notificationsEnabled;
		notificationsEnabled = !previous;
		try {
			await communityApi(
				fetch,
				`communities/${encodeURIComponent(data.community.slug)}/chat/notifications`,
				{
					method: 'PATCH',
					body: JSON.stringify({ chatNotificationsEnabled: notificationsEnabled })
				}
			);
		} catch (error) {
			notificationsEnabled = previous;
			errorMessage =
				error instanceof Error ? error.message : 'Could not update chat notifications.';
		} finally {
			savingNotifications = false;
		}
	}

	function messageTime(value: string): string {
		return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
	}

	function messageLinks() {
		return messages.flatMap((message) => {
			const matches = message.body.match(/https?:\/\/\S+/g) ?? [];
			return matches.map((url) => ({ id: message.id, author: message.author.displayName, url }));
		});
	}

	async function searchConversation(event: SubmitEvent) {
		event.preventDefault();
		const query = messageSearchQuery.trim();
		if (!query || searching) return;
		searching = true;
		errorMessage = '';
		try {
			const result = await communityApi<{ items: ChatMessage[] }>(
				fetch,
				`communities/${encodeURIComponent(data.community.slug)}/chat/messages?limit=20&search=${encodeURIComponent(query)}`
			);
			searchResults = result.items;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not search this conversation.';
		} finally {
			searching = false;
		}
	}
</script>

<svelte:head
	><title>{data.community.name} chat | Sanctyria Community</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>

<main
	class="mx-auto flex h-[100dvh] w-full max-w-3xl flex-col px-3 text-[#f1efe9] sm:px-6 md:h-[calc(100dvh-62px)]"
>
	<header class="flex shrink-0 items-center gap-3 border-b border-white/[0.08] py-3">
		<a
			href="/chats"
			aria-label="Back to chats"
			class="grid h-9 w-9 place-items-center rounded-full text-white/60 hover:bg-white/5"
			><ArrowLeft size={18} /></a
		>
		<a
			href={`/r/${encodeURIComponent(data.community.slug)}`}
			class="flex min-w-0 flex-1 items-center gap-3"
		>
			<span
				class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04] text-orange-200"
				>{#if data.community.avatarUrl}<img
						src={data.community.avatarUrl}
						alt=""
						class="h-full w-full object-cover"
					/>{:else}<MessageCircle size={16} />{/if}</span
			>
			<span class="min-w-0"
				><strong class="block truncate text-sm font-medium text-white">{data.community.name}</strong
				><small class="block text-[10px] text-white/40"
					>{data.community.memberCount} members · Community chat</small
				></span
			>
		</a>
		<button
			type="button"
			disabled={savingNotifications}
			onclick={toggleNotifications}
			aria-pressed={notificationsEnabled}
			aria-label={notificationsEnabled ? 'Mute chat notifications' : 'Enable chat notifications'}
			class={`hidden h-9 w-9 place-items-center rounded-full border border-white/10 md:grid ${notificationsEnabled ? 'text-orange-200' : 'text-white/40'}`}
			><Volume2 size={16} /></button
		>
		<button
			type="button"
			onclick={() => (communityInfoOpen = true)}
			aria-label="Community chat details"
			class="grid h-9 w-9 place-items-center rounded-full text-white/65 md:hidden"
			><MoreHorizontal size={19} /></button
		>
	</header>
	<section
		class="min-h-0 flex-1 overflow-y-auto py-4"
		aria-label={`${data.community.name} chat messages`}
	>
		{#if messages.length}
			<div class="space-y-5">
				{#each messages as message (message.id)}
					<article
						id={`chat-message-${message.id}`}
						class={`flex gap-2.5 ${message.author.username === (data.communityUser?.username ?? '') ? 'flex-row-reverse' : ''}`}
					>
						<a
							href={`/u/${encodeURIComponent(message.author.username)}`}
							aria-label={`View ${message.author.displayName}'s profile`}
							class="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 text-[10px] text-white"
							style={message.author.avatarUrl
								? undefined
								: `background:${message.author.avatarColor ?? '#476259'}`}
						>
							{#if message.author.avatarUrl}<img
									src={message.author.avatarUrl}
									alt=""
									class="h-full w-full object-cover"
								/>{:else}{message.author.initials ??
									message.author.displayName.slice(0, 1).toUpperCase()}{/if}
						</a>
						<div
							class={`max-w-[85%] min-w-0 ${message.author.username === (data.communityUser?.username ?? '') ? 'text-right' : ''}`}
						>
							<div class="mb-1 flex flex-wrap items-center gap-2 text-[10px]">
								<strong class="text-white/75">{message.author.displayName}</strong><time
									class="text-white/35">{messageTime(message.createdAt)}</time
								>
								{#if message.isPinned}<span class="text-orange-200"><Pin size={11} /></span>{/if}
							</div>
							<div
								class={`rounded-2xl px-3.5 py-2.5 text-left ${message.author.username === (data.communityUser?.username ?? '') ? 'rounded-tr-sm bg-orange-300/15 text-white/90' : 'rounded-tl-sm bg-white/[0.06] text-white/80'}`}
							>
								{#if message.replyToBody}<p
										class="mb-2 border-l-2 border-orange-200/50 pl-2 text-[10px] text-white/45"
									>
										Replying to {message.replyToAuthorName ?? 'member'}: {message.replyToBody}
									</p>{/if}
								{#if message.body}<p class="text-xs leading-5 break-words whitespace-pre-wrap">
										{message.body}
									</p>{/if}
								{#if message.mediaKind === 'image_url' && message.mediaUrl}<a
										href={message.mediaUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="mt-2 block overflow-hidden rounded-xl"
										><img
											src={message.mediaUrl}
											alt="Shared in chat"
											loading="lazy"
											class="max-h-72 w-full object-cover"
										/></a
									>{/if}
								{#if message.mediaKind === 'audio_url' && message.mediaUrl}<div class="mt-2">
										<CommunityAudioPlayer src={message.mediaUrl} title="Voice message" />
									</div>{/if}
							</div>
							<div
								class={`mt-1 flex items-center gap-3 ${message.author.username === (data.communityUser?.username ?? '') ? 'justify-end' : ''}`}
							>
								{#each message.reactions as item (item.emoji)}<button
										type="button"
										onclick={() => react(message)}
										aria-pressed={item.reacted}
										class={`rounded-full border px-2 py-1 text-[10px] ${item.reacted ? 'border-orange-200/30 text-orange-100' : 'border-white/10 text-white/50'}`}
										>{item.emoji} {item.count}</button
									>{/each}
								{#if !message.reactions.some((item) => item.emoji === '🔥')}<button
										type="button"
										onclick={() => react(message)}
										aria-label="React with fire"
										class="text-white/35 hover:text-orange-200"><Smile size={13} /></button
									>{/if}
								<button
									type="button"
									onclick={() => (replyTo = message)}
									class="text-[9px] text-white/35 hover:text-white/70">Reply</button
								>
								{#if canModerate}<button
										type="button"
										onclick={() => togglePin(message)}
										aria-label={message.isPinned ? 'Unpin message' : 'Pin message'}
										class="text-white/35 hover:text-orange-200"><Pin size={12} /></button
									>{/if}
							</div>
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="grid h-full place-items-center text-center">
				<div>
					<MessageCircle size={22} class="mx-auto text-orange-200/60" />
					<h2 class="mt-3 font-display text-2xl">Start the conversation</h2>
					<p class="mt-2 text-xs text-white/45">Say hello to your community.</p>
				</div>
			</div>
		{/if}
	</section>
	{#if errorMessage}<p role="alert" class="mb-2 text-xs text-red-200">{errorMessage}</p>{/if}
	{#if replyTo}<div
			class="flex items-center justify-between rounded-t-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] text-white/65"
		>
			<span class="truncate"
				>Replying to {replyTo.author.displayName}: {replyTo.body || 'media'}</span
			><button
				type="button"
				onclick={() => (replyTo = null)}
				aria-label="Cancel reply"
				class="px-2 text-white/50">×</button
			>
		</div>{/if}
	{#if mediaUrl}<div
			class="flex items-center justify-between border-x border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] text-emerald-200/80"
		>
			<span class="truncate"
				>Media ready to send ({mediaKind === 'image_url' ? 'image' : 'audio'})</span
			><button
				type="button"
				onclick={() => {
					mediaUrl = '';
					mediaKind = '';
				}}
				class="px-2">Remove</button
			>
		</div>{/if}
	<form
		onsubmit={sendMessage}
		class="chat-message-composer shrink-0 border border-white/10 bg-[#111211] p-2.5"
	>
		{#if emojiPickerOpen}
			<div class="chat-emoji-picker md:hidden" aria-label="Emoji picker">
				{#each ['🔥', '❤️', '😂', '👏', '✨', '🙏'] as emoji (emoji)}
					<button type="button" onclick={() => addEmoji(emoji)} aria-label={`Add ${emoji}`}
						>{emoji}</button
					>
				{/each}
			</div>
		{/if}
		{#if attachmentMenuOpen}
			<div class="chat-attachment-menu md:hidden">
				<label title="Choose image">
					<Image size={16} /> Image
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						class="sr-only"
						onchange={(event) => uploadChatMedia(event, 'image')}
						disabled={uploading}
					/>
				</label>
				<label title="Choose audio">
					<Music2 size={16} /> Audio
					<input
						type="file"
						accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/aac"
						class="sr-only"
						onchange={(event) => uploadChatMedia(event, 'audio')}
						disabled={uploading}
					/>
				</label>
			</div>
		{/if}
		<textarea
			bind:value={body}
			rows="2"
			maxlength="1000"
			aria-label="Chat message"
			placeholder="Message your community…"
			class="w-full resize-none bg-transparent px-2 py-1 text-sm text-white outline-none placeholder:text-white/35"
		></textarea>
		<div
			class="chat-composer-toolbar flex items-center justify-between gap-2 border-t border-white/[0.07] pt-2"
		>
			<div class="chat-mobile-controls md:hidden">
				<button
					type="button"
					onclick={() => {
						attachmentMenuOpen = !attachmentMenuOpen;
						emojiPickerOpen = false;
					}}
					aria-label="Add attachment"
					class="chat-control-button"><Plus size={19} /></button
				>
				<button
					type="button"
					onclick={() => {
						emojiPickerOpen = !emojiPickerOpen;
						attachmentMenuOpen = false;
					}}
					aria-label="Choose emoji"
					class="chat-control-button"><Smile size={19} /></button
				>
				<label title="Take or choose photo" class="chat-control-button">
					<Camera size={18} />
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						capture="environment"
						class="sr-only"
						onchange={(event) => uploadChatMedia(event, 'image')}
						disabled={uploading}
					/>
				</label>
				<button
					type="button"
					onclick={toggleVoiceRecording}
					aria-label={recording ? 'Stop voice recording' : 'Record voice message'}
					aria-pressed={recording}
					class:recording
					class="chat-control-button"><Mic size={18} /></button
				>
				{#if recording}<span class="chat-recording-time"
						>{Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(
							2,
							'0'
						)}</span
					>{/if}
				{#if uploading}<span class="text-[10px] text-orange-200/70">Uploading…</span>{/if}
			</div>
			<div class="chat-desktop-controls hidden items-center gap-1 md:flex">
				<label
					title="Upload image"
					class="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-white/45 hover:bg-white/5 hover:text-orange-100"
					><Image size={16} /><input
						type="file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						class="sr-only"
						onchange={(event) => uploadChatMedia(event, 'image')}
						disabled={uploading}
					/></label
				>
				<label
					title="Upload audio"
					class="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-white/45 hover:bg-white/5 hover:text-orange-100"
					><Music2 size={16} /><input
						type="file"
						accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/aac"
						class="sr-only"
						onchange={(event) => uploadChatMedia(event, 'audio')}
						disabled={uploading}
					/></label
				>
				{#if uploading}<span class="text-[10px] text-orange-200/70">Uploading…</span>{/if}
			</div>
			<button
				type="submit"
				disabled={sending || uploading || (!body.trim() && !mediaUrl)}
				aria-label={sending ? 'Sending message' : 'Send message'}
				class="inline-flex items-center gap-2 rounded-full bg-[#ed6a36] px-4 py-2.5 text-xs font-medium text-[#1a100b] disabled:opacity-40"
				>{sending ? 'Sending…' : 'Send'} <Send size={13} /></button
			>
		</div>
	</form>
</main>

{#if communityInfoOpen}
	<div class="fixed inset-0 z-[70] md:hidden">
		<button
			type="button"
			class="absolute inset-0 h-full w-full bg-black/70"
			onclick={() => (communityInfoOpen = false)}
			aria-label="Close chat details"
		></button>
		<dialog
			open
			aria-modal="true"
			aria-labelledby="chat-details-heading"
			class="chat-details-sheet absolute inset-x-0 bottom-0 m-0 max-h-[88dvh] w-full max-w-none overflow-y-auto border border-white/10 bg-[#111211] px-5 pt-3 pb-[max(22px,env(safe-area-inset-bottom))] text-white shadow-2xl"
		>
			<div class="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20"></div>
			<header class="flex items-center justify-between border-b border-white/[0.08] pb-3">
				<div class="flex min-w-0 items-center gap-3">
					<span
						class="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.04] text-orange-200"
					>
						{#if data.community.avatarUrl}<img
								src={data.community.avatarUrl}
								alt=""
								class="h-full w-full object-cover"
							/>{:else}<MessageCircle size={18} />{/if}
					</span>
					<div class="min-w-0">
						<h2 id="chat-details-heading" class="truncate font-display text-xl">
							{data.community.name}
						</h2>
						<p class="text-[10px] text-white/40">{data.community.memberCount} members</p>
					</div>
				</div>
				<button
					type="button"
					onclick={() => (communityInfoOpen = false)}
					aria-label="Close chat details"
					class="grid h-9 w-9 place-items-center rounded-full text-white/55 hover:bg-white/5"
					><X size={18} /></button
				>
			</header>
			<form
				onsubmit={searchConversation}
				class="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2"
			>
				<Search size={15} class="shrink-0 text-white/40" />
				<input
					bind:value={messageSearchQuery}
					oninput={() => (searchResults = null)}
					aria-label="Search this conversation"
					placeholder="Search this conversation"
					class="min-w-0 flex-1 bg-transparent py-1 text-xs text-white outline-none placeholder:text-white/35"
				/>
				<button
					type="submit"
					disabled={searching || !messageSearchQuery.trim()}
					class="text-[10px] text-orange-100/80 disabled:opacity-40"
					>{searching ? 'Searching…' : 'Search'}</button
				>
			</form>
			{#if messageSearchQuery.trim()}
				<div class="mt-2 divide-y divide-white/[0.07]">
					{#if searchResults === null && !searching}
						<p class="py-4 text-xs text-white/45">Enter a phrase and tap Search.</p>
					{:else if searchResults?.length === 0}
						<p class="py-4 text-xs text-white/45">No matching messages found.</p>
					{:else}
						{#each searchResults ?? [] as match (match.id)}
							<button
								type="button"
								onclick={() => {
									communityInfoOpen = false;
									document.getElementById(`chat-message-${match.id}`)?.scrollIntoView({
										behavior: 'smooth',
										block: 'center'
									});
								}}
								class="block w-full py-3 text-left"
							>
								<span class="block text-[10px] text-white/45">{match.author.displayName}</span>
								<span class="mt-1 line-clamp-2 block text-xs leading-5 text-white/75"
									>{match.body || 'Shared media'}</span
								>
							</button>
						{/each}
					{/if}
				</div>
			{:else}
				<section class="mt-5">
					<h3 class="flex items-center gap-2 text-xs font-medium text-white/75">
						<Image size={14} /> Shared media
					</h3>
					{#if messages.some((message) => message.mediaUrl)}
						<div class="mt-2 grid grid-cols-3 gap-2">
							{#each messages
								.filter((message) => message.mediaUrl)
								.slice(0, 6) as shared (shared.id)}
								<a
									href={shared.mediaUrl ?? '#'}
									target="_blank"
									rel="noopener noreferrer"
									class="grid aspect-square place-items-center overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] text-orange-100"
									aria-label={`Open ${shared.mediaKind === 'audio_url' ? 'audio' : 'image'} shared by ${shared.author.displayName}`}
								>
									{#if shared.mediaKind === 'image_url' && shared.mediaUrl}<img
											src={shared.mediaUrl}
											alt=""
											class="h-full w-full object-cover"
										/>{:else}<Music2 size={20} />{/if}
								</a>
							{/each}
						</div>
					{:else}
						<p class="mt-2 text-[11px] text-white/40">No shared media yet.</p>
					{/if}
				</section>
				<section class="mt-5 border-t border-white/[0.08] pt-4">
					<h3 class="flex items-center gap-2 text-xs font-medium text-white/75">
						<Link size={14} /> Shared links
					</h3>
					{#if messageLinks().length}
						<div class="mt-2 divide-y divide-white/[0.07]">
							{#each messageLinks().slice(0, 5) as sharedLink (`${sharedLink.id}:${sharedLink.url}`)}
								<a
									href={sharedLink.url}
									target="_blank"
									rel="noopener noreferrer"
									class="block truncate py-3 text-xs text-orange-100/80"
									>{sharedLink.url}<span class="ml-2 text-[10px] text-white/35"
										>by {sharedLink.author}</span
									></a
								>
							{/each}
						</div>
					{:else}
						<p class="mt-2 text-[11px] text-white/40">No links shared yet.</p>
					{/if}
				</section>
				<section class="mt-4 border-t border-white/[0.08] pt-4">
					<a
						href={`/r/${encodeURIComponent(data.community.slug)}`}
						onclick={() => (communityInfoOpen = false)}
						class="flex items-center justify-between py-2 text-xs text-white/75"
					>
						<span class="flex items-center gap-2"><Users size={15} />Community members</span>
						<span class="text-white/45">{data.community.memberCount} ›</span>
					</a>
					<button
						type="button"
						onclick={toggleNotifications}
						aria-pressed={notificationsEnabled}
						disabled={savingNotifications}
						class="flex w-full items-center justify-between border-t border-white/[0.08] py-3 text-xs text-white/75"
					>
						<span class="flex items-center gap-2"><Volume2 size={15} />Chat notifications</span>
						<span class="text-orange-100/75">{notificationsEnabled ? 'On' : 'Off'}</span>
					</button>
					<a
						href={`/r/${encodeURIComponent(data.community.slug)}`}
						onclick={() => (communityInfoOpen = false)}
						class="flex items-center gap-2 border-t border-white/[0.08] py-3 text-xs text-white/75"
						><FileText size={15} />View community</a
					>
				</section>
			{/if}
			{#if errorMessage}<p role="alert" class="mt-3 text-xs text-red-200">{errorMessage}</p>{/if}
		</dialog>
	</div>
{/if}

<style>
	@media (max-width: 767px) {
		.chat-details-sheet {
			border-right: 0;
			border-bottom: 0;
			border-left: 0;
			border-radius: 20px 20px 0 0;
		}

		.chat-message-composer {
			display: grid;
			grid-template-columns: 36px minmax(0, 1fr) 32px 32px 32px 40px;
			align-items: center;
			gap: 3px;
			border: 0;
			border-radius: 0;
			background: #0c0d0c;
			padding: 8px 12px max(8px, env(safe-area-inset-bottom));
		}

		.chat-message-composer textarea {
			grid-column: 2;
			grid-row: 1;
			min-height: 42px;
			max-height: 112px;
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.04);
			padding: 9px 13px;
		}

		.chat-composer-toolbar {
			display: contents;
		}

		.chat-mobile-controls {
			display: contents;
		}

		.chat-mobile-controls > :nth-child(1) {
			grid-column: 1;
			grid-row: 1;
		}

		.chat-mobile-controls > :nth-child(2) {
			grid-column: 3;
			grid-row: 1;
		}

		.chat-mobile-controls > :nth-child(3) {
			grid-column: 4;
			grid-row: 1;
		}

		.chat-mobile-controls > :nth-child(4) {
			grid-column: 5;
			grid-row: 1;
		}

		.chat-message-composer button[type='submit'] {
			grid-column: 6;
			grid-row: 1;
			width: 40px;
			height: 40px;
			justify-content: center;
			padding: 0;
			font-size: 0;
		}

		.chat-message-composer button[type='submit'] :global(svg) {
			width: 15px;
			height: 15px;
		}

		.chat-control-button {
			display: grid;
			width: 32px;
			height: 36px;
			flex: 0 0 auto;
			place-items: center;
			border-radius: 50%;
			color: rgba(255, 255, 255, 0.6);
		}

		.chat-control-button:active,
		.chat-control-button.recording {
			background: rgba(237, 106, 54, 0.18);
			color: #ffb58c;
		}

		.chat-control-button.recording {
			animation: chat-record-pulse 1.2s ease-in-out infinite;
		}

		.chat-recording-time {
			min-width: 31px;
			color: #ffb58c;
			font-size: 9px;
			font-variant-numeric: tabular-nums;
		}

		.chat-attachment-menu,
		.chat-emoji-picker {
			grid-column: 1 / -1;
			grid-row: 2;
			display: flex;
			gap: 8px;
			padding: 6px 0 11px;
		}

		.chat-attachment-menu label,
		.chat-emoji-picker button {
			display: inline-flex;
			min-height: 36px;
			align-items: center;
			justify-content: center;
			gap: 7px;
			border: 1px solid rgba(255, 255, 255, 0.1);
			border-radius: 999px;
			padding: 0 12px;
			color: rgba(255, 255, 255, 0.72);
			font-size: 11px;
		}

		@keyframes chat-record-pulse {
			50% {
				box-shadow: 0 0 0 5px rgba(237, 106, 54, 0.12);
			}
		}
	}
</style>
