export function jsonLdScript(schema: unknown): string {
	const serialized = JSON.stringify(schema).replace(/</g, '\\u003c');
	return `<script type="application/ld+json">${serialized}</script>`;
}
