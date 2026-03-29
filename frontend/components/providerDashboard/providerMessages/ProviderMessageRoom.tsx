"use client";
import React, { useState, useEffect, useRef } from "react";
import {
    ChevronLeft,
    Search,
    MoreVertical,
    Plus,
    Send,
    Paperclip,
    Clock,
    CheckCircle2,
    ShieldCheck,
    Briefcase,
    FileText,
    ArrowUpRight,
    ChevronDown,
} from "lucide-react";
import { ProviderMessage, ChatMessage } from "@/app/providerDashboard/page";

/* ────────────────────────────────────────────────────────────
   Inline Proposal Card – renders inside chat as a customer message
   ──────────────────────────────────────────────────────────── */
function ProposalCard({ onAccept }: { onAccept: () => void }) {
    // ─── START: Sample order hardcoded data ───
    const proposal = {
        title: "Proposal Received",
        price: "$540.00 USD",
        deliverables: ["Logo + Social Media Kit", "3 Revisions"],
    };
    // ─── END: Sample order hardcoded data ───

    return (
        <div className="flex items-end gap-3 flex-row">
            {/* Avatar placeholder (matches customer bubble style) */}
            <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden shrink-0 border border-zinc-100 shadow-sm">
                <img
                    src="https://ui-avatars.com/api/?name=Customer&background=00E676&color=fff"
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>

            <div className="max-w-[70%]">
                <div className="rounded-[2.5rem] rounded-bl-none border-2 border-dashed border-zinc-100 bg-white shadow-sm p-6 space-y-4">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <FileText size={18} className="text-[#00E676]" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                {proposal.title}
                            </p>
                            <p className="text-lg font-black text-zinc-900 leading-tight">
                                {proposal.price}
                            </p>
                        </div>
                    </div>

                    {/* Deliverables */}
                    <div className="space-y-1.5">
                        {proposal.deliverables.map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm font-bold text-zinc-500">
                                <CheckCircle2 size={14} className="text-[#00E676] shrink-0" />
                                {item}
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            className="flex-1 h-10 rounded-full border border-zinc-200 text-xs font-black text-zinc-500 uppercase tracking-wider hover:border-zinc-300 hover:bg-zinc-50 transition-all"
                        >
                            View Details
                        </button>
                        <button
                            onClick={onAccept}
                            className="flex-1 h-10 rounded-full bg-[#00E676] hover:bg-[#00c968] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                        >
                            Accept
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-1 mt-1.5 justify-start">
                    <span className="text-[8px] font-black uppercase tracking-widest opacity-40 italic text-zinc-300">
                        Proposal
                    </span>
                </div>
            </div>
        </div>
    );
}

interface ProviderMessageRoomProps {
    room: ProviderMessage;
    onBack: () => void;
    userName: string;
    token: string;
}

export default function ProviderMessageRoom({ room, onBack, userName, token }: ProviderMessageRoomProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<WebSocket | null>(null);

    // ─── Accept Proposal → Create Order ───
    const handleAcceptOrder = async () => {
        // ─── START: Sample order hardcoded data ───
        const orderPayload = {
            price: "540.00",
            discount: "0.00",
            delivery_days: 5,
            revisions: 3,
            signature: `accepted-by-${userName}`,
            room_name: room.name,
        };
        // ─── END: Sample order hardcoded data ───

        try {
            const res = await fetch("/api/providers/providerDashboard/order/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify(orderPayload),
            });

            const data = await res.json();
            if (res.ok) {
                console.log("orderplaced", data);
            } else {
                console.error("Order creation failed:", res.status, data);
            }
        } catch (err) {
            console.error("Order API error:", err);
        }
    };

    // Fetch message history
    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch(`/api/providers/providerDashboard/messages/?room=${room.name}`, {
                    headers: { Authorization: `Token ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (err) {
                console.error("Failed to fetch history:", err);
            }
        }
        fetchHistory();
    }, [room.name, token]);

    // WebSocket setup
    useEffect(() => {
        const wsUrl = `ws://127.0.0.1:8000/ws/chat/${room.name}/?token=${token}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => console.log("WebSocket Connected");
        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            setMessages((prev) => [...prev, {
                id: Math.random().toString(), // Temp ID
                room: room.name,
                sender_username: data.sender,
                content: data.message,
                timestamp: data.timestamp
            }]);
        };
        ws.onclose = () => console.log("WebSocket Disconnected");

        socketRef.current = ws;
        return () => {
            socketRef.current = null;
            ws.close();
        };
    }, [room.name, token]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        const socket = socketRef.current;
        if (!input.trim() || !socket) return;
        socket.send(JSON.stringify({ message: input }));
        setInput("");
    };

    const customerName = room.participants_usernames.find(u => u !== userName) || "Customer";

    return (
        <div className="flex h-full bg-white border-l border-zinc-100 overflow-hidden animate-in fade-in duration-500 gap-5">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Chat Header */}
                <header className="h-20 px-8 flex items-center justify-between border-b border-zinc-100 shrink-0">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={onBack}
                            className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all group"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full bg-emerald-50 overflow-hidden border border-zinc-100">
                                <img src={`https://ui-avatars.com/api/?name=${customerName}&background=00E676&color=fff&size=100`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-zinc-900 leading-none mb-1">{customerName}</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#00E676] rounded-full animate-pulse shadow-[0_0_8px_#00E676]"></span>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Customer Portfolio</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-10 h-10 rounded-xl text-zinc-400 hover:bg-zinc-50 flex items-center justify-center transition-all">
                            <Search size={18} />
                        </button>
                        <button className="w-10 h-10 rounded-xl text-zinc-400 hover:bg-zinc-50 flex items-center justify-center transition-all">
                            <MoreVertical size={18} />
                        </button>
                    </div>
                </header>

                {/* Messages Container */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#fdfdfd] scroll-smooth"
                >
                    {/* Date Separator */}
                    <div className="flex justify-center">
                        <span className="px-4 py-1 rounded-full bg-zinc-100/50 text-[9px] font-black text-zinc-400 uppercase tracking-widest">First Interaction</span>
                    </div>

                    {/* Order Status Notification */}
                    <div className="bg-sky-50/50 border border-sky-100/30 rounded-3xl p-6 text-center max-w-lg mx-auto shadow-sm">
                        <p className="text-sky-900 font-bold text-sm leading-relaxed mb-1">New inquiry received for <span className="text-sky-600">&quot;Custom Logo &amp; Brand Identity&quot;</span></p>
                        <p className="text-zinc-400 font-black text-[9px] uppercase tracking-widest italic">Awaiting your professional proposal</p>
                    </div>

                    {/* Chat Bubbles */}
                    {messages.map((msg, idx) => {
                        const isMe = msg.sender_username === userName;
                        return (
                            <div key={idx} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {!isMe && (
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden shrink-0 border border-zinc-100 shadow-sm">
                                        <img src={`https://ui-avatars.com/api/?name=${customerName}&background=00E676&color=fff`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className={`max-w-[70%] group`}>
                                    <div className={`p-5 rounded-3xl shadow-sm text-sm font-bold leading-relaxed transition-all ${isMe
                                        ? 'bg-[#00E676] text-white rounded-br-none'
                                        : 'bg-white text-zinc-600 border border-zinc-100 rounded-bl-none'
                                        }`}>
                                        {msg.content}
                                    </div>
                                    <div className={`flex items-center gap-2 px-1 mt-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <span className={`text-[8px] font-black uppercase tracking-widest opacity-40 italic ${isMe ? 'text-zinc-400' : 'text-zinc-300'}`}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && <CheckCircle2 size={10} className="text-[#00E676] opacity-60" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* ─── START: Hardcoded Proposal Card (sample order data) ─── */}
                    <ProposalCard onAccept={handleAcceptOrder} />
                    {/* ─── END: Hardcoded Proposal Card (sample order data) ─── */}
                </div>

                {/* Chat Footer / Input */}
                <footer className="px-8 py-6 bg-white border-t border-zinc-100 shrink-0">
                    <div className="max-w-4xl mx-auto flex items-center gap-4 bg-zinc-50 rounded-full px-6 py-2 border border-zinc-100/50 shadow-inner group">
                        <button className="w-10 h-10 rounded-full bg-white border border-zinc-100 text-zinc-400 hover:text-[#00E676] transition-all shrink-0 shadow-sm flex items-center justify-center">
                            <Plus size={20} />
                        </button>
                        <div className="flex-1">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your message..."
                                className="w-full h-12 bg-transparent text-sm font-bold text-zinc-700 focus:outline-none placeholder:text-zinc-300 placeholder:italic"
                            />
                        </div>
                        <button
                            onClick={handleSend}
                            className="w-10 h-10 bg-[#00E676] hover:bg-[#00c968] text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </footer>
            </div>

            {/* Right Sidebar - Order Summary Section Unified */}
            <aside className="w-[380px] hidden xl:flex shrink-0 border-l border-zinc-100 bg-white">
                <div className="m-6 flex flex-col h-full rounded-[2rem] border border-zinc-100 shadow-sm bg-white p-6">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                            Order Summary
                        </h3>
                        <span className="px-3 py-1 bg-orange-50 text-orange-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                            Drafting
                        </span>
                    </div>

                    {/* Service */}
                    <div className="mb-4">
                        <p className="text-[9px] font-black text-zinc-300 uppercase mb-1">
                            Service
                        </p>
                        <p className="text-sm font-black text-zinc-900 leading-tight">
                            Custom Logo & Brand Identity
                        </p>
                    </div>

                    {/* Price */}
                    <div className="mb-5">
                        <p className="text-[9px] font-black text-zinc-300 uppercase mb-2">
                            Proposed Price
                        </p>
                        <div className="h-14 rounded-xl border border-zinc-100 flex items-center justify-between px-4 bg-zinc-50">
                            <span className="text-lg font-black">$540.00</span>
                            <span className="text-[9px] text-zinc-400 uppercase">USD</span>
                        </div>
                    </div>

                    {/* Scope */}
                    <div className="mb-5">
                        <p className="text-[9px] font-black text-zinc-300 uppercase mb-3">
                            Scope & Deliverables
                        </p>

                        <div className="space-y-2">
                            {[
                                "3 Custom Logo Concepts",
                                "Social Media Kit",
                                "Vector Source Files"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-zinc-600">
                                    <CheckCircle2 size={14} className="text-[#00E676]" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Delivery + Revisions */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="border border-zinc-100 rounded-xl py-3 text-center">
                            <p className="text-[9px] text-zinc-400 uppercase">Delivery</p>
                            <p className="text-sm font-bold">5 Days</p>
                        </div>
                        <div className="border border-zinc-100 rounded-xl py-3 text-center">
                            <p className="text-[9px] text-zinc-400 uppercase">Revisions</p>
                            <p className="text-sm font-bold">Unlimited</p>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="mt-auto flex flex-col gap-3">

                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Service Fee (10%)</span>
                            <span>- $54.00</span>
                        </div>

                        <div className="flex justify-between items-center bg-[#00E676]/10 px-4 py-3 rounded-xl">
                            <span className="text-xs font-bold">You Receive</span>
                            <span className="text-lg font-black text-[#00E676]">$486.00</span>
                        </div>

                        <button className="w-full h-14 bg-[#00E676] hover:bg-[#00c968] mb-2 text-white rounded-xl font-black tracking-wide">
                            Send Order Proposal
                        </button>
                    </div>

                </div>
            </aside>
        </div>
    );
}
