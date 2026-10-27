import { renderBrandedOgImage } from '#lib/server/ogImage.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const title = url.searchParams.get('title')?.trim() ?? '';
	const description = url.searchParams.get('description')?.trim() ?? '';
	const eyebrow = url.searchParams.get('eyebrow')?.trim() ?? '';
	if (!title || title.length > 120 || description.length > 300 || eyebrow.length > 60) {
		return new Response('Invalid social preview request.', { status: 400 });
	}

	try {
		const image = await renderBrandedOgImage({ title, description, eyebrow });
		return new Response(new Uint8Array(image), {
			headers: {
				'content-type': 'image/png',
				'cache-control': 'public, max-age=3600, stale-while-revalidate=86400',
				'content-length': String(image.byteLength),
				'X-Content-Type-Options': 'nosniff'
			}
		});
	} catch (cause) {
		console.error('Could not render a branded social preview image.', cause);
		return new Response('Could not render social preview.', { status: 500 });
	}
};
