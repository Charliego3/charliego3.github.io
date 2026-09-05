<script lang="ts">
    import Button from "$lib/components/ui/button/button.svelte";
    import * as Table from "$lib/components/ui/table/index.js";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import { OrderWrapper } from "$lib/types.js";
    import { Trash2 } from "@lucide/svelte";
    import dayjs from 'dayjs';

    let {
        opened_orders,
        do_cancel_order,
        get_order_title,
    }: {
        opened_orders: OrderWrapper[];
        do_cancel_order: (orderId: string, symbol: string) => void;
        get_order_title: (order: OrderWrapper) => string;
    } = $props();
</script>

<Table.Root class="text-xs min-h-20">
    <Table.Header>
        <Table.Row>
            <Table.Head>时间</Table.Head>
            <Table.Head>交易对</Table.Head>
            <Table.Head class="hidden md:table-cell">方向</Table.Head>
            <Table.Head>价格</Table.Head>
            <Table.Head>数量</Table.Head>
            <Table.Head class="hidden md:table-cell">类型</Table.Head>
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
                <Table.Cell class={(order.is_long() ? "text-[#ef5350]" : "text-[#26a69a]") + " font-bold hidden md:table-cell"}>{get_order_title(order)}</Table.Cell>
                <Table.Cell>{order.price}</Table.Cell>
                <Table.Cell>{order.origQty}</Table.Cell>
                <Table.Cell class="text-stone-500 hidden md:table-cell">{order.type}</Table.Cell>
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
