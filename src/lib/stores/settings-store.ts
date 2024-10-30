import { writable } from 'svelte/store';
import { db } from '$lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const maxBidIncrement = writable<number>(5);
export const minBidIncrement = writable<number>(1);

export async function loadSettings() {
    try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'bid'));
        if (settingsDoc.exists()) {
            const data = settingsDoc.data();
            maxBidIncrement.set(data.max_bid);
            minBidIncrement.set(data.min_inc);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}