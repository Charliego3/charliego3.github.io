<script lang="ts">
    import WebsocketStatus from "$lib/components/WebsocketStatus.svelte";
    import type { Market } from "$lib/exchanges.svelte";
    import {
        WebSocketClient,
        websocketManager,
        type KlineUpDownStatus,
        type WebsocketHandler,
        type WebSocketMessage,
        type WebsocketParams,
    } from "$lib/websocket";
    import { ArrowDownToDot, ArrowUpDown, ArrowUpFromDot } from '@lucide/svelte';
    import { Decimal } from "decimal.js";
    import { untrack } from "svelte";

    interface Props {
        market: Market | undefined;
        current_price: Decimal;
        kline_up_down_status: KlineUpDownStatus;
        levels?: number;
        mark_price: Decimal;
    }

    let {
        market,
        current_price,
        kline_up_down_status,
        levels = 20,
        mark_price = $bindable(new Decimal("0")),
    }: Props = $props();

    let asks: unknown[][] = $state([]);
    let bids: unknown[][] = $state([]);
    let aske: Element | undefined = $state();

    class DepthHandler implements WebsocketHandler {
        supported(_: string, message: WebSocketMessage): boolean {
            if (!message.data || !message.data.e) return false;
            return message.data.e === "depthUpdate";
        }

        handle(message: WebSocketMessage): void {
            asks = Array.from(message.data.a).reverse() as unknown[][];
            bids = message.data.b;
            if (aske) aske.scrollTop = aske?.scrollHeight;
        }
    }

    class MarkPriceHandler implements WebsocketHandler {
        supported(_: string, message: WebSocketMessage): boolean {
            if (!message.data || !message.data.e) return false;
            return message.data.e === "markPriceUpdate";
        }

        handle(message: WebSocketMessage): void {
            mark_price = new Decimal(message.data.p);
        }
    }

    let public_stream = $state<WebSocketClient>();
    let market_stram = $state<WebSocketClient>();

    $effect(() => {
        const depth_param: WebsocketParams = {
            method: "SUBSCRIBE",
            params: [`${market?.symbol_lower}@depth${levels}@500ms`],
            id: `subscribe_${market?.symbol_lower}_depth${levels}_500ms`,
        };

        let unsubscribe_depth = () => {};
        untrack(() => {
            public_stream = websocketManager.public_stream();
            if (public_stream) {
                unsubscribe_depth = public_stream.subscribe(new DepthHandler());
                public_stream.send(depth_param);
            }
        });

        return () => {
            unsubscribe_depth();
            public_stream?.send_unsubscribe(depth_param);
        }
    });

    $effect(() => {
        const mark_price_param: WebsocketParams = {
            method: "SUBSCRIBE",
            params: [`${market?.symbol_lower}@markPrice@1s`],
            id: `subscribe_${market?.symbol_lower}_mark_price_1s`,
        };

        let unsubscribe_mark_price = () => {};
        untrack(() => {
            market_stram = websocketManager.market_stream();
            if (market_stram) {
                unsubscribe_mark_price = market_stram.subscribe(new MarkPriceHandler());
                market_stram.send(mark_price_param);
            }
        });

        return () => {
            unsubscribe_mark_price();
            market_stram?.send_unsubscribe(mark_price_param);
        };
    });
</script>

<div class="flex flex-col h-full max-h-79 md:max-h-full min-h-0 gap-2 justify-between">
    <div bind:this={aske} class="flex-1 flex flex-col min-h-0 overflow-hidden pt-1">
        {#each asks as ask}
            <div class="flex justify-between text-sm leading-6 px-3 border border-transparent hover:border-[#26a69a]/50 hover:cursor-pointer">
                <span class="text-[#26a69a]">{ask[0]}</span>
                <span class="dark:text-gray-500">{ask[1]}</span>
            </div>
        {/each}
    </div>
    <div class="flex-none flex text-bold text-lg px-3 gap-2 items-center">
        <WebsocketStatus status={public_stream?.getStatus() ?? "idle"} bordered={false} size={2}/>
        <span class={kline_up_down_status === "DOWN" ? "text-[#26a69a]" : (kline_up_down_status === "UP" ? "text-[#ef5350]" : "")}>{market?.parse_quote(current_price)}</span>
        {#if current_price && kline_up_down_status === "UP"}
            <ArrowUpFromDot size={13} color={"#ef5350"} strokeWidth={3}/>
        {:else if current_price && kline_up_down_status === "DOWN"}
            <ArrowDownToDot size={13} color={"#26a69a"} strokeWidth={3}/>
        {:else if current_price}
            <ArrowUpDown size={14} strokeWidth={2.5}></ArrowUpDown>
        {/if}
        <span class="text-mist-500 text-xs pl-4">{market?.parse_quote(mark_price)}</span>
    </div>
    <div class="flex-1 flex flex-col min-h-0 overflow-hidden pb-1">
        {#each bids as bid}
            <div class="flex justify-between text-sm leading-6 px-3 border border-transparent hover:border-[#ef5350]/50 hover:cursor-pointer">
                <span class="text-[#ef5350]">{bid[0]}</span>
                <span class="dark:text-gray-500">{bid[1]}</span>
            </div>
        {/each}
    </div>
</div>
