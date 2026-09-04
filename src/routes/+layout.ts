// src/routes/+layout.ts
import type { LayoutLoad } from './$types';
import { exchanges } from "$lib/exchanges.svelte";

// export const prerender = true;

export const load: LayoutLoad = async ({ fetch }) => {
    const markets = await exchanges.load(fetch);
    return { markets }
};
