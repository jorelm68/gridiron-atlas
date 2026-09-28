import ws from "ws";

// supabase-js builds a realtime client on construction, which needs a global WebSocket.
// Node < 22 has none, so hand it the `ws` implementation there. Remove once Node 22+ is required.
export const nodeRealtimeOptions =
  typeof globalThis.WebSocket === "undefined"
    ? { realtime: { transport: ws as unknown as typeof WebSocket } }
    : {};
