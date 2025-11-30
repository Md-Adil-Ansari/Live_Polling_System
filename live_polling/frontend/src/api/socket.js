// frontend/src/api/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  autoConnect: true,
  transports: ["websocket", "polling"], // fallback if websocket not available
});

export { socket };
