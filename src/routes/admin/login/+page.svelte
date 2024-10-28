<script lang="ts">
    import { auth, db } from '$lib/firebase';
    import { signInWithEmailAndPassword } from 'firebase/auth';
    import { doc, setDoc } from 'firebase/firestore';
    import { goto } from '$app/navigation';
    import { user, isAdmin } from '$lib/stores/auth-store';

    let email = '';
    let password = '';
    let error = '';
    let loading = false;

    async function handleLogin() {
        loading = true;
        error = '';
        
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            
            // Create user document if it doesn't exist
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: userCredential.user.email,
                admin: false
            }, { merge: true });
            
            // Check admin status and redirect
            if ($isAdmin) {
                goto('/admin');
            } else {
                error = 'Not authorized as admin';
                auth.signOut();
            }
        } catch (e) {
            error = 'Invalid email or password';
        } finally {
            loading = false;
        }
    }
</script>

<div class="container">
    <div class="login-card">
        <h1>Admin Login</h1>
        
        <form on:submit|preventDefault={handleLogin}>
            <div class="input-group">
                <input
                    type="email"
                    bind:value={email}
                    placeholder="Email"
                    required
                />
            </div>
            
            <div class="input-group">
                <input
                    type="password"
                    bind:value={password}
                    placeholder="Password"
                    required
                />
            </div>
            
            {#if error}
                <p class="error">{error}</p>
            {/if}
            
            <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
            </button>
        </form>
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

    input:focus {
        outline: none;
        border-color: var(--neon-blue);
    }

    .error {
        color: #ff4444;
        text-align: center;
        margin: 1rem 0;
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
</style>
