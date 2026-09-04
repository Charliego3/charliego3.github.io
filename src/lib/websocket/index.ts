// src/lib/websocket/index.ts

import type { WebsocketParams } from "./types";

export { websocketManager } from "./manager";

export { WebSocketClient } from "./client.svelte";

export type {
    WebSocketOptions,
    WebSocketMessage,
    WebsocketHandler,
    WebSocketState,
    WebSocketStatus,
    KlineUpDownStatus,
    KLineMsg,
    DepthMsg,
    MarkPriceMsg,
    WebsocketParams,
} from "./types";

export { BalancePositionAbstractHandler } from "./types";

export function unsubscribe_message(message: WebsocketParams): WebsocketParams {
    return { ...message, method: "UNSUBSCRIBE" };
}
