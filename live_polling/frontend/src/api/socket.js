// frontend/src/api/socket.js
import { io } from "socket.io-client";

// Use environment variable for backend URL, fallback to localhost for development
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";

const socket = io(BACKEND_URL, {
  autoConnect: true,
  transports: ["websocket", "polling"], // fallback if websocket not available
});

export { socket };
