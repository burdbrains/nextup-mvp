<script lang="ts">
    import { db, storage } from '$lib/firebase';
    import {
        collection,
        query,
        orderBy,
        limit,
        onSnapshot,
        type QuerySnapshot,
        type DocumentData
    } from 'firebase/firestore';
    import { getDownloadURL, ref } from 'firebase/storage';
    import { onMount, onDestroy } from 'svelte';
    import SongCard from '$lib/components/SongCard.svelte';
    import BidModal from '$lib/components/BidModal.svelte';
    import type { Song } from '$lib/types/song';

    let songs: Song[] = [];
    let nextUpSong: Song | null = null;
    let unsubscribeQueue: (() => void) | null = null;

    async function getImageUrl(songId: string): Promise<string> {
        try {
            const imageRef = ref(storage, `songs/${songId}.png`);
            return await getDownloadURL(imageRef);
        } catch (error) {
            console.error("Error loading image:", error);
            return ''; // Return empty string if image fails to load
        }
    }

    async function processSnapshot(snapshot: QuerySnapshot<DocumentData>): Promise<Song[]> {
        const songsWithImages = await Promise.all(
            snapshot.docs.map(async doc => ({
                id: doc.id,
                ...doc.data(),
                imageUrl: await getImageUrl(doc.id)
            } as Song))
        );
        return songsWithImages.sort((a, b) => (b.bid || 0) - (a.bid || 0));
    }

    function setupRealtimeListeners() {
        const collectionRef = collection(db, 'songs');
        
        // Set up real-time listener
        unsubscribeQueue = onSnapshot(collectionRef, async (snapshot) => {
            try {
                const processedSongs = await processSnapshot(snapshot);
                
                // Update next up song (highest bid)
                nextUpSong = processedSongs[0] || null;
                
                // Update remaining songs
                songs = processedSongs.slice(1);
                
            } catch (error) {
                console.error("Error processing real-time update:", error);
            }
        }, (error) => {
            console.error("Error in real-time listener:", error);
        });
    }

    onMount(() => {
        setupRealtimeListeners();
    });

    onDestroy(() => {
        // Clean up listener when component is destroyed
        if (unsubscribeQueue) {
            unsubscribeQueue();
        }
    });

    // No longer need handleBidUpdated since updates are real-time
    function handleBidUpdated() {
        // Keep this empty function to maintain compatibility with BidModal
        // or remove the handler if BidModal doesn't require it
    }
</script>

<div class="venue-header">
    <div class="venue-info">
        <svg class="location-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor"/>
        </svg>
        <h1>Victory Lap</h1>
    </div>
</div>

<div class="container">
    {#if nextUpSong}
        <div class="next-up-section">
            <h2 class="next-up-title">Next Up</h2>
            <div class="next-up-card">
                <SongCard song={nextUpSong} isNextUp={true} />
            </div>
        </div>
    {/if}

    <div class="queue-section">
        <h2>Queue</h2>
        {#each songs as song}
            <SongCard {song} />
        {/each}
    </div>
</div>

<BidModal on:bidUpdated={handleBidUpdated} />

<style>
    .venue-header {
        background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
        padding: 1rem 2rem;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .venue-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        max-width: 800px;
        margin: 0 auto;
    }

    .location-icon {
        color: var(--neon-blue);
        filter: drop-shadow(0 0 5px var(--neon-blue));
    }

    h1 {
        font-size: 2rem;
        margin: 0;
        color: var(--text-light);
        text-shadow: 0 0 10px var(--neon-blue);
    }

    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .next-up-section {
        margin-bottom: 2rem;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .next-up-title {
        color: var(--neon-blue);
        font-size: 1.5rem;
        margin-bottom: 1rem;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 2px;
        text-shadow: 0 0 10px var(--neon-blue);
    }

    .queue-section h2 {
        color: var(--text-light);
        font-size: 1.25rem;
        margin-bottom: 1rem;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .logo {
        height: 4rem; /* Adjust the height as needed */
    }
</style>