<script lang="ts">
    import { db } from '$lib/firebase';
    import {
        arrayRemove,
        arrayUnion,
        doc,
        setDoc,
        updateDoc,
        collection,
        getDocs
    } from 'firebase/firestore';
    import { connectStorageEmulator } from 'firebase/storage';
    import { onMount } from 'svelte';

    // Define the interface for a song
    interface Song {
        id: string;
        title: string;
        artist: string;
        bid?: number;  // optional field
    }

    // Initialize songs array with the correct type
    let songs: Song[] = [];

    async function allSongs(): Promise<Song[]> {
        const collectionRef = collection(db, 'songs');
        const querySnapshot = await getDocs(collectionRef);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Song));  // Type assertion to Song
    }

    onMount(async () => {
        try {
            songs = await allSongs();
            console.log("Firebase Output:", songs);
        } catch (error) {
            console.error("Error fetching songs:", error);
        }
    });
</script>

<h1>SvelteKit App</h1>

{#each songs as song}
    <div class="song">
        <h3>{song.title}</h3>
        <p>Artist: {song.artist}</p>
        <p>Current Bid: ${song.bid ?? 0}</p>
    </div>
{/each}

<style>
    .song {
        border: 1px solid #ccc;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
    }
</style>