export function brandedOgImageUrl(title: string, description: string, eyebrow: string): string {
	return `https://sanctyria.com${brandedOgImagePath(title, description, eyebrow)}`;
}

export function brandedOgImagePath(title: string, description: string, eyebrow: string): string {
	const query = new URLSearchParams({
		title: title.slice(0, 120),
		description: description.slice(0, 300),
		eyebrow: eyebrow.slice(0, 60)
	});
	return `/api/og/page?${query}`;
}
