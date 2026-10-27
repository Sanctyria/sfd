<script lang="ts">
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<div
	class="relative min-h-screen overflow-hidden bg-[#10110f] text-[#f4f0e8] selection:bg-orange-300/30"
>
	<div class="pointer-events-none absolute inset-0 z-0 opacity-30" aria-hidden="true">
		<div
			class="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(118,75,52,0.2),transparent_45%)]"
		></div>
		<div
			class="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-size-[72px_72px]"
		></div>
	</div>

	<header
		class="relative z-10 mx-auto flex h-20 max-w-7xl items-center justify-between border-b border-white/10 px-5 sm:px-9 lg:px-12"
	>
		<a
			href="/"
			class="group flex items-center gap-3 text-left"
			aria-label="Return to Sanctyria home"
		>
			<img src="/assets/dlst.gif" alt="Sanctyria logo" class="h-9 w-9 object-contain" />
			<span class="font-display text-[22px] leading-none">Sanctyria</span>
			<span
				class="hidden border-l border-white/15 pl-3 font-mono text-[9px] tracking-[0.18em] text-white/40 uppercase sm:inline"
				>Journal / 01</span
			>
		</a>
		<div class="flex items-center gap-2 sm:gap-5">
			<a
				href="/studio"
				class="hidden items-center gap-2 font-mono text-[10px] tracking-[0.15em] text-white/50 uppercase transition-colors hover:text-white sm:flex"
			>
				Studio archive
			</a>
			<a
				href="/"
				class="flex items-center gap-2 border border-white/15 px-3 py-2 font-mono text-[9px] tracking-[0.12em] text-white/75 uppercase transition-colors hover:border-orange-200/50 hover:text-orange-100 sm:px-4"
			>
				<span class="hidden sm:inline">Return home</span><span class="sm:hidden">Home</span>
			</a>
		</div>
	</header>

	{@render children()}

	<footer class="relative z-10 border-t border-white/10">
		<div
			class="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 font-mono text-[8px] tracking-[0.15em] text-white/35 uppercase sm:flex-row sm:items-center sm:justify-between sm:px-9 lg:px-12"
		>
			<span
				>Sanctyria Journal <span class="px-1 text-orange-200/60">·</span> Stories still becoming</span
			>
			<a
				href="/studio"
				class="inline-flex items-center gap-2 self-start text-white/45 transition-colors hover:text-orange-100 sm:self-auto"
				>Explore the Studio archive <span aria-hidden="true">↗</span></a
			>
		</div>
	</footer>
</div>
