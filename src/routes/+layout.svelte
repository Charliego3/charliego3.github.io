<script lang="ts">
	import "./layout.css";
	import favicon from "$lib/assets/favicon.svg";
	import { ModeWatcher } from "mode-watcher";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Toaster } from "$lib/components/ui/sonner/index.js";

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<ModeWatcher />
<Toaster position="top-right" />
<Tooltip.Provider>{@render children()}</Tooltip.Provider>
