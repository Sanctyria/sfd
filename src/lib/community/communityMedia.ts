import { communityApi } from './communityApi';

type UploadPurpose =
	| 'profile-avatar'
	| 'profile-banner'
	| 'post-image'
	| 'post-video'
	| 'post-audio'
	| 'chat-image'
	| 'chat-audio'
	| 'reply-attachment';

interface UploadSignature {
	cloudName: string;
	resourceType: 'image' | 'video';
	allowedFormats: string[];
	maxBytes: number;
	maxVideoDurationSeconds: number | null;
	apiKey: string;
	timestamp: number;
	signature: string;
	folder: string;
	publicId: string;
}

interface CloudinaryUploadResponse {
	secure_url?: string;
	error?: { message?: string };
}

export async function uploadCommunityMedia(
	file: File,
	purpose: UploadPurpose,
	options: { communitySlug?: string; mediaType?: 'image' | 'video' } = {}
): Promise<string> {
	const signature = await communityApi<UploadSignature>(fetch, 'uploads/signature', {
		method: 'POST',
		body: JSON.stringify({
			purpose,
			...(purpose === 'post-audio' || purpose === 'chat-audio' ? { fileName: file.name } : {}),
			...(options.communitySlug ? { communitySlug: options.communitySlug } : {}),
			...(options.mediaType ? { mediaType: options.mediaType } : {})
		})
	});
	const extension = file.name.split('.').pop()?.toLowerCase();
	if (!extension || !signature.allowedFormats.includes(extension)) {
		throw new Error(`Choose a ${signature.allowedFormats.join(', ')} file.`);
	}
	if (file.size > signature.maxBytes) {
		throw new Error(
			`This file exceeds the ${Math.floor(signature.maxBytes / (1024 * 1024))} MB upload limit.`
		);
	}

	const form = new FormData();
	form.set('file', file);
	form.set('api_key', signature.apiKey);
	form.set('timestamp', String(signature.timestamp));
	form.set('signature', signature.signature);
	form.set('folder', signature.folder);
	form.set('public_id', signature.publicId);
	form.set('overwrite', 'false');
	form.set('allowed_formats', signature.allowedFormats.join(','));
	const response = await fetch(
		`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/${signature.resourceType}/upload`,
		{ method: 'POST', body: form }
	);
	const payload = (await response.json().catch(() => null)) as CloudinaryUploadResponse | null;
	if (!response.ok) {
		throw new Error(payload?.error?.message ?? 'Media upload failed. Please try again.');
	}
	const secureUrl = payload?.secure_url;
	if (!secureUrl) throw new Error('The media service returned no secure file URL.');
	const uploadedUrl = new URL(secureUrl);
	if (
		uploadedUrl.protocol !== 'https:' ||
		uploadedUrl.hostname !== 'res.cloudinary.com' ||
		uploadedUrl.pathname.split('/')[1] !== signature.cloudName ||
		uploadedUrl.pathname.split('/')[2] !== signature.resourceType
	) {
		throw new Error('The media service returned an unexpected file URL.');
	}
	return uploadedUrl.toString();
}
