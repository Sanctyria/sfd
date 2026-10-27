import { loadJournalArticles } from '#lib/marketing/journalApi.js';
import type { RequestHandler } from './$types';

const siteUrl = 'https://sanctyria.com';
const maximumUrls = 50_000;
const routes = [
	'/',
	'/about',
	'/flameborns',
	'/nations',
	'/studio',
	'/journal',
	'/partnership',
	'/roadmap',
	'/reach-us'
];

interface SearchIndexResponse {
	communities: { slug: string; updatedAt: string }[];
	posts: { id: string; updatedAt: string }[];
	profiles: { username: string; updatedAt: string }[];
}

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

function sitemapEntry(url: string, lastModified?: string): string {
	const lastmod = lastModified ? new Date(lastModified) : null;
	const lastmodElement =
		lastmod && !Number.isNaN(lastmod.getTime())
			? `<lastmod>${lastmod.toISOString()}</lastmod>`
			: '';
	return `\t<url><loc>${escapeXml(url)}</loc>${lastmodElement}</url>`;
}

export const GET: RequestHandler = async ({ fetch }) => {
	const pageUrls = routes.map((route) => sitemapEntry(`${siteUrl}${route}`));
	const articles = await loadJournalArticles(fetch);
	const articleLimit = Math.max(0, maximumUrls - pageUrls.length);
	const articleEntries = articles
		.slice(0, articleLimit)
		.map((article) => sitemapEntry(`${siteUrl}/journal/${encodeURIComponent(article.slug)}`));
	const remainingLimit = Math.max(0, maximumUrls - pageUrls.length - articleEntries.length);
	const indexableResponse = await fetch(`/api/community/seo/sitemap?limit=${remainingLimit}`, {
		headers: { accept: 'application/json' }
	});
	if (!indexableResponse.ok) {
		console.error(
			`Could not load approved community content for the sitemap: HTTP ${indexableResponse.status}.`
		);
		return new Response('The sitemap is temporarily unavailable.', {
			status: 503,
			headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '300' }
		});
	}
	const indexableContent = (await indexableResponse.json()) as SearchIndexResponse;
	const dynamicEntries = [
		...indexableContent.communities.map((community) =>
			sitemapEntry(`${siteUrl}/r/${encodeURIComponent(community.slug)}`, community.updatedAt)
		),
		...indexableContent.posts.map((post) =>
			sitemapEntry(`${siteUrl}/p/${encodeURIComponent(post.id)}`, post.updatedAt)
		),
		...indexableContent.profiles.map((profile) =>
			sitemapEntry(`${siteUrl}/u/${encodeURIComponent(profile.username)}`, profile.updatedAt)
		)
	];
	const urls = [...pageUrls, ...articleEntries, ...dynamicEntries].join('\n');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
		{
			headers: {
				'Content-Type': 'application/xml; charset=utf-8',
				'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
			}
		}
	);
};
