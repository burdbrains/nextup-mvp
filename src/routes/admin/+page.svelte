<script lang="ts">
    import { onMount } from 'svelte';
    import { auth } from '$lib/firebase';
    import { goto } from '$app/navigation';
    import { isAdmin, checkAdminStatus } from '$lib/stores/auth-store';

    let loading = true;

    onMount(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (!user) {
                goto('/admin/login');
                return;
            }

            const adminStatus = await checkAdminStatus(user.uid);
            if (!adminStatus) {
                goto('/');
                return;
            }

            loading = false;
        });

        // Return the cleanup function directly, not in a Promise
        return unsubscribe;
    });
</script>

{#if loading}
    <div class="loading">Loading...</div>
{:else}
    <div class="container">
        <h1>Admin Dashboard</h1>
        <p>Welcome to the admin panel</p>
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

    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    h1 {
        color: var(--text-light);
        margin-bottom: 2rem;
    }
</style>