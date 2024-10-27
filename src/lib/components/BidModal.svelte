<script lang="ts">
    import { onMount } from 'svelte';
    import { scale } from 'svelte/transition';
    import { db } from '$lib/firebase';
    import { doc, getDoc, updateDoc } from 'firebase/firestore';
    import { MINIMUM_BID_INCREMENT, currentSong, isModalOpen } from '$lib/stores/bid-store';

    let dialog: HTMLDialogElement;
    let userBid: number = MINIMUM_BID_INCREMENT;
    let errorMessage: string = '';
    let loading: boolean = false;
    let currentDbBid: number = $currentSong?.bid || 0;

    $: totalBid = (currentDbBid || 0) + userBid;
    $: minBid = MINIMUM_BID_INCREMENT;
    $: if ($isModalOpen && dialog && !dialog.open) {
        dialog.showModal();
    } else if (!$isModalOpen && dialog?.open) {
        dialog.close();
    }

    // Handle escape key globally
    function handleKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && dialog?.open) {
            closeModal();
        }
    }

    // Rest of your existing functions...
    async function checkCurrentBid() {
        if (!$currentSong) return;
        
        const docRef = doc(db, 'songs', $currentSong.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            const newDbBid = docSnap.data().bid || 0;
            if (newDbBid !== currentDbBid) {
                errorMessage = `Base bid has changed to $${newDbBid}`;
                currentDbBid = newDbBid;
            }
        }
    }

    async function updateBid() {
        if (!$currentSong) return;
        
        loading = true;
        errorMessage = '';
        
        try {
            await checkCurrentBid();
            
            if (userBid < minBid) {
                errorMessage = `Minimum bid increment is $${minBid}`;
                return;
            }

            const docRef = doc(db, 'songs', $currentSong.id);
            await updateDoc(docRef, {
                bid: totalBid
            });

            $currentSong.bid = totalBid;
            currentDbBid = totalBid;
            errorMessage = 'Bid updated successfully!';
            
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
        if (userBid > minBid) {
            userBid -= MINIMUM_BID_INCREMENT;
        }
    }

    function closeModal() {
        $isModalOpen = false;
        $currentSong = null;
        userBid = MINIMUM_BID_INCREMENT;
    }

    onMount(() => {
        checkCurrentBid();
    });
</script>

<svelte:window on:keydown={handleKeydown} />

<dialog
    bind:this={dialog}
    class="modal"
>
    {#if $isModalOpen && $currentSong}
        <form
            method="dialog"
            class="modal-content"
            on:submit|preventDefault={closeModal}
            transition:scale={{ duration: 200 }}
        >
            <button 
                type="button"
                class="close-button" 
                on:click={closeModal}
                aria-label="Close bid modal"
            >
                ✕
            </button>
            
            <h2>{$currentSong.song_name}</h2>
            <p class="artist">Artist: {$currentSong.song_artist}</p>
            
            <div class="bid-info">
                <p class="current-bid">Current Bid: ${currentDbBid}</p>
                <div class="bid-controls">
                    <button 
                        type="button"
                        on:click={incrementBid}
                        disabled={loading}
                        class="bid-button"
                        aria-label="Increase bid"
                    >
                        +
                    </button>
                    
                    <div class="bid-amount">
                        <label>
                            <span>Your Bid:</span>
                            <div class="input-wrapper">
                                <span class="currency" aria-hidden="true">$</span>
                                <input 
                                    type="number"
                                    bind:value={userBid}
                                    min={minBid}
                                    step={MINIMUM_BID_INCREMENT}
                                    disabled={loading}
                                    aria-label="Bid amount in dollars"
                                />
                            </div>
                        </label>
                    </div>
                    
                    <button 
                        type="button"
                        on:click={decrementBid}
                        disabled={userBid <= minBid || loading}
                        class="bid-button"
                        aria-label="Decrease bid"
                    >
                        −
                    </button>
                </div>

                <p class="total-bid">Total Bid: ${totalBid}</p>
            </div>
            
            {#if errorMessage}
                <p class="error-message" role="alert">{errorMessage}</p>
            {/if}
            
            <button 
                type="button"
                class="submit-button"
                on:click={updateBid}
                disabled={loading || userBid < minBid}
            >
                {loading ? 'Updating...' : 'Place Bid'}
            </button>
            
            <p class="min-bid-note">
                Minimum bid increment: ${minBid}
            </p>
        </form>
        
        <!-- Invisible button to handle backdrop clicks -->
        <button
            type="button"
            class="backdrop-button"
            on:click={closeModal}
            aria-label="Close modal"
        />
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

    .backdrop-button {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        border: none;
        cursor: default;
        z-index: -1;
    }

    .modal-content {
        background-color: white;
        padding: 2rem;
        border-radius: 8px;
        position: relative;
        text-align: center;
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

    h2 {
        margin: 0 0 0.5rem;
        color: #2c3e50;
    }

    .artist {
        color: #666;
        margin: 0 0 1.5rem;
        font-size: 0.9rem;
    }

    .bid-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .current-bid {
        font-size: 1.1rem;
        color: #2c3e50;
        margin: 0;
    }

    .total-bid {
        font-size: 1.2rem;
        font-weight: bold;
        color: #1976d2;
        margin: 0;
    }

    .bid-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        width: 100%;
        max-width: 200px;
    }

    .bid-button {
        background-color: #e3f2fd;
        border: none;
        border-radius: 50%;
        width: 2.5rem;
        height: 2.5rem;
        cursor: pointer;
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1976d2;
        transition: all 0.2s ease;
    }

    .bid-button:hover:not(:disabled) {
        background-color: #bbdefb;
    }

    .bid-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .bid-amount {
        width: 100%;
    }

    .bid-amount label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        width: 100%;
    }

    .bid-amount span {
        font-size: 0.9rem;
        color: #666;
    }

    .input-wrapper {
        display: flex;
        align-items: center;
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 0.5rem;
    }

    .currency {
        color: #2c3e50;
        margin-right: 0.25rem;
    }

    input {
        width: 100%;
        border: none;
        font-size: 1.25rem;
        text-align: center;
        padding: 0;
        margin: 0;
    }

    input:focus {
        outline: none;
    }

    .input-wrapper:focus-within {
        border-color: #1976d2;
    }

    .error-message {
        color: #dc3545;
        margin: 1rem 0;
        font-size: 0.9rem;
    }

    .submit-button {
        width: 100%;
        padding: 0.75rem;
        background-color: #1976d2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
        transition: background-color 0.2s ease;
    }

    .submit-button:hover:not(:disabled) {
        background-color: #1565c0;
    }

    .submit-button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
    }

    .min-bid-note {
        text-align: center;
        color: #666;
        margin: 1rem 0 0;
        font-size: 0.8rem;
    }
</style>