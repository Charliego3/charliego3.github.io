<script lang="ts">
    import {
        cancel_order,
        get_open_orders,
        get_positions
    } from "$lib/binance.svelte";
    import Kline from "$lib/components/Kline.svelte";
    import OrderAction from "$lib/components/OrderAction.svelte";
    import OrderBook from "$lib/components/OrderBook.svelte";
    import Blaze from "$lib/components/ui/Blaze.svelte";
    import ForceField from "$lib/components/ui/ForceField.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import { Separator } from "$lib/components/ui/separator/index.js";
    import * as Table from "$lib/components/ui/table/index.js";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import { Market } from "$lib/exchanges.svelte";
    import { settings } from "$lib/settings.svelte";
    import { type Order, OrderWrapper } from "$lib/types.js";
    import type { JSONData, KlineUpDownStatus } from "$lib/websocket/types";
    import {
        Trash2
    } from "@lucide/svelte";
    import dayjs from 'dayjs';
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
            opened_orders = data;
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
</script>

<svelte:head>
    <title>{current_price + " |"} {market?.symbol}</title>
</svelte:head>
<ForceField refraction={30} rippleIntensity={0.05} rippleSpeed={2} class="h-full w-full">
    <Blaze smoke={0.2} class="h-full w-full">
        <div class="h-full w-full flex flex-col gap-3 p-5 overflow-y-auto overflow-x-hidden md:overflow-hidden">
            <div class={`flex-none flex flex-col md:flex-row w-full gap-3 ${settings.is_invalid() ? "h-full" : "md:h-[80%]"}`}>
                <Kline bind:market bind:current_price bind:kline_up_down_status bind:kline_series></Kline>
                <div class="flex-none flex flex-col md:h-full border rounded-lg md:w-110 w-full">
                    <OrderBook {market} {current_price} bind:mark_price {kline_up_down_status}></OrderBook>
                    <Separator></Separator>
                    <div class="flex-none h-82">
                        <OrderAction {market} {current_price} {mark_price} {on_order} {refresh_opened_orders} {can_close_long_size} {can_close_short_size}></OrderAction>
                    </div>
                </div>
            </div>
            {#if !settings.is_invalid()}
                <div class="flex-none border rounded-lg w-full flex md:flex-row flex-col">
                    <div class="flex-1 border-b-1 md:border-b-0">
                        <Table.Root class="text-xs">
                            <Table.Header>
                                <Table.Row>
                                    <Table.Head>合约</Table.Head>
                                    <Table.Head>合约方向</Table.Head>
                                    <Table.Head>持仓数量</Table.Head>
                                    <Table.Head>开仓价格</Table.Head>
                                    <Table.Head>标记价格</Table.Head>
                                    <Table.Head>当前价差</Table.Head>
                                    <Table.Head>未实现盈亏<span class="pl-1 text-[8px] text-muted-foreground">(回报率)</span></Table.Head>
                                    <Table.Head>强平价格</Table.Head>
                                    <Table.Head>初始保证金</Table.Head>
                                    <Table.Head>操作</Table.Head>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {#each positions as p}
                                    <Table.Row>
                                        {const is_long = p.positionSide === "LONG"}
                                        <Table.Cell>{p.symbol}</Table.Cell>
                                        <Table.Cell class={(is_long ? "text-[#ef5350]" : "text-[#26a69a]") + " font-bold"}>{is_long ? "开多" : "开空"}</Table.Cell>
                                        <Table.Cell class={(p.positionAmt > 0 ? "text-[#ef5350]" : "text-[#26a69a]") + " font-bold"}>{p.positionAmt}</Table.Cell>
                                        <Table.Cell>{p.entryPrice}</Table.Cell>
                                        <Table.Cell>{market?.parse_quote(mark_price)}</Table.Cell>
                                        {const diff = $derived(is_long ? current_price.sub(new Decimal(p.entryPrice)) : new Decimal(p.entryPrice).sub(current_price))}
                                        <Table.Cell class={diff.comparedTo(0) > 0 ? "text-[#ef5350]" : "text-[#26a69a]"}>{market?.parse_quote(diff)}</Table.Cell>
                                        {const profit = $derived(current_price.sub(new Decimal(String(p.entryPrice))).mul(is_long ? new Decimal("1") : new Decimal(-1)).mul(new Decimal(String(p.positionAmt)).abs()))}
                                        <Table.Cell class={(profit.comparedTo(0) > 0 ? "text-[#ef5350]" : "text-[#26a69a]")}>
                                            <span class="font-bold">{market?.parse_quote(profit)}</span><span class="text-[10px] pl-1">{profit.div(new Decimal(p.initialMargin)).mul(new Decimal("100")).toFixed(2)}%</span>
                                        </Table.Cell>
                                        <Table.Cell>{market?.parse_quote(p.liquidationPrice)}</Table.Cell>
                                        <Table.Cell>
                                            {market?.parse_quote(p.initialMargin)}<span class="text-[7px] pl-1 text-mist-400 align-top">{p.marginAsset}</span>
                                        </Table.Cell>
                                        <Table.Cell class="flex gap-2">
                                            <Button size="xs" variant=link class="p-0 hover:cursor-pointer text-[#F0B909]">
                                                平仓
                                            </Button>
                                            <Button size="xs" variant=link class="p-0 hover:cursor-pointer text-[#F0B909]">
                                                反手交易
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                {/each}
                            </Table.Body>
                        </Table.Root>
                    </div>
                    <!-- <Separator orientation="vertical"></Separator> -->
                    <div class="flex-none border-l-none md:border-l min-h-20 md:min-w-110 md:w-[40%] overflow-x-auto">
                        <Table.Root class="text-xs border-b">
                            <Table.Header>
                                <Table.Row>
                                    <Table.Head>时间</Table.Head>
                                    <Table.Head>合约</Table.Head>
                                    <Table.Head>方向</Table.Head>
                                    <Table.Head>价格</Table.Head>
                                    <Table.Head>数量</Table.Head>
                                    <Table.Head>类型</Table.Head>
                                    <Table.Head>已成交</Table.Head>
                                    <Table.Head>操作</Table.Head>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {#each opened_orders as order}
                                    <Table.Row>
                                        <Table.Cell class="text-stone-500">
                                            <Tooltip.Root>
                                                <Tooltip.Trigger>
                                                    {dayjs(order.time).format("HH:mm:ss")}
                                                </Tooltip.Trigger>
                                                <Tooltip.Content>{dayjs(order.time).format("YYYY-MM-DD HH:mm:ss")}</Tooltip.Content>
                                            </Tooltip.Root>
                                        </Table.Cell>
                                        <Table.Cell>{order.symbol}</Table.Cell>
                                        <Table.Cell class={(order.is_long() ? "text-[#ef5350]" : "text-[#26a69a]") + " font-bold"}>{get_order_title(order)}</Table.Cell>
                                        <Table.Cell>{order.price}</Table.Cell>
                                        <Table.Cell>{order.origQty}</Table.Cell>
                                        <Table.Cell class="text-stone-500">{order.type}</Table.Cell>
                                        <Table.Cell>{order.executedQty}</Table.Cell>
                                        <Table.Cell>
                                            <Button onclick={() => do_cancel_order(order.orderId, order.symbol)} title="撤销" size="icon-xs" variant=link class="hover:cursor-pointer text-red-600">
                                                <Trash2 strokeWidth={2.5} />
                                            </Button>
                                        </Table.Cell>
                                    </Table.Row>
                                {/each}
                            </Table.Body>
                        </Table.Root>
                    </div>
                </div>
            {/if}
        </div>
    </Blaze>
</ForceField>
