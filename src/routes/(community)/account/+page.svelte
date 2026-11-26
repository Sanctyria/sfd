<script lang="ts">
	import { onMount } from 'svelte';
	import { communityApi } from '#lib/community/communityApi.js';
	import CommunityMobileSubheader from '#lib/community/components/CommunityMobileSubheader.svelte';

	let email = $state('');
	let code = $state('');
	let verified = $state(false);
	let loading = $state(true);
	let saving = $state(false);
	let errorMessage = $state('');
	let notice = $state('');

	onMount(async () => {
		try {
			const status = await communityApi<{ email: string | null; verified: boolean }>(
				fetch,
				'me/email'
			);
			email = status.email ?? '';
			verified = status.verified;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not load account email.';
		} finally {
			loading = false;
		}
	});

	async function run(action: () => Promise<void>, success: string) {
		saving = true;
		errorMessage = '';
		notice = '';
		try {
			await action();
			notice = success;
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not complete the request.';
		} finally {
			saving = false;
		}
	}

	function saveEmail(event: SubmitEvent) {
		event.preventDefault();
		return run(
			() =>
				communityApi(fetch, 'me/email', {
					method: 'PUT',
					body: JSON.stringify({ email: email.trim().toLowerCase() })
				}),
			'Verification code sent. Check your inbox.'
		);
	}

	function verifyEmail(event: SubmitEvent) {
		event.preventDefault();
		return run(async () => {
			await communityApi(fetch, 'auth/email/verify', {
				method: 'POST',
				body: JSON.stringify({ code: code.trim() })
			});
			verified = true;
			code = '';
		}, 'Email verified.');
	}

	function resendCode() {
		return run(
			() => communityApi(fetch, 'me/email/verify/resend', { method: 'POST' }),
			'A new verification code was sent.'
		);
	}
</script>

<svelte:head
	><title>Account email | Sanctyria Community</title><meta
		name="robots"
		content="noindex, nofollow"
	/></svelte:head
>

<main
	class="mx-auto min-h-[calc(100dvh-62px)] w-full max-w-xl px-5 pt-7 pb-24 text-[#f1efe9] max-md:pt-0 sm:px-8"
>
	<CommunityMobileSubheader title="Account email" backHref="/home" />
	<a href="/home" class="text-xs text-white/55 hover:text-white max-md:hidden"
		>← <span>Account email</span></a
	>
	<h1 class="mt-10 font-display text-4xl text-white">
		{verified ? 'Verified email' : 'Add or verify an email'}
	</h1>
	<p class="mt-3 text-sm leading-6 text-white/55">
		A verified email lets you recover your password if you lose access.
	</p>
	{#if loading}<p class="mt-8 text-sm text-white/45">Loading account email…</p>
	{:else}
		<form onsubmit={saveEmail} class="mt-8 space-y-5">
			<label class="block text-sm text-white/70"
				>Email address
				<input
					bind:value={email}
					type="email"
					required
					disabled={verified || saving}
					autocomplete="email"
					class="mt-2 w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-base text-white outline-none focus:border-orange-300"
				/>
			</label>
			{#if !verified}<button
					type="submit"
					disabled={saving}
					class="w-full rounded-full bg-[#ed6a36] px-5 py-4 text-sm text-[#1a100b] disabled:opacity-50"
					>{saving ? 'Sending…' : 'Send verification code'}</button
				>{/if}
		</form>
		{#if !verified && email}
			<form onsubmit={verifyEmail} class="mt-8 space-y-5">
				<label class="block text-sm text-white/70"
					>Verification code
					<input
						bind:value={code}
						required
						autocomplete="one-time-code"
						class="mt-2 w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-base text-white outline-none focus:border-orange-300"
					/>
				</label>
				<button
					type="submit"
					disabled={saving}
					class="w-full rounded-full bg-[#ed6a36] px-5 py-4 text-sm text-[#1a100b] disabled:opacity-50"
					>Verify email</button
				>
				<button
					type="button"
					disabled={saving}
					onclick={resendCode}
					class="block w-full py-2 text-sm text-orange-200">Resend code</button
				>
			</form>
		{/if}
	{/if}
	{#if errorMessage}<p role="alert" class="mt-5 text-sm text-red-200">{errorMessage}</p>{/if}
	{#if notice}<p role="status" class="mt-5 text-sm leading-6 text-orange-200">{notice}</p>{/if}
</main>
