// src/lib/websocket/types.ts

export type WebSocketStatus =
    "idle" | "connecting" | "open" | "closed" | "error";

export interface WebSocketOptions {
    /**
     * 是否自动重连
     */
    reconnect?: boolean;

    /**
     * 最大重连延迟
     */
    maxReconnectDelay?: number;

    /**
     * 初始重连延迟
     */
    reconnectDelay?: number;

    /**
     * 是否启用心跳
     */
    heartbeat?: boolean;

    /**
     * 心跳间隔
     */
    heartbeatInterval?: number;

    /**
     * ping 消息
     */
    pingMessage?: unknown;

    /**
     * 是否自动 JSON.parse
     */
    json?: boolean;
}

export type JSONData = Record<string, any>;

export interface WebSocketMessage extends JSONData {}

export interface WebsocketHandler {
    supported(types: string, message: WebSocketMessage): boolean;
    handle(message: WebSocketMessage): void;
}

export interface WebSocketState {
    status: WebSocketStatus;
    reconnectAttempts: number;
}

export interface KLineMsg {
    stream: string;
    data: KLineData;
}

export interface KLineData {
    e: string;
    E: number;
    s: string;
    k: KLine;
}

export interface KLine {
    t: number;
    T: number;
    s: string;
    i: string;
    f: number;
    L: number;
    o: string;
    c: string;
    h: string;
    l: string;
    v: string;
    n: number;
    x: boolean;
    q: string;
    V: string;
    Q: string;
    B: string;
}

export interface DepthMsg {
    stream: string;
    data: DepthData;
}

export interface DepthData {
    e: string;
    E: number;
    T: number;
    s: string;
    U: number;
    u: number;
    pu: number;
    b: string[][];
    a: string[][];
    ps: string;
    st: number;
}

export interface MarkPriceMsg {
  stream: string
  data: MarkPriceData
}

export interface MarkPriceData {
  e: string
  E: number
  s: string
  p: string
  i: string
  P: string
  r: string
  ap: string
  T: number
  st: number
}

export abstract class BalancePositionAbstractHandler implements WebsocketHandler {
    supported(_: string, message: WebSocketMessage): boolean {
        const supportedTypes = ["ORDER_TRADE_UPDATE", "ACCOUNT_UPDATE"]
        return supportedTypes.includes(message.e);
    }
    abstract handle(message: WebSocketMessage): void;
}

export interface WebsocketParams {
    method?: string;
    params?: string[];
    id?: string;
}

export type KlineUpDownStatus = "UP" | "DOWN" | "UD";
