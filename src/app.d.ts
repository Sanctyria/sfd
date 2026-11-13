// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	interface Window {
		requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
		cancelIdleCallback?: (handle: number) => void;
		turnstile?: {
			render: (
				container: HTMLElement,
				options: {
					sitekey: string;
					action: string;
					theme: 'dark';
					callback: (token: string) => void;
					'expired-callback': () => void;
					'error-callback': () => void;
				}
			) => string;
			reset: (widgetId?: string) => void;
			remove: (widgetId: string) => void;
		};
	}

	interface Navigator {
		connection?: {
			saveData?: boolean;
			effectiveType?: string;
		};
	}

	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
