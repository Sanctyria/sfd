export class CoreApiError extends Error {
	constructor(
		public readonly status: number,
		message: string
	) {
		super(message);
		this.name = 'CoreApiError';
	}
}

export async function coreApi<T>(
	fetcher: typeof fetch,
	path: string,
	init?: RequestInit
): Promise<T> {
	const response = await fetcher(`/api/community/core/${path.replace(/^\//, '')}`, {
		...init,
		credentials: 'same-origin',
		headers: {
			accept: 'application/json',
			...(init?.body !== undefined ? { 'content-type': 'application/json' } : {}),
			...init?.headers
		}
	});

	if (!response.ok) {
		const payload = (await response.json().catch(() => null)) as {
			error?: { message?: string };
		} | null;
		throw new CoreApiError(
			response.status,
			payload?.error?.message ?? 'The administration request failed.'
		);
	}
	if (response.status === 204) return undefined as T;
	return (await response.json()) as T;
}
