import { writable } from 'svelte/store';
import type { User } from 'firebase/auth';
import { auth, db } from '$lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const user = writable<User | null>(null);
export const isAdmin = writable<boolean>(false);

// Check if user is admin
export async function checkAdminStatus(uid: string) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            isAdmin.set(userDoc.data()?.admin === true);
        } else {
            isAdmin.set(false);
        }
    } catch (error) {
        console.error('Error checking admin status:', error);
        isAdmin.set(false);
    }
}

// Initialize auth state listener
auth.onAuthStateChanged(async (firebaseUser) => {
    user.set(firebaseUser);
    if (firebaseUser) {
        await checkAdminStatus(firebaseUser.uid);
    } else {
        isAdmin.set(false);
    }
});
