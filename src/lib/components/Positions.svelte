<script lang="ts">
    import * as Table from "$lib/components/ui/table/index.js";
    import type { Market } from "$lib/exchanges.svelte";
    import type { JSONData } from "$lib/websocket/types";
    import Button from "$lib/components/ui/button/button.svelte";
    import Decimal from "decimal.js";

    interface Props {
        market?: Market;
        mark_price: Decimal;
        current_price: Decimal;
        positions: JSONData[];
    }

    let { market, mark_price, current_price, positions }: Props = $props();
</script>

<Table.Root class="text-xs min-h-20">
    <Table.Header>
        <Table.Row>
            <Table.Head>交易对</Table.Head>
            <Table.Head class="hidden md:table-cell">方向</Table.Head>
            <Table.Head>持仓数量</Table.Head>
            <Table.Head>开仓价格</Table.Head>
            <Table.Head class="hidden md:table-cell">标记价格</Table.Head>
            <Table.Head class="hidden md:table-cell">当前价差</Table.Head>
            <Table.Head>未实现盈亏<span class="pl-1 text-[8px] text-muted-foreground">(回报率)</span></Table.Head>
            <Table.Head>强平价格</Table.Head>
            <Table.Head class="hidden md:table-cell">初始保证金</Table.Head>
            <Table.Head>操作</Table.Head>
        </Table.Row>
    </Table.Header>
    <Table.Body>
        {#each positions as p}
            <Table.Row>
                {const is_long = p.positionSide === "LONG"}
                <Table.Cell>{p.symbol}</Table.Cell>
                <Table.Cell class={(is_long ? "text-[#ef5350]" : "text-[#26a69a]") + " font-bold hidden md:table-cell"}>{is_long ? "开多" : "开空"}</Table.Cell>
                <Table.Cell class={(p.positionAmt > 0 ? "text-[#ef5350]" : "text-[#26a69a]") + " font-bold"}>{market?.parse_base(p.positionAmt)}</Table.Cell>
                <Table.Cell>{market?.parse_quote(p.entryPrice)}</Table.Cell>
                <Table.Cell class="hidden md:table-cell">{market?.parse_quote(mark_price)}</Table.Cell>
                {const diff = $derived(is_long ? current_price.sub(new Decimal(p.entryPrice)) : new Decimal(p.entryPrice).sub(current_price))}
                <Table.Cell class={"hidden md:table-cell " + (diff.comparedTo(0) > 0 ? "text-[#ef5350]" : "text-[#26a69a]")}>{market?.parse_quote(diff)}</Table.Cell>
                {const profit = $derived(current_price.sub(new Decimal(String(p.entryPrice))).mul(is_long ? new Decimal("1") : new Decimal(-1)).mul(new Decimal(String(p.positionAmt)).abs()))}
                <Table.Cell class={(profit.comparedTo(0) > 0 ? "text-[#ef5350]" : "text-[#26a69a]")}>
                    <span class="font-bold">{market?.parse_quote(profit)}</span><span class="text-[10px] pl-1">{profit.div(new Decimal(p.initialMargin)).mul(new Decimal("100")).toFixed(2)}%</span>
                </Table.Cell>
                <Table.Cell>{market?.parse_quote(p.liquidationPrice)}</Table.Cell>
                <Table.Cell class="hidden md:table-cell">
                    {market?.parse_quote(p.initialMargin)}<span class="text-[7px] pl-1 text-mist-400 align-top">{p.marginAsset}</span>
                </Table.Cell>
                <Table.Cell class="flex gap-2">
                    <Button size="xs" variant=link class="p-0 hover:cursor-pointer text-[#F0B909]">
                        平仓
                    </Button>
                    <Button size="xs" variant=link class="p-0 hover:cursor-pointer text-[#F0B909]">
                        反手
                    </Button>
                </Table.Cell>
            </Table.Row>
        {/each}
    </Table.Body>
</Table.Root>
