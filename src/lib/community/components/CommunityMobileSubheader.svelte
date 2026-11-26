<script lang="ts">
	import { ArrowLeft, RefreshCw } from '@lucide/svelte';

	interface Props {
		title: string;
		backHref: string;
		subtitle?: string;
		align?: 'center' | 'left';
		onRefresh?: () => void;
		refreshing?: boolean;
	}

	let {
		title,
		backHref,
		subtitle,
		align = 'center',
		onRefresh,
		refreshing = false
	}: Props = $props();
</script>

<header class="community-mobile-subheader">
	<a href={backHref} aria-label="Go back" class="subheader-back"><ArrowLeft size={20} /></a>
	<div class="subheader-title" class:align-left={align === 'left'}>
		<strong>{title}</strong>
		{#if subtitle}<small>{subtitle}</small>{/if}
	</div>
	{#if onRefresh}
		<button
			type="button"
			onclick={onRefresh}
			disabled={refreshing}
			aria-label="Refresh"
			class:refreshing
			class="subheader-refresh"><RefreshCw size={18} /></button
		>
	{:else}
		<span class="subheader-spacer" aria-hidden="true"></span>
	{/if}
</header>

<style>
	.community-mobile-subheader {
		display: none;
	}

	@media (max-width: 767px) {
		.community-mobile-subheader {
			position: sticky;
			z-index: 35;
			top: 0;
			display: flex;
			height: 58px;
			align-items: center;
			justify-content: space-between;
			width: 100vw;
			margin-left: calc(50% - 50vw);
			border-bottom: 1px solid rgba(255, 255, 255, 0.08);
			background: rgba(9, 10, 10, 0.97);
			padding: 0 16px;
			backdrop-filter: blur(16px);
		}

		.subheader-back,
		.subheader-refresh,
		.subheader-spacer {
			display: grid;
			width: 36px;
			height: 36px;
			flex: 0 0 36px;
			place-items: center;
			color: rgba(255, 255, 255, 0.78);
		}

		.subheader-title {
			display: flex;
			min-width: 0;
			flex: 1;
			flex-direction: column;
			align-items: center;
			gap: 2px;
			color: rgba(255, 255, 255, 0.95);
			text-align: center;
		}

		.subheader-title strong {
			overflow: hidden;
			font-size: 16px;
			font-weight: 600;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.subheader-title small {
			color: rgba(255, 255, 255, 0.42);
			font-size: 10px;
		}

		.subheader-title.align-left {
			align-items: flex-start;
			text-align: left;
		}

		.subheader-title.align-left strong {
			font-family: var(--font-display);
			font-size: 22px;
			font-weight: 400;
		}

		.subheader-refresh:disabled {
			opacity: 0.5;
		}

		.subheader-refresh.refreshing :global(svg) {
			animation: subheader-spin 800ms linear infinite;
		}
	}

	@keyframes subheader-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
