<script lang="ts">
    import { db } from '$lib/firebase';
    import {
        collection,
        getDocs,
        query,
        orderBy,
        limit
    } from 'firebase/firestore';
    import { onMount } from 'svelte';
    import SongCard from '$lib/components/SongCard.svelte';
    import BidModal from '$lib/components/BidModal.svelte';
    import type { Song } from '$lib/types/song';

    let songs: Song[] = [];
    let nextUpSong: Song | null = null;

    async function getNextUpSong(): Promise<Song | null> {
        const collectionRef = collection(db, 'songs');
        const q = query(collectionRef, orderBy('bid', 'desc'), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) return null;
        
        return {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
        } as Song;
    }

    async function getRemainingongs(): Promise<Song[]> {
        const collectionRef = collection(db, 'songs');
        const querySnapshot = await getDocs(collectionRef);
        return querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Song))
            .filter(song => song.id !== nextUpSong?.id)
            .sort((a, b) => (b.bid || 0) - (a.bid || 0));
    }

    onMount(async () => {
        try {
            nextUpSong = await getNextUpSong();
            songs = await getRemainingongs();
            console.log("Next Up Song:", nextUpSong);
            console.log("Remaining Songs:", songs);
        } catch (error) {
            console.error("Error fetching songs:", error);
        }
    });
</script>

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

<BidModal />

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 1rem;
    }

    .next-up-section {
        margin-bottom: 2rem;
        padding: 1rem;
        background-color: #f8f9fa;
        border-radius: 8px;
    }

    .next-up-title {
        color: #2c3e50;
        font-size: 1.5rem;
        margin-bottom: 1rem;
        text-align: center;
    }

    .queue-section h2 {
        color: #2c3e50;
        font-size: 1.25rem;
        margin-bottom: 1rem;
    }
</style>