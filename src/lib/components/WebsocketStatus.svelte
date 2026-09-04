<script lang="ts">
    import type { WebSocketStatus } from "$lib/websocket";

    let {
        status = $bindable(),
        bordered = true,
        size = 3,
    }: {
        status: WebSocketStatus;
        bordered?: boolean;
        size?: number;
    } = $props();

    let size_style = $derived(`width: calc(var(--spacing) * ${size}); height: calc(var(--spacing) * ${size})`);
    let container_class = $derived.by(() => {
        let classes = "hover:cursor-auto flex items-center justify-center";
        if (bordered) {
            classes += " size-8 shadow-xs border border-border bg-background bg-clip-padding rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-md dark:border-input dark:bg-input/30";
        }
        return classes;
    });
</script>

<div class={container_class}>
    {#if status === "idle"}
        <span class={`relative flex`} style={size_style}>
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
            <span style={size_style} class={`relative inline-flex rounded-full bg-sky-500`}></span>
        </span>
    {:else if status === "connecting"}
        <span class={`relative flex`} style={size_style}>
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
            <span style={size_style} class={`relative inline-flex rounded-full bg-orange-500`}></span>
        </span>
    {:else if status === "open"}
        <span style={size_style} class={`relative inline-flex rounded-full bg-emerald-600`}></span>
    {:else if status === "closed"}
        <span style={size_style} class={`relative inline-flex rounded-full bg-mist-600`}></span>
    {:else}
        <span style={size_style} class={`relative inline-flex rounded-full bg-red-600`}></span>
    {/if}
</div>
