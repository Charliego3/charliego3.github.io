// src/lib/websocket/state.svelte.ts

import type {
  WebSocketState,
} from './types';

export const websocketStates
    = $state<Record<string, WebSocketState>>({});
