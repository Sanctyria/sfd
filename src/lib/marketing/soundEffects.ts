type RoadmapSound =
	| 'hover'
	| 'whoosh'
	| 'click'
	| 'phase-reveal'
	| 'dot-ping'
	| 'cta-confirm'
	| 'milestone'
	| 'carousel-step';

let sharedAudioContext: AudioContext | null = null;
let loadingOscillator: OscillatorNode | null = null;
let loadingGain: GainNode | null = null;
let loadingLfo: OscillatorNode | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!sharedAudioContext) {
		const AudioContextClass = window.AudioContext;
		if (AudioContextClass) sharedAudioContext = new AudioContextClass();
	}
	if (sharedAudioContext?.state === 'suspended') {
		void sharedAudioContext.resume().catch(() => undefined);
	}
	return sharedAudioContext;
}

function playTone(
	context: AudioContext,
	frequency: number,
	endFrequency: number,
	duration: number,
	volume: number,
	waveform: OscillatorType = 'sine',
	startAt = context.currentTime
) {
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = waveform;
	oscillator.frequency.setValueAtTime(frequency, startAt);
	if (endFrequency > 0 && endFrequency !== frequency) {
		oscillator.frequency.exponentialRampToValueAtTime(endFrequency, startAt + duration);
	}
	gain.gain.setValueAtTime(volume, startAt);
	gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
	oscillator.connect(gain);
	gain.connect(context.destination);
	oscillator.start(startAt);
	oscillator.stop(startAt + duration + 0.02);
}

export function playDoorCloseSound() {
	const context = getAudioContext();
	if (!context) return;
	const oscillator = context.createOscillator();
	const filter = context.createBiquadFilter();
	const gain = context.createGain();
	oscillator.type = 'triangle';
	oscillator.frequency.setValueAtTime(180, context.currentTime);
	oscillator.frequency.exponentialRampToValueAtTime(45, context.currentTime + 0.6);
	filter.type = 'lowpass';
	filter.frequency.setValueAtTime(400, context.currentTime);
	filter.frequency.exponentialRampToValueAtTime(100, context.currentTime + 0.6);
	gain.gain.setValueAtTime(0.35, context.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.6);
	oscillator.connect(filter);
	filter.connect(gain);
	gain.connect(context.destination);
	oscillator.start();
	oscillator.stop(context.currentTime + 0.65);
}

export function playDoorOpenSound() {
	const context = getAudioContext();
	if (!context) return;
	const oscillator = context.createOscillator();
	const filter = context.createBiquadFilter();
	const gain = context.createGain();
	oscillator.type = 'sine';
	oscillator.frequency.setValueAtTime(100, context.currentTime);
	oscillator.frequency.exponentialRampToValueAtTime(520, context.currentTime + 0.7);
	filter.type = 'bandpass';
	filter.frequency.setValueAtTime(200, context.currentTime);
	filter.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.7);
	filter.Q.value = 2;
	gain.gain.setValueAtTime(0.12, context.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.75);
	oscillator.connect(filter);
	filter.connect(gain);
	gain.connect(context.destination);
	oscillator.start();
	oscillator.stop(context.currentTime + 0.8);
}

export function startTransitionHum() {
	const context = getAudioContext();
	if (!context) return;
	stopTransitionHum();
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	const filter = context.createBiquadFilter();
	const lfo = context.createOscillator();
	const lfoGain = context.createGain();
	oscillator.type = 'sawtooth';
	oscillator.frequency.setValueAtTime(80, context.currentTime);
	filter.type = 'lowpass';
	filter.frequency.value = 160;
	lfo.type = 'sine';
	lfo.frequency.setValueAtTime(6, context.currentTime);
	lfoGain.gain.setValueAtTime(0.05, context.currentTime);
	lfo.connect(lfoGain);
	lfoGain.connect(gain.gain);
	oscillator.connect(filter);
	filter.connect(gain);
	gain.connect(context.destination);
	gain.gain.setValueAtTime(0.08, context.currentTime);
	oscillator.start();
	lfo.start();
	loadingOscillator = oscillator;
	loadingGain = gain;
	loadingLfo = lfo;
}

export function stopTransitionHum() {
	if (loadingOscillator) {
		try {
			loadingOscillator.stop();
			loadingOscillator.disconnect();
		} catch {
			// The transition may already have stopped the oscillator.
		}
		loadingOscillator = null;
	}
	if (loadingLfo) {
		try {
			loadingLfo.stop();
			loadingLfo.disconnect();
		} catch {
			// The transition may already have stopped the oscillator.
		}
		loadingLfo = null;
	}
	loadingGain?.disconnect();
	loadingGain = null;
}

export function playNationSwitchTone(direction: 'next' | 'prev', volume = 1) {
	if (volume <= 0) return;
	const context = getAudioContext();
	if (!context) return;
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.connect(gain);
	gain.connect(context.destination);
	oscillator.type = 'sine';
	const startFrequency = direction === 'next' ? 220 : 440;
	const endFrequency = direction === 'next' ? 440 : 220;
	oscillator.frequency.setValueAtTime(startFrequency, context.currentTime);
	oscillator.frequency.exponentialRampToValueAtTime(endFrequency, context.currentTime + 0.25);
	gain.gain.setValueAtTime(0.08 * volume, context.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3);
	oscillator.start();
	oscillator.stop(context.currentTime + 0.35);
}

export function playFlamebornTone(name: string, volume = 1) {
	if (volume <= 0) return;
	const context = getAudioContext();
	if (!context) return;
	const settings: Record<string, [OscillatorType, number, number, number]> = {
		EMBERLYN: ['triangle', 90, 280, 0.6],
		KIAREN: ['sine', 110, 55, 0.8],
		LIBER: ['sine', 550, 1100, 0.4],
		SAPHYRAN: ['triangle', 380, 140, 0.5]
	};
	const tone = settings[name];
	if (!tone) return;
	const [waveform, startFrequency, endFrequency, duration] = tone;
	playTone(context, startFrequency, endFrequency, duration, 0.12 * volume, waveform);
}

function playNoiseWhoosh(context: AudioContext, now: number) {
	const bufferSize = Math.floor(context.sampleRate * 0.3);
	const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
	const samples = buffer.getChannelData(0);
	for (let index = 0; index < bufferSize; index += 1) samples[index] = Math.random() * 2 - 1;
	const source = context.createBufferSource();
	const filter = context.createBiquadFilter();
	const gain = context.createGain();
	source.buffer = buffer;
	filter.type = 'lowpass';
	filter.frequency.setValueAtTime(100, now);
	filter.frequency.exponentialRampToValueAtTime(800, now + 0.1);
	filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);
	gain.gain.setValueAtTime(0, now);
	gain.gain.linearRampToValueAtTime(0.02, now + 0.1);
	gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
	source.connect(filter);
	filter.connect(gain);
	gain.connect(context.destination);
	source.start(now);
	source.stop(now + 0.3);
}

export function playRoadmapSound(type: RoadmapSound) {
	const context = getAudioContext();
	if (!context) return;
	const now = context.currentTime;
	switch (type) {
		case 'hover':
			playTone(context, 500, 560, 0.04, 0.01, 'sine', now);
			break;
		case 'whoosh':
			playNoiseWhoosh(context, now);
			break;
		case 'click':
			playTone(context, 680, 130, 0.09, 0.045, 'sine', now);
			break;
		case 'phase-reveal':
			playTone(context, 110, 440, 0.55, 0.028, 'triangle', now);
			playTone(context, 880, 1320, 0.4, 0.016, 'sine', now + 0.15);
			break;
		case 'dot-ping':
			playTone(context, 660, 880, 0.08, 0.022, 'sine', now);
			break;
		case 'cta-confirm':
			[440, 554.37, 659.25, 880, 1108.73].forEach((frequency, index) => {
				const startAt = now + index * 0.07;
				const oscillator = context.createOscillator();
				const gain = context.createGain();
				oscillator.type = 'sine';
				oscillator.frequency.setValueAtTime(frequency, startAt);
				gain.gain.setValueAtTime(0, startAt);
				gain.gain.linearRampToValueAtTime(0.038, startAt + 0.01);
				gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.22);
				oscillator.connect(gain);
				gain.connect(context.destination);
				oscillator.start(startAt);
				oscillator.stop(startAt + 0.25);
			});
			break;
		case 'milestone':
			playTone(context, 60, 180, 0.7, 0.045, 'sawtooth', now + 0.1);
			playTone(context, 240, 720, 0.5, 0.022, 'triangle', now + 0.35);
			break;
		case 'carousel-step':
			playTone(context, 300, 600, 0.12, 0.02, 'sine', now);
			playTone(context, 880, 880, 0.12, 0.012, 'sine', now + 0.1);
			break;
	}
}
