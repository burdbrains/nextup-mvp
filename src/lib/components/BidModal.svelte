<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { scale } from 'svelte/transition';
    import { db } from '$lib/firebase';
    import { doc, getDoc, updateDoc } from 'firebase/firestore';
    import { MINIMUM_BID_INCREMENT, currentSong, isModalOpen } from '$lib/stores/bid-store';

    const dispatch = createEventDispatcher();

    let dialog: HTMLDialogElement;
    let userBid: number = MINIMUM_BID_INCREMENT;
    let errorMessage: string = '';
    let loading: boolean = false;
    let currentDbBid: number = 0;

    $: if ($isModalOpen && dialog && !dialog.open) {
        dialog.showModal();
        currentDbBid = $currentSong?.bid || 0;
        errorMessage = '';
        userBid = MINIMUM_BID_INCREMENT;
    } else if (!$isModalOpen && dialog?.open) {
        dialog.close();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && dialog?.open) {
            closeModal();
        }
    }

    async function checkCurrentBid() {
        if (!$currentSong) return;
        
        const docRef = doc(db, 'songs', $currentSong.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const newDbBid = docSnap.data().bid || 0;
            if (newDbBid !== currentDbBid) {
                errorMessage = `Base bid has changed to $${newDbBid}`;
                currentDbBid = newDbBid;
                return false;
            }
            return true;
        }
        return false;
    }

    async function updateBid() {
        if (!$currentSong) return;
        
        loading = true;
        errorMessage = '';
        
        try {
            const currentBidValid = await checkCurrentBid();
            if (!currentBidValid) return;
            
            if (userBid < MINIMUM_BID_INCREMENT) {
                errorMessage = `Minimum bid increment is $${MINIMUM_BID_INCREMENT}`;
                return;
            }

            const newBidTotal = currentDbBid + userBid;
            const docRef = doc(db, 'songs', $currentSong.id);
            await updateDoc(docRef, {
                bid: newBidTotal
            });

            $currentSong.bid = newBidTotal;
            currentDbBid = newBidTotal;
            errorMessage = 'Bid successfully placed!';
            dispatch('bidUpdated');
            
        } catch (error) {
            errorMessage = 'Error updating bid. Please try again.';
            console.error('Error:', error);
        } finally {
            loading = false;
        }
    }

    function incrementBid() {
        userBid += MINIMUM_BID_INCREMENT;
    }

    function decrementBid() {
        if (userBid > MINIMUM_BID_INCREMENT) {
            userBid -= MINIMUM_BID_INCREMENT;
        }
    }

    function closeModal() {
        $isModalOpen = false;
        $currentSong = null;
        userBid = MINIMUM_BID_INCREMENT;
    }
</script>

<svelte:window on:keydown={handleKeydown} />

<dialog
    bind:this={dialog}
    class="modal"
>
    {#if $isModalOpen && $currentSong}
        <div 
            class="modal-content"
            transition:scale={{ duration: 200 }}
        >
            {#if $currentSong.imageUrl}
                <img 
                    class="song-image"
                    src={$currentSong.imageUrl} 
                    alt="{$currentSong.song_name} by {$currentSong.song_artist}"
                />
            {/if}
            
            <button 
                type="button"
                class="close-button" 
                on:click={closeModal}
                aria-label="Close bid modal"
            >
                ✕
            </button>

            <div class="song-details">
                <h2>{$currentSong.song_name}</h2>
                <p class="artist">{$currentSong.song_artist}</p>
                
                <div class="current-bid">
                    Current Bid: <span class="amount">${currentDbBid}</span>
                </div>

                <div class="bid-controls">
                    <button 
                        type="button"
                        on:click={decrementBid}
                        disabled={userBid <= MINIMUM_BID_INCREMENT || loading}
                        class="bid-button"
                        aria-label="Decrease bid"
                    >
                        −
                    </button>
                    
                    <div class="bid-input">
                        <span class="currency">$</span>
                        <input 
                            type="number"
                            bind:value={userBid}
                            min={MINIMUM_BID_INCREMENT}
                            step={MINIMUM_BID_INCREMENT}
                            disabled={loading}
                            aria-label="Bid amount in dollars"
                        />
                    </div>
                    
                    <button 
                        type="button"
                        on:click={incrementBid}
                        disabled={loading}
                        class="bid-button"
                        aria-label="Increase bid"
                    >
                        +
                    </button>
                </div>
            
                {#if errorMessage}
                    <p class={errorMessage === 'Bid successfully placed!' ? 'success-message' : 'error-message'} role="alert">
                        {errorMessage}
                    </p>
                {/if}
                
                <button 
                    type="button"
                    class="submit-button"
                    on:click={updateBid}
                    disabled={loading || userBid < MINIMUM_BID_INCREMENT}
                >
                    {loading ? 'Placing Bid...' : 'Place Bid'}
                </button>
            </div>
        </div>
    {/if}
</dialog>

<style>
    .modal {
        padding: 0;
        max-width: 90%;
        width: 400px;
        border: none;
        border-radius: 12px;
        background: transparent;
        color: var(--text-light);
    }

    .modal::backdrop {
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
    }

    .modal-content {
        background-color: #121212;
        border-radius: 12px;
        overflow: hidden;
        position: relative;
    }

    .song-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
    }

    .song-details {
        padding: 1.5rem;
    }

    .close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(0, 0, 0, 0.5);
        border: none;
        color: var(--text-light);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        transition: background-color 0.2s ease;
    }

    .close-button:hover {
        background: rgba(0, 0, 0, 0.7);
    }

    h2 {
        margin: 0;
        font-size: 1.5rem;
        color: var(--text-light);
    }

    .artist {
        margin: 0.25rem 0 1.5rem;
        color: var(--text-dimmed);
        font-size: 1rem;
    }

    .current-bid {
        text-align: center;
        margin-bottom: 1.5rem;
        font-size: 1.125rem;
    }

    .amount {
        color: var(--neon-blue);
        font-size: 1.5rem;
        font-weight: 700;
        text-shadow: 0 0 10px rgba(0, 194, 255, 0.5);
    }

    .bid-controls {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .bid-button {
        background-color: rgba(0, 194, 255, 0.1);
        border: 1px solid var(--neon-blue);
        color: var(--neon-blue);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .bid-button:hover:not(:disabled) {
        background-color: rgba(0, 194, 255, 0.2);
        box-shadow: 0 0 10px rgba(0, 194, 255, 0.3);
    }

    .bid-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .bid-input {
        flex: 1;
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 0.5rem 1rem;
    }

    .currency {
        color: var(--text-dimmed);
        margin-right: 0.5rem;
    }

    input {
        width: 100%;
        background: transparent;
        border: none;
        color: var(--text-light);
        font-size: 1.5rem;
        font-family: 'Poppins', sans-serif;
        font-weight: 700;
        text-align: center;
        padding: 0;
        margin: 0;
    }

    input:focus {
        outline: none;
    }

    .error-message {
        color: #ff4444;
        text-align: center;
        margin: 1rem 0;
        font-size: 0.875rem;
    }

    .success-message {
        color: #00ff88;
        text-align: center;
        margin: 1rem 0;
        font-size: 0.875rem;
        text-shadow: 0 0;
    }
</style>