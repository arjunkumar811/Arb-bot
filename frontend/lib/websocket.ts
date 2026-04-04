export type WebsocketMessage = {
	type: "status" | "profit" | "opportunity" | "trade";
	payload: unknown;
};

export type WebsocketHandlers = {
	onMessage: (message: WebsocketMessage) => void;
	onOpen?: () => void;
	onError?: (event: Event) => void;
	onClose?: () => void;
};

export function connectWebsocket(
	url: string,
	handlers: WebsocketHandlers
): WebSocket {
	const socket = new WebSocket(url);

	socket.addEventListener("open", () => handlers.onOpen?.());
	socket.addEventListener("error", (event) => handlers.onError?.(event));
	socket.addEventListener("close", () => handlers.onClose?.());
	socket.addEventListener("message", (event) => {
		try {
			const parsed = JSON.parse(event.data) as WebsocketMessage;
			handlers.onMessage(parsed);
		} catch {
			// Ignore malformed payloads
		}
	});

	return socket;
}
