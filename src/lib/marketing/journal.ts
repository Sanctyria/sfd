export interface JournalArticle {
	slug: string;
	title: string;
	dek: string;
	category: string;
	date: string;
	readTime: string;
	image: string;
	imageAlt: string;
	imageNote: string;
	sections: { heading?: string; paragraphs: string[] }[];
	pullQuote: string;
}

export const journalArticles: JournalArticle[] = [
	{
		slug: 'the-flame-that-remembers',
		title: 'The Flame That Remembers',
		dek: 'In Sanctyria, a flame is more than a beginning. It is a promise carried forward, one small act of courage at a time.',
		category: 'Worldbuilding',
		date: 'October 18, 2026',
		readTime: '5 min read',
		image:
			'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1800&q=85',
		imageAlt: 'A distant mountain range rising through a veil of cloud',
		imageNote: 'A study in distance and return · Unsplash',
		pullQuote:
			'A living world is not remembered by what it keeps, but by what it chooses to carry.',
		sections: [
			{
				paragraphs: [
					'Every world has a first light. Sanctyria began with a harder question: what happens to that light after the people who first saw it are gone?',
					'The Eternal Flame is not a crown, a weapon, or a shortcut through darkness. It is a record of choices. It gathers the things a people decide are worth protecting: a name spoken aloud, a door left open, a promise kept when no one is watching. Its warmth is real, but so is the responsibility it asks of those who stand near it.'
				]
			},
			{
				heading: 'What survives the telling',
				paragraphs: [
					'That idea changed how we approached the world’s oldest stories. We did not want history to feel like a polished monument. Memory in Sanctyria is personal and imperfect. Two people can carry the same event and remember different truths about it; both can be honest, and both can matter.',
					'The Flameborns inherit that tension. Their gift is not certainty. It is the chance to listen closely enough to understand what came before, then decide what deserves to continue. A spark can illuminate a path, but it cannot walk it for you.'
				]
			},
			{
				heading: 'A promise, not an answer',
				paragraphs: [
					'When we write about the Flame now, we return to the smallest scale: one person choosing to make tomorrow possible for someone else. That is where a legend becomes more than lore. It becomes something the reader can recognize in their own life.',
					'Sanctyria’s first light is still burning. The interesting question is never who owns it. It is what we will do with the warmth we have been given.'
				]
			}
		]
	},
	{
		slug: 'eight-nations-one-sky',
		title: 'Eight Nations, One Sky',
		dek: 'A map can show where a border runs. It takes a people to tell you what that border means.',
		category: 'Field Notes',
		date: 'October 11, 2026',
		readTime: '4 min read',
		image:
			'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=85',
		imageAlt: 'A quiet alpine lake reflecting the surrounding mountains',
		imageNote: 'A landscape shaped by water and weather · Unsplash',
		pullQuote: 'The land gives each nation a different question. Their answers make a world.',
		sections: [
			{
				paragraphs: [
					'Eight nations can sound like a number on a map. We wanted it to feel like eight different ways of waking up in the morning.',
					'So we start with the ground beneath people’s feet. What does the air smell like after rain? Which paths are safe in winter? Where do you go when you need to be alone, and where does everyone gather when there is news? The answers change how a community builds, trades, celebrates, and remembers.'
				]
			},
			{
				heading: 'Culture lives in the details',
				paragraphs: [
					'A landscape is never just scenery. It shapes the practical knowledge people pass between generations: how to read a cloud bank, how to store a harvest, how far a traveler can walk before the light changes. Those habits become customs. Customs become stories. Eventually, the stories tell you what a nation fears losing.',
					'That is why we try to build outward from lived experience instead of assigning each place a single defining trait. No nation is only its climate, its history, or its most famous export. There are always disagreements inside the borders, and always unexpected kinship across them.'
				]
			},
			{
				heading: 'Room for the unknown',
				paragraphs: [
					'A useful world map is not an inventory of everything. It is an invitation to look closer. The edges between known places are where travelers, rumors, and new ideas meet.',
					'Eight nations share one sky, but they do not share one story. We hope you will find a corner of the map that feels like home, and another that makes you curious enough to keep walking.'
				]
			}
		]
	},
	{
		slug: 'finding-the-sound-of-sanctyria',
		title: 'Finding the Sound of Sanctyria',
		dek: 'Before a melody can belong to a place, it has to learn how that place breathes.',
		category: 'In the Studio',
		date: 'October 4, 2026',
		readTime: '6 min read',
		image:
			'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1400&q=85',
		imageAlt: 'A broad ocean horizon beneath a soft, clouded sky',
		imageNote: 'The space between a wave and its echo · Unsplash',
		pullQuote: 'The most recognizable theme might be the one that knows when not to play.',
		sections: [
			{
				paragraphs: [
					'A soundtrack can tell you what to feel. We were more interested in what it could help you notice.',
					'When we began shaping Sanctyria’s music, we listened for the spaces between events: the hush before a door opens, the long breath after a difficult choice, the steady rhythm of a place that has been here longer than anyone alive. Those silences gave us a starting point before a single instrument did.'
				]
			},
			{
				heading: 'A world in recurring notes',
				paragraphs: [
					'We built the soundscape from small motifs rather than one grand anthem. A few notes can return in a new key, lose their percussion, or arrive almost unrecognizable beneath another character’s theme. The change matters as much as the melody. It lets music remember without simply repeating itself.',
					'Texture matters, too. A polished orchestral line can sit beside a rough breath or an unexpected silence. That contrast keeps the music human. It reminds us that the world is not a finished painting; it is a place being lived in while the story unfolds.'
				]
			},
			{
				heading: 'Listening for what belongs',
				paragraphs: [
					'The final test is simple: does the music make the scene feel more like itself? If it asks for attention when the moment needs space, we take it away. If one quiet phrase can carry a character’s history without explaining it, we let that phrase stay.',
					'Sanctyria’s sound is still growing alongside the world. For now, we keep listening for the note that feels less composed than discovered.'
				]
			}
		]
	}
];
