<script lang="ts">
	import { goto } from '$app/navigation';
	import { Flag, X } from '@lucide/svelte';
	import { communityApi } from '../communityApi.js';

	interface Props {
		targetType: 'post' | 'community';
		targetId: string;
		targetLabel: string;
		viewerUsername?: string;
		returnTo: string;
		ownContent?: boolean;
	}

	let {
		targetType,
		targetId,
		targetLabel,
		viewerUsername,
		returnTo,
		ownContent = false
	}: Props = $props();
	let open = $state(false);
	let reason = $state('');
	let errorMessage = $state('');
	let submitting = $state(false);
	let submitted = $state(false);

	function startReport() {
		if (!viewerUsername) {
			void goto(`/login?returnTo=${encodeURIComponent(returnTo)}`);
			return;
		}
		open = true;
		errorMessage = '';
		reason = '';
	}

	async function submitReport(event: SubmitEvent) {
		event.preventDefault();
		if (submitting || reason.trim().length < 10) return;
		submitting = true;
		errorMessage = '';
		try {
			await communityApi(fetch, 'reports', {
				method: 'POST',
				body: JSON.stringify({ targetType, targetId, reason: reason.trim() })
			});
			open = false;
			submitted = true;
		} catch (cause) {
			errorMessage = cause instanceof Error ? cause.message : 'Could not submit report.';
		} finally {
			submitting = false;
		}
	}
</script>

{#if !ownContent}
	<button
		type="button"
		onclick={startReport}
		disabled={submitted}
		class="inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-[10px] text-white/45 transition-colors hover:bg-red-300/[0.06] hover:text-red-100 disabled:cursor-default disabled:text-emerald-200/70"
	>
		<Flag size={12} />{submitted ? 'Reported' : `Report ${targetLabel}`}
	</button>
{/if}

{#if open}
	<div class="fixed inset-0 z-[1001] flex items-center justify-center bg-black/75 p-4">
		<dialog
			open
			aria-labelledby="community-report-heading"
			class="m-0 w-full max-w-lg border border-white/10 bg-[#111211] p-5 text-white shadow-2xl sm:p-6"
		>
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="font-mono text-[9px] tracking-[0.12em] text-red-200/70 uppercase">
						Community safety
					</p>
					<h2 id="community-report-heading" class="mt-1 font-display text-2xl">
						Report {targetLabel}
					</h2>
					<p class="mt-1 text-xs leading-5 text-white/45">
						Reports are sent to the Sanctyria moderation team for review.
					</p>
				</div>
				<button
					type="button"
					onclick={() => (open = false)}
					aria-label="Close report form"
					class="flex h-9 w-9 items-center justify-center text-white/60 hover:bg-white/5 hover:text-white"
					><X size={17} /></button
				>
			</div>
			<form onsubmit={submitReport} class="mt-5 space-y-4">
				<label class="block text-xs text-white/65">
					Reason
					<textarea
						bind:value={reason}
						minlength="10"
						maxlength="500"
						rows="4"
						required
						placeholder="Describe the issue so it can be reviewed..."
						class="mt-1.5 w-full resize-y border border-white/10 bg-black/20 px-3 py-2.5 text-sm leading-5 text-white outline-none placeholder:text-white/25 focus:border-orange-200/40"
					></textarea>
				</label>
				{#if errorMessage}
					<p
						role="alert"
						class="border border-red-300/15 bg-red-300/[0.04] px-3 py-2.5 text-xs text-red-200"
					>
						{errorMessage}
					</p>
				{/if}
				<div class="flex justify-end gap-2 border-t border-white/[0.08] pt-4">
					<button
						type="button"
						onclick={() => (open = false)}
						class="border border-white/15 px-4 py-2 text-xs text-white/70 hover:text-white"
						>Cancel</button
					>
					<button
						type="submit"
						disabled={submitting || reason.trim().length < 10}
						class="bg-red-300 px-4 py-2 text-xs font-semibold text-[#211010] hover:bg-red-200 disabled:opacity-50"
						>{submitting ? 'Submitting...' : 'Submit report'}</button
					>
				</div>
			</form>
		</dialog>
	</div>
{/if}
