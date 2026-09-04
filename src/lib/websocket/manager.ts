// src/lib/websocket/manager.ts

import { WebSocketClient } from "./client.svelte";
import type { WebSocketOptions } from "./types";
import { generate_listen_key } from "$lib/binance.svelte";
import { settings } from "$lib/settings.svelte";

class WebSocketManager {

    constructor() {
        // console.log(
        //   '[WebSocketManager] CREATED',
        //   this
        // );
    }

    private clients = new Map<string, WebSocketClient>();

    /**
     * 获取指定 key 的 WebSocket。
     *
     * 同一个 key 永远返回同一个实例。
     */
    get(key: string, url: string, options?: WebSocketOptions): WebSocketClient {
        let client = this.clients.get(key);
        if (!client) {
            client = new WebSocketClient(key, url, options);
            this.clients.set(key, client);
        }
        return client;
    }

    /**
     * 获取或创建并立即连接。
     */
    connect(
        key: string,
        url: string,
        options?: WebSocketOptions,
    ): WebSocketClient {
        const client = this.get(key, url, options);
        client.connect();
        return client;
    }

    market_stream(options?: WebSocketOptions,): WebSocketClient | undefined {
        if (!settings.market_stream_domain) return undefined;
        return this.connect("market_stream", settings.market_stream_domain, options);
    }

    public_stream(options?: WebSocketOptions): WebSocketClient | undefined {
        if (!settings.public_stream_domain) return undefined;
        return this.connect("public_stream", settings.public_stream_domain, options);
    }

    private_ws(listen_key: string, options?: WebSocketOptions): WebSocketClient | undefined {
        if (settings.is_invalid() || !settings.private_stream_domain) return undefined;
        const domain = settings.private_stream_domain;
        if (!listen_key.startsWith("/") && !domain.endsWith("/")) {
            listen_key = "/" + listen_key;
        }
        return this.connect("private_ws", `${domain}${listen_key}`, options);
    }

    async private_ws_auto(options?: WebSocketOptions): Promise<WebSocketClient| undefined> {
        if (settings.is_invalid()) return undefined;
        const data = await generate_listen_key();
        return this.private_ws(data.listenKey, options);
    }

    /**
     * 获取已经存在的实例。
     */
    find(key: string): WebSocketClient | undefined {
        return this.clients.get(key);
    }

    /**
     * 关闭指定连接。
     */
    close(key: string) {
        const client = this.clients.get(key);
        if (!client) {
            return;
        }
        client.close();
    }

    /**
     * 删除指定连接。
     */
    remove(key: string) {
        const client = this.clients.get(key);
        if (!client) {
            return;
        }
        client.destroy();
        this.clients.delete(key);
    }

    /**
     * 关闭所有连接。
     */
    closeAll() {
        for (const client of this.clients.values()) {
            client.close();
        }
    }

    /**
     * 删除所有连接。
     */
    destroyAll() {
        for (const client of this.clients.values()) {
            client.destroy();
        }

        this.clients.clear();
    }

    /**
     * 获取所有连接。
     */
    getAll(): WebSocketClient[] {
        return Array.from(this.clients.values());
    }

    /**
     * 是否存在。
     */
    has(key: string): boolean {
        return this.clients.has(key);
    }
}

/**
 * 浏览器端全局单例。
 *
 * SvelteKit SSR 时不会建立 WebSocket。
 */
export const websocketManager = new WebSocketManager();
