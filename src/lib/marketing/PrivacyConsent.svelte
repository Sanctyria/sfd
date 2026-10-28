<script lang="ts">
	import { onMount } from 'svelte';

	const storageKey = 'sanctyria-privacy-consent-v1';
	const consentVersion = 1;
	let { onConsentChange }: { onConsentChange: (analyticsAllowed: boolean) => void } = $props();
	let visible = $state(false);
	let settingsOpen = $state(false);
	let analyticsAllowed = $state(false);
	let saveError = $state('');

	onMount(() => {
		let stored: string | null;
		try {
			stored = localStorage.getItem(storageKey);
		} catch (cause) {
			console.error('Could not read saved privacy preferences.', cause);
			visible = true;
			saveError = 'Browser storage is unavailable. Optional analytics will remain off.';
			return;
		}
		if (!stored) {
			visible = true;
			return;
		}

		try {
			const consent: unknown = JSON.parse(stored);
			if (
				typeof consent === 'object' &&
				consent !== null &&
				'version' in consent &&
				consent.version === consentVersion &&
				'analytics' in consent &&
				typeof consent.analytics === 'boolean'
			) {
				analyticsAllowed = consent.analytics;
				onConsentChange(consent.analytics);
				return;
			}
		} catch (cause) {
			console.error('Could not read saved privacy preferences.', cause);
		}
		visible = true;
	});

	function saveConsent(allowAnalytics: boolean) {
		try {
			localStorage.setItem(
				storageKey,
				JSON.stringify({
					version: consentVersion,
					analytics: allowAnalytics,
					updatedAt: new Date().toISOString()
				})
			);
		} catch (cause) {
			console.error('Could not save privacy preferences.', cause);
			saveError =
				'Your choice could not be saved. Check your browser storage settings and try again.';
			return;
		}

		analyticsAllowed = allowAnalytics;
		onConsentChange(allowAnalytics);
		visible = false;
		settingsOpen = false;
		saveError = '';
	}
</script>

{#if visible}
	<aside class="privacy-banner" aria-label="Privacy choices">
		<div class="privacy-copy">
			<strong>Privacy choices</strong>
			<p>
				Essential storage keeps site features working. Optional analytics and error diagnostics help
				us improve Sanctyria and are off unless you allow them. You can change your choice anytime.
			</p>
			{#if settingsOpen}
				<label class="privacy-toggle">
					<input type="checkbox" bind:checked={analyticsAllowed} />
					<span>Allow anonymous analytics and error diagnostics</span>
				</label>
				<p class="privacy-essential">Essential site storage is always on.</p>
			{/if}
			{#if saveError}<p class="privacy-error" role="alert">{saveError}</p>{/if}
		</div>
		<div class="privacy-actions">
			{#if settingsOpen}
				<button class="privacy-button secondary" onclick={() => saveConsent(analyticsAllowed)}
					>Save choices</button
				>
			{:else}
				<button class="privacy-button secondary" onclick={() => (settingsOpen = true)}
					>Customize</button
				>
			{/if}
			<button class="privacy-button secondary" onclick={() => saveConsent(false)}
				>Reject optional</button
			>
			<button class="privacy-button primary" onclick={() => saveConsent(true)}>Accept all</button>
		</div>
	</aside>
{/if}

<style>
	.privacy-banner {
		position: fixed;
		z-index: 1000;
		right: max(16px, env(safe-area-inset-right));
		bottom: max(16px, env(safe-area-inset-bottom));
		left: max(16px, env(safe-area-inset-left));
		display: flex;
		max-width: 900px;
		margin-inline: auto;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		border: 1px solid rgb(212 162 135 / 35%);
		padding: 18px 20px;
		background: #10110f;
		color: #f3eee9;
		box-shadow: 0 16px 48px rgb(0 0 0 / 45%);
	}

	.privacy-copy {
		max-width: 540px;
	}

	.privacy-copy strong {
		font-family: var(--font-display);
		font-size: 19px;
		font-weight: 400;
	}

	.privacy-copy p {
		margin-top: 5px;
		color: rgb(243 238 233 / 68%);
		font-size: 12px;
		line-height: 1.6;
	}

	.privacy-toggle {
		display: flex;
		margin-top: 12px;
		align-items: center;
		gap: 8px;
		font-size: 12px;
	}

	.privacy-toggle input {
		accent-color: #d4a287;
	}

	.privacy-copy .privacy-essential {
		font-size: 10px;
	}

	.privacy-copy .privacy-error {
		color: #ffb4a8;
	}

	.privacy-actions {
		display: flex;
		flex: 0 0 auto;
		flex-wrap: wrap;
		gap: 8px;
	}

	.privacy-button {
		border: 1px solid rgb(243 238 233 / 28%);
		padding: 9px 12px;
		color: inherit;
		font-size: 11px;
		cursor: pointer;
	}

	.privacy-button.primary {
		border-color: #d4a287;
		background: #d4a287;
		color: #171310;
	}

	.privacy-button.secondary {
		background: #171815;
	}

	.privacy-button:hover {
		border-color: #e7b394;
	}

	@media (max-width: 680px) {
		.privacy-banner {
			align-items: stretch;
			flex-direction: column;
			gap: 14px;
			padding: 15px;
		}

		.privacy-actions > button {
			flex: 1 1 100px;
		}
	}
</style>
