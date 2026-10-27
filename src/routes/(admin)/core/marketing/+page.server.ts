import { error } from '@sveltejs/kit';
import { journalArticles, type JournalArticle } from '#lib/marketing/journal.js';
import { coreApi } from '#lib/core/coreApi.js';
import type { PageServerLoad } from './$types';

type ManagedArticle = JournalArticle & {
	isPublished: boolean;
	publishedAt: string | null;
	updatedAt: string;
};

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const saved = await coreApi<ManagedArticle[]>(fetch, 'marketing/articles');
		const savedBySlug = new Map(saved.map((article) => [article.slug, article]));
		const bundled = journalArticles.map((article) => {
			const override = savedBySlug.get(article.slug);
			if (override) savedBySlug.delete(article.slug);
			return {
				...article,
				isPublished: override?.isPublished ?? true,
				publishedAt: override?.publishedAt ?? null,
				updatedAt: override?.updatedAt ?? ''
			};
		});
		return { articles: [...bundled, ...savedBySlug.values()] };
	} catch (cause) {
		console.error('Could not load Core marketing content.', cause);
		error(503, 'The journal content workspace is temporarily unavailable.');
	}
};
