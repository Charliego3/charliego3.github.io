<script lang="ts">
    import {
        get_klines
    } from "$lib/binance.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import { buttonVariants } from "$lib/components/ui/button/index.js";
    import * as Command from "$lib/components/ui/command/index.js";
    import * as NativeSelect from "$lib/components/ui/native-select/index.js";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import WebsocketStatus from "$lib/components/WebsocketStatus.svelte";
    import { exchanges, Market } from "$lib/exchanges.svelte";
    import { local_state } from "$lib/local-state.svelte";
    import { type CandlestickItem } from "$lib/types.js";
    import { cn } from "$lib/utils";
    import {
        WebSocketClient,
        websocketManager,
        type KlineUpDownStatus,
        type WebsocketHandler,
        type WebSocketMessage,
        type WebsocketParams
    } from "$lib/websocket";
    import {
        CheckIcon,
        ChevronsUpDownIcon,
        Eye,
        EyeOff,
        FoldVertical,
        Loader,
        RefreshCcwDot,
    } from "@lucide/svelte";
    import dayjs from 'dayjs';
    import { Decimal } from "decimal.js";
    import {
        CrosshairMode,
        HistogramSeries,
        type HistogramData,
        type IChartApi,
        type ISeriesApi
    } from "lightweight-charts";
    import {
        CandlestickSeries,
        Chart,
        type CandlestickData,
        type MouseEventParams,
        type Time,
        type UTCTimestamp,
    } from "lightweight-charts-svelte";
    import { mode } from "mode-watcher";
    import { onMount, tick, untrack } from "svelte";

    interface Props {
        market: Market | undefined;
        current_price: Decimal;
        kline_up_down_status: KlineUpDownStatus;
        kline_series: ISeriesApi<'Candlestick'> | undefined;
    }

    let {
        market = $bindable(),
        current_price = $bindable(),
        kline_up_down_status = $bindable(),
        kline_series = $bindable(),
    }: Props = $props();

    const is_dark = $derived(mode.current === "dark");
    const available_intervals = {
        "1分钟": "1m",
        // "3m",
        "5分钟": "5m",
        "15分钟": "15m",
        "30分钟": "30m",
        "1小时": "1h",
        "2小时": "2h",
        "4小时": "4h",
        // "6h",
        "8小时": "8h",
        "12小时": "12h",
        "1天": "1d",
        // "3d",
        "1周": "1w",
        "1月": "1M",
    };
    let pane_style = $derived({
		separatorColor: is_dark ? '#232323' : '#D7D7D7',
		separatorHoverColor: is_dark ? '#303030' : '#333333',
	});
    let chart_options = $derived({
        localization: {
            timeFormatter: (time: number) => {
                return dayjs(Number(time * 1000)).format("YYYY-MM-DD HH:mm");
            }
        },
        layout: {
            background: { color: "transparent" },
            textColor: is_dark ? "gray" : "#333333",
            attributionLogo: false,
            fontFamily: "JetBrains Mono Variable",
            panes: pane_style
        },
        grid: {
            vertLines: { color: is_dark ? "rgba(35, 35, 35, 0.5)" : "rgba(200, 200, 200, 0.3)", visible: true },
            horzLines: { color: is_dark ? "rgba(35, 35, 35, 0.5)" : "rgba(200, 200, 200, 0.2)", visible: true },
        },
        // 3. 右侧价格轴
        rightPriceScale: { borderColor: is_dark ? "#232323" : "#E5E5E5", borderVisible: true },
        // 4. 底部时间轴
        timeScale: {
            timeVisible: true,
            secondsVisible: false,
            borderColor: is_dark ? "#232323" : "#E5E5E5",
            borderVisible: true,
        },
        crosshair: {
            mode: CrosshairMode.Normal,
            // 价格标签背景色（右侧那个）
            horzLine: { labelBackgroundColor: is_dark ? "#434C5A" : "#DDDDDD" },
            // 时间标签背景色（底部那个）
            vertLine: { labelBackgroundColor: is_dark ? "#434C5A" : "#DDDDDD" },
            rightOffset: 5,
        },
    });

    let market_combobox_value = local_state("selected_market", "ethusdc");
    let interval = local_state("kline_interval", "1m");
    let chart_container: HTMLElement | undefined = $state();
    let chart_api = $state<IChartApi>();
    let chart_ref = $state<Chart>();
    let kline_ref = $state<CandlestickSeries>();
    let vol_series = $state<ISeriesApi<any>>();
    let last_kline = $state<CandlestickData | undefined>();
    let kline_data: CandlestickData<Time>[] = $state([]);
    let price_scale_width = $state<number>();
    let time_scale_height = $state<number>();
    let vol_data = $state<HistogramData[]>([]);
    let candlestick_data = $derived(candlestick2item(last_kline));
    let candlestick_style = $derived(candlestick_data ? (candlestick_data.close < candlestick_data.open ? "#26a69a" : "#ef5350") : "");
    let candlestick_bar = $state<CandlestickItem>();
    let refresh_kline_button_active = $state(false);
    let show_vol = local_state("show_volume", true);
    let market_combobox_opened = $state(false);
    let market_combobox_trigger_ref = $state<HTMLButtonElement>(null!);
    let candlestick_info_visiable = $state(false);
    let candlestick_info_left = $state(0);
    let candlestick_info_top = $state(0);
    let previous_price: Decimal = $state(new Decimal("0"));
    let show_loading_kline = $state(false);
    let chart_container_width = $state<number>();
    let chart_container_height = $state<number>();

    class KlineHandler implements WebsocketHandler {
        supported(_: string, message: WebSocketMessage): boolean {
            if (!message.data) return false;
            return message.data.e === "kline";
        }

        handle(message: WebSocketMessage): void {
            let k = message.data.k;
            const bar: CandlestickData = {
                time: Math.floor(k.t / 1000) as UTCTimestamp, // 开盘时间（秒）
                open: parseFloat(k.o),
                high: parseFloat(k.h),
                low: parseFloat(k.l),
                close: parseFloat(k.c),
            };
            candlestick_bar = candlestick2item(bar);
            candlestick_data = candlestick_bar;
            current_price = new Decimal(k.c);
            if (current_price > previous_price) {
                kline_up_down_status = "UP";
            } else if (current_price < previous_price) {
                kline_up_down_status = "DOWN";
            } else {
                kline_up_down_status = "UD";
            }
            previous_price = current_price;
            try {
                const data = kline_series?.data();
                if (data && data.length > 0) {
                    const last_time = data.at(-1)?.time;
                    if (last_time && last_time > bar.time) {
                        return;
                    }
                }
                kline_series?.update(bar);
                vol_series?.update({
                    time: bar.time,
                    value: Number(k.v),
                    color: k.c >= k.o ? '#ef5350' : '#26a69a',
                });
            } catch(err) {
                console.log("更新K线出错:", err, "bar:", bar, "", k);
            }
        }
    }

    onMount(() => {
        let chart_handler: any | null = null;
        let resizeObserver: ResizeObserver;
        let on_range: () => number | undefined;
        tick().then(() => {
            chart_api = chart_ref?.getChart?.() as IChartApi;
            kline_series = kline_ref?.getSeries?.() as ISeriesApi<'Candlestick'>;
            vol_series = chart_api.addSeries(
                HistogramSeries,
                {
                    visible: true,
                    priceFormat: { type: 'volume' },
                    lastValueVisible: true,
                    priceLineVisible: true,
                    baseLineVisible: true,
                },
                1
            );

            const update_width = () => {
                if (!kline_series || !chart_api) return;
                const price_scale = kline_series?.priceScale();
                const time_scale = chart_api?.timeScale();
                if (!price_scale || !time_scale) return;
                const width = price_scale.width() ?? 0;
                const height = time_scale.height() ?? 0;
                price_scale_width = width;
                time_scale_height = height;
            };

            requestAnimationFrame(update_width);
            resizeObserver = new ResizeObserver(() => {
                if (chart_ref && chart_container) {
                    const { width, height } = chart_container.getBoundingClientRect();
                    chart_container_width = width;
                    chart_container_height = height;
                    chart_ref.getChart()?.applyOptions({ width, height });
                    requestAnimationFrame(update_width);
                }
            });
            resizeObserver.observe(chart_container as Element);
            if (chart_api) {
                kline_series?.priceScale().applyOptions({ ticksVisible: true, scaleMargins: { top: 0.1, bottom: 0.02 } });
                chart_handler = chart_api.subscribeCrosshairMove(
                    (param: MouseEventParams<Time>) => {untrack(() => {
                        // 鼠标在图表外
                        if (
                            !param.point ||
                            param.point.x < 0 ||
                            param.point.y < 0 ||
                            !param.time ||
                            !kline_series
                        ) {
                            candlestick_data = candlestick_bar;
                            candlestick_info_visiable = false;
                            return;
                        }

                        // 当前十字线位置对应的蜡烛数据
                        const data = param.seriesData.get(kline_series);
                        if (!data) {
                            candlestick_data = candlestick_bar;
                            candlestick_info_visiable = false;
                            return;
                        }

                        // data 形如 { time, open, high, low, close }
                        candlestick_data = candlestick2item(data as CandlestickData);

                        try {
                            //@ts-ignore
                            const vol_data: HistogramData<Time> = param.seriesData.get(vol_series);
                            if (vol_data && candlestick_data) {
                                candlestick_data.vol_size = String(vol_data.value);
                            }

                            if (param.paneIndex ?? 1 > 0) { return; }
                            candlestick_info_visiable = true;
                            candlestick_info_left = param.point.x;
                            candlestick_info_top = param.point.y;
                        } catch {}
                    })},
                );
            }

            on_range = () => requestAnimationFrame(update_width);
            chart_api?.timeScale().subscribeVisibleLogicalRangeChange(on_range);
        });

        return () => {
            if (resizeObserver) resizeObserver.disconnect();
            if (chart_handler) chart_api?.unsubscribeCrosshairMove(chart_handler);
            if (on_range) chart_api?.timeScale().unsubscribeVisibleLogicalRangeChange(on_range);
        };
    });

    $effect(() => {
        market = exchanges.get_market(market_combobox_value.current)!;
    });

    let market_stream = $state<WebSocketClient>();

    $effect(() => {
        let unsubscribe_kline_handler = () => {};
        let kline_params: WebsocketParams = {
            method: "SUBSCRIBE",
            params: [`${market?.symbol_lower}@kline_${interval.current}`],
            id: `subscribe_${market?.symbol_lower}_kline_${interval.current}`,
        };

        untrack(() => {
            market_stream = websocketManager.market_stream();
            if (market_stream) {
                unsubscribe_kline_handler = market_stream.subscribe(new KlineHandler());
                market_stream.send(kline_params);
            }
        });

        return () => {
            market_stream?.send_unsubscribe(kline_params);
            unsubscribe_kline_handler();
        }
    });

    $effect(refresh_volume_pane);

    $effect(refresh_kline);

    function refresh_kline() {
        untrack(() => {
            show_loading_kline = true;
            refresh_kline_button_active = true;
        });
        get_klines(market?.symbol_lower, interval.current).then((value) => {
            if (!value) return;
            //@ts-ignore
            if (!value.klines || value.klines.length <= 0) {
                console.log("K线数据不正确", value);
                return;
            };
            untrack(() => {
                kline_data = value.klines as CandlestickData[];
                last_kline = value.klines.at(-1);
                current_price = new Decimal(last_kline?.close ?? "0");
            });
            vol_data = value.klines.map((k: any) => ({
                time: k.time,
                value: k.vol_size,
                color: k.close >= k.open ? '#ef5350' : '#26a69a',
            }));
            untrack(() => {
                show_loading_kline = false;
                refresh_kline_button_active = false;
            });
        });
    }

    // TODO: 显示/移除 Vol 有问题
    function refresh_volume_pane() {
        if (!chart_api || !vol_data || !vol_series) return;
        let panes = chart_api.panes();
        if (panes.length < 2) {
            chart_api.addPane();
        } else if (!show_vol.current) {
            chart_api.removePane(1);
            return;
        }

        vol_series?.setData(vol_data);
        vol_series?.priceScale().applyOptions({
            scaleMargins: { bottom: 0, top: 0.1 },
            ticksVisible: true,
        });

        panes[0].setStretchFactor(0.8);
        vol_series?.getPane().setStretchFactor(0.2);
    }

    function reset_price_scale() {
        kline_series?.priceScale().setAutoScale(true);
        vol_series?.priceScale().setAutoScale(true);
    }

    function candlestick2item(candlestick: CandlestickData | undefined): CandlestickItem | undefined {
        if (!candlestick) return undefined;
        const toFixed = (v: any) => new Decimal(String(v)).toFixed(market?.price_precision);
        return {
            time: dayjs(Number(candlestick?.time) * 1000).format("MM-DD HH:mm"),
            open: toFixed(candlestick?.open),
            high: toFixed(candlestick?.high),
            low: toFixed(candlestick?.low),
            close: toFixed(candlestick?.close),
        }
    }
</script>
<div class="kline flex-1 h-full w-full max-h-[80vh] min-h-[80vh] border rounded-lg overflow-hidden relative">
    <div bind:this={chart_container} class="h-full w-full chart relative">
        {#if chart_container && kline_data}
            <Chart
                bind:this={chart_ref}
                options={chart_options}
                height={chart_container_height ?? window.screen.availHeight}
                width={chart_container_width ?? window.screen.availWidth}
            >
                <CandlestickSeries
                    bind:this={kline_ref}
                    paneIndex={0}
                    reactive={true}
                    data={kline_data}
                    upColor="#ef5350"
                    downColor="#26a69a"
                    borderVisible={true}
                    borderUpColor="#ef5350"
                    borderDownColor="#26a69a"
                    wickUpColor="#ef5350"
                    wickDownColor="#26a69a"
                ></CandlestickSeries>
            </Chart>
            {#if price_scale_width}
                <button onclick={reset_price_scale} style={`width: ${price_scale_width + 1}px; height: ${(time_scale_height ?? 17.5) + (show_vol ? 0.5 : 2)}px`} class="absolute bottom-0 hover:cursor-pointer right-0 border-l border-t flex items-center justify-center">
                    <FoldVertical size={15}/>
                </button>
            {/if}
            <div class="absolute top-2 left-3 flex flex-col z-30 gap-2">
                <div class="flex gap-2.5 items-center">
                    <WebsocketStatus status={market_stream?.getStatus() ?? "idle"}></WebsocketStatus>
                    <Button class="hidden md:flex" disabled title="显示/隐藏成交量" onclick={() => show_vol.current = !show_vol.current} variant=outline size=icon-sm>
                        {#if show_vol.current}
                            <Eye/>
                        {:else}
                            <EyeOff/>
                        {/if}
                    </Button>
                    <Button title="Refresh KLine"
                        onclick={refresh_kline}
                        variant="outline"
                        size="icon-sm"
                        disabled={refresh_kline_button_active}>
                        <RefreshCcwDot />
                    </Button>
                    <Popover.Root bind:open={market_combobox_opened}>
                        <Popover.Trigger bind:ref={market_combobox_trigger_ref} class={buttonVariants({variant: "outline", size: "sm"})}>
                            {#snippet child({ props })}
                                <Button variant="outline" class="justify-between" {...props} role="combobox" aria-expanded={market_combobox_opened}>
                                    {market?.symbol || "Select a market..."}
                                    <ChevronsUpDownIcon class="ms-2 size-4 shrink-0 opacity-50" />
                                </Button>
                            {/snippet}
                        </Popover.Trigger>
                        <Popover.Content class="w-50 p-0">
                            <Command.Root>
                                <Command.Input placeholder="Search market..." />
                                <Command.List>
                                    <Command.Empty>No market found.</Command.Empty>
                                    <Command.Group>
                                    {#each exchanges.get_markets() as market}
                                        <Command.Item value={market.symbol} onSelect={() => {
                                            market_combobox_value.current = market.symbol;
                                            market_combobox_opened = false;
                                        }}>
                                            <CheckIcon class={cn("me-2 size-4", market_combobox_value.current !== market.symbol && "text-transparent")}/>
                                            {market.symbol}
                                        </Command.Item>
                                    {/each}
                                    </Command.Group>
                                </Command.List>
                            </Command.Root>
                        </Popover.Content>
                    </Popover.Root>
                    <NativeSelect.Root bind:value={interval.current} size="sm">
                        {#each Object.entries(available_intervals) as [k, v]}
                            <NativeSelect.Option value={v}>{k}</NativeSelect.Option>
                        {/each}
                    </NativeSelect.Root>
                </div>
                {#if candlestick_data}
                    <div class="pl-1 flex gap-2 text-xs items-center">
                        <span style="color: slategray">{candlestick_data.time}</span>
                        <span>开: <span style="color: {candlestick_style}">{candlestick_data.open}</span></span>
                        <span>高: <span style="color: {candlestick_style}">{candlestick_data.high}</span></span>
                        <span>低: <span style="color: {candlestick_style}">{candlestick_data.low}</span></span>
                        <span>收: <span style="color: {candlestick_style}">{candlestick_data.close}</span></span>
                    </div>
                {/if}
            </div>
            {#if candlestick_data && candlestick_info_visiable}
                <div class="absolute z-10 gap-1 bg-secondary border drop-shadow-md rounded-lg shadow-sm px-3 py-2 flex flex-col text-xs"
                    style={`left: ${candlestick_info_left + 5}px; top: ${candlestick_info_top + 5}px; color: ${candlestick_style}`}>
                    <span style="color: slategray">{candlestick_data.time}</span>
                    <span>开：{candlestick_data.open}</span>
                    <span>高：{candlestick_data.high}</span>
                    <span>低：{candlestick_data.low}</span>
                    <span>收：{candlestick_data.close}</span>
                    {#if candlestick_data.vol_size}
                        <span>量：{candlestick_data.vol_size}</span>
                    {/if}
                </div>
            {/if}
        {/if}
    </div>
    {#if show_loading_kline}
        <div class="absolute h-full w-full top-0 left-0 z-10 backdrop-blur-[2px] flex items-center justify-center">
            <Loader class="animate-spin text-amber-600 dark:text-amber-400" strokeWidth={2} size={30}/>
        </div>
    {/if}
</div>

<style>
    .chart {
        cursor: crosshair;
    }

    @media (width < 48rem /* 768px */) {
        .kline {
            height: 100px;
        }
    }
</style>
