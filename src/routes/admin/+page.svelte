<script lang="ts">
    import { db, storage } from '$lib/firebase';
    import {
        collection,
        getDocs,
        doc,
        updateDoc,
        addDoc,
        writeBatch
    } from 'firebase/firestore';
    import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
    import { onMount } from 'svelte';
    import type { Song } from '$lib/types/song';

    let songs: Song[] = [];
    let newSong = {
        song_name: '',
        song_artist: '',
        bid: 0
    };
    let selectedFile: File | null = null;
    let globalBidAmount = 0;
    let loading = false;
    let message = '';

    async function loadSongs() {
        const querySnapshot = await getDocs(collection(db, 'songs'));
        songs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Song));
    }

    async function updateSongBid(songId: string, newBid: number) {
        try {
            await updateDoc(doc(db, 'songs', songId), { bid: newBid });
            message = 'Bid updated successfully';
            await loadSongs();
        } catch (error) {
            message = 'Error updating bid';
            console.error(error);
        }
    }

    async function setAllBids() {
        try {
            loading = true;
            const batch = writeBatch(db);
            
            songs.forEach(song => {
                const songRef = doc(db, 'songs', song.id);
                batch.update(songRef, { bid: globalBidAmount });
            });
            
            await batch.commit();
            message = 'All bids updated successfully';
            await loadSongs();
        } catch (error) {
            message = 'Error updating bids';
            console.error(error);
        } finally {
            loading = false;
        }
    }

    async function addNewSong() {
        try {
            loading = true;
            
            // Add song document
            const docRef = await addDoc(collection(db, 'songs'), newSong);
            
            // Upload image if selected
            if (selectedFile) {
                const imageRef = ref(storage, `songs/${docRef.id}.png`);
                await uploadBytes(imageRef, selectedFile);
            }
            
            message = 'Song added successfully';
            newSong = { song_name: '', song_artist: '', bid: 0 };
            selectedFile = null;
            await loadSongs();
        } catch (error) {
            message = 'Error adding song';
            console.error(error);
        } finally {
            loading = false;
        }
    }

    function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            selectedFile = input.files[0];
        }
    }

    onMount(loadSongs);
</script>

<div class="container">
    <h1>Admin Dashboard</h1>
    
    <!-- Add New Song -->
    <section class="card">
        <h2>Add New Song</h2>
        <form on:submit|preventDefault={addNewSong}>
            <div class="input-group">
                <input
                    bind:value={newSong.song_name}
                    placeholder="Song Name"
                    required
                />
            </div>
            
            <div class="input-group">
                <input
                    bind:value={newSong.song_artist}
                    placeholder="Artist Name"
                    required
                />
            </div>
            
            <div class="input-group">
                <input
                    type="number"
                    bind:value={newSong.bid}
                    placeholder="Initial Bid"
                    min="0"
                />
            </div>
            
            <div class="input-group">
                <input
                    type="file"
                    accept="image/*"
                    on:change={handleFileSelect}
                />
            </div>
            
            <button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Song'}
            </button>
        </form>
    </section>
    
    <!-- Set All Bids -->
    <section class="card">
        <h2>Set All Bids</h2>
        <div class="input-group">
            <input
                type="number"
                bind:value={globalBidAmount}
                placeholder="New bid amount"
                min="0"
            />
            <button on:click={setAllBids} disabled={loading}>
                Set All Bids
            </button>
        </div>
    </section>
    
    <!-- Song List -->
    <section class="card">
        <h2>Manage Songs</h2>
        <div class="song-list">
            {#each songs as song}
                <div class="song-item">
                    <div class="song-info">
                        <h3>{song.song_name}</h3>
                        <p>{song.song_artist}</p>
                    </div>
                    
                    <div class="bid-control">
                        <input
                            type="number"
                            value={song.bid ?? 0}
                            on:change={(e) => updateSongBid(song.id, Number(e.currentTarget.value))}
                            min="0"
                        />
                    </div>
                </div>
            {/each}
        </div>
    </section>
    
    {#if message}
        <div class="message" class:error={message.includes('Error')}>
            {message}
        </div>
    {/if}
</div>

<style>
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    h1 {
        color: var(--text-light);
        margin-bottom: 2rem;
        text-align: center;
    }

    .card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    h2 {
        color: var(--text-light);
        margin-bottom: 1.5rem;
        font-size: 1.25rem;
    }

    .input-group {
        margin-bottom: 1rem;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: var(--text-light);
    }

    input[type="file"] {
        padding: 0.5rem;
    }

    button {
        width: 100%;
        padding: 0.75rem;
        background: var(--neon-blue);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.2s ease;
    }

    button:hover:not(:disabled) {
        box-shadow: 0 0 15px rgba(0, 194, 255, 0.5);
    }

    button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .song-list {
        display: grid;
        gap: 1rem;
    }

    .song-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
    }
</style>