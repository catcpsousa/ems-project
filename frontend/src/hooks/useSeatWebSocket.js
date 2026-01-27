import { useEffect, useRef } from "react";

const WS_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export function useSeatWebSocket(onSeatUpdate, onRefresh) {
  const clientRef = useRef(null);
  const connectedRef = useRef(false);
  
  // Refs para callbacks (evita re-renders)
  const callbacksRef = useRef({ onSeatUpdate, onRefresh });
  callbacksRef.current = { onSeatUpdate, onRefresh };

  useEffect(() => {
    let client = null;
    let mounted = true;

    async function connect() {
      try {
        // Import dinâmico para evitar problemas de SSR/bundling
        const { Client } = await import("@stomp/stompjs");
        const SockJS = (await import("sockjs-client")).default;

        if (!mounted) return;

        client = new Client({
          webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          debug: (str) => {
            // Descomente para debug:
            // console.log("[STOMP]", str);
          },
          onConnect: () => {
            console.log("✅ WebSocket connected");
            connectedRef.current = true;

            // Subscrever atualizações de assentos
            client.subscribe("/topic/seats", (message) => {
              try {
                const update = JSON.parse(message.body);
                console.log("📨 Seat update:", update);
                callbacksRef.current.onSeatUpdate?.(update);
              } catch (e) {
                console.error("Error parsing seat update:", e);
              }
            });

            // Subscrever refresh (quando locks expiram)
            client.subscribe("/topic/seats/refresh", (message) => {
              try {
                const count = JSON.parse(message.body);
                console.log("🔄 Seats released:", count);
                callbacksRef.current.onRefresh?.();
              } catch (e) {
                console.error("Error parsing refresh:", e);
              }
            });
          },
          onDisconnect: () => {
            console.log("❌ WebSocket disconnected");
            connectedRef.current = false;
          },
          onStompError: (frame) => {
            console.error("STOMP error:", frame.headers?.message || frame);
          },
          onWebSocketError: (event) => {
            console.error("WebSocket error:", event);
          },
          onWebSocketClose: (event) => {
            console.log("WebSocket closed:", event.code, event.reason);
            connectedRef.current = false;
          },
        });

        client.activate();
        clientRef.current = client;
        
      } catch (error) {
        console.error("Failed to initialize WebSocket:", error);
      }
    }

    connect();

    // Cleanup
    return () => {
      mounted = false;
      if (client?.active) {
        client.deactivate();
      }
    };
  }, []);

  return {
    client: clientRef.current,
    isConnected: connectedRef.current,
  };
}