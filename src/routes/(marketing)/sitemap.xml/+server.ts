import { communityDirectory, communitySlug, demoPosts } from '#lib/community/community.js';
import { loadJournalArticles } from '#lib/marketing/journalApi.js';
import type { RequestHandler } from './$types';

const siteUrl = 'https://sanctyria.com';
const routes = [
	'/',
	'/about',
	'/flameborns',
	'/nations',
	'/studio',
	'/journal',
	'/home',
	'/partnership',
	'/roadmap',
	'/reach-us'
];

export const GET: RequestHandler = async ({ fetch }) => {
	const pageUrls = routes.map((route) => `${siteUrl}${route}`);
	const articleUrls = (await loadJournalArticles(fetch)).map(
		(article) => `${siteUrl}/journal/${article.slug}`
	);
	const communityUrls = communityDirectory.map(
		(community) => `${siteUrl}/r/${communitySlug(community.name)}`
	);
	const postUrls = demoPosts.map((post) => `${siteUrl}/p/${post.id}`);
	const urls = [...pageUrls, ...articleUrls, ...communityUrls, ...postUrls]
		.map((url) => `\t<url><loc>${url}</loc></url>`)
		.join('\n');

	return new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`,
		{ headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
	);
};
