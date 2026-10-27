import { journalArticles, type JournalArticle } from './journal.js';

interface PublicJournalResponse {
	items: JournalArticle[];
	hiddenSlugs: string[];
}

function mergePublishedArticles(payload: PublicJournalResponse): JournalArticle[] {
	const hidden = new Set(payload.hiddenSlugs);
	const overrides = new Map(payload.items.map((article) => [article.slug, article]));
	const staticArticles = journalArticles.filter(
		(article) => !hidden.has(article.slug) && !overrides.has(article.slug)
	);
	return [...payload.items, ...staticArticles];
}

export async function loadJournalArticles(fetcher: typeof fetch): Promise<JournalArticle[]> {
	try {
		const known = journalArticles.map((article) => article.slug).join(',');
		const response = await fetcher(
			`/api/community/marketing/articles?known=${encodeURIComponent(known)}`,
			{
				headers: { accept: 'application/json' }
			}
		);
		if (!response.ok) throw new Error(`Journal content API returned ${response.status}.`);
		return mergePublishedArticles((await response.json()) as PublicJournalResponse);
	} catch (cause) {
		console.error('Journal CMS is unavailable; serving the bundled editorial content.', cause);
		return journalArticles;
	}
}

export async function loadJournalArticle(
	fetcher: typeof fetch,
	slug: string
): Promise<JournalArticle | null> {
	const bundledArticle = journalArticles.find((article) => article.slug === slug);
	try {
		const response = await fetcher(
			`/api/community/marketing/articles/${encodeURIComponent(slug)}`,
			{ headers: { accept: 'application/json' } }
		);
		if (response.status === 410) return null;
		if (response.status === 404) return bundledArticle ?? null;
		if (!response.ok) throw new Error(`Journal content API returned ${response.status}.`);
		return (await response.json()) as JournalArticle;
	} catch (cause) {
		console.error('Journal CMS is unavailable; using bundled content when available.', cause);
		return bundledArticle ?? null;
	}
}
