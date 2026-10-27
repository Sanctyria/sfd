<script lang="ts">
	const currentYear = new Date().getFullYear();
</script>

<footer
	class="relative z-10 mt-auto w-full border-t border-white/5 bg-[#080809] px-6 py-16 font-body select-none sm:px-8"
>
	<div
		class="mx-auto grid max-w-7xl grid-cols-1 gap-10 border-b border-white/5 pb-12 text-left md:grid-cols-12 md:gap-8"
	>
		<div class="flex flex-col items-start space-y-4 md:col-span-5">
			<a
				href="/"
				class="flex items-center font-display text-2xl font-semibold tracking-tight text-white"
			>
				<img src="/assets/dlst.gif" alt="Sanctyria Logo" class="mr-2 h-6 w-6 object-contain" /><span
					>Sanctyria</span
				>
			</a>
			<p class="max-w-sm text-xs leading-relaxed text-white/40 sm:text-sm">
				Sanctyria is a dark fantasy universe and creative transmedia ecosystem built around the
				concept of creation as survival. Gather around the Eternal Flame to explore nations and
				build digital sanctuaries.
			</p>
		</div>
		<div class="grid grid-cols-2 gap-4 md:col-span-4">
			<div class="flex flex-col space-y-2">
				<span class="mb-1 font-mono text-[10px] tracking-widest text-[#f97316] uppercase"
					>Explore</span
				>
				<a href="/" class="text-xs text-white/50 transition-colors hover:text-[#f97316]">Home</a>
				<a href="/about" class="text-xs text-white/50 transition-colors hover:text-[#f97316]"
					>About Universe</a
				>
				<a href="/flameborns" class="text-xs text-white/50 transition-colors hover:text-[#f97316]"
					>Flameborns</a
				>
				<a href="/nations" class="text-xs text-white/50 transition-colors hover:text-[#f97316]"
					>Eight Nations</a
				>
			</div>
			<div class="flex flex-col space-y-2">
				<span class="mb-1 font-mono text-[10px] tracking-widest text-[#10b981] uppercase"
					>Ecosystem</span
				>
				<a href="/roadmap" class="text-xs text-white/50 transition-colors hover:text-[#10b981]"
					>Roadmap</a
				>
				<a href="/studio" class="text-xs text-white/50 transition-colors hover:text-[#10b981]"
					>Studio Workspace</a
				>
				<a
					href="https://world.sanctyria.com"
					class="text-xs text-white/50 transition-colors hover:text-[#10b981]">World of Sanctyria</a
				>
				<a href="/journal" class="text-xs text-white/50 transition-colors hover:text-[#10b981]"
					>Journal</a
				>
				<a href="/partnership" class="text-xs text-white/50 transition-colors hover:text-[#10b981]"
					>Partnerships</a
				>
				<a href="/reach-us" class="text-xs text-white/50 transition-colors hover:text-[#10b981]"
					>Reach Us</a
				>
			</div>
		</div>
		<div class="flex flex-col items-start space-y-4 md:col-span-3">
			<span class="font-mono text-[10px] tracking-widest text-[#a855f7] uppercase"
				>Realm Profiles</span
			>
			<div class="flex flex-wrap gap-3">
				<a
					href="https://discord.gg/sanctyria"
					target="_blank"
					rel="noopener noreferrer"
					class="rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-white/40 transition-colors hover:text-white"
					>Discord</a
				>
				<a
					href="https://x.com/sanctyria"
					target="_blank"
					rel="noopener noreferrer"
					class="rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-white/40 transition-colors hover:text-white"
					>X</a
				>
				<a
					href="https://youtube.com/@sanctyria"
					target="_blank"
					rel="noopener noreferrer"
					class="rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-white/40 transition-colors hover:text-white"
					>YouTube</a
				>
				<a
					href="https://open.spotify.com/artist/sanctyria"
					target="_blank"
					rel="noopener noreferrer"
					class="rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-white/40 transition-colors hover:text-white"
					>Spotify</a
				>
				<a
					href="https://tiktok.com/@sanctyria"
					target="_blank"
					rel="noopener noreferrer"
					class="rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-white/40 transition-colors hover:text-white"
					>TikTok</a
				>
				<a
					href="https://instagram.com/sanctyria"
					target="_blank"
					rel="noopener noreferrer"
					class="rounded-full border border-white/5 bg-white/5 px-3 py-1.5 text-xs text-white/40 transition-colors hover:text-white"
					>Instagram</a
				>
			</div>
		</div>
	</div>
	<div
		class="mx-auto flex max-w-7xl flex-col items-center justify-between pt-8 font-mono text-[10px] tracking-wider text-white/30 sm:flex-row"
	>
		<span>© {currentYear} SANCTYRIA.COM // ALL CODES SECURED</span>
		<span class="mt-2 uppercase sm:mt-0">Creation is Survival · Powered by the Eternal Flame</span>
	</div>
</footer>
