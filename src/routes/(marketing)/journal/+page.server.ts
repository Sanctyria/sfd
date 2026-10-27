import { loadJournalArticles } from '#lib/marketing/journalApi.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => ({
	articles: await loadJournalArticles(fetch)
});
