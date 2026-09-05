import { onMount } from "svelte";

export function useMediaQuery(query: string) {
    let matches = $state(false);

    onMount(() => {
        const media = window.matchMedia(query);
        matches = media.matches;

        const handler = (ev: MediaQueryListEvent) => { matches = ev.matches };
        media.addEventListener("change", handler);

        return () => media.removeEventListener("change", handler);
    });

    return {
        get matches() {
            return matches;
        },
    };
}

export const moblie_query = () => useMediaQuery('(max-width: 767px)');
