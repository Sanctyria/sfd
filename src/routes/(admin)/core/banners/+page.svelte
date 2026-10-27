<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { ArrowDown, ArrowUp, Check, Image, Plus, Save, Trash2 } from '@lucide/svelte';
	import { coreApi } from '#lib/core/coreApi.js';
	import type { ApiCommunityBanner } from '#lib/community/communityApi.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const blankBanner = (): Omit<ApiCommunityBanner, 'id'> => ({
		eyebrow: '',
		title: '',
		description: '',
		action: '',
		href: '/home',
		image: '',
		imageAlt: '',
		accent: '#f4a261'
	});
	const firstBanner = untrack(() => data.banners[0]);
	let selectedId = $state(firstBanner?.id ?? '');
	let form = $state<Omit<ApiCommunityBanner, 'id'>>(
		firstBanner
			? {
					eyebrow: firstBanner.eyebrow,
					title: firstBanner.title,
					description: firstBanner.description,
					action: firstBanner.action,
					href: firstBanner.href,
					image: firstBanner.image,
					imageAlt: firstBanner.imageAlt,
					accent: firstBanner.accent
				}
			: blankBanner()
	);
	let isBusy = $state(false);
	let formError = $state('');
	let savedMessage = $state('');

	function chooseBanner(banner: ApiCommunityBanner) {
		selectedId = banner.id;
		form = {
			eyebrow: banner.eyebrow,
			title: banner.title,
			description: banner.description,
			action: banner.action,
			href: banner.href,
			image: banner.image,
			imageAlt: banner.imageAlt,
			accent: banner.accent
		};
		formError = '';
		savedMessage = '';
	}

	function createBanner() {
		selectedId = '';
		form = blankBanner();
		formError = '';
		savedMessage = '';
	}

	async function saveBanner(event: SubmitEvent) {
		event.preventDefault();
		isBusy = true;
		formError = '';
		savedMessage = '';
		try {
			if (selectedId) {
				await coreApi(fetch, `banners/${encodeURIComponent(selectedId)}`, {
					method: 'PUT',
					body: JSON.stringify(form)
				});
				savedMessage = 'Banner changes saved.';
			} else {
				const result = await coreApi<{ banner: ApiCommunityBanner }>(fetch, 'banners', {
					method: 'POST',
					body: JSON.stringify(form)
				});
				selectedId = result.banner.id;
				savedMessage = 'Banner added to the community feed.';
			}
			await invalidateAll();
		} catch (cause) {
			formError = cause instanceof Error ? cause.message : 'The banner could not be saved.';
		} finally {
			isBusy = false;
		}
	}

	async function moveBanner(index: number, direction: -1 | 1) {
		const destination = index + direction;
		if (destination < 0 || destination >= data.banners.length || isBusy) return;
		const reordered = [...data.banners];
		[reordered[index], reordered[destination]] = [reordered[destination]!, reordered[index]!];
		isBusy = true;
		formError = '';
		savedMessage = '';
		try {
			await coreApi(fetch, 'banners/order', {
				method: 'PATCH',
				body: JSON.stringify({ ids: reordered.map((banner) => banner.id) })
			});
			await invalidateAll();
			savedMessage = 'Banner order updated.';
		} catch (cause) {
			formError = cause instanceof Error ? cause.message : 'The banner order could not be saved.';
		} finally {
			isBusy = false;
		}
	}

	async function removeBanner() {
		if (!selectedId || isBusy) return;
		if (!window.confirm('Remove this banner from the community home feed?')) return;
		isBusy = true;
		formError = '';
		savedMessage = '';
		try {
			await coreApi(fetch, `banners/${encodeURIComponent(selectedId)}`, { method: 'DELETE' });
			selectedId = '';
			form = blankBanner();
			savedMessage = 'Banner removed from the community feed.';
			await invalidateAll();
		} catch (cause) {
			formError = cause instanceof Error ? cause.message : 'The banner could not be removed.';
		} finally {
			isBusy = false;
		}
	}
</script>

<svelte:head><title>Community banners | Sanctyria Core</title></svelte:head>

<div class="core-page-heading">
	<div>
		<span class="core-eyebrow">COMMUNITY / HOME FEED</span>
		<h1>Community banners</h1>
		<p>Add, edit, remove, and reorder the announcements shown in the community home carousel.</p>
	</div>
	<button class="core-button primary" type="button" onclick={createBanner} disabled={isBusy}>
		<Plus size={15} /> New banner
	</button>
</div>

<div class="banner-workspace">
	<aside class="core-panel banner-library">
		<div class="banner-library-heading">
			<div>
				<span class="core-eyebrow">LIVE ROTATION</span><strong>{data.banners.length} banners</strong
				>
			</div>
			<Image size={17} />
		</div>
		{#each data.banners as banner, index (banner.id)}
			<div class="banner-row" class:selected={selectedId === banner.id}>
				<button class="banner-choice" type="button" onclick={() => chooseBanner(banner)}>
					<img src={banner.image} alt="" loading="lazy" />
					<span><strong>{banner.title}</strong><small>{banner.eyebrow}</small></span>
				</button>
				<div class="banner-order" aria-label={`Order controls for ${banner.title}`}>
					<button
						class="order-button"
						type="button"
						aria-label={`Move ${banner.title} up`}
						disabled={index === 0 || isBusy}
						onclick={() => moveBanner(index, -1)}><ArrowUp size={14} /></button
					>
					<button
						class="order-button"
						type="button"
						aria-label={`Move ${banner.title} down`}
						disabled={index === data.banners.length - 1 || isBusy}
						onclick={() => moveBanner(index, 1)}><ArrowDown size={14} /></button
					>
				</div>
			</div>
		{:else}
			<p class="banner-empty">No banners yet. Add one to start the community rotation.</p>
		{/each}
	</aside>

	<section class="core-panel banner-editor">
		<div class="banner-editor-heading">
			<div>
				<span class="core-eyebrow">{selectedId ? 'EDIT ANNOUNCEMENT' : 'NEW ANNOUNCEMENT'}</span>
				<h2>{form.title || 'Untitled banner'}</h2>
			</div>
			{#if form.image}<img class="banner-preview" src={form.image} alt={form.imageAlt} />{/if}
		</div>
		{#if formError}<div class="core-error" role="alert">{formError}</div>{/if}
		{#if savedMessage}<div class="banner-saved" role="status">
				<Check size={14} />{savedMessage}
			</div>{/if}
		<form class="banner-form" onsubmit={saveBanner}>
			<label
				>Eyebrow<input
					bind:value={form.eyebrow}
					maxlength="80"
					required
					placeholder="COMMUNITY SPOTLIGHT"
				/></label
			>
			<label>Title<input bind:value={form.title} maxlength="160" required /></label>
			<label class="banner-field-wide"
				>Description<textarea bind:value={form.description} maxlength="500" rows="3" required
				></textarea></label
			>
			<label
				>Action label<input
					bind:value={form.action}
					maxlength="80"
					required
					placeholder="Explore the community"
				/></label
			>
			<label
				>Destination<input
					bind:value={form.href}
					maxlength="500"
					required
					pattern="/(?!/).*"
					title="Use an internal path beginning with a single slash."
					placeholder="/home"
				/></label
			>
			<label class="banner-field-wide"
				>Image URL<input
					bind:value={form.image}
					maxlength="2048"
					required
					placeholder="/assets/community/banner.jpg"
				/></label
			>
			<label class="banner-field-wide"
				>Image description<input
					bind:value={form.imageAlt}
					maxlength="300"
					placeholder="Describe the image for screen readers"
				/></label
			>
			<label
				>Accent color<span class="banner-color-control"
					><input type="color" bind:value={form.accent} /><input
						bind:value={form.accent}
						pattern="#[0-9a-fA-F]{6}"
						required
					/></span
				></label
			>
			<div class="banner-form-actions">
				<button class="core-button primary" type="submit" disabled={isBusy}
					><Save size={14} />{isBusy
						? 'Saving…'
						: selectedId
							? 'Save changes'
							: 'Add banner'}</button
				>
				{#if selectedId}<button
						class="core-button danger"
						type="button"
						onclick={removeBanner}
						disabled={isBusy}><Trash2 size={14} />Remove</button
					>{/if}
			</div>
		</form>
	</section>
</div>

<style>
	.banner-workspace {
		display: grid;
		grid-template-columns: minmax(250px, 0.8fr) minmax(0, 1.4fr);
		gap: 14px;
	}

	.banner-library,
	.banner-editor {
		min-width: 0;
		padding: 16px;
	}

	.banner-library-heading,
	.banner-editor-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.banner-library-heading {
		margin-bottom: 12px;
		color: var(--core-muted);
	}

	.banner-library-heading strong {
		display: block;
		margin-top: 5px;
		color: var(--core-text);
		font-size: 13px;
	}

	.banner-row {
		display: flex;
		align-items: center;
		gap: 7px;
		border: 1px solid transparent;
		border-bottom-color: var(--core-border);
		padding: 8px 2px;
	}

	.banner-row.selected {
		border-color: rgba(240, 161, 108, 0.24);
		background: rgba(240, 161, 108, 0.06);
	}

	.banner-choice {
		display: flex;
		min-width: 0;
		flex: 1;
		align-items: center;
		gap: 10px;
		border: 0;
		background: none;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.banner-choice img {
		width: 48px;
		height: 42px;
		flex: 0 0 auto;
		object-fit: cover;
	}

	.banner-choice span,
	.banner-choice strong,
	.banner-choice small {
		display: block;
		min-width: 0;
	}

	.banner-choice strong {
		overflow: hidden;
		font-size: 11px;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.banner-choice small {
		margin-top: 4px;
		color: var(--core-muted);
		font-size: 9px;
	}

	.banner-order {
		display: grid;
		gap: 3px;
	}

	.order-button {
		display: grid;
		width: 27px;
		height: 24px;
		place-items: center;
		border: 1px solid var(--core-border);
		background: transparent;
		color: var(--core-muted);
		cursor: pointer;
	}

	.order-button:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.banner-empty {
		padding: 16px 4px;
		color: var(--core-muted);
		font-size: 12px;
		line-height: 1.6;
	}

	.banner-editor-heading {
		margin-bottom: 18px;
	}

	.banner-editor-heading h2 {
		margin-top: 5px;
		font-family: var(--font-display);
		font-size: 19px;
		font-weight: 400;
	}

	.banner-preview {
		width: 66px;
		height: 52px;
		object-fit: cover;
	}

	.banner-form {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 13px;
	}

	.banner-form label {
		display: grid;
		gap: 6px;
		color: var(--core-muted);
		font-size: 10px;
	}

	.banner-field-wide {
		grid-column: 1 / -1;
	}

	.banner-form input:not([type='color']),
	.banner-form textarea {
		width: 100%;
		border: 1px solid var(--core-border);
		border-radius: 4px;
		background: #0a0c0b;
		padding: 9px 10px;
		color: var(--core-text);
		font: inherit;
		font-size: 12px;
	}

	.banner-form textarea {
		resize: vertical;
	}

	.banner-color-control {
		display: flex;
		gap: 7px;
	}

	.banner-color-control input[type='color'] {
		width: 38px;
		height: 34px;
		border: 1px solid var(--core-border);
		background: transparent;
	}

	.banner-form-actions {
		display: flex;
		grid-column: 1 / -1;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 2px;
	}

	.banner-saved {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: -8px 0 12px;
		color: #9ed0a8;
		font-size: 11px;
	}

	@media (max-width: 820px) {
		.banner-workspace {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 480px) {
		.banner-form {
			grid-template-columns: 1fr;
		}

		.banner-field-wide,
		.banner-form-actions {
			grid-column: auto;
		}
	}
</style>
