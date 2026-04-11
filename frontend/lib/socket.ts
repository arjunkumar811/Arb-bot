"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
	if (!socket) {
		const wsUrl =
			process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3002";
		socket = io(wsUrl, {
			autoConnect: true,
			reconnection: true,
		});
	}

	return socket;
}
