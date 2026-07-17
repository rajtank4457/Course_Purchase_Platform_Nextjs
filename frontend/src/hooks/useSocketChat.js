"use client";

import { useEffect } from "react";

import { apiRequest, chatApi } from "@/lib/apiHelper";
import { connectSocket, getSocket } from "@/lib/socket";

import { useChat } from "@/context/ChatContext";

export default function useSocketChat() {
    const {
        setUsers,
        setConversations,
        setMessages,
        setUnreadCount,
        selectedConversation,
        setOnlineUsers,
        setTypingUsers,
    } = useChat();

    const socket = getSocket() || connectSocket();

    // ============================
    // Load Users
    // ============================

    const loadUsers = async () => {
        const res = await apiRequest(chatApi.getUsers);

        if (res.success) {
            setUsers(res.data.data || []);
        }
    };

    // ============================
    // Load Conversations
    // ============================

    const loadConversations = async () => {
        const res = await apiRequest(chatApi.getConversations);

        if (res.success) {
            const list = res.data.data || [];

            setConversations(list);

            const unread = list.reduce(
                (sum, item) => sum + Number(item.unreadCount || 0),
                0
            );

            setUnreadCount(unread);
        }
    };

    // ============================
    // Load Messages
    // ============================

    const loadMessages = async (conversationId) => {
        const res = await apiRequest(
            chatApi.getMessages(conversationId)
        );

        if (res.success) {
            setMessages(res.data.data || []);
        }
    };

    // ============================
    // Initial Load
    // ============================

    useEffect(() => {
        loadUsers();
        loadConversations();
    }, []);

    // ============================
    // Conversation Changed
    // ============================

    useEffect(() => {
        if (!selectedConversation) return;

        loadMessages(
            selectedConversation.conversationId
        );

        socket.emit(
            "joinConversation",
            selectedConversation.conversationId
        );

        return () => {
            socket.emit(
                "leaveConversation",
                selectedConversation.conversationId
            );
        };
    }, [selectedConversation]);

    // ============================
    // Socket Events
    // ============================

    useEffect(() => {
        if (!socket) return;

        socket.on("newMessage", (message) => {
            setMessages((prev) => [...prev, message]);
            loadConversations();
        });

        socket.on("typing", (data) => {
            setTypingUsers((prev) => {
                if (
                    prev.some(
                        (x) => x.senderId === data.senderId
                    )
                ) {
                    return prev;
                }

                return [...prev, data];
            });
        });

        socket.on("stopTyping", (data) => {
            setTypingUsers((prev) =>
                prev.filter(
                    (x) => x.senderId !== data.senderId
                )
            );
        });

        socket.on("messagesRead", () => {
            if (selectedConversation) {
                loadMessages(
                    selectedConversation.conversationId
                );
            }
        });

        socket.on("messageEdited", (edited) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.messageId === edited.messageId
                        ? {
                            ...msg,
                            ...edited,
                        }
                        : msg
                )
            );
        });

        socket.on("messageDeleted", (deleted) => {
            setMessages((prev) =>
                prev.filter(
                    (msg) =>
                        msg.messageId !==
                        deleted.messageId
                )
            );
        });

        socket.on("messageReaction", (reaction) => {
            setMessages((prev) =>
                prev.map((msg) =>
                    msg.messageId === reaction.messageId
                        ? {
                            ...msg,
                            reaction:
                                reaction.reaction,
                        }
                        : msg
                )
            );
        });

        socket.on("userOnline", (user) => {
            setOnlineUsers((prev) => [
                ...prev.filter(
                    (x) => x.userId !== user.userId
                ),
                user,
            ]);
        });

        socket.on("userOffline", (user) => {
            setOnlineUsers((prev) =>
                prev.filter(
                    (x) => x.userId !== user.userId
                )
            );
        });

        socket.on("heartbeatAck", () => {
            console.log("Heartbeat OK");
        });

        return () => {
            socket.off("newMessage");
            socket.off("typing");
            socket.off("stopTyping");
            socket.off("messagesRead");
            socket.off("messageEdited");
            socket.off("messageDeleted");
            socket.off("messageReaction");
            socket.off("userOnline");
            socket.off("userOffline");
            socket.off("heartbeatAck");
        };
    }, [selectedConversation]);

    // ============================
    // Heartbeat
    // ============================

    useEffect(() => {
        if (!socket) return;

        const interval = setInterval(() => {
            socket.emit("heartbeat");
        }, 60000);

        return () => clearInterval(interval);
    }, []);
}