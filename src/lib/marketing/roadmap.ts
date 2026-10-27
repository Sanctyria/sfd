export interface RoadmapPhase {
	number: number;
	label: string;
	title: string;
	subtitle: string;
	status: 'current' | 'upcoming' | 'vision';
	color: string;
	glowColor: string;
	items: string[];
}

export const phases: RoadmapPhase[] = [
	{
		number: 1,
		label: 'Phase I',
		title: 'Foundation of the Flame',
		subtitle: 'Phase I',
		status: 'upcoming',
		color: '#f97316',
		glowColor: 'rgba(249,115,22,0.35)',
		items: [
			'Community formation & culture',
			'Discord sanctuary & Flameborn companions',
			'Official website launch',
			'Beta Sanctyria Pay App',
			'Canon establishment',
			'Identity & brand clarity'
		]
	},
	{
		number: 2,
		label: 'Phase II',
		title: 'Expansion of Lore & Creation',
		subtitle: 'Current Phase',
		status: 'current',
		color: '#a855f7',
		glowColor: 'rgba(168,85,247,0.35)',
		items: [
			'Canon books & narrative media',
			'Creator-focused tools & apps',
			'Early game & interactive design',
			'Flameborn histories fully defined',
			'Growth of public presence',
			'Creator economy foundations'
		]
	},
	{
		number: 3,
		label: 'Phase III',
		title: 'Living Systems & Interactive Worlds',
		subtitle: 'Phase III',
		status: 'upcoming',
		color: '#06b6d4',
		glowColor: 'rgba(6,182,212,0.35)',
		items: [
			'Games & interactive experiences',
			'Cross-platform progression',
			'Mature Ember economy',
			'Advanced ranking systems',
			'Strategic partnerships',
			'World-event driven narratives'
		]
	},
	{
		number: 4,
		label: 'Phase IV',
		title: 'The Eternal Continuum',
		subtitle: 'Long-Term Vision',
		status: 'vision',
		color: '#10b981',
		glowColor: 'rgba(16,185,129,0.35)',
		items: [
			'Long-term IP growth',
			'Cross-media continuity',
			'Community-shaped canon',
			'Seasonal world events',
			'Cultural legacy systems',
			'Self-sustaining universe'
		]
	}
];
