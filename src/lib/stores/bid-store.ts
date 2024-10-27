import { writable } from 'svelte/store';
import type { Song } from '$lib/types/song';

export const MINIMUM_BID_INCREMENT = 1; // You can adjust this value
export const currentSong = writable<Song | null>(null);
export const isModalOpen = writable(false);