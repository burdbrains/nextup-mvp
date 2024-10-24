<script lang="ts">
    import { db } from '$lib/firebase';
    import {
        arrayRemove,
        arrayUnion,
        doc,
        setDoc,
        updateDoc,
        collection,
        getDocs
    } from 'firebase/firestore';


    async function allSongs(){
        const collectionRef = collection(db, 'songs');
        const querySnapshot = await getDocs(collectionRef);
        
        return querySnapshot;
    }

    console.log(allSongs());
</script>

<h1>Welcome to SvelteKit</h1>

<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
