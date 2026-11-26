<script lang="ts">
	import { communityApi } from '#lib/community/communityApi.js';
	import CommunityMobileSubheader from '#lib/community/components/CommunityMobileSubheader.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let removedUsernames = $state<string[]>([]);
	const profiles = $derived(
		data.profiles.filter((profile) => !removedUsernames.includes(profile.username))
	);
	let errorMessage = $state('');
	let savingUsername = $state<string | null>(null);

	async function unblock(username: string) {
		savingUsername = username;
		errorMessage = '';
		try {
			await communityApi(fetch, `profiles/${encodeURIComponent(username)}/block`, {
				method: 'DELETE'
			});
			removedUsernames = [...removedUsernames, username];
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not unblock this profile.';
		} finally {
			savingUsername = null;
		}
	}
</script>

<svelte:head
	><title>Blocked profiles | Sanctyria Community</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>

<main
	class="mx-auto min-h-[calc(100dvh-62px)] w-full max-w-3xl px-4 pt-7 pb-28 text-[#f1efe9] max-md:pt-0 sm:px-8"
>
	<CommunityMobileSubheader title="Blocked profiles" backHref="/notification-settings" />
	<a href="/notification-settings" class="text-xs text-white/55 hover:text-white max-md:hidden"
		>← <span>Blocked profiles</span></a
	>
	{#if profiles.length}
		<ul class="mt-6 divide-y divide-white/[0.08]">
			{#each profiles as profile (profile.username)}
				<li class="flex items-center gap-3 py-4">
					<span
						class="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 text-sm text-white"
						style={profile.avatarUrl ? undefined : `background:${profile.avatarColor ?? '#476259'}`}
					>
						{#if profile.avatarUrl}<img
								src={profile.avatarUrl}
								alt=""
								class="h-full w-full object-cover"
							/>{:else}{profile.initials ?? profile.displayName.slice(0, 2).toUpperCase()}{/if}
					</span>
					<a href={`/u/${encodeURIComponent(profile.username)}`} class="min-w-0 flex-1">
						<strong class="block truncate text-sm font-medium">{profile.displayName}</strong>
						<span class="mt-1 block text-xs text-white/45">@{profile.username}</span>
					</a>
					<button
						type="button"
						disabled={savingUsername !== null}
						onclick={() => unblock(profile.username)}
						class="px-2 py-2 text-sm text-orange-200 disabled:opacity-50"
						>{savingUsername === profile.username ? 'Saving…' : 'Unblock'}</button
					>
				</li>
			{/each}
		</ul>
	{:else}
		<div class="py-16 text-center">
			<h1 class="font-display text-3xl">No blocked profiles</h1>
			<p class="mt-2 text-sm text-white/45">Profiles you block will appear here.</p>
		</div>
	{/if}
	{#if errorMessage}<p role="alert" class="mt-5 text-sm text-red-200">{errorMessage}</p>{/if}
</main>
