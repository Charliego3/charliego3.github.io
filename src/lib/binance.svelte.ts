import { toast } from 'svelte-sonner'
import type { UTCTimestamp } from "lightweight-charts-svelte";
import { settings } from './settings.svelte';

interface RequestParams {
    method?: "POST" | "GET" | "DELETE" | "PUT";
    endpoint: string;
    signatured?: boolean;
    body?: Record<string, any>;
}

/*
 * 订单种类 (type):
 * LIMIT 限价单
 * MARKET 市价单
 * STOP 止损限价单
 * STOP_MARKET 止损市价单
 * TAKE_PROFIT 止盈限价单
 * TAKE_PROFIT_MARKET 止盈市价单
 * TRAILING_STOP_MARKET 跟踪止损单
 */
export type OrderType = "LIMIT" | "MARKET" | "STOP" | "STOP_MARKET" | "TAKE_PROFIT" | "TAKE_PROFIT_MARKET" | "TRAILING_STOP_MARKET";

export type OrderSide = "BUY" | "SELL";

// 防止自成交模式
export type PreventionMode = "EXPIRE_TAKER" | "EXPIRE_MAKER" | "EXPIRE_BOTH";

export type PositionSide = "LONG" | "SHORT";

/*
 * 有效方式 (timeInForce):
 * GTC - Good Till Cancel 成交为止（下单后仅有1年有效期，1年后自动取消）
 * IOC - Immediate or Cancel 无法立即成交(吃单)的部分就撤销
 * FOK - Fill or Kill 无法全部立即成交就撤销
 * GTX - Good Till Crossing 无法成为挂单方就撤销
 * GTD - Good Till Date 在特定时间之前有效，到期自动撤销
 * RPI - Retail Price Improvement（仅与来自APP或者网页端的订单成交，且为Post Only）
 */
export type TimeInForce = "GTC" | "IOC" | "FOK" | "GTX" | "GTD" | "RPI";

/*
 * 仅对LIMIT/STOP/TAKE_PROFIT订单有效；不能与price参数同时传入
 * 枚举值:
 * OPPONENT (盘口对手价)
 * OPPONENT_5 (盘口对手5档价)
 * OPPONENT_10 (盘口对手10档价)
 * OPPONENT_20
 * QUEUE (盘口同向价)
 * QUEUE_5 (盘口同向排队5档价)
 * QUEUE_10 (盘口同向排队10档价)
 * QUEUE_20 (盘口同向排队20档价)
 */
export type OrderPriceMatch = "OPPONENT" | "OPPONENT_5" | "OPPONENT_10" | "OPPONENT_20" | "QUEUE" | "QUEUE_5" | "QUEUE_10" | "QUEUE_20";

async function hmacSha256(message: string): Promise<string> {
    const enc = new TextEncoder();

    const key = await crypto.subtle.importKey(
        "raw",
        enc.encode(settings.current().api_secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );

    const signature = await crypto.subtle.sign(
        "HMAC",
        key,
        enc.encode(message),
    );

    // 转成 hex 字符串
    return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

function get_url(endpoint: string) {
    return settings.current().rest_domain + endpoint;
}

async function request({ method = "GET", endpoint, signatured = true, body = {} }: RequestParams) {
    const timestamp = String(Date.now());
    let request_url: string | null = null;
    const request_init: RequestInit = { method };

    if (signatured) {
        if (settings.is_invalid()) {
            return undefined;
        }
        request_init.headers = { "X-MBX-APIKEY": settings.current().api_key };
        const url = new URL(endpoint, settings.current().rest_domain);
        if (method === "POST") {
            for (const [key, value] of Object.entries(body)) {
                url.searchParams.set(key, value);
            }
        }
        url.searchParams.set("timestamp", timestamp);
        let signature = await hmacSha256(url.searchParams.toString());
        url.searchParams.set("signature", signature);
        request_url = url.href;
    } else {
        request_url = get_url(endpoint);
    }

    const request = new Request(request_url, request_init);
    const response = await fetch(request);
    if (response.status !== 200) {
        throw new Error(`Request failed with status ${response.status}: ${await response.text()}`);
    }
    return await response.json();
}

async function request_without_signature({ method = "GET", endpoint }: RequestParams) {
    return request({ method, endpoint, signatured: false });
}

export async function get_balance_v3() {
    return request({ endpoint: "/fapi/v3/balance" });
}

export async function get_klines(market: string = "ethusdc", interval: string = "1m") {
    const klines = request_without_signature({
        endpoint: `/fapi/v1/klines?symbol=${market}&interval=${interval}`
    }).then(value => {
        return value.map((item: any) => ({
            time: Math.floor(item[0] / 1000) as UTCTimestamp, // 注意这里 as UTCTimestamp
            open: parseFloat(item[1]),
            high: parseFloat(item[2]),
            low: parseFloat(item[3]),
            close: parseFloat(item[4]),
            vol_size: parseFloat(item[5]),
            vol_numbers: parseFloat(item[7]),
        }))
    }).catch(err => toast.error(`获取K线失败: ${err}`));
    return { klines: await klines };
}

export async function generate_listen_key() {
    return request({ method: "POST", endpoint: "/fapi/v1/listenKey" })
    .catch(err => toast.error(`生成 listenKey 失败: ${err}`));
}

export async function get_open_orders(market?: string) {
    let endpoint = "/fapi/v1/openOrders";
    if (market) endpoint += `?symbol=${market}`;
    return request({ endpoint })
        .catch(err => toast.error(`获取当前挂单失败: ${err}`));
}

export async function cancel_order(orderId: string, market: string) {
    return request({ method: "DELETE", endpoint: `/fapi/v1/order?symbol=${market}&orderId=${orderId}` })
        .catch(err => toast.error(`取消委托失败<${orderId}>: ${err}`));
}

export async function order(params: {
    symbol: string;
    side: OrderSide;
    type?: OrderType;
    positionSide?: PositionSide;
    selfTradePreventionMode?: PreventionMode;
    quantity?: string;
    price?: string;
    timeInForce?: TimeInForce;
    newOrderRespType?: "RESULT" | "ACK";
    priceMatch?: OrderPriceMatch;
}) {
    if (!params.type) params.type = "LIMIT";
    if (!params.timeInForce) params.timeInForce = "GTX";
    if (!params.newOrderRespType) params.newOrderRespType = "RESULT";
    if (!params.selfTradePreventionMode) params.selfTradePreventionMode = "EXPIRE_BOTH";
    return request({ method: "POST", endpoint: `/fapi/v1/order`, body: params })
        .catch(err => toast.error(`创建订单失败: ${err}`));
}

export async function close_order(params: {
    algoType?: "CONDITIONAL";
    symbol: string;
    side: OrderSide;
    type?: OrderType;
    positionSide?: PositionSide;
    timeInForce?: TimeInForce;
    quantity?: string;
    price?: string;
    triggerPrice?: string;
    newOrderRespType?: "RESULT" | "ACK";
    priceMatch?: OrderPriceMatch;
    selfTradePreventionMode?: PreventionMode;
}) {
    if (!params.algoType) params.algoType = "CONDITIONAL";
    if (!params.timeInForce) params.timeInForce = "GTX";
    if (!params.newOrderRespType) params.newOrderRespType = "RESULT";
    if (!params.selfTradePreventionMode) params.selfTradePreventionMode = "EXPIRE_BOTH";
    return request({ method: "POST", endpoint: "/fapi/v1/algoOrder", body: params })
        .catch(err => toast.error(`创建条件单失败: ${err}`));
}

export async function get_positions(market?: string) {
    let endpoint = "/fapi/v3/positionRisk";
    if (market) endpoint += `?symbol=${market}`;
    return request({ endpoint })
        .catch(err => toast.error(`获取持仓失败: ${err}`));
}

export async function get_leverage_bracket() {
    return request({ endpoint: "/fapi/v1/leverageBracket" })
        .catch(err => toast.error(`获取杠杆分层标准失败: ${err}`));
}

export async function get_symbol_config() {
    return request({ endpoint: "/fapi/v1/symbolConfig" })
        .catch(err => toast.error(`获取交易对配置失败: ${err}`));
}
