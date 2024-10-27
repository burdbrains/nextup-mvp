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
    <div class="song-content">
        <div class="image-container">
            {#if song.imageUrl}
                <img 
                    src={song.imageUrl} 
                    alt="{song.song_name} by {song.song_artist}"
                    loading="lazy"
                />
            {:else}
                <div class="image-placeholder" />
            {/if}
        </div>
        <div class="song-info">
            <div class="text-content">
                <h3>{song.song_name}</h3>
                <p class="artist">{song.song_artist}</p>
            </div>
            <div class="bid-amount">
                ${song.bid ?? 0}
            </div>
        </div>
    </div>
</button>

<style>
    .song-button {
        width: 100%;
        text-align: left;
        border: none;
        padding: 0.75rem;
        margin: 0.5rem 0;
        border-radius: 8px;
        cursor: pointer;
        background-color: rgba(255, 255, 255, 0.05);
        font-family: 'Poppins', sans-serif;
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .song-button:hover {
        background-color: rgba(255, 255, 255, 0.1);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 194, 255, 0.2);
    }

    .song-content {
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .image-container {
        width: 60px;
        height: 60px;
        border-radius: 4px;
        overflow: hidden;
        flex-shrink: 0;
    }

    .image-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .image-placeholder {
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.1);
    }

    .song-info {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 0;
    }

    .text-content {
        flex: 1;
        min-width: 0;
    }

    h3 {
        margin: 0;
        font-size: 1rem;
        color: var(--text-light);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .artist {
        margin: 0.25rem 0 0;
        font-size: 0.875rem;
        color: var(--text-dimmed);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .bid-amount {
        font-size: 1.25rem;
        color: var(--neon-blue);
        font-weight: 700;
        margin-left: 1rem;
        text-shadow: 0 0 10px rgba(0, 194, 255, 0.5);
    }

    .next-up {
        background-color: rgba(0, 194, 255, 0.1);
        border-color: var(--neon-blue);
    }

    .next-up:hover {
        box-shadow: 0 4px 12px rgba(0, 194, 255, 0.3);
    }

    .next-up .bid-amount {
        font-size: 1.5rem;
    }
</style>