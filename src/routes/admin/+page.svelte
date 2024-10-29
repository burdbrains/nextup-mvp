<script lang="ts">
    import { onMount } from 'svelte';
    import { auth, db, storage } from '$lib/firebase';
    import { goto } from '$app/navigation';
    import { isAdmin, checkAdminStatus } from '$lib/stores/auth-store';
    import { 
        collection, 
        getDocs, 
        doc, 
        updateDoc, 
        addDoc, 
        deleteDoc,
        writeBatch,
        query,
        orderBy 
    } from 'firebase/firestore';
    import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
    import type { Song } from '$lib/types/song';

    let loading = true;
    let songs: Song[] = [];
    let globalBidAmount = 0;
    let message = '';
    let messageTimeout: NodeJS.Timeout;

    // New song form
    let newSong = {
        song_name: '',
        song_artist: '',
        bid: 0
    };
    let selectedFile: File | null = null;
    let uploadingNew = false;

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

            await loadSongs();
            loading = false;
        });

        return unsubscribe;
    });

    async function loadSongs() {
        const collectionRef = collection(db, 'songs');
        const q = query(collectionRef, orderBy('bid', 'desc'));
        const querySnapshot = await getDocs(q);
        
        songs = await Promise.all(querySnapshot.docs.map(async doc => {
            const imageUrl = await getImageUrl(doc.id);
            return {
                id: doc.id,
                ...doc.data(),
                imageUrl
            } as Song;
        }));
    }

    async function getImageUrl(songId: string): Promise<string> {
        try {
            const imageRef = ref(storage, `songs/${songId}.png`);
            return await getDownloadURL(imageRef);
        } catch (error) {
            return ''; // Return empty string if image fails to load
        }
    }

    async function updateSongBid(song: Song, newBid: number) {
        try {
            await updateDoc(doc(db, 'songs', song.id), { bid: newBid });
            showMessage('Bid updated successfully');
            await loadSongs();
        } catch (error) {
            showMessage('Error updating bid', true);
            console.error(error);
        }
    }

    async function setAllBids() {
        try {
            const batch = writeBatch(db);
            songs.forEach(song => {
                const songRef = doc(db, 'songs', song.id);
                batch.update(songRef, { bid: globalBidAmount });
            });
            
            await batch.commit();
            showMessage('All bids updated successfully');
            await loadSongs();
        } catch (error) {
            showMessage('Error updating bids', true);
            console.error(error);
        }
    }

    async function deleteSong(songId: string) {
        if (!confirm('Are you sure you want to delete this song?')) return;
        
        try {
            await deleteDoc(doc(db, 'songs', songId));
            showMessage('Song deleted successfully');
            await loadSongs();
        } catch (error) {
            showMessage('Error deleting song', true);
            console.error(error);
        }
    }

    function handleFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            selectedFile = input.files[0];
        }
    }

    async function addNewSong() {
        if (!selectedFile) {
            showMessage('Please select an image', true);
            return;
        }

        uploadingNew = true;
        try {
            // Add song document
            const docRef = await addDoc(collection(db, 'songs'), {
                song_name: newSong.song_name,
                song_artist: newSong.song_artist,
                bid: newSong.bid
            });
            
            // Upload image
            const imageRef = ref(storage, `songs/${docRef.id}.png`);
            await uploadBytes(imageRef, selectedFile);
            
            showMessage('Song added successfully');
            newSong = { song_name: '', song_artist: '', bid: 0 };
            selectedFile = null;
            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            
            await loadSongs();
        } catch (error) {
            showMessage('Error adding song', true);
            console.error(error);
        } finally {
            uploadingNew = false;
        }
    }

    function showMessage(msg: string, isError = false) {
        message = msg;
        if (messageTimeout) clearTimeout(messageTimeout);
        messageTimeout = setTimeout(() => message = '', 3000);
    }
</script>

<div class="container">
    <h1>Admin Dashboard</h1>
    
    <!-- Add New Song -->
    <section class="card">
        <h2>Add New Song</h2>
        <form on:submit|preventDefault={addNewSong} class="form-grid">
            <div class="input-group">
                <label for="song-name">Song Name</label>
                <input
                    id="song-name"
                    bind:value={newSong.song_name}
                    placeholder="Enter song name"
                    required
                />
            </div>
            
            <div class="input-group">
                <label for="artist">Artist</label>
                <input
                    id="artist"
                    bind:value={newSong.song_artist}
                    placeholder="Enter artist name"
                    required
                />
            </div>
            
            <div class="input-group">
                <label for="initial-bid">Initial Bid</label>
                <input
                    id="initial-bid"
                    type="number"
                    bind:value={newSong.bid}
                    min="0"
                    step="1"
                />
            </div>
            
            <div class="input-group">
                <label for="cover-image">Cover Image (.PNG Required)</label>
                <input
                    id="cover-image"
                    type="file"
                    accept="image/png"
                    on:change={handleFileSelect}
                    required
                />
            </div>
            
            <button type="submit" disabled={uploadingNew} class="submit-button">
                {uploadingNew ? 'Adding...' : 'Add Song'}
            </button>
        </form>
    </section>

    <!-- Global Bid Control -->
    <section class="card">
        <h2>Set All Bids</h2>
        <div class="bid-control">
            <input
                type="number"
                bind:value={globalBidAmount}
                min="0"
                step="1"
                placeholder="Enter amount"
            />
            <button on:click={setAllBids}>Set All Bids to ${globalBidAmount}</button>
        </div>
    </section>

    <!-- Manage Songs -->
    <section class="card">
        <h2>Manage Songs</h2>
        <div class="songs-grid">
            {#each songs as song}
                <div class="song-card">
                    {#if song.imageUrl}
                        <img src={song.imageUrl} alt={song.song_name} />
                    {/if}
                    <div class="song-info">
                        <h3>{song.song_name}</h3>
                        <p>{song.song_artist}</p>
                        <div class="bid-control">
                            <input
                                type="number"
                                value={song.bid ?? 0}
                                on:change={(e) => updateSongBid(song, Number(e.currentTarget.value))}
                                min="0"
                                step="1"
                            />
                        </div>
                        <button 
                            class="delete-button"
                            on:click={() => deleteSong(song.id)}
                        >
                            Delete Song
                        </button>
                    </div>
                </div>
            {/each}
        </div>
    </section>
</div>

{#if message}
    <div class="message" class:error={message.includes('Error')}>
        {message}
    </div>
{/if}

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1rem;
    }

    h1, h2 {
        color: var(--text-light);
        margin-bottom: 1.5rem;
    }

    .card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .form-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    .input-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    label {
        color: var(--text-light);
        font-size: 0.875rem;
    }

    input {
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: var(--text-light);
    }

    input:focus {
        outline: none;
        border-color: var(--neon-blue);
    }

    button {
        padding: 0.75rem 1.5rem;
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

    .submit-button {
        grid-column: 1 / -1;
    }

    .bid-control {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
    }

    .songs-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }

    .song-card {
        background: rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        overflow: hidden;
    }

    .song-card img {
        width: 100%;
        height: 200px;
        object-fit: cover;
    }

    .song-info {
        padding: 1rem;
    }

    .song-info h3 {
        margin: 0;
        color: var(--text-light);
    }

    .song-info p {
        color: var(--text-dimmed);
        margin: 0.5rem 0 1rem;
    }

    .delete-button {
        background: #ff4444;
        width: 100%;
    }

    .delete-button:hover {
        background: #ff6666;
        box-shadow: 0 0 15px rgba(255, 68, 68, 0.5);
    }

    .message {
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        padding: 1rem 2rem;
        border-radius: 6px;
        background: #00ff88;
        color: #000;
        animation: fadeIn 0.3s ease;
    }

    .message.error {
        background: #ff4444;
        color: white;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, 1rem); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }
</style>