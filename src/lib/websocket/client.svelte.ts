// src/lib/websocket/client.ts

import { unsubscribe_message } from ".";
import type {
    WebsocketHandler,
    WebSocketMessage,
    WebSocketOptions,
    WebsocketParams,
    WebSocketState,
    WebSocketStatus,
} from "./types";

const DEFAULT_OPTIONS: Required<WebSocketOptions> = {
    reconnect: true,

    reconnectDelay: 1000,

    maxReconnectDelay: 30000,

    heartbeat: false,

    heartbeatInterval: 30000,

    pingMessage: {
        type: "ping",
    },

    json: true,
};

export class WebSocketClient {
    readonly key: string;

    readonly url: string;

    private ws: WebSocket | null = null;

    private options: Required<WebSocketOptions>;

    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

    private reconnectAttempts = 0;

    private manuallyClosed = false;

    private handlers = new Set<WebsocketHandler>();

    private state: WebSocketState = $state({
        status: "idle",
        reconnectAttempts: 0,
    });

    private messages: Set<WebSocketMessage> = new Set();

    private stateListeners = new Set<(state: WebSocketState) => void>();

    constructor(key: string, url: string, options: WebSocketOptions = {}) {
        this.key = key;
        this.url = url;

        this.options = {
            ...DEFAULT_OPTIONS,
            ...options,
        };

        // console.log("[WebSocketClient] CREATED", this);
    }

    // ---------------------------------------------------------------------------
    // Public
    // ---------------------------------------------------------------------------

    connect() {
        if (typeof window === "undefined") {
            return;
        }

        this.manuallyClosed = false;

        if (!this.ws) {
            this.createConnection();
            return;
        }

        if (
            this.ws.readyState === WebSocket.OPEN ||
            this.ws.readyState === WebSocket.CONNECTING
        ) {
            return;
        }

        this.createConnection();
    }

    close() {
        this.manuallyClosed = true;

        this.clearReconnectTimer();
        this.stopHeartbeat();

        const ws = this.ws;

        this.ws = null;

        if (ws) {
            ws.close();
        }

        this.setState({
            status: "closed",
            reconnectAttempts: this.reconnectAttempts,
        });
    }

    destroy() {
        this.close();

        this.handlers.clear();
        this.stateListeners.clear();
    }

    send(message: WebSocketMessage): boolean {
        this.waitForOpen().then(() => {
            if (message.____ === "ping") {
                this.ws?.send("ping");
                return;
            }
            if (message?.method === "SUBSCRIBE") {
                this.messages.add(message);
            }
            this.ws?.send(JSON.stringify(message));
        });
        return true;
    }

    send_unsubscribe(params: WebsocketParams) {
        this.send(unsubscribe_message(params));
    }

    subscribe(handler: WebsocketHandler): () => void {
        if (!this.handlers) {
            this.handlers = new Set();
        }

        this.handlers.add(handler);

        return () => {
            this.handlers?.delete(handler);
        };
    }

    /**
     * 监听连接状态
     */
    onStateChange(listener: (state: WebSocketState) => void): () => void {
        this.stateListeners.add(listener);

        listener(this.state);

        return () => {
            this.stateListeners.delete(listener);
        };
    }

    async waitForOpen(): Promise<void> {
        if (this.manuallyClosed) {
            throw new Error("websocket closed by manually");
        }
        if (this.state.status === "open") {
            return;
        }

        await new Promise<void>((resolve) => {
            const unsubscribe = this.onStateChange((state) => {
                if (state.status === "open") {
                    unsubscribe();
                    resolve();
                }
            });
        });
    }

    getState(): WebSocketState {
        return this.state;
    }

    getStatus(): WebSocketStatus {
        return this.state.status;
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    isConnecting(): boolean {
        return this.ws?.readyState === WebSocket.CONNECTING;
    }

    // ---------------------------------------------------------------------------
    // Connection
    // ---------------------------------------------------------------------------

    private createConnection() {
        if (typeof window === "undefined") {
            return;
        }

        if (this.manuallyClosed) {
            return;
        }

        this.clearReconnectTimer();

        this.setState({
            status: "connecting",
            reconnectAttempts: this.reconnectAttempts,
        });

        const ws = new WebSocket(this.url);

        this.ws = ws;

        ws.onopen = () => {
            this.reconnectAttempts = 0;

            this.setState({
                status: "open",
                reconnectAttempts: 0,
            });

            this.startHeartbeat();
            for (const msg of this.messages) {
                this.send(msg);
            }
        };

        ws.onmessage = (event) => {
            if (event.type !== 'message') {
                console.log({
                    type: event.type,
                    message: event.data,
                });
            }
            this.handleMessage(event.type, event.data);
        };

        ws.onerror = () => {
            this.setState({
                status: "error",
                reconnectAttempts: this.reconnectAttempts,
            });
        };

        ws.onclose = () => {
            this.stopHeartbeat();

            if (this.ws === ws) {
                this.ws = null;
            }

            if (this.manuallyClosed || !this.options.reconnect) {
                this.setState({
                    status: "closed",
                    reconnectAttempts: this.reconnectAttempts,
                });

                return;
            }

            this.setState({
                status: "closed",
                reconnectAttempts: this.reconnectAttempts,
            });

            this.scheduleReconnect();
        };
    }

    // ---------------------------------------------------------------------------
    // Message
    // ---------------------------------------------------------------------------

    private handleMessage(types: string, raw: unknown) {
        let message: WebSocketMessage;
        if (this.options.json && typeof raw === "string") {
            try {
                message = JSON.parse(raw);
            } catch {
                console.warn(`[WebSocket:${this.key}] Invalid JSON:`, raw);
                return;
            }
        } else {
            message = raw as WebSocketMessage;
        }

        if (!message || typeof message !== "object") {
            return;
        }

        for (const handler of this.handlers) {
            if (!handler.supported(types, message)) {
                continue;
            }
            handler.handle(message);
        }
    }

    // ---------------------------------------------------------------------------
    // Reconnect
    // ---------------------------------------------------------------------------

    private scheduleReconnect() {
        if (this.manuallyClosed || !this.options.reconnect) {
            return;
        }

        if (this.reconnectTimer) {
            return;
        }

        const baseDelay = Math.min(
            this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts),
            this.options.maxReconnectDelay,
        );

        // jitter
        const jitter = Math.random() * 1000;

        const delay = baseDelay + jitter;

        // const delay = 1000;
        this.reconnectAttempts++;

        this.setState({
            status: "closed",
            reconnectAttempts: this.reconnectAttempts,
        });

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;

            if (this.manuallyClosed) {
                return;
            }

            this.createConnection();
        }, delay);
    }

    // ---------------------------------------------------------------------------
    // Heartbeat
    // ---------------------------------------------------------------------------

    private startHeartbeat() {
        if (!this.options.heartbeat) {
            return;
        }

        this.stopHeartbeat();

        this.heartbeatTimer = setInterval(() => {
            if (!this.isConnected()) {
                return;
            }

            const ping = this.options.pingMessage;

            if (typeof ping === "string") {
                this.ws?.send(ping);
            } else {
                this.ws?.send(JSON.stringify(ping));
            }
        }, this.options.heartbeatInterval);
    }

    private stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);

            this.heartbeatTimer = null;
        }
    }

    // ---------------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------------

    private setState(state: WebSocketState) {
        this.state = state;

        for (const listener of this.stateListeners) {
            listener(state);
        }
    }

    // ---------------------------------------------------------------------------
    // Timer
    // ---------------------------------------------------------------------------

    private clearReconnectTimer() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);

            this.reconnectTimer = null;
        }
    }
}
