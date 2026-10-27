export function subscribeCommunityRealtime(onUpdate: () => void): () => void {
	const source = new EventSource('/api/community/events');
	const handleUpdate = () => onUpdate();
	source.addEventListener('community', handleUpdate);
	return () => source.close();
}
