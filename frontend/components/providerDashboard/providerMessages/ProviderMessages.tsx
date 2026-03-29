"use client";
import React from "react";
import ProviderMessagesLobby from "./ProviderMessagesLobby";
import ProviderMessageRoom from "./ProviderMessageRoom";
import { ProviderMessage, ChatViewType } from "@/app/providerDashboard/page";

interface ProviderMessagesProps {
    messages: ProviderMessage[];
    view: ChatViewType;
    selectedRoom: ProviderMessage | null;
    onBackToLobby: () => void;
    onSelectRoom: (room: ProviderMessage) => void;
    userName: string;
    token: string;
    loading: boolean;
}

export default function ProviderMessages({
    messages,
    view,
    selectedRoom,
    onBackToLobby,
    onSelectRoom,
    userName,
    token,
    loading
}: ProviderMessagesProps) {
    if (view === "lobby") {
        return (
            <ProviderMessagesLobby 
                messages={messages} 
                onSelectRoom={onSelectRoom} 
                userName={userName}
                loading={loading}
            />
        );
    }

    if (view === "room" && selectedRoom) {
        return (
            <ProviderMessageRoom 
                room={selectedRoom} 
                onBack={onBackToLobby}
                userName={userName}
                token={token}
            />
        );
    }

    return null;
}
