<script lang="ts">
    import { onMount } from 'svelte';
    import { fade, scale } from 'svelte/transition';
    import { db } from '$lib/firebase';
    import { doc, getDoc, updateDoc } from 'firebase/firestore';
    import { MINIMUM_BID_INCREMENT, currentSong, isModalOpen } from '$lib/stores/bid-store';

    let dialog: HTMLDialogElement;
    let localBid: number = $currentSong?.bid || 0;
    let errorMessage: string = '';
    let loading: boolean = false;
    let currentDbBid: number = localBid;

    $: minBid = currentDbBid + MINIMUM_BID_INCREMENT;
    $: if ($isModalOpen && dialog && !dialog.open) {
        dialog.showModal();
    }

    async function checkCurrentBid() {
        if (!$currentSong) return;
        
        const docRef = doc(db, 'songs', $currentSong.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            currentDbBid = docSnap.data().bid || 0;
            if (currentDbBid !== $currentSong.bid) {
                errorMessage = `Bid has changed! Minimum bid is now $${minBid}`;
                localBid = currentDbBid + MINIMUM_BID_INCREMENT;
            }
        }
    }

    async function updateBid() {
        if (!$currentSong) return;
        
        loading = true;
        errorMessage = '';
        
        try {
            await checkCurrentBid();
            
            if (localBid <= currentDbBid) {
                errorMessage = `Bid must be at least $${minBid}`;
                return;
            }

            const docRef = doc(db, 'songs', $currentSong.id);
            await updateDoc(docRef, {
                bid: localBid
            });

            $currentSong.bid = localBid;
            currentDbBid = localBid;
            errorMessage = 'Bid updated successfully!';
            
        } catch (error) {
            errorMessage = 'Error updating bid. Please try again.';
            console.error('Error:', error);
        } finally {
            loading = false;
        }
    }

    function incrementBid() {
        localBid += MINIMUM_BID_INCREMENT;
    }

    function decrementBid() {
        if (localBid > minBid) {
            localBid -= MINIMUM_BID_INCREMENT;
        }
    }

    function closeModal() {
        dialog?.close();
        $isModalOpen = false;
        $currentSong = null;
    }

    function handleClick(e: MouseEvent) {
        if (e.target === dialog) {
            closeModal();
        }
    }

    // Check current bid when modal opens
    onMount(() => {
        checkCurrentBid();
    });
</script>

<dialog
    bind:this={dialog}
    on:click={handleClick}
    class="modal"
>
    {#if $isModalOpen && $currentSong}
        <div 
            class="modal-content"
            transition:scale={{ duration: 200 }}
        >
            <button class="close-button" on:click={closeModal}>
                ✕
            </button>
            
            <h2>{$currentSong.song_name}</h2>
            <p class="artist">Artist: {$currentSong.song_artist}</p>
            
            <div class="bid-controls">
                <button 
                    on:click={decrementBid}
                    disabled={localBid <= minBid || loading}
                    class="bid-button"
                >
                    −
                </button>
                
                <div class="bid-amount">
                    <span class="currency">$</span>
                    <input 
                        type="number"
                        bind:value={localBid}
                        min={minBid}
                        step={MINIMUM_BID_INCREMENT}
                        disabled={loading}
                    />
                </div>
                
                <button 
                    on:click={incrementBid}
                    disabled={loading}
                    class="bid-button"
                >
                    +
                </button>
            </div>
            
            {#if errorMessage}
                <p class="error-message">{errorMessage}</p>
            {/if}
            
            <button 
                class="submit-button"
                on:click={updateBid}
                disabled={loading || localBid <= currentDbBid}
            >
                {loading ? 'Updating...' : 'Place Bid'}
            </button>
            
            <p class="min-bid-note">
                Minimum bid: ${minBid}
            </p>
        </div>
    {/if}
</dialog>

<style>
    .modal {
        padding: 0;
        max-width: 90%;
        width: 400px;
        border: none;
        border-radius: 8px;
        background: transparent;
    }

    .modal::backdrop {
        background: rgba(0, 0, 0, 0.5);
    }

    .modal-content {
        background-color: white;
        padding: 2rem;
        border-radius: 8px;
        position: relative;
    }

    .close-button {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        color: #666;
        font-size: 1.5rem;
        line-height: 1;
    }

    .close-button:hover {
        color: #333;
    }

    /* Rest of your styles remain the same */
</style>