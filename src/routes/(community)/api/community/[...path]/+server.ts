import type { RequestHandler } from './$types';

function getBackendOrigin(): string {
	const configuredBackendOrigin = process.env.COMMUNITY_BACKEND_URL;
	if (!configuredBackendOrigin && process.env.NODE_ENV === 'production') {
		throw new Error('COMMUNITY_BACKEND_URL must be set in production.');
	}
	const backendOrigin = configuredBackendOrigin ?? 'http://127.0.0.1:3000';
	const backendUrl = new URL(backendOrigin);
	if (backendUrl.protocol !== 'http:' && backendUrl.protocol !== 'https:') {
		throw new Error('COMMUNITY_BACKEND_URL must use HTTP or HTTPS.');
	}
	return backendOrigin;
}

const MAX_REQUEST_BODY_BYTES = 1_048_576;
const UPSTREAM_TIMEOUT_MS = 15_000;

async function readBoundedBody(request: Request): Promise<ArrayBuffer | null> {
	const declaredLength = request.headers.get('content-length');
	if (declaredLength && Number(declaredLength) > MAX_REQUEST_BODY_BYTES) return null;
	if (!request.body) return new ArrayBuffer(0);

	const reader = request.body.getReader();
	const chunks: Uint8Array[] = [];
	let totalLength = 0;
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			totalLength += value.byteLength;
			if (totalLength > MAX_REQUEST_BODY_BYTES) {
				await reader.cancel();
				return null;
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}

	const body = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		body.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return body.buffer;
}

const forward: RequestHandler = async ({ request, params, url }) => {
	let backendOrigin: string;
	try {
		backendOrigin = getBackendOrigin();
	} catch (error) {
		console.error('Community API proxy configuration is invalid.', error);
		return Response.json(
			{
				error: {
					code: 'COMMUNITY_API_MISCONFIGURED',
					message: 'The community service is unavailable.'
				}
			},
			{ status: 503 }
		);
	}

	const segments = params.path.split('/');
	if (segments.some((segment) => segment === '.' || segment === '..' || segment.includes('\\'))) {
		return Response.json(
			{ error: { code: 'INVALID_PATH', message: 'The API path is invalid.' } },
			{ status: 400 }
		);
	}

	const target = new URL(
		`/api/v1/${segments.map((segment) => encodeURIComponent(segment)).join('/')}`,
		backendOrigin
	);
	target.search = url.search;

	const origin = request.headers.get('origin');
	if (origin && origin !== url.origin) {
		return Response.json(
			{ error: { code: 'ORIGIN_NOT_ALLOWED', message: 'Request origin is not allowed.' } },
			{ status: 403 }
		);
	}

	const headers = new Headers(request.headers);
	headers.delete('host');
	headers.delete('origin');
	headers.delete('connection');
	headers.delete('content-length');
	headers.delete('expect');
	headers.delete('transfer-encoding');

	const body =
		request.method === 'GET' || request.method === 'HEAD'
			? undefined
			: await readBoundedBody(request);
	if (body === null) {
		return Response.json(
			{ error: { code: 'REQUEST_BODY_TOO_LARGE', message: 'The request body is too large.' } },
			{ status: 413 }
		);
	}

	const isEventStream =
		request.method === 'GET' && segments.length === 1 && segments[0] === 'events';
	try {
		const response = await fetch(target, {
			method: request.method,
			headers,
			body,
			redirect: 'manual',
			...(isEventStream ? {} : { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) })
		});
		const responseHeaders = new Headers(response.headers);
		for (const header of [
			'connection',
			'content-encoding',
			'content-length',
			'transfer-encoding'
		]) {
			responseHeaders.delete(header);
		}
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders
		});
	} catch (error) {
		if (error instanceof Error && error.name === 'TimeoutError') {
			return Response.json(
				{
					error: {
						code: 'COMMUNITY_API_TIMEOUT',
						message: 'The community service did not respond in time.'
					}
				},
				{ status: 504 }
			);
		}
		return Response.json(
			{
				error: {
					code: 'COMMUNITY_API_UNAVAILABLE',
					message: 'The community service is unavailable.'
				}
			},
			{ status: 502 }
		);
	}
};

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
