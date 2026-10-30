// Universal fallback WebSocket transport for server-side environments (SSR, Node.js)
// where native WebSocket may not be globally defined or needed for REST operations.

export class FallbackWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readyState = 3; // CLOSED

  constructor(_url?: string | URL, _protocols?: string | string[]) {}

  addEventListener(_type: string, _listener: unknown): void {}
  removeEventListener(_type: string, _listener: unknown): void {}
  dispatchEvent(_event: unknown): boolean {
    return false;
  }
  send(_data: unknown): void {}
  close(_code?: number, _reason?: string): void {}
}

export function getRealtimeTransport(): typeof WebSocket {
  if (typeof WebSocket !== "undefined") {
    return WebSocket;
  }
  if (typeof globalThis !== "undefined" && typeof globalThis.WebSocket !== "undefined") {
    return globalThis.WebSocket;
  }
  return FallbackWebSocket as unknown as typeof WebSocket;
}
