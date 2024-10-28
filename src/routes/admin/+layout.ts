import { isAdmin, user } from '$lib/stores/auth-store';
import { redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load = async () => {
    // Wait a brief moment for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!get(user)) {
        throw redirect(302, '/admin/login');
    }
    
    if (!get(isAdmin)) {
        throw redirect(302, '/');
    }
    
    return {};
};
