<script lang="ts">
    import { currentSong, isModalOpen } from '$lib/stores/bid-store';
    import type { Song } from '$lib/types/song';
    
    export let song: Song;
    export let isNextUp = false;

    function handleInteraction() {
        $currentSong = song;
        $isModalOpen = true;
    }
</script>

<button 
    class="song-button" 
    class:next-up={isNextUp}
    on:click={handleInteraction}
    on:keydown={(e) => e.key === 'Enter' && handleInteraction()}
    type="button"
    aria-label="Bid on {song.song_name} by {song.song_artist}"
>
    <h3>{song.song_name}</h3>
    <p>Artist: {song.song_artist}</p>
    <p>Current Bid: ${song.bid ?? 0}</p>
</button>

<style>
    .song-button {
        width: 100%;
        text-align: left;
        border: 1px solid #ccc;
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 4px;
        transition: all 0.3s ease;
        cursor: pointer;
        background-color: white;
        font-size: inherit;
    }

    .song-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .song-button:focus {
        outline: 2px solid #007bff;
        outline-offset: 2px;
    }

    .next-up {
        background-color: #e3f2fd;
        border-color: #90caf9;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        transform: scale(1.02);
    }

    .next-up h3 {
        color: #1976d2;
    }

    /* Reset button styles */
    .song-button h3,
    .song-button p {
        margin: 0.5rem 0;
    }

    .song-button h3 {
        font-size: 1.25rem;
        font-weight: bold;
    }
</style>