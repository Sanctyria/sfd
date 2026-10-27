<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { untrack } from 'svelte';
	import { BookOpen, Check, CirclePlus, Eye, Save } from '@lucide/svelte';
	import type { JournalArticle } from '#lib/marketing/journal.js';
	import { coreApi } from '#lib/core/coreApi.js';
	import type { PageProps } from './$types';

	type ManagedArticle = JournalArticle & {
		isPublished: boolean;
		publishedAt: string | null;
		updatedAt: string;
	};
	let { data }: PageProps = $props();
	const blankArticle = (): ManagedArticle => ({
		slug: '',
		title: '',
		dek: '',
		category: 'Worldbuilding',
		date: new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric' }).format(
			new Date()
		),
		readTime: '5 min read',
		image: '',
		imageAlt: '',
		imageNote: '',
		sections: [{ paragraphs: [''] }],
		pullQuote: '',
		isPublished: false,
		publishedAt: null,
		updatedAt: ''
	});
	const firstArticle = untrack(() => (data.articles[0] ? { ...data.articles[0] } : blankArticle()));
	let selectedSlug = $state(firstArticle.slug);
	let form = $state<ManagedArticle>(firstArticle);
	let sectionsJson = $state(JSON.stringify(firstArticle.sections, null, 2));
	let isBusy = $state(false);
	let formError = $state('');
	let savedMessage = $state('');

	function chooseArticle(article: ManagedArticle) {
		selectedSlug = article.slug;
		form = { ...article };
		sectionsJson = JSON.stringify(article.sections, null, 2);
		formError = '';
		savedMessage = '';
	}

	function createArticle() {
		selectedSlug = '';
		form = blankArticle();
		sectionsJson = JSON.stringify(form.sections, null, 2);
		formError = '';
		savedMessage = '';
	}

	async function saveArticle() {
		formError = '';
		savedMessage = '';
		let sections: ManagedArticle['sections'];
		try {
			sections = JSON.parse(sectionsJson) as ManagedArticle['sections'];
			if (!Array.isArray(sections) || !sections.length)
				throw new Error('Add at least one story section.');
		} catch (cause) {
			formError = cause instanceof Error ? cause.message : 'Story sections must be valid JSON.';
			return;
		}
		isBusy = true;
		try {
			const slug = form.slug.trim().toLowerCase();
			await coreApi(fetch, 'marketing/articles', {
				method: 'PUT',
				body: JSON.stringify({
					...form,
					slug,
					sections
				})
			});
			selectedSlug = slug;
			savedMessage = form.isPublished
				? 'Story saved and published.'
				: 'Draft saved. It is not visible on the public site.';
			await invalidateAll();
		} catch (cause) {
			formError = cause instanceof Error ? cause.message : 'The article could not be saved.';
		} finally {
			isBusy = false;
		}
	}
</script>

<svelte:head><title>Marketing | Sanctyria Core</title></svelte:head>

<div class="core-page-heading">
	<div>
		<span class="core-eyebrow">MARKETING / EDITORIAL</span>
		<h1>Journal</h1>
		<p>
			Edit published stories and prepare new dispatches. This CMS is limited to editorial content;
			other marketing pages remain static and unchanged.
		</p>
	</div>
	<a class="core-button secondary" href="/journal" target="_blank" rel="noreferrer"
		><Eye size={14} /> View journal</a
	>
</div>

<div class="editor-layout">
	<aside class="core-panel article-list">
		<div class="list-heading">
			<div>
				<span class="core-eyebrow">STORY LIBRARY</span><strong
					>{data.articles.length} stories</strong
				>
			</div>
			<button class="add-button" onclick={createArticle} aria-label="Create new story"
				><CirclePlus size={17} /></button
			>
		</div>
		{#each data.articles as article (article.slug)}
			<button
				class="article-item"
				class:selected={selectedSlug === article.slug}
				onclick={() => chooseArticle(article)}
			>
				<img class="article-thumb" src={article.image} alt="" loading="lazy" />
				<span class="article-label"
					><strong>{article.title}</strong><small>{article.category}</small></span
				>
				<span class={`core-pill ${article.isPublished ? 'published' : 'draft'}`}
					>{article.isPublished ? 'live' : 'draft'}</span
				>
			</button>
		{:else}
			<p class="empty-library">No editorial stories yet. Start with a new draft.</p>
		{/each}
	</aside>

	<section class="core-panel article-editor">
		<div class="editor-heading">
			<div>
				<span class="core-eyebrow">{selectedSlug ? 'EDIT STORY' : 'NEW DISPATCH'}</span>
				<h2>{selectedSlug || 'Untitled story'}</h2>
			</div>
			<label class="publish-switch"
				><input type="checkbox" bind:checked={form.isPublished} /><span
					>{form.isPublished ? 'Published' : 'Draft'}</span
				></label
			>
		</div>
		{#if formError}<div class="core-error" role="alert">{formError}</div>{/if}
		{#if savedMessage}<div class="saved-note" role="status">
				<Check size={14} />{savedMessage}
			</div>{/if}
		<form
			class="editor-form"
			onsubmit={(event) => {
				event.preventDefault();
				saveArticle();
			}}
		>
			<div class="field-grid">
				<label
					>Story title<input
						class="core-field"
						bind:value={form.title}
						maxlength="160"
						required
					/></label
				>
				<label
					>URL slug<input
						class="core-field"
						bind:value={form.slug}
						maxlength="100"
						pattern="[a-z0-9]+(-[a-z0-9]+)*"
						required
					/></label
				>
			</div>
			<label
				>Short description<textarea
					class="core-field"
					bind:value={form.dek}
					maxlength="500"
					rows="2"
					required></textarea></label
			>
			<div class="field-grid three">
				<label
					>Category<input
						class="core-field"
						bind:value={form.category}
						maxlength="80"
						required
					/></label
				>
				<label
					>Display date<input
						class="core-field"
						bind:value={form.date}
						maxlength="40"
						required
					/></label
				>
				<label
					>Read time<input
						class="core-field"
						bind:value={form.readTime}
						maxlength="40"
						required
					/></label
				>
			</div>
			<label
				>Hero image URL <small>HTTPS required</small><input
					class="core-field"
					type="url"
					bind:value={form.image}
					placeholder="https://…"
					required
				/></label
			>
			<div class="field-grid">
				<label
					>Image alt text<input
						class="core-field"
						bind:value={form.imageAlt}
						maxlength="300"
					/></label
				>
				<label
					>Image credit / caption<input
						class="core-field"
						bind:value={form.imageNote}
						maxlength="200"
					/></label
				>
			</div>
			<label
				>Pull quote<textarea
					class="core-field"
					bind:value={form.pullQuote}
					maxlength="500"
					rows="2"
					required></textarea></label
			>
			<label
				>Story sections <small
					>JSON array with optional heading and a paragraphs array for each section</small
				><textarea
					class="core-field sections-editor"
					bind:value={sectionsJson}
					spellcheck="false"
					rows="12"></textarea></label
			>
			<div class="editor-actions">
				{#if form.isPublished}<span class="public-note"
						><BookOpen size={13} /> Published on /journal/{form.slug || 'your-story'}</span
					>{:else}<span class="public-note">Drafts are not exposed publicly.</span>{/if}
				<button type="submit" class="core-button" disabled={isBusy}
					><Save size={14} />{isBusy ? 'Saving…' : 'Save story'}</button
				>
			</div>
		</form>
	</section>
</div>

<style>
	.editor-layout {
		display: grid;
		grid-template-columns: minmax(220px, 0.7fr) minmax(0, 1.7fr);
		align-items: start;
		gap: 15px;
	}
	.article-list {
		overflow: hidden;
	}
	.list-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 15px 14px;
		border-bottom: 1px solid var(--core-border);
	}
	.list-heading > div {
		display: grid;
		gap: 6px;
	}
	.list-heading strong {
		font-family: var(--font-display);
		font-size: 19px;
		font-weight: 400;
	}
	.add-button {
		display: grid;
		width: 31px;
		height: 31px;
		place-items: center;
		border: 1px solid rgba(240, 161, 108, 0.28);
		border-radius: 6px;
		background: rgba(240, 161, 108, 0.08);
		color: #efb28d;
		cursor: pointer;
	}
	.article-item {
		display: flex;
		width: 100%;
		align-items: center;
		gap: 9px;
		border: 0;
		border-bottom: 1px solid var(--core-border);
		padding: 10px;
		background: transparent;
		color: inherit;
		text-align: left;
		cursor: pointer;
	}
	.article-item:hover,
	.article-item.selected {
		background: rgba(255, 255, 255, 0.035);
	}
	.article-thumb {
		width: 40px;
		height: 40px;
		flex: 0 0 auto;
		border-radius: 5px;
		background-position: center;
		background-size: cover;
		background-color: #27221e;
	}
	.article-label {
		min-width: 0;
		flex: 1;
	}
	.article-label strong,
	.article-label small {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.article-label strong {
		font-size: 9px;
		font-weight: 500;
	}
	.article-label small {
		margin-top: 4px;
		color: var(--core-muted);
		font-size: 8px;
	}
	.article-item .core-pill {
		font-size: 7px;
	}
	.empty-library {
		padding: 15px;
		color: var(--core-muted);
		font-size: 9px;
		line-height: 1.6;
	}
	.editor-heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border-bottom: 1px solid var(--core-border);
		padding: 17px 19px;
	}
	.editor-heading h2 {
		overflow: hidden;
		max-width: 600px;
		margin: 5px 0 0;
		font-family: var(--font-display);
		font-size: 23px;
		font-weight: 400;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.publish-switch {
		display: flex;
		align-items: center;
		gap: 7px;
		color: var(--core-muted);
		font-size: 9px;
		white-space: nowrap;
	}
	.publish-switch input {
		accent-color: #d79d76;
	}
	.editor-form {
		display: grid;
		gap: 14px;
		padding: 18px;
	}
	.editor-form label {
		display: grid;
		gap: 6px;
		color: rgba(255, 255, 255, 0.74);
		font-size: 9px;
	}
	.editor-form label small {
		color: var(--core-muted);
		font-weight: 400;
	}
	.editor-form textarea {
		resize: vertical;
		line-height: 1.55;
	}
	.field-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 12px;
	}
	.field-grid.three {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}
	.sections-editor {
		font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
		font-size: 10px;
	}
	.editor-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		border-top: 1px solid var(--core-border);
		padding-top: 14px;
	}
	.public-note {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--core-muted);
		font-size: 9px;
	}
	.saved-note {
		display: flex;
		align-items: center;
		gap: 6px;
		margin: 12px 18px 0;
		border: 1px solid rgba(120, 168, 135, 0.2);
		border-radius: 6px;
		padding: 9px;
		color: #a8d0b3;
		font-size: 10px;
	}
	.article-editor > .core-error {
		margin: 12px 18px 0;
	}
	@media (max-width: 960px) {
		.editor-layout {
			grid-template-columns: 1fr;
		}
		.article-list {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.list-heading {
			grid-column: 1/-1;
		}
		.article-item {
			border-right: 1px solid var(--core-border);
		}
	}
	@media (max-width: 650px) {
		.article-list {
			grid-template-columns: 1fr;
		}
		.article-item {
			border-right: 0;
		}
		.field-grid,
		.field-grid.three {
			grid-template-columns: 1fr;
		}
		.editor-heading,
		.editor-form {
			padding-inline: 13px;
		}
		.editor-actions {
			align-items: flex-start;
			flex-direction: column;
		}
		.editor-actions .core-button {
			width: 100%;
		}
	}
</style>
