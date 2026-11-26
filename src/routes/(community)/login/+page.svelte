<script lang="ts">
	import CommunityAuthCard from '#lib/community/components/CommunityAuthCard.svelte';
</script>

<svelte:head>
	<title>Sign in | Sanctyria Community</title>
	<meta name="description" content="Sign in to your Sanctyria Community account." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main
	class="grid min-h-[100dvh] place-items-center px-0 py-0 sm:px-6 sm:py-8 md:min-h-[calc(100dvh-62px)] md:px-8"
>
	<CommunityAuthCard mode="login" />
</main>
