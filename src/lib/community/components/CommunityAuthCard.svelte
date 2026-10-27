<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import { ArrowUpRight, Eye, EyeOff, Flame } from '@lucide/svelte';

	interface Props {
		mode: 'login' | 'signup';
	}

	interface AuthResponse {
		error?: { message?: string };
	}

	let { mode }: Props = $props();
	let username = $state('');
	let displayName = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let passwordVisible = $state(false);
	let submitting = $state(false);
	let errorMessage = $state('');
	const isSignup = $derived(mode === 'signup');
	const returnTo = $derived.by(() => {
		const destination = page.url.searchParams.get('returnTo') ?? '/home';
		return destination.startsWith('/') && !destination.startsWith('//') ? destination : '/home';
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';
		if (isSignup && password !== confirmPassword) {
			errorMessage = 'Passwords do not match.';
			return;
		}

		submitting = true;
		try {
			const endpoint = isSignup ? 'signup' : 'login';
			const payload = isSignup ? { username, displayName, password } : { username, password };
			const response = await fetch(`/api/community/auth/${endpoint}`, {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload)
			});
			if (!response.ok) {
				const result = (await response.json().catch(() => null)) as AuthResponse | null;
				errorMessage = result?.error?.message ?? 'We could not sign you in. Try again.';
				return;
			}
			await invalidateAll();
			await goto(returnTo);
		} catch {
			errorMessage = 'The community service is unavailable. Try again shortly.';
		} finally {
			submitting = false;
		}
	}
</script>

<section class="mx-auto w-full max-w-md border border-white/10 bg-[#111211] p-5 shadow-2xl sm:p-8">
	<a
		href="/home"
		class="mb-8 inline-flex items-center gap-2 text-white/80"
		aria-label="Sanctyria Community home"
	>
		<img src="/assets/dlst.gif" alt="" class="h-8 w-8 object-contain" />
		<span class="font-display text-xl">Sanctyria</span>
	</a>
	<div class="mb-6">
		<p
			class="flex items-center gap-2 font-mono text-[9px] tracking-[0.14em] text-orange-200/70 uppercase"
		>
			<Flame size={13} /> Community
		</p>
		<h1 class="mt-2 font-display text-4xl text-white">
			{isSignup ? 'Create your account' : 'Welcome back'}
		</h1>
		<p class="mt-2 text-xs leading-5 text-white/50">
			{isSignup
				? 'Join the conversation across Sanctyria.'
				: 'Sign in to continue to your community.'}
		</p>
	</div>

	<form onsubmit={submit} class="space-y-4">
		{#if isSignup}
			<label class="block">
				<span class="mb-1.5 block text-[11px] text-white/65">Display name</span>
				<input
					bind:value={displayName}
					autocomplete="name"
					maxlength="60"
					required
					class="w-full border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-200/50"
					placeholder="How should we address you?"
				/>
			</label>
		{/if}
		<label class="block">
			<span class="mb-1.5 block text-[11px] text-white/65">Username</span>
			<input
				bind:value={username}
				autocomplete="username"
				minlength="3"
				maxlength="30"
				required
				class="w-full border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-200/50"
				placeholder="your-name"
			/>
		</label>
		<label class="block">
			<span class="mb-1.5 block text-[11px] text-white/65">Password</span>
			<span class="flex border border-white/10 bg-black/20 focus-within:border-orange-200/50">
				<input
					bind:value={password}
					type={passwordVisible ? 'text' : 'password'}
					autocomplete={isSignup ? 'new-password' : 'current-password'}
					minlength={isSignup ? 12 : 1}
					maxlength="256"
					required
					class="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/25"
					placeholder={isSignup ? 'At least 12 characters' : 'Your password'}
				/>
				<button
					type="button"
					onclick={() => (passwordVisible = !passwordVisible)}
					aria-label={passwordVisible ? 'Hide password' : 'Show password'}
					class="flex w-11 items-center justify-center text-white/45 hover:text-white"
					>{#if passwordVisible}<EyeOff size={16} />{:else}<Eye size={16} />{/if}</button
				>
			</span>
		</label>
		{#if isSignup}
			<label class="block">
				<span class="mb-1.5 block text-[11px] text-white/65">Confirm password</span>
				<input
					bind:value={confirmPassword}
					type={passwordVisible ? 'text' : 'password'}
					autocomplete="new-password"
					required
					class="w-full border border-white/10 bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-200/50"
					placeholder="Repeat your password"
				/>
			</label>
		{/if}
		{#if errorMessage}
			<p
				role="alert"
				class="border border-red-300/20 bg-red-300/[0.06] px-3 py-2.5 text-xs text-red-200"
			>
				{errorMessage}
			</p>
		{/if}
		<button
			type="submit"
			disabled={submitting}
			class="flex w-full items-center justify-center gap-2 bg-white px-4 py-3 text-sm font-medium text-black transition-colors hover:bg-orange-100 disabled:cursor-wait disabled:opacity-60"
		>
			{submitting ? 'Please wait...' : isSignup ? 'Create account' : 'Sign in'}
			{#if !submitting}<ArrowUpRight size={15} />{/if}
		</button>
	</form>

	<p class="mt-6 border-t border-white/[0.07] pt-5 text-center text-xs text-white/45">
		{#if isSignup}
			Already have an account?
			<a
				class="ml-1 text-orange-100 hover:text-white"
				href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>Sign in</a
			>
		{:else}
			New to the community?
			<a
				class="ml-1 text-orange-100 hover:text-white"
				href={`/signup?returnTo=${encodeURIComponent(returnTo)}`}>Create an account</a
			>
		{/if}
	</p>
</section>

<style>
	@media (prefers-reduced-motion: no-preference) {
		section {
			animation: auth-arrive 260ms ease-out both;
		}
	}

	@keyframes auth-arrive {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
