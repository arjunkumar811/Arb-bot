import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getSocket(): Socket {
	if (!socket) {
		const url = process.env.WS_URL ?? "http://localhost:3002";
		socket = io(url, {
			autoConnect: true,
			reconnection: true,
		});
	}

	return socket;
}

export function emitEvent(event: string, payload: Record<string, unknown>): void {
	const client = getSocket();
	client.emit(event, payload);
}
