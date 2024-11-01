<script lang="ts">
    import { onMount } from 'svelte';
    import { auth, db } from '$lib/firebase';
    import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
    import { doc, setDoc, getDoc } from 'firebase/firestore';
    import { isAdmin } from '$lib/stores/auth-store';

    let error = '';
    let loading = false;

    onMount(() => {
        // Check if already logged in and admin
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists() && userDoc.data().admin === true) {
                    isAdmin.set(true);
                    window.location.href = '/admin';
                }
            }
        });
    });

    async function handleGoogleLogin() {
        loading = true;
        error = '';
        
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            
            // Create/update user document
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: userCredential.user.email,
                lastLogin: new Date()
            }, { merge: true });
            
            // Check if user is admin
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            
            if (userDoc.exists() && userDoc.data().admin === true) {
                isAdmin.set(true);
                window.location.href = '/admin';
            } else {
                error = 'Not authorized as admin';
                await auth.signOut();
                isAdmin.set(false);
            }
        } catch (e) {
            console.error('Login error:', e);
            error = 'Login failed. Please try again.';
            isAdmin.set(false);
        } finally {
            loading = false;
        }
    }
</script>

<div class="container">
    <div class="login-card">
        <h1>Admin Login</h1>
        
        <button 
            class="google-button" 
            on:click={handleGoogleLogin} 
            disabled={loading}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="google-icon">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        
        {#if error}
            <p class="error">{error}</p>
        {/if}
    </div>
</div>

<style>
    .container {
        max-width: 400px;
        margin: 2rem auto;
        padding: 1rem;
    }

    .login-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 2rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    h1 {
        text-align: center;
        color: var(--text-light);
        margin-bottom: 2rem;
    }

    .google-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        width: 100%;
        padding: 0.75rem;
        background: white;
        color: #757575;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-family: 'Roboto', sans-serif;
        transition: all 0.2s ease;
    }

    .google-button:hover:not(:disabled) {
        background: #f5f5f5;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .google-button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .google-icon {
        width: 24px;
        height: 24px;
    }

    .error {
        color: #ff4444;
        text-align: center;
        margin: 1rem 0;
        font-size: 0.875rem;
    }
</style>
