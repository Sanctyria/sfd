<script lang="ts">
	import { communityApi } from '#lib/community/communityApi.js';
	import CommunityMobileSubheader from '#lib/community/components/CommunityMobileSubheader.svelte';

	let email = $state('');
	let code = $state('');
	let password = $state('');
	let requested = $state(false);
	let submitting = $state(false);
	let errorMessage = $state('');
	let notice = $state('');

	async function requestCode(event: SubmitEvent) {
		event.preventDefault();
		submitting = true;
		errorMessage = '';
		notice = '';
		try {
			await communityApi(fetch, 'auth/password-reset/request', {
				method: 'POST',
				body: JSON.stringify({ email: email.trim().toLowerCase() })
			});
			requested = true;
			notice = 'If this address has a verified Sanctyria account, a recovery code has been sent.';
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not request a recovery code.';
		} finally {
			submitting = false;
		}
	}

	async function resetPassword(event: SubmitEvent) {
		event.preventDefault();
		if (password.length < 12 || password.length > 256) {
			errorMessage = 'Use a password between 12 and 256 characters.';
			return;
		}
		submitting = true;
		errorMessage = '';
		try {
			await communityApi(fetch, 'auth/password-reset/confirm', {
				method: 'POST',
				body: JSON.stringify({ code: code.trim(), password })
			});
			notice = 'Password updated. Sign in with your new password.';
			await new Promise((resolve) => setTimeout(resolve, 900));
			window.location.assign('/login');
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not reset your password.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Password recovery | Sanctyria Community</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main
	class="mx-auto min-h-[calc(100dvh-62px)] w-full max-w-xl px-5 pt-8 pb-24 text-[#f1efe9] max-md:pt-0 sm:px-8"
>
	<CommunityMobileSubheader title="Password recovery" backHref="/login" />
	<a
		href="/login"
		class="inline-flex items-center gap-2 text-xs text-white/55 hover:text-white max-md:hidden"
		>← <span>Password recovery</span></a
	>
	<h1 class="mt-10 font-display text-4xl text-white">Reset your password</h1>
	<p class="mt-3 text-sm leading-6 text-white/55">
		Recovery is available for accounts with a verified email address.
	</p>
	<form onsubmit={requested ? resetPassword : requestCode} class="mt-9 space-y-6">
		<label class="block text-sm text-white/70">
			Email address
			<input
				bind:value={email}
				type="email"
				autocomplete="email"
				required
				disabled={requested || submitting}
				class="mt-2 w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-base text-white outline-none focus:border-orange-300"
			/>
		</label>
		{#if requested}
			<label class="block text-sm text-white/70">
				Recovery code
				<input
					bind:value={code}
					required
					autocomplete="one-time-code"
					class="mt-2 w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-base text-white outline-none focus:border-orange-300"
				/>
			</label>
			<label class="block text-sm text-white/70">
				New password
				<input
					bind:value={password}
					type="password"
					minlength="12"
					maxlength="256"
					required
					autocomplete="new-password"
					class="mt-2 w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-base text-white outline-none focus:border-orange-300"
				/>
			</label>
		{/if}
		{#if errorMessage}<p role="alert" class="text-sm text-red-200">{errorMessage}</p>{/if}
		{#if notice}<p role="status" class="text-sm leading-6 text-orange-200">{notice}</p>{/if}
		<button
			type="submit"
			disabled={submitting}
			class="w-full rounded-full bg-[#ed6a36] px-5 py-4 text-sm font-medium text-[#1a100b] disabled:opacity-50"
		>
			{submitting ? 'Please wait…' : requested ? 'Update password' : 'Send recovery code'}
		</button>
		{#if requested}<button
				type="button"
				onclick={() => {
					requested = false;
					code = '';
					password = '';
					notice = '';
				}}
				class="block w-full py-3 text-center text-sm text-orange-200">Use another email</button
			>{/if}
	</form>
</main>
