<script lang="ts">
	import { communityApi } from '#lib/community/communityApi.js';
	import CommunityMobileSubheader from '#lib/community/components/CommunityMobileSubheader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let settings = $derived<Record<string, boolean>>({ ...data.settings });
	let savingKey = $state<string | null>(null);
	let errorMessage = $state('');
	const options: { key: string; title: string; detail: string }[] = [
		{
			key: 'communityPosts',
			title: 'Community posts',
			detail: 'New posts in communities you joined.'
		},
		{ key: 'followingPosts', title: 'Following', detail: 'Posts by people you follow.' },
		{ key: 'replies', title: 'Replies', detail: 'Replies to your posts and conversations.' },
		{ key: 'mentions', title: 'Mentions', detail: 'When someone mentions you.' },
		{ key: 'likes', title: 'Likes', detail: 'Reactions to your posts.' },
		{ key: 'follows', title: 'New followers', detail: 'When someone follows your profile.' },
		{
			key: 'communityUpdates',
			title: 'Community updates',
			detail: 'Membership and moderation updates.'
		}
	];

	async function toggle(key: string) {
		if (savingKey) return;
		const previous = { ...settings };
		settings = { ...settings, [key]: !settings[key] };
		savingKey = key;
		errorMessage = '';
		try {
			const result = await communityApi<{ settings: typeof settings }>(
				fetch,
				'me/notification-settings',
				{ method: 'PATCH', body: JSON.stringify(settings) }
			);
			settings = result.settings;
		} catch (error) {
			settings = previous;
			errorMessage = error instanceof Error ? error.message : 'Could not save this setting.';
		} finally {
			savingKey = null;
		}
	}
</script>

<svelte:head
	><title>Notification settings | Sanctyria Community</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>

<main
	class="mx-auto min-h-[calc(100dvh-62px)] w-full max-w-3xl px-4 pt-7 pb-28 text-[#f1efe9] max-md:pt-0 sm:px-8"
>
	<CommunityMobileSubheader title="Notification settings" backHref="/notifications" />
	<a href="/notifications" class="text-xs text-white/55 hover:text-white max-md:hidden"
		>← <span>Notification settings</span></a
	>
	<p class="mt-8 text-sm text-white/55">Choose which activity you want to hear about.</p>
	<div class="mt-5 space-y-3">
		{#each options as option (option.key)}
			<label
				class="flex min-h-[88px] items-center justify-between gap-5 rounded-2xl border border-white/10 bg-[#111211] px-5 py-4"
			>
				<span class="min-w-0"
					><span class="block text-sm font-semibold text-white/90">{option.title}</span><span
						class="mt-1 block text-xs leading-5 text-white/50">{option.detail}</span
					></span
				>
				<input
					type="checkbox"
					checked={settings[option.key] ?? true}
					disabled={savingKey !== null}
					onchange={() => toggle(option.key)}
					aria-label={`Enable ${option.title} notifications`}
					class="notification-setting-checkbox h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full border border-white/15 bg-white/10 transition-colors checked:border-orange-400/40 checked:bg-orange-600"
				/>
				<span class="notification-toggle" aria-hidden="true"></span>
			</label>
		{/each}
	</div>
	<a
		href="/blocked-profiles"
		class="mt-6 flex items-center justify-between border-t border-white/10 py-5 text-sm text-white/75"
	>
		<span
			><strong class="block font-medium">Blocked profiles</strong><small
				class="mt-1 block text-xs text-white/45">Review or unblock profiles.</small
			></span
		><span class="text-lg text-orange-200">›</span>
	</a>
	{#if errorMessage}<p role="alert" class="text-sm text-red-200">{errorMessage}</p>{/if}
</main>

<style>
	.notification-toggle {
		display: none;
	}

	@media (max-width: 767px) {
		.notification-setting-checkbox {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
			clip-path: inset(50%);
		}

		.notification-toggle {
			position: relative;
			width: 48px;
			height: 28px;
			flex: 0 0 auto;
			border: 1px solid rgba(255, 255, 255, 0.16);
			border-radius: 999px;
			background: rgba(255, 255, 255, 0.1);
			transition:
				background 160ms ease,
				border-color 160ms ease;
			display: block;
		}

		.notification-toggle::after {
			position: absolute;
			top: 3px;
			left: 3px;
			width: 20px;
			height: 20px;
			border-radius: 50%;
			background: #f1efe9;
			content: '';
			transition:
				background 160ms ease,
				transform 160ms ease;
		}

		input:checked + .notification-toggle {
			border-color: rgba(237, 106, 54, 0.5);
			background: #c95527;
		}

		input:checked + .notification-toggle::after {
			background: white;
			transform: translateX(20px);
		}

		input:focus-visible + .notification-toggle {
			outline: 2px solid #f2a077;
			outline-offset: 3px;
		}

		input:disabled + .notification-toggle {
			opacity: 0.55;
		}
	}
</style>
