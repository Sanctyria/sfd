export interface PartnershipType {
	id: string;
	number: string;
	title: string;
	subtitle: string;
	loreTitle: string;
	loreLabel: string;
	idealFor: string[];
	theyOffer: string[];
	weOffer: string[];
	accentColor: string;
	glowColor: string;
	icon: 'swords' | 'sparkles' | 'wrench' | 'gem' | 'radio' | 'star' | 'graduation-cap' | 'hexagon';
}

export const partnerships: PartnershipType[] = [
	{
		id: 'community',
		number: '01',
		title: 'Community & Discord',
		subtitle: 'Alliances between realms.',
		loreTitle: 'Allied Realms',
		loreLabel: "External Sanctuaries connected to Sanctyria's influence.",
		idealFor: [
			'Discord servers',
			'Creative communities',
			'Gaming & fandom hubs',
			'Writing & art circles'
		],
		theyOffer: [
			'Active members & cultural exchange',
			'Events, raids & shared experiences',
			'Cross-community growth'
		],
		weOffer: [
			'Shared events and giveaways',
			'Role or nation access for partners',
			'Lore integration as allied realms'
		],
		accentColor: '#f97316',
		glowColor: 'rgba(249,115,22,0.18)',
		icon: 'swords'
	},
	{
		id: 'creators',
		number: '02',
		title: 'Creator Partnerships',
		subtitle: 'Pacts with individual creators.',
		loreTitle: 'Flamebound Contributors',
		loreLabel: "Their work etched into Sanctyria's living history.",
		idealFor: ['Artists & writers', 'Streamers & YouTubers', 'Musicians & voice actors'],
		theyOffer: [
			'Original content & storytelling reach',
			'Visibility & cultural identity',
			'Creative depth for nations'
		],
		weOffer: [
			'Spotlight features',
			'Early access to lore & tools',
			'Canon recognition & in-world roles',
			'Revenue-sharing opportunities'
		],
		accentColor: '#a855f7',
		glowColor: 'rgba(168,85,247,0.18)',
		icon: 'sparkles'
	},
	{
		id: 'tools',
		number: '03',
		title: 'Project & Tool',
		subtitle: 'Functional alliances.',
		loreTitle: 'Relics of the Flame',
		loreLabel: 'Empowering creation across the realm.',
		idealFor: [
			'Worldbuilding tools',
			'Writing platforms',
			'AI creative tools',
			'Game dev utilities'
		],
		theyOffer: ['Infrastructure & systems', 'Experimental features', 'Creator empowerment'],
		weOffer: [
			'Real user testing in a live ecosystem',
			'Feedback from power users',
			'Narrative integration as Flame Artifacts'
		],
		accentColor: '#10b981',
		glowColor: 'rgba(16,185,129,0.18)',
		icon: 'wrench'
	},
	{
		id: 'brand',
		number: '04',
		title: 'Brand & Product',
		subtitle: 'Material-world alliances.',
		loreTitle: 'Emberbound Goods',
		loreLabel: 'Artifacts and Sigils of the physical world.',
		idealFor: [
			'Merch & apparel brands',
			'Accessories',
			'Lifestyle brands',
			'Creator-focused brands'
		],
		theyOffer: [
			'Physical expressions of the world',
			'Event rewards & achievements',
			'Tangible identity'
		],
		weOffer: [
			'Lore-backed merchandise integration',
			'Limited-edition drops tied to nations',
			'Community-driven hype'
		],
		accentColor: '#f59e0b',
		glowColor: 'rgba(245,158,11,0.18)',
		icon: 'gem'
	},
	{
		id: 'media',
		number: '05',
		title: 'Media & Platform',
		subtitle: "Sanctyria's amplified voice.",
		loreTitle: 'Chroniclers of the Flame',
		loreLabel: "Spreading Sanctyria's influence beyond its borders.",
		idealFor: ['Streaming platforms', 'Media outlets', 'Podcasts', 'Event platforms'],
		theyOffer: ['Reach and amplification', 'Distribution channels', 'Visibility beyond community'],
		weOffer: [
			'Exclusive content',
			'Lore-rich programming',
			'Access to deeply engaged audiences',
			'Long-form narrative projects'
		],
		accentColor: '#3b82f6',
		glowColor: 'rgba(59,130,246,0.18)',
		icon: 'radio'
	},
	{
		id: 'events',
		number: '06',
		title: 'Event & Campaign',
		subtitle: 'Built around moments.',
		loreTitle: 'Flame Convergences',
		loreLabel: 'Moments that altered the realm.',
		idealFor: ['Launch events', 'Seasonal campaigns', 'Competitions', 'Charity initiatives'],
		theyOffer: ['Momentum & shared purpose', 'Time-bound energy'],
		weOffer: [
			'Co-branded events',
			'Unique lore arcs',
			'Rewards tied to participation',
			'Canon outcomes shaped by the event'
		],
		accentColor: '#ef4444',
		glowColor: 'rgba(239,68,68,0.18)',
		icon: 'star'
	},
	{
		id: 'education',
		number: '07',
		title: 'Educational & Knowledge',
		subtitle: 'Growth through wisdom.',
		loreTitle: 'Keepers of the Flame',
		loreLabel: 'Passing knowledge forward.',
		idealFor: ['Writing schools', 'Art academies', 'Coding bootcamps', 'Creative educators'],
		theyOffer: ['Skill development', 'Structured learning', 'Mentorship'],
		weOffer: [
			'Real-world application',
			'Engaged learners',
			'Gamified progression',
			'Recognition in a living world'
		],
		accentColor: '#06b6d4',
		glowColor: 'rgba(6,182,212,0.18)',
		icon: 'graduation-cap'
	},
	{
		id: 'strategic',
		number: '08',
		title: 'Strategic Alliances',
		subtitle: 'Rare. Deep. Intentional.',
		loreTitle: 'Pillars of Eternia',
		loreLabel: 'Foundations upon which the future is built.',
		idealFor: ['Studios & publishers', 'Long-term collaborators', 'Co-creators of IP'],
		theyOffer: ['Stability & shared vision', 'Expansion across media'],
		weOffer: [
			'Shared IP growth',
			'Cross-media worldbuilding',
			'Long-term revenue and legacy',
			'A universe that evolves with its partners'
		],
		accentColor: '#e879f9',
		glowColor: 'rgba(232,121,249,0.18)',
		icon: 'hexagon'
	}
];
