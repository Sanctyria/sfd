import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import https from 'node:https';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import sharp, { type OverlayOptions } from 'sharp';

const width = 1200;
const height = 630;
const assetsPath = resolve(process.cwd(), 'static', 'assets');
const characters = ['ember.png', 'kai.png', 'lib.png', 'saphy.png'];
const ogFonts = [
	resolve(assetsPath, 'fonts', 'NotoSans-Variable.ttf'),
	resolve(assetsPath, 'fonts', 'NotoSerif-Variable.ttf')
];
const imageCache = new Map<string, { image: Buffer; expiresAt: number }>();

export interface BrandedOgImageOptions {
	title: string;
	description: string;
	eyebrow?: string;
	imageUrl?: string | null;
	initials?: string;
	character?: number;
	cacheVersion?: string;
}

function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function wrapText(value: string, maxLength: number, maxLines: number): string[] {
	const words = value.trim().split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = '';

	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (next.length > maxLength && line) {
			lines.push(line);
			line = word;
			if (lines.length === maxLines - 1) break;
		} else {
			line = next;
		}
	}

	if (line && lines.length < maxLines) lines.push(line);
	const consumed = lines.join(' ').length;
	if (consumed < value.trim().length && lines.length) {
		lines[lines.length - 1] = `${lines.at(-1)?.replace(/[.…]+$/, '')}…`;
	}
	return lines;
}

function makeTemplate(options: BrandedOgImageOptions, showInitials = !options.imageUrl): string {
	const titleLines = wrapText(options.title || 'Discover Sanctyria', 24, 2);
	const descriptionLines = wrapText(options.description || 'A world of stories and wonder.', 58, 2);
	const eyebrow = escapeXml(options.eyebrow || 'SANCTYRIA');
	const title = titleLines
		.map(
			(line, index) =>
				`<text x="76" y="${445 + index * 48}" font-family="Noto Serif" font-size="42px" font-weight="600" fill="#fffaf5">${escapeXml(line)}</text>`
		)
		.join('');
	const descriptionStart = 510 + Math.max(0, titleLines.length - 1) * 48;
	const description = descriptionLines
		.map(
			(line, index) =>
				`<text x="80" y="${descriptionStart + index * 25}" font-family="Noto Sans" font-size="18px" fill="#e3d6cb">${escapeXml(line)}</text>`
		)
		.join('');
	const initials = escapeXml((options.initials || 'S').slice(0, 3));
	const profileImage =
		options.initials !== undefined && showInitials
			? `<rect x="825" y="170" width="290" height="290" rx="20" fill="#211915" stroke="#e9a363" stroke-opacity=".45" stroke-width="2"/><text x="970" y="338" text-anchor="middle" font-family="Noto Serif" font-size="92px" font-weight="600" fill="#fff1e2">${initials}</text>`
			: '';

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
		<defs>
			<linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#100e0e"/>
				<stop offset=".54" stop-color="#241713"/>
				<stop offset="1" stop-color="#0d1114"/>
			</linearGradient>
			<radialGradient id="glow"><stop stop-color="#c65b24" stop-opacity=".38"/><stop offset="1" stop-color="#c65b24" stop-opacity="0"/></radialGradient>
			<linearGradient id="shade" x1="0" y1="1" x2="0" y2="0">
				<stop stop-color="#09090b" stop-opacity=".76"/><stop offset=".55" stop-color="#09090b" stop-opacity=".08"/>
			</linearGradient>
		</defs>
		<rect width="1200" height="630" fill="url(#background)"/>
		<ellipse cx="970" cy="290" rx="360" ry="310" fill="url(#glow)"/>
		<path d="M0 500C260 380 450 600 730 460S1030 420 1200 470V630H0Z" fill="#09090b" opacity=".3"/>
		<rect width="1200" height="630" fill="url(#shade)"/>
		<path d="M60 155H1140" stroke="#f4cba8" stroke-opacity=".13"/>
		<rect x="28" y="28" width="1144" height="574" rx="16" fill="none" stroke="#fff4e8" stroke-opacity=".12"/>
		${profileImage}
		<text x="80" y="135" font-family="Noto Sans" font-size="13px" font-weight="600" letter-spacing="4" fill="#efb886">${eyebrow}</text>
		${title}
		${description}
		<text x="80" y="594" font-family="Noto Sans" font-size="13px" font-weight="600" letter-spacing="4" fill="#efb886" opacity=".65">A WORLD OF STORIES &amp; WONDER</text>
	</svg>`;
}

function isPublicIpv4(address: string): boolean {
	const parts = address.split('.').map(Number);
	if (
		parts.length !== 4 ||
		parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
	) {
		return false;
	}
	const [first = -1, second = -1, third = -1] = parts;
	return !(
		first === 0 ||
		first === 10 ||
		first === 127 ||
		(first === 100 && second >= 64 && second <= 127) ||
		(first === 169 && second === 254) ||
		(first === 172 && second >= 16 && second <= 31) ||
		(first === 192 && second === 168) ||
		(first === 192 && second === 0 && (third === 0 || third === 2)) ||
		(first === 198 && (second === 18 || second === 19)) ||
		(first === 198 && second === 51 && third === 100) ||
		(first === 203 && second === 0 && third === 113) ||
		first >= 224
	);
}

async function loadRemoteImage(imageUrl: string, redirectsRemaining = 3): Promise<Buffer | null> {
	let url: URL;
	try {
		url = new URL(imageUrl);
	} catch {
		return null;
	}
	if (
		url.protocol !== 'https:' ||
		url.username ||
		url.password ||
		(url.port && url.port !== '443')
	) {
		return null;
	}

	const addressMatch = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(url.hostname);
	let address: string;
	if (addressMatch) {
		if (!isPublicIpv4(url.hostname)) return null;
		address = url.hostname;
	} else {
		if (url.hostname.includes(':')) return null;
		const addresses = await lookup(url.hostname, { family: 4, all: true, verbatim: true });
		if (!addresses.length || addresses.some(({ address: ip }) => !isPublicIpv4(ip))) return null;
		address = addresses[0]?.address ?? '';
		if (!address) return null;
	}

	return new Promise<Buffer | null>((resolveImage, reject) => {
		const request = https.request(
			{
				hostname: url.hostname,
				port: 443,
				path: `${url.pathname}${url.search}`,
				method: 'GET',
				servername: url.hostname,
				lookup: (_hostname, _options, callback) => callback(null, address, 4),
				headers: { accept: 'image/png,image/jpeg,image/webp,image/gif' }
			},
			(response) => {
				if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
					const location = response.headers.location;
					response.resume();
					if (!location || redirectsRemaining === 0) {
						resolveImage(null);
						return;
					}
					try {
						resolveImage(
							loadRemoteImage(new URL(location, url).toString(), redirectsRemaining - 1)
						);
					} catch {
						resolveImage(null);
					}
					return;
				}
				if (
					response.statusCode !== 200 ||
					!/^image\/(?:png|jpeg|webp|gif)\b/i.test(response.headers['content-type'] ?? '')
				) {
					response.resume();
					resolveImage(null);
					return;
				}
				const chunks: Buffer[] = [];
				let bytes = 0;
				response.on('data', (chunk: Buffer) => {
					bytes += chunk.length;
					if (bytes > 3_000_000) {
						response.destroy(new Error('Profile avatar exceeds the preview size limit.'));
						return;
					}
					chunks.push(chunk);
				});
				response.on('end', () => resolveImage(Buffer.concat(chunks)));
				response.on('error', reject);
			}
		);
		request.setTimeout(4000, () => request.destroy(new Error('Avatar request timed out.')));
		request.on('error', reject);
		request.end();
	});
}

async function loadAvatarImage(imageUrl: string): Promise<Buffer | null> {
	if (!imageUrl.startsWith('data:')) return loadRemoteImage(imageUrl);

	const match = /^data:image\/(?:png|jpeg|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/.exec(imageUrl);
	const encoded = match?.[1];
	if (!encoded || encoded.length % 4 !== 0 || encoded.length > 1_400_000) return null;

	const image = Buffer.from(encoded, 'base64');
	if (image.length > 1_000_000 || image.toString('base64') !== encoded) return null;
	return image;
}

async function createBrandedOgImage(options: BrandedOgImageOptions): Promise<Buffer> {
	const background = new Resvg(makeTemplate(options, !options.imageUrl), {
		font: {
			fontFiles: ogFonts,
			loadSystemFonts: false,
			defaultFontFamily: 'Noto Sans',
			sansSerifFamily: 'Noto Sans',
			serifFamily: 'Noto Serif'
		}
	})
		.render()
		.asPng();
	const logo = await sharp(await readFile(resolve(assetsPath, 'dlst.gif')), { page: 0, pages: 1 })
		.resize(86, 86, { fit: 'contain' })
		.png()
		.toBuffer();
	const layers: OverlayOptions[] = [
		{
			input: logo,
			left: 68,
			top: 39
		}
	];

	if (options.imageUrl) {
		let remoteImage: Buffer | null = null;
		let avatarLoadError: unknown;
		let avatarRendered = false;
		try {
			remoteImage = await loadAvatarImage(options.imageUrl);
		} catch (cause) {
			avatarLoadError = cause;
		}
		if (remoteImage) {
			try {
				const avatar = await sharp(remoteImage, { limitInputPixels: 16_000_000 })
					.resize(290, 290, { fit: 'cover', position: 'centre' })
					.png()
					.toBuffer();
				const mask = Buffer.from(
					'<svg xmlns="http://www.w3.org/2000/svg" width="290" height="290"><rect width="290" height="290" rx="20" fill="white"/></svg>'
				);
				const framedAvatar = await sharp(avatar)
					.composite([{ input: mask, blend: 'dest-in' }])
					.png()
					.toBuffer();
				layers.push({ input: framedAvatar, left: 825, top: 170 });
				avatarRendered = true;
			} catch (cause) {
				console.warn(
					'Could not decode profile avatar for the social preview; using initials.',
					cause
				);
			}
		} else {
			console.warn(
				'Avatar is unavailable for the social preview; using initials.',
				avatarLoadError
			);
		}
		if (!avatarRendered && options.initials !== undefined) {
			const initials = escapeXml(options.initials.slice(0, 3));
			const fallback = Buffer.from(
				`<svg xmlns="http://www.w3.org/2000/svg" width="290" height="290"><rect width="290" height="290" rx="20" fill="#211915" stroke="#e9a363" stroke-opacity=".45" stroke-width="2"/><text x="145" y="168" text-anchor="middle" font-family="Noto Serif" font-size="92px" font-weight="600" fill="#fff1e2">${initials}</text></svg>`
			);
			layers.push({ input: fallback, left: 825, top: 170 });
		}
	} else if (options.initials !== undefined) {
		return sharp(background).composite(layers).png().toBuffer();
	} else {
		const titleHash = Array.from(options.title).reduce(
			(hash, character) => (hash * 31 + character.codePointAt(0)!) >>> 0,
			0
		);
		const characterIndex = options.character ?? titleHash;
		const character = characters[Math.abs(characterIndex) % characters.length] ?? characters[0]!;
		const characterImage = await sharp(resolve(assetsPath, 'characters', character))
			.resize(430, 600, {
				fit: 'contain',
				position: 'centre',
				background: { r: 0, g: 0, b: 0, alpha: 0 }
			})
			.png()
			.toBuffer();
		layers.push({ input: characterImage, left: 748, top: 15 });
	}

	return sharp(background).composite(layers).png().toBuffer();
}

export async function renderBrandedOgImage(options: BrandedOgImageOptions): Promise<Buffer> {
	const key = createHash('sha256').update(JSON.stringify(options)).digest('hex');
	const cached = imageCache.get(key);
	if (cached && cached.expiresAt > Date.now()) {
		imageCache.delete(key);
		imageCache.set(key, cached);
		return cached.image;
	}

	const image = await createBrandedOgImage(options);
	if (imageCache.size >= 256) {
		const oldestKey = imageCache.keys().next().value;
		if (oldestKey) imageCache.delete(oldestKey);
	}
	imageCache.set(key, { image, expiresAt: Date.now() + 60 * 60 * 1000 });
	return image;
}
