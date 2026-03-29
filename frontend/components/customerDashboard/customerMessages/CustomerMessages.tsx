import React from "react";
import CustomerMessagesLobby from "./CustomerMessagesLobby";
import CustomerMessageRoom from "./CustomerMessageRoom";
import { CustomerMessage, ChatViewType } from "@/app/customerDashboard/page";

interface CustomerMessagesProps {
    messages: CustomerMessage[];
    view: ChatViewType;
    selectedRoom: CustomerMessage | null;
    onBackToLobby: () => void;
    onSelectRoom: (room: CustomerMessage) => void;
    userName: string;
    token: string;
    onExploreServices: () => void;
}

export default function CustomerMessages({
    messages,
    view,
    selectedRoom,
    onBackToLobby,
    onSelectRoom,
    userName,
    token,
    onExploreServices,
}: CustomerMessagesProps) {
    if (view === "lobby") {
        return (
            <CustomerMessagesLobby 
                messages={messages} 
                onSelectRoom={onSelectRoom} 
                userName={userName}
                onExploreServices={onExploreServices}
            />
        );
    }

    if (view === "room" && selectedRoom) {
        return (
            <CustomerMessageRoom 
                room={selectedRoom} 
                onBack={onBackToLobby}
                userName={userName}
                token={token}
            />
        );
    }

    return null;
}
