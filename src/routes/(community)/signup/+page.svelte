<script lang="ts">
	import CommunityAuthCard from '#lib/community/components/CommunityAuthCard.svelte';
</script>

<svelte:head>
	<title>Create an account | Sanctyria Community</title>
	<meta name="description" content="Create an account to join the Sanctyria community." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="grid min-h-[calc(100dvh-62px)] place-items-center px-4 py-8 sm:px-6 md:px-8">
	<CommunityAuthCard mode="signup" />
</main>
