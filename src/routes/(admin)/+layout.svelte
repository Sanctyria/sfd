<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';
	import {
		Activity,
		BookOpen,
		Building2,
		ChartNoAxesCombined,
		ChevronRight,
		Image,
		LayoutDashboard,
		UsersRound
	} from '@lucide/svelte';

	let { children, data }: LayoutProps = $props();
	const navigation = [
		{ href: '/core', label: 'Overview', icon: LayoutDashboard },
		{ href: '/core/users', label: 'Users', icon: UsersRound },
		{ href: '/core/communities', label: 'Communities', icon: Building2 },
		{ href: '/core/moderation', label: 'Moderation', icon: Activity },
		{ href: '/core/marketing', label: 'Marketing', icon: BookOpen },
		{ href: '/core/banners', label: 'Banners', icon: Image },
		{ href: '/core/analytics', label: 'Analytics', icon: ChartNoAxesCombined }
	];
	const currentSection = $derived(
		navigation.find((item) => item.href === page.url.pathname)?.label ??
			(page.url.pathname.startsWith('/core/banners/') ? 'Banners' : 'Administration')
	);
</script>

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
	<meta name="theme-color" content="#0a0b0a" />
</svelte:head>

<div class="core-shell">
	<aside class="core-sidebar">
		<a href="/home" class="core-brand" aria-label="Sanctyria Community home">
			<img class="core-brand-mark" src="/assets/dlst.gif" alt="" />
			<span><strong>Sanctyria</strong><small>CORE / ADMIN</small></span>
		</a>
		<div class="core-workspace-label">WORKSPACE</div>
		<nav aria-label="Administration">
			{#each navigation as item (item.href)}
				<a
					href={item.href}
					class:active={page.url.pathname === item.href}
					aria-current={page.url.pathname === item.href ? 'page' : undefined}
				>
					<item.icon size={17} strokeWidth={1.8} />
					<span>{item.label}</span>
					{#if page.url.pathname === item.href}<ChevronRight
							size={14}
							class="core-nav-current"
						/>{/if}
				</a>
			{/each}
		</nav>
		<div class="core-sidebar-footer">
			<div class="core-admin-avatar">{data.adminUser.displayName.slice(0, 1).toUpperCase()}</div>
			<div class="core-admin-identity">
				<strong>{data.adminUser.displayName}</strong>
				<small>Global administrator</small>
			</div>
			<a href="/" class="core-exit" aria-label="Return to Sanctyria website" title="Return to site">
				<ChevronRight size={16} />
			</a>
		</div>
	</aside>
	<div class="core-main">
		<header class="core-topbar">
			<div class="core-breadcrumb">
				<span>Core</span><ChevronRight size={13} /><strong>{currentSection}</strong>
			</div>
			<div class="core-topbar-right"><span class="core-status-dot"></span>System workspace</div>
		</header>
		<main class="core-content">
			{@render children()}
		</main>
	</div>
	<nav class="core-mobile-nav" aria-label="Mobile administration">
		{#each navigation as item (item.href)}
			<a href={item.href} class:active={page.url.pathname === item.href} aria-label={item.label}>
				<item.icon size={19} strokeWidth={1.8} />
				<span>{item.label}</span>
			</a>
		{/each}
	</nav>
</div>

<style>
	.core-shell {
		--core-bg: #0a0b0a;
		--core-panel: #111311;
		--core-border: rgba(255, 255, 255, 0.085);
		--core-muted: rgba(235, 235, 227, 0.48);
		--core-text: #edeee8;
		--core-accent: #f0a16c;
		display: grid;
		grid-template-columns: 238px minmax(0, 1fr);
		min-height: 100dvh;
		background: var(--core-bg);
		color: var(--core-text);
		font-family: var(--font-body);
	}

	.core-sidebar {
		position: sticky;
		top: 0;
		display: flex;
		height: 100dvh;
		flex-direction: column;
		border-right: 1px solid var(--core-border);
		padding: 25px 15px 16px;
		background: #0d0f0e;
	}

	.core-brand {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 1px 6px 29px;
		color: inherit;
		text-decoration: none;
	}

	.core-brand-mark {
		width: 37px;
		height: 37px;
		flex: 0 0 auto;
		object-fit: contain;
	}

	.core-brand strong,
	.core-brand small,
	.core-admin-identity strong,
	.core-admin-identity small {
		display: block;
	}

	.core-brand strong {
		font-family: var(--font-display);
		font-size: 19px;
		font-weight: 400;
	}

	.core-brand small,
	.core-workspace-label,
	.core-admin-identity small {
		color: var(--core-muted);
		font-family: var(--font-anton);
		font-size: 8px;
		letter-spacing: 0.16em;
	}

	.core-workspace-label {
		padding: 0 11px 10px;
	}

	.core-sidebar nav {
		display: grid;
		gap: 4px;
	}

	.core-sidebar nav a {
		display: flex;
		min-height: 42px;
		align-items: center;
		gap: 11px;
		border: 1px solid transparent;
		border-radius: 7px;
		padding: 0 10px;
		color: rgba(235, 235, 227, 0.58);
		font-size: 12px;
		text-decoration: none;
		transition:
			background 160ms ease,
			color 160ms ease,
			border-color 160ms ease;
	}

	.core-sidebar nav a:hover {
		background: rgba(255, 255, 255, 0.04);
		color: white;
	}

	.core-sidebar nav a.active {
		border-color: rgba(240, 161, 108, 0.17);
		background: rgba(240, 161, 108, 0.08);
		color: #f6c19f;
	}

	.core-sidebar nav a span {
		flex: 1;
	}

	:global(.core-nav-current) {
		opacity: 0.65;
	}

	.core-sidebar-footer {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: auto;
		border-top: 1px solid var(--core-border);
		padding: 16px 3px 1px;
	}

	.core-admin-avatar {
		display: grid;
		width: 34px;
		height: 34px;
		flex: 0 0 auto;
		place-items: center;
		border-radius: 50%;
		background: linear-gradient(145deg, #9d664b, #593f35);
		color: white;
		font-size: 12px;
	}

	.core-admin-identity {
		min-width: 0;
		flex: 1;
	}

	.core-admin-identity strong {
		overflow: hidden;
		color: rgba(255, 255, 255, 0.88);
		font-size: 11px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.core-admin-identity small {
		margin-top: 4px;
		font-family: var(--font-body);
		font-size: 9px;
		letter-spacing: 0;
	}

	.core-exit {
		display: grid;
		width: 29px;
		height: 29px;
		place-items: center;
		transform: rotate(180deg);
		color: var(--core-muted);
	}

	.core-main {
		min-width: 0;
	}

	.core-topbar {
		position: sticky;
		z-index: 5;
		top: 0;
		display: flex;
		height: 62px;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid var(--core-border);
		padding: 0 clamp(18px, 4vw, 50px);
		background: rgba(10, 11, 10, 0.92);
		backdrop-filter: blur(16px);
	}

	.core-breadcrumb,
	.core-topbar-right {
		display: flex;
		align-items: center;
		gap: 9px;
		color: var(--core-muted);
		font-size: 11px;
	}

	.core-breadcrumb strong {
		color: rgba(255, 255, 255, 0.83);
		font-weight: 500;
	}

	.core-topbar-right {
		font-size: 10px;
	}

	.core-status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #78a887;
		box-shadow: 0 0 10px rgba(120, 168, 135, 0.45);
	}

	.core-content {
		width: min(100%, 1440px);
		margin: 0 auto;
		padding: clamp(25px, 4vw, 48px) clamp(18px, 4vw, 50px) 60px;
	}

	.core-mobile-nav {
		display: none;
	}

	:global(.core-page-heading) {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 20px;
		margin-bottom: 28px;
	}

	:global(.core-eyebrow) {
		color: var(--core-accent);
		font-family: var(--font-anton);
		font-size: 8px;
		letter-spacing: 0.2em;
	}

	:global(.core-page-heading h1) {
		margin: 8px 0 0;
		font-family: var(--font-display);
		font-size: clamp(34px, 5vw, 47px);
		font-weight: 400;
		line-height: 1;
	}

	:global(.core-page-heading p) {
		max-width: 570px;
		margin: 10px 0 0;
		color: var(--core-muted);
		font-size: 12px;
		line-height: 1.7;
	}

	:global(.core-panel) {
		border: 1px solid var(--core-border);
		border-radius: 9px;
		background: linear-gradient(145deg, rgba(255, 255, 255, 0.027), rgba(255, 255, 255, 0.012));
	}

	:global(.core-panel-title) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 17px 19px;
		border-bottom: 1px solid var(--core-border);
	}

	:global(.core-panel-title h2) {
		margin: 0;
		font-family: var(--font-display);
		font-size: 20px;
		font-weight: 400;
	}

	:global(.core-muted) {
		color: var(--core-muted);
	}

	:global(.core-button) {
		display: inline-flex;
		min-height: 36px;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 1px solid rgba(240, 161, 108, 0.32);
		border-radius: 6px;
		padding: 0 12px;
		background: rgba(240, 161, 108, 0.1);
		color: #f4bd98;
		font-size: 11px;
		text-decoration: none;
		cursor: pointer;
	}

	:global(.core-button:hover:not(:disabled)) {
		background: rgba(240, 161, 108, 0.17);
	}

	:global(.core-button:disabled) {
		cursor: not-allowed;
		opacity: 0.42;
	}

	:global(.core-button.secondary) {
		border-color: var(--core-border);
		background: rgba(255, 255, 255, 0.035);
		color: rgba(255, 255, 255, 0.76);
	}

	:global(.core-button.danger) {
		border-color: rgba(234, 104, 92, 0.28);
		background: rgba(234, 104, 92, 0.08);
		color: #f0a29a;
	}

	:global(.core-field) {
		width: 100%;
		min-height: 38px;
		border: 1px solid var(--core-border);
		border-radius: 6px;
		padding: 9px 11px;
		background: rgba(0, 0, 0, 0.18);
		color: var(--core-text);
		font: inherit;
		font-size: 11px;
		outline: none;
	}

	:global(.core-field:focus) {
		border-color: rgba(240, 161, 108, 0.5);
	}

	:global(.core-error) {
		border: 1px solid rgba(234, 104, 92, 0.25);
		border-radius: 6px;
		padding: 11px 13px;
		background: rgba(234, 104, 92, 0.07);
		color: #f0a29a;
		font-size: 11px;
	}

	:global(.core-pill) {
		display: inline-flex;
		align-items: center;
		border: 1px solid var(--core-border);
		border-radius: 99px;
		padding: 4px 8px;
		color: rgba(255, 255, 255, 0.67);
		font-size: 9px;
		text-transform: capitalize;
	}

	:global(.core-pill.active),
	:global(.core-pill.published),
	:global(.core-pill.resolved) {
		border-color: rgba(120, 168, 135, 0.28);
		background: rgba(120, 168, 135, 0.08);
		color: #a8d0b3;
	}

	:global(.core-pill.suspended),
	:global(.core-pill.open) {
		border-color: rgba(240, 161, 108, 0.24);
		background: rgba(240, 161, 108, 0.07);
		color: #f3bb96;
	}

	:global(.core-pill.deleted),
	:global(.core-pill.dismissed),
	:global(.core-pill.archived) {
		border-color: rgba(234, 104, 92, 0.22);
		background: rgba(234, 104, 92, 0.06);
		color: #e8a19a;
	}

	@media (max-width: 900px) {
		.core-shell {
			grid-template-columns: 205px minmax(0, 1fr);
		}
	}

	@media (max-width: 700px) {
		.core-shell {
			display: block;
		}

		.core-sidebar {
			display: none;
		}

		.core-topbar {
			height: 54px;
			padding-inline: 18px;
		}

		.core-content {
			padding-bottom: 96px;
		}

		.core-mobile-nav {
			position: fixed;
			z-index: 20;
			right: 0;
			bottom: 0;
			left: 0;
			display: grid;
			grid-template-columns: repeat(7, minmax(0, 1fr));
			border-top: 1px solid var(--core-border);
			padding: 7px 3px calc(7px + env(safe-area-inset-bottom));
			background: rgba(13, 15, 14, 0.97);
			backdrop-filter: blur(18px);
		}

		.core-mobile-nav a {
			display: flex;
			min-width: 0;
			flex-direction: column;
			align-items: center;
			gap: 4px;
			padding: 6px 1px;
			color: var(--core-muted);
			font-size: 8px;
			text-decoration: none;
		}

		.core-mobile-nav a.active {
			color: #f4bd98;
		}

		:global(.core-page-heading) {
			align-items: flex-start;
			flex-direction: column;
			margin-bottom: 22px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.core-sidebar nav a {
			transition: none;
		}
	}
</style>
