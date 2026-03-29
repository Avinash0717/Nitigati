"use client";
import React from "react";
import { MessageSquare, Search, Filter, Clock, CheckCircle2 } from "lucide-react";
import { ProviderMessage } from "@/app/providerDashboard/page";

interface ProviderMessagesLobbyProps {
    messages: ProviderMessage[];
    onSelectRoom: (room: ProviderMessage) => void;
    userName: string;
    loading: boolean;
}

export default function ProviderMessagesLobby({ messages, onSelectRoom, userName, loading }: ProviderMessagesLobbyProps) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-[3rem] border border-zinc-100 shadow-xl shadow-zinc-200/50 p-12">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-400 font-black text-[10px] uppercase tracking-widest italic">Loading Conversations...</p>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="bg-white rounded-[3rem] p-16 border border-zinc-100 shadow-xl shadow-zinc-200/50 text-center max-w-2xl mx-auto mt-10">
                <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-500 mx-auto mb-8 shadow-inner">
                    <MessageSquare size={40} />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight italic">No Active Conversations</h3>
                <p className="text-zinc-500 font-medium mb-10 leading-relaxed max-w-md mx-auto">
                    When a customer messages you about your services, their inquiries will appear here. Stay responsive to convert leads into orders!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Lobby Header/Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-lg shadow-zinc-200/30">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                    <input
                        type="text"
                        placeholder="Search chats by customer name..."
                        className="w-full h-14 bg-zinc-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl pl-14 pr-6 text-sm font-bold text-zinc-700 transition-all outline-none"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-14 px-6 rounded-2xl bg-zinc-50 text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-500 transition-all flex items-center gap-2 border border-transparent hover:border-emerald-200">
                        <Filter size={16} />
                        Filter
                    </button>
                    <button className="h-14 px-6 rounded-2xl bg-zinc-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20">
                        Unread First
                    </button>
                </div>
            </div>

            {/* Message Grid */}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {messages.map((room) => {
                    // Identify the other participant (the customer)
                    const customerName = room.participants_usernames.find(u => u !== userName) || "Customer";

                    return (
                        <button
                            key={room.id}
                            onClick={() => onSelectRoom(room)}
                            className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-md 
hover:shadow-2xl hover:-translate-y-1 transition-all text-left group 
relative overflow-hidden outline-none focus:outline-none focus:ring-0"
                        >
                            <div className="flex items-start justify-between mb-8">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 overflow-hidden border-2 border-white shadow-sm ring-1 ring-zinc-50">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${customerName}&background=00E676&color=fff&size=100`}
                                            alt={customerName}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00E676] rounded-full border-4 border-white shadow-sm"></div>
                                </div>
                                {(room.unread_count ?? 0) > 0 && (
                                    <span className="bg-emerald-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-emerald-500/30">
                                        {room.unread_count} NEW
                                    </span>
                                )}
                            </div>

                            <div className="mb-6">
                                <h4 className="text-xl font-black text-zinc-900 mb-2 group-hover:text-emerald-500 transition-colors leading-none tracking-tight">
                                    {customerName}
                                </h4>
                                <p className="text-zinc-400 text-xs font-bold truncate italic">
                                    {room.last_message?.content || "No messages yet"}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                                <div className="flex items-center gap-2 text-zinc-300">
                                    <Clock size={12} />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic pt-0.5">
                                        {room.last_message?.timestamp ? new Date(room.last_message.timestamp).toLocaleDateString() : 'Just now'}
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-xl bg-zinc-50 text-zinc-300 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    <CheckCircle2 size={16} />
                                </div>
                            </div>

                            {/* Accent Decoration */}
                            <div className="absolute top-0 right-0 w-1 h-32 bg-[#00E676] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
