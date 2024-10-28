<script lang="ts">
    import { isAdmin, user } from '$lib/stores/auth-store';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    onMount(async () => {
        // Wait for auth state to be determined
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (!$user) {
            goto('/admin/login');
        } else if (!$isAdmin) {
            goto('/');
        }
    });
</script>

{#if $user && $isAdmin}
    <slot />
{:else}
    <div class="loading">
        Loading...
    </div>
{/if}

<style>
    .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        color: var(--text-light);
    }
</style>