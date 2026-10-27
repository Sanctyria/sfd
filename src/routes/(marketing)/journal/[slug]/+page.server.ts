import { error } from '@sveltejs/kit';
import { loadJournalArticle, loadJournalArticles } from '#lib/marketing/journalApi.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const [article, articles] = await Promise.all([
		loadJournalArticle(fetch, params.slug),
		loadJournalArticles(fetch)
	]);

	if (!article) {
		error(404, 'That page is not in the journal yet.');
	}

	return {
		article,
		relatedArticles: articles.filter((entry) => entry.slug !== article.slug)
	};
};
