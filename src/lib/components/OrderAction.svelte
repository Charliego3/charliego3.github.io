<script lang="ts">
    import {
        get_balance_v3,
        get_symbol_config,
        order,
        type OrderSide,
        type PositionSide,
    } from "$lib/binance.svelte";
    import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
    import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
    import * as InputGroup from "$lib/components/ui/input-group/index.js";
    import { Slider } from "$lib/components/ui/slider/index.js";
    import * as Tooltip from "$lib/components/ui/tooltip/index.js";
    import { Market } from "$lib/exchanges.svelte";
    import { local_state } from "$lib/local-state.svelte";
    import { settings } from "$lib/settings.svelte";
    import { type Order } from "$lib/types.js";
    import { BalancePositionAbstractHandler, websocketManager, type WebSocketMessage } from "$lib/websocket";
    import { BadgeInfo, Key, MoveUpRight, RotateCcw } from "@lucide/svelte";
    import Decimal from "decimal.js";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import OrderInput from "./OrderInput.svelte";
    import * as Dialog from "$lib/components/ui/dialog/index.js";
    import { Input } from "$lib/components/ui/input/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { MorphIcon } from "morphicons/svelte";
    import { MopSparkles, Mop, Eye, EyeOff, Zap, ZapOff } from "lucide";

    interface Props {
        order_book_hiddened: boolean;
        market: Market | undefined;
        current_price: Decimal;
        on_order?: (order: Order) => void;
        refresh_opened_orders?: () => void;
        can_close_long_size: Decimal;
        can_close_short_size: Decimal;
        mark_price: Decimal;
        refresh_position?: () => void;
    }

    let {
        order_book_hiddened = $bindable(),
        market = $bindable(),
        current_price,
        on_order,
        refresh_opened_orders,
        can_close_long_size,
        can_close_short_size,
        mark_price,
        refresh_position,
    }: Props = $props();

    const d_0 = new Decimal("0");
    const d_100 = new Decimal("100");
    // 开仓价格偏移量
    let offset = local_state(`order_offset_${market?.base.toLowerCase()}`, new Decimal("0.01"));
    // 可用余额
    let quote_balance = $state(d_0);
    // 杠杆倍数
    let leverage = $state(d_0);
    // 可用余额 * 杠杆倍数
    let quote_balance_max = $derived(quote_balance.mul(leverage));

    // 默认做多资金占比
    let long_slider_rate = $state(20);
    // 默认做多资金占比百分比
    let long_slider_rate_decimal = $derived(new Decimal(String(long_slider_rate)).div(d_100));
    // 手动输入的做多价格
    let long_price: Decimal | undefined = $state();
    // 根据当前价实时计算的做多价格（当前价格 - 开仓价格偏移量）
    let long_price_placeholder = $derived(current_price.sub(offset.current));
    // 手动输入的做多数量
    let long_size: Decimal | undefined = $state();
    // 最终开仓价格
    let final_long_price = $derived(new Decimal(long_price ?? long_price_placeholder));
    // 每单位做多开仓亏损（基于市价）
    let long_unit_loss = $derived(Decimal.min(d_0, mark_price.sub(final_long_price)).abs());
    // 最大可开多数量
    let max_can_open_long_size = $derived(quote_balance.div(final_long_price.div(leverage).add(long_unit_loss)));
    // 实时计算的做多数量（非手动输入时）
    let long_size_placeholder = $derived(max_can_open_long_size.mul(long_slider_rate_decimal));
    // 最终开多数量
    let final_long_size = $derived(new Decimal(long_size ?? long_size_placeholder));
    // 做多强平价格
    let long_liq_price = $state(d_0);
    // 做多保证金
    let long_cost = $derived(final_long_size.mul(final_long_price.div(leverage).add(long_unit_loss)));
    // let long_cost = $derived(quote_balance.mul(leverage).div(final_long_price.add(leverage.mul(long_unit_loss))));

    // 默认做空资金占比
    let short_slider_rate = $state(20);
    // 默认做空资金占比百分比
    let short_slider_rate_decimal = $derived(new Decimal(String(short_slider_rate)).div(d_100));
    // 手动输入的做空价格
    let short_price: Decimal | undefined = $state();
    // 根据当前价格实时计算的做空价格（当前价格 + 开仓价格偏移量）
    let short_price_placeholder = $derived(current_price.add(offset.current));
    // 手动输入的做空数量
    let short_size: Decimal | undefined = $state();
    // 最终开空价格
    let final_short_price = $derived(new Decimal(short_price ?? short_price_placeholder));
    // 每单位做空开仓亏损（基于市价）
    let short_unit_loss = $derived(Decimal.min(d_0, mark_price.sub(final_short_price)).abs());
    // 最大可开空数量
    let max_can_open_short_size = $derived(quote_balance.div(final_short_price.div(leverage).add(short_unit_loss)));
    // 根据当前价格实时计算的做空数量
    let short_size_placeholder = $derived(max_can_open_short_size.mul(short_slider_rate_decimal));
    // 最终开空数量
    let final_short_size = $derived(new Decimal(short_size ?? short_size_placeholder));
    // 做空强平价格
    let short_liq_price = $state(d_0);
    // 做空总成本
    let short_cost = $derived(final_short_size.mul(final_short_price.div(leverage).add(short_unit_loss)));

    let fast_order_opened = local_state("fast_order_opened", false);
    let settings_opened = $state(false);
    let settings_props = $state(settings.current());
    let reset_after_order = local_state("reset_after_order", false);
    let offset_input_width = $derived.by(() => {
        let def = 0;
        if (typeof window !== "undefined" && window.screen.availWidth <= 767) def = 5;
        if (!offset.current) return def + 47;
        return (new Decimal(offset.current).toFixed().length * 8) + def + 47;
    });

    function reset() {
        long_price = undefined;
        short_price = undefined;
        long_size = undefined;
        short_size = undefined;
        long_slider_rate = 20;
        short_slider_rate = 20;
    }

    class BalancePositionHandler extends BalancePositionAbstractHandler {
        handle(message: WebSocketMessage): void {
            console.log(message);
            switch (message.e) {
                // {"e":"ACCOUNT_UPDATE","T":1788231624647,"E":1788231624647,"a":{"B":[{"a":"USDC","wb":"291","cw":"291","bc":"0"}],"P":[{"s":"ETHUSDC","pa":"-0.473","ep":"2463.26","cr":"-48571.11968048","up":"0.04257","mt":"cross","iw":"0","ps":"SHORT","ma":"USDC","bep":"2463.26"}],"m":"ORDER"}}
                case "ACCOUNT_UPDATE":
                    try {
                        quote_balance = new Decimal(message.a.B[0].cw);
                    } catch {
                        refresh_balance();
                    }
                    if (message.a.m === "ORDER") { // notify type
                        refresh_position?.();
                        refresh_opened_orders?.();
                    }
                    break;
                // {"e":"TRADE_LITE","E":1788231624647,"T":1788231624647,"s":"ETHUSDC","q":"0.473","p":"2463.26","m":true,"c":"xNzvN00fwGYcj0DLc9EThL","S":"SELL","L":"2463.26","l":"0.473","t":871685788,"i":81873278124}
                case "TRADE_LITE":
                // {"e":"ORDER_TRADE_UPDATE","T":1788231596123,"E":1788231596123,"o":{"s":"ETHUSDC","c":"xNzvN00fwGYcj0DLc9EThL","S":"SELL","o":"LIMIT","f":"GTX","q":"0.473","p":"2463.26","ap":"0","sp":"0","x":"NEW","X":"NEW","i":81873278124,"l":"0","z":"0","L":"0","n":"0","N":"USDC","T":1788231596123,"t":0,"b":"0","a":"1166.82229","m":false,"R":false,"wt":"CONTRACT_PRICE","ot":"LIMIT","ps":"SHORT","cp":false,"rp":"0","pP":false,"si":0,"ss":0,"V":"EXPIRE_MAKER","pm":"NONE","gtd":0,"er":"0"}}
                case "ORDER_TRADE_UPDATE":
                    break;
            }
        }
    }

    onMount(() => {
        websocketManager.private_ws_auto()
            .then((client) => {
                if (!client) return;
                client.subscribe(new BalancePositionHandler());
            });

        refresh_symbol_config();
    });

    $effect(() => {
        settings.api_key;
        settings.api_secret;
        market; // market更新后刷新资产
        refresh_balance();
        refresh_symbol_config();
        reset();
    })

    function refresh_balance() {
        get_balance_v3().then((value) => {
            if (!value) return;
            const balance = (value as Balance[])
                .filter((item) => item.asset === market?.quote)
                .at(0);
            quote_balance = new Decimal(balance?.availableBalance ?? "0");
        });
    }

    function refresh_symbol_config() {
        get_symbol_config().then(data => {
            if (!data) return;
            const config = data.find((d: any) => d.symbol === market?.symbol);
            leverage = new Decimal(String(config.leverage));
        });
    }

    function order_long() {
        const params = {
            symbol: `${market?.symbol}`,
            side: "BUY" as OrderSide,
            positionSide: "LONG" as PositionSide,
            price: market?.parse_quote_0(final_long_price),
            quantity: market?.parse_base_0(final_long_size),
        };
        order(params).then(data => {
            if (!data) return;
            if (!data.orderId) {
                toast.error(`下单失败: ${JSON.stringify(data)}`);
                return;
            }
            on_order?.(data);
            if (reset_after_order.current) reset();
            toast.success(`做多成功: ${params.price} - ${params.quantity}`);
        });
    }

    function order_short() {
        const params = {
            symbol: `${market?.symbol}`,
            side: "SELL" as OrderSide,
            positionSide: "SHORT" as PositionSide,
            price: market?.parse_quote_0(final_short_price),
            quantity: market?.parse_base_0(final_short_size),
        };
        order(params).then(data => {
            if (!data) return;
            if (!data.orderId) {
                toast.error(`下单失败: ${JSON.stringify(data)}`);
                return;
            }
            on_order?.(data);
            if (reset_after_order.current) reset();
            toast.success(`做空成功: ${params.price} - ${params.quantity}`);
        });
    }

    function order_close_long() {
        const params = {
            symbol: `${market?.symbol}`,
            side: "SELL" as OrderSide,
            positionSide: "LONG" as PositionSide,
            price: market?.parse_quote_0(final_short_price),
            quantity: market?.parse_base_0(can_close_long_size),
        };
        order(params).then(data => {
            if (!data) return;
            if (!data.orderId) {
                toast.error(`平多单失败: ${JSON.stringify(data)}`);
                return;
            }
            on_order?.(data);
            if (reset_after_order.current) reset();
            toast.success(`平多成功: ${params.price} - ${params.quantity}`);
        });
    }

    function order_close_short() {
        const params = {
            symbol: `${market?.symbol}`,
            side: "BUY" as OrderSide,
            positionSide: "SHORT" as PositionSide,
            price: market?.parse_quote_0(final_long_price),
            quantity: market?.parse_base_0(can_close_short_size),
        };
        order(params).then(data => {
            if (!data) return;
            if (!data.orderId) {
                toast.error(`平空单失败: ${JSON.stringify(data)}`);
                return;
            }
            on_order?.(data);
            if (reset_after_order.current) reset();
            toast.success(`平空成功: ${params.price} - ${params.quantity}`);
        });
    }

    interface Balance {
        asset: string;
        balance: string;
        availableBalance: string;
    }
</script>

<div class="flex flex-col gap-2 relative overflow-hidden p-2">
    <div class="flex justify-between">
        <div>
            <ButtonGroup.Root class="[--radius:9999px]">
                <Button class="h-7" onclick={reset} title="重置" variant="outline" size="icon-sm">
                    <RotateCcw />
                </Button>
                <Button class="h-7 md:hidden" onclick={() => order_book_hiddened = !order_book_hiddened} title="显示/隐藏盘口" variant="outline" size="icon-sm">
                    <MorphIcon icon={order_book_hiddened ? EyeOff : Eye} />
                </Button>
                <Button class="h-7" onclick={() => fast_order_opened.current = !fast_order_opened.current} title="显示/隐藏盘口" variant="outline" size="icon-sm">
                    <MorphIcon icon={fast_order_opened.current ? ZapOff : Zap} />
                </Button>
                <Button class="h-7" onclick={() => reset_after_order.current = !reset_after_order.current} title="下单后自动重置" variant="outline" size="icon-sm">
                    <MorphIcon icon={reset_after_order.current ? MopSparkles : Mop} />
                </Button>
            </ButtonGroup.Root>
        </div>
        <div class="text-xs flex gap-1 items-center">
            <ButtonGroup.Root class="[--radius:9999px]">
                <InputGroup.Root class={`[--radius:9999px] h-7 max-w-full`}
                    style={`width: ${offset_input_width}px`}>
                    <InputGroup.Addon>
                        <Tooltip.Root>
                            <Tooltip.Trigger>
                                {#snippet child({ props })}
                                    <InputGroup.Button {...props} class="rounded-full" size="icon-xs">
                                        <BadgeInfo />
                                    </InputGroup.Button>
                                {/snippet}
                            </Tooltip.Trigger>
                            <Tooltip.Content>设置开仓价偏移量</Tooltip.Content>
                        </Tooltip.Root>
                    </InputGroup.Addon>
                    <InputGroup.Input bind:value={offset.current} />
                </InputGroup.Root>
                <ButtonGroup.Text class="text-xs">
                    <span class="text-mist-500">{market?.quote}</span>
                    <span>{quote_balance.toFixed(market?.quote_asset_precision)}</span>
                </ButtonGroup.Text>
            </ButtonGroup.Root>
        </div>
    </div>
    <div class="flex w-full gap-2">
        <div class="flex w-full flex-col gap-2">
            <OrderInput title="Price" unit={market?.quote} bind:value={long_price} placeholder={market?.parse_quote(long_price_placeholder)} />
            <OrderInput title="Size" unit={market?.base} bind:value={long_size} placeholder={market?.parse_base(long_size_placeholder)} />
            <div class="flex gap-2 px-1">
                <Slider disabled={fast_order_opened.current} type="single" bind:value={long_slider_rate} max={100} step={1} />
                <span class="w-9 text-right text-xs text-mist-500">{long_slider_rate}%</span>
            </div>
            <Button disabled={fast_order_opened.current} onclick={() => order_long()} variant="default" class="bg-[#ef5350] hover:cursor-pointer hover:bg-[#ef5350]/80 text-white" size="sm">做多</Button>
            <Button onclick={order_close_short} disabled={fast_order_opened.current || can_close_short_size.comparedTo(d_0) <= 0} variant="default"
                class="bg-[#26a69a] hover:cursor-pointer hover:bg-[#26a69a]/80 text-white" size="sm">
                <div class="flex gap-2 items-end">
                    <span>平空</span>
                    {#if can_close_short_size.comparedTo(d_0) > 0}
                        <span class="text-[10px] text-background/70 dark:text-foreground/70 flex gap-0.5">
                            <span>{market?.parse_base(can_close_short_size)}</span>
                            <span>{market?.base}</span>
                        </span>
                    {/if}
                </div>
            </Button>
            <div class="flex justify-between text-[10px] px-1">
                <span class="text-mist-500">强平价格</span>
                <span>{market?.parse_quote(long_liq_price)}&nbsp;{market?.quote}</span>
            </div>
            <div class="flex justify-between text-[10px] px-1">
                <span class="text-mist-500">保证金</span>
                <span>{market?.parse_quote(long_cost)}&nbsp;{market?.quote}</span>
            </div>
            <div class="flex justify-between text-[10px] px-1">
                <span class="text-mist-500">可开</span>
                <span>{market?.parse_base(max_can_open_long_size)}&nbsp;{market?.base}</span>
            </div>
            <div class="flex justify-between text-[10px] px-1">
                <span class="text-mist-500">可平</span>
                <span>{market?.parse_base(can_close_long_size)}&nbsp;{market?.base}</span>
            </div>
        </div>
        <div class="flex w-full flex-col gap-2">
            <OrderInput title="Price" unit={market?.quote} bind:value={short_price} placeholder={market?.parse_quote(short_price_placeholder)} />
            <OrderInput title="Size" unit={market?.base} bind:value={short_size} placeholder={market?.parse_base(short_size_placeholder)} />
            <div class="flex gap-2 px-1">
                <Slider disabled={fast_order_opened.current} type="single" bind:value={short_slider_rate} max={100} step={1} />
                <span class="w-9 text-right text-xs text-mist-500">{short_slider_rate}%</span>
            </div>
            <Button disabled={fast_order_opened.current} onclick={() => order_short()} variant="default" class="bg-[#26a69a] hover:cursor-pointer hover:bg-[#26a69a]/80 text-white" size="sm">做空</Button>
            <Button onclick={order_close_long} disabled={fast_order_opened.current || can_close_long_size.comparedTo(d_0) <= 0} variant="default" class="bg-[#ef5350] hover:cursor-pointer hover:bg-[#ef5350]/80 text-white" size="sm">
                <div class="flex gap-2 items-end">
                    <span>平多</span>
                    {#if can_close_long_size.comparedTo(d_0) > 0}
                        <span class="text-[10px] text-background/70 dark:text-foreground/70 flex gap-0.5">
                            <span>{market?.parse_base(can_close_long_size)}</span>
                            <span>{market?.base}</span>
                        </span>
                    {/if}
                </div>
            </Button>
            <div class="flex justify-between text-[10px] px-1">
                <span class="text-mist-500">强平价格</span>
                <span>{market?.parse_quote(short_liq_price)}&nbsp;{market?.quote}</span>
            </div>
            <div class="flex justify-between text-[10px] px-1">
                <span class="text-mist-500">保证金</span>
                <span>{market?.parse_quote(short_cost)}&nbsp;{market?.quote}</span>
            </div>
            <div class="flex justify-between text-[10px] px-1">
                <span class="text-mist-500">可开</span>
                <span>{market?.parse_base(max_can_open_short_size)}&nbsp;{market?.base}</span>
            </div>
            <div class="flex justify-between text-[10px] px-1">
                <span class="text-mist-500">可平</span>
                <span>{market?.parse_base(can_close_short_size)}&nbsp;{market?.base}</span>
            </div>
        </div>
    </div>
    {#if settings.is_invalid()}
        <div class="absolute select-none w-full bg-background/30 backdrop-grayscale flex flex-col gap-5 justify-center items-center rounded-lg h-full top-0 left-0 backdrop-blur-xs">
            <div class="flex p-3 items-center justify-center rounded-full bg-amber-500/10">
                <Key class="dark:text-amber-300 text-amber-600" size={25}/>
            </div>

            <div class="space-y-1 max-w-sm flex flex-col items-center">
                <h3 class="text-sm font-bold dark:text-amber-300 text-foreground/80">
                    配置API
                </h3>
                <p class="text-xs leading-relaxed dark:text-amber-500 text-foreground/60">
                    请设置币安API KEY以使用完整功能
                </p>
            </div>

            <div class="flex gap-5 text-xs font-medium dark:text-foreground/70 text-muted-foreground">
                <Dialog.Root bind:open={settings_opened}>
                    <Dialog.Trigger class="pb-0.8 border-b-2 border-b-muted-foreground dark:border-b-foreground/70 hover:cursor-pointer hover:border-b-rose-500 hover:text-rose-500 dark:hover:border-b-muted-foreground dark:hover:text-amber-300">设置</Dialog.Trigger>
                    <Dialog.Content class="drop-shadow-2xl" onInteractOutside={(e) => e.preventDefault()}>
                        <Dialog.Header>
                            <Dialog.Title>配置</Dialog.Title>
                            <Dialog.Description>
                                输入API信息使用完整功能，如未创建API，参见API管理。
                            </Dialog.Description>
                        </Dialog.Header>
                        <div class="grid gap-4">
                            <div class="grid gap-3">
                                <Label class="text-muted-foreground" for="i-1">API密钥</Label>
                                <Input id="i-1" type="text" bind:value={settings_props.api_key} />
                            </div>
                            <div class="grid gap-3">
                                <Label class="text-muted-foreground" for="i-2">密钥</Label>
                                <Input id="i-2" type="text" bind:value={settings_props.api_secret} />
                            </div>
                            <div class="grid gap-3">
                                <Label class="text-muted-foreground" for="i-3">公共WebSocket端点</Label>
                                <Input id="i-3" type="text" bind:value={settings_props.public_stream_domain} />
                            </div>
                            <div class="grid gap-3">
                                <Label class="text-muted-foreground" for="i-4">市场WebSocket端点</Label>
                                <Input id="i-4" type="text" bind:value={settings_props.market_stream_domain} />
                            </div>
                            <div class="grid gap-3">
                                <Label class="text-muted-foreground" for="i-5">私有WebSocket端点</Label>
                                <Input id="i-5" type="text" bind:value={settings_props.private_stream_domain} />
                            </div>
                        </div>
                        <Dialog.Footer>
                            <Dialog.Close type="button" class={buttonVariants({ variant: "outline" })}>
                                取消
                            </Dialog.Close>
                            <Button type="submit" onclick={() => {
                                settings.set(settings_props);
                                settings_opened = false;
                            }}>保存</Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Root>
                <a href="https://www.binance.com/zh-CN/my/settings/api-management" target="_blank"
                    class="flex gap-1 justify-center items-center pb-0.8 border-b-2 border-b-muted-foreground dark:border-b-foreground/70 hover:border-b-rose-500 hover:text-rose-500 dark:hover:border-b-amber-300 dark:hover:text-amber-300">
                    API管理
                    <MoveUpRight size={12} strokeWidth={4} class="inline"/>
                </a>
            </div>
        </div>
    {/if}
</div>
