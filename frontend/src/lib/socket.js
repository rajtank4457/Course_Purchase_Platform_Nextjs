"use client";

import { io } from "socket.io-client";
import API_URL from "@/config/api";

let socket = null;

export const connectSocket = () => {
    if (socket?.connected) return socket;

    const token = localStorage.getItem("auth_token");

    socket = io(API_URL, {
        withCredentials: true,
        autoConnect: true,
        transports: ["websocket", "polling"],
        auth: {
            token,
        },
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};