<script lang="ts">
    import {
        cancel_order,
        get_open_orders,
        get_positions
    } from "$lib/binance.svelte";
    import Kline from "$lib/components/Kline.svelte";
    import OrderAction from "$lib/components/OrderAction.svelte";
    import OrderBook from "$lib/components/OrderBook.svelte";
    import Orders from "$lib/components/Orders.svelte";
    import Positions from "$lib/components/Positions.svelte";
    import Blaze from "$lib/components/ui/Blaze.svelte";
    import ForceField from "$lib/components/ui/ForceField.svelte";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import { Market } from "$lib/exchanges.svelte";
    import { settings } from "$lib/settings.svelte";
    import { OrderWrapper, type Order } from "$lib/types.js";
    import type { JSONData, KlineUpDownStatus } from "$lib/websocket/types";
    import { Decimal } from "decimal.js";
    import {
        LineStyle,
        type IPriceLine,
        type ISeriesApi
    } from "lightweight-charts";
    import { onMount } from "svelte";

    let market = $state<Market>();
    let current_price = $state<Decimal>(new Decimal("0"));
    let kline_up_down_status = $state<KlineUpDownStatus>("UD");
    let kline_series = $state<ISeriesApi<'Candlestick'>>();
    let mark_price: Decimal = $state(new Decimal("0"));

    let opened_orders: OrderWrapper[] = $state([]);
    let positions: JSONData[] = $state([]);
    let can_close_long_size = $derived<Decimal>(positions.reduce((t: Decimal, p) => {
        if (p.positionSide !== "LONG") return t;
        return t.add(new Decimal(p.positionAmt));
    }, new Decimal("0")));
    let can_close_short_size = $derived<Decimal>(positions.reduce((t: Decimal, p) => {
        if (p.positionSide !== "SHORT") return t;
        return t.add(new Decimal(p.positionAmt).abs());
    }, new Decimal("0")));

    function refresh_position() {
        get_positions(market?.symbol_lower).then((data) => {
            if (!data) return;
            positions = data.filter((d: JSONData) => {
                return new Decimal(d.entryPrice).comparedTo(0) > 0 || new Decimal(d.positionAmt).comparedTo(0) > 0;
            });
        });
    }

    function refresh_opened_orders() {
        get_open_orders(market?.symbol_lower).then((data) => {
            if (!data) return;
            opened_orders = data.map((d: Order) => new OrderWrapper(d));
        });
    }

    function get_order_title(order: OrderWrapper) {
        const is_short = order.is_short();
        const is_buy = order.is_buy();
        let title = "";
        if (is_short && is_buy) {
            title = "平空";
        } else if (!is_short && !is_buy) {
            title = "平多";
        } else if (is_short) {
            title = "开空";
        } else {
            title = "开多";
        }
        return title;
    }

    let chart_line_map = new Map<string, IPriceLine>();
    $effect(() => {
        const order_ids = new Set(opened_orders.map(o => String(o.orderId)));
        for (const [order_id, line] of chart_line_map) {
            if (!order_ids.has(order_id)) {
                kline_series?.removePriceLine(line);
                chart_line_map.delete(order_id);
            }
        }

        for (const order of opened_orders) {
            const options = {
                price: Number(order.price),
                color: order.is_sell() ? '#26a69a' : '#ef5350',
                lineWidth: 1 as const,
                lineStyle: LineStyle.Dashed,
                axisLabelVisible: true,
                title: `${get_order_title(order)} ${order.origQty}`,
            };

            const existing = chart_line_map.get(order.orderId);
            if (existing) {
                existing.applyOptions(options);
            } else {
                const line = kline_series?.createPriceLine(options);
                if (line) chart_line_map.set(order.orderId, line);
            }
        }

        return () => {
            for (const [, line] of chart_line_map) {
                try {
                    kline_series?.removePriceLine(line);
                } catch {}
            }
            chart_line_map.clear();
        };
    });

    onMount(() => {
        refresh_position();
        refresh_opened_orders();
    });

    $effect(() => {
        settings.api_key;
        settings.api_secret;
        refresh_position();
        refresh_opened_orders();
    });

    function on_order(order: Order) {
        console.log("on_order: ", order)
        opened_orders.push(new OrderWrapper(order));
    }

    function do_cancel_order(orderId: string, symbol: string) {
        cancel_order(orderId, symbol).then(data => {
            if (!data || data.status !== "CANCELED") return;
            opened_orders = opened_orders.filter((o) => o.orderId !== data.orderId);
        })
    }

    let order_book_hiddened = $state(false);
</script>

<svelte:head>
    <title>{market?.parse_quote(current_price) + " |"} {market?.symbol}</title>
</svelte:head>
<!-- <ForceField refraction={30} rippleIntensity={0.05} rippleSpeed={2} class="md:h-full md:w-full"> -->
    <Blaze smoke={0.1} class="md:h-full md:w-full">
        <div class="h-full w-full flex flex-col md:gap-3 md:p-5 overflow-y-auto overflow-x-hidden md:overflow-hidden">
            <div class={`flex-none flex flex-col md:flex-row w-full md:gap-3 ${settings.is_invalid() ? "h-full" : "md:h-[80%]"}`}>
                <Kline bind:market bind:current_price bind:kline_up_down_status bind:kline_series></Kline>
                <div class="flex-none flex flex-col md:h-full md:border rounded-lg md:w-110 w-full">
                    {#if !order_book_hiddened}
                        <OrderBook {market} {current_price} bind:mark_price {kline_up_down_status}></OrderBook>
                        <Separator></Separator>
                    {/if}
                    <div class="flex-none h-82">
                        <OrderAction bind:order_book_hiddened {market} {current_price} {mark_price} {on_order} {refresh_position} {refresh_opened_orders} {can_close_long_size} {can_close_short_size}></OrderAction>
                    </div>
                </div>
            </div>
            {#if settings.api_key && settings.api_secret}
                <div class="flex-1 border-t md:border md:rounded-lg w-full flex md:flex-row flex-col">
                    <div class="flex-1 border-b min-h-20 md:border-b-0">
                        <Positions {market} {mark_price} {current_price} {positions}></Positions>
                    </div>
                    <!-- <Separator orientation="vertical"></Separator> -->
                    <div class="flex-none border-l-none md:border-l min-h-20 md:min-w-110 md:w-[40%] overflow-x-auto">
                        <Orders {opened_orders} {do_cancel_order} {get_order_title}></Orders>
                    </div>
                </div>
            {/if}
        </div>
    </Blaze>
<!-- </ForceField> -->
