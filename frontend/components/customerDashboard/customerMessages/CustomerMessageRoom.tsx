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
import { CustomerMessage, ChatMessage } from "@/app/customerDashboard/page";

interface CustomerMessageRoomProps {
    room: CustomerMessage;
    onBack: () => void;
    userName: string;
    token: string;
}

export default function CustomerMessageRoom({ room, onBack, userName, token }: CustomerMessageRoomProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [socket, setSocket] = useState<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch message history
    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch(`/api/customer/customerDashboard/messages?room=${room.name}`, {
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

        setSocket(ws);
        return () => ws.close();
    }, [room.name, token]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !socket) return;
        socket.send(JSON.stringify({ message: input }));
        setInput("");
    };

    const providerName = room.participants_usernames.find(u => u !== userName) || "Provider";

    return (
        <div className="flex h-[calc(100vh-12rem)] bg-white rounded-[3rem] border border-zinc-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 border-r border-zinc-50">
                {/* Chat Header */}
                <header className="h-24 px-10 flex items-center justify-between border-b border-zinc-50 bg-white/50 backdrop-blur-md">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={onBack}
                            className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all group lg:hidden"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 overflow-hidden border-2 border-white shadow-sm">
                                <img src={`https://ui-avatars.com/api/?name=${providerName}&background=132d1f&color=fff&size=100`} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-zinc-900 tracking-tight">{providerName}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Online • Local time 2:14 PM</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="w-12 h-12 rounded-2xl text-zinc-400 hover:bg-zinc-50 flex items-center justify-center transition-all">
                            <Search size={20} />
                        </button>
                        <button className="w-12 h-12 rounded-2xl text-zinc-400 hover:bg-zinc-50 flex items-center justify-center transition-all">
                            <MoreVertical size={20} />
                        </button>
                    </div>
                </header>

                {/* Messages Container */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-10 space-y-8 bg-[#fafafa]/30"
                >
                    {/* Date Separator */}
                    <div className="flex justify-center">
                        <span className="px-4 py-1 rounded-full bg-white border border-zinc-100 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] shadow-sm">Today</span>
                    </div>

                    {/* Order Status Notification */}
                    <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-3xl p-6 text-center max-w-lg mx-auto">
                        <p className="text-emerald-800 font-bold text-sm leading-relaxed mb-1">Order discussion initiated for "Custom Logo & Brand Identity"</p>
                        <p className="text-emerald-500 font-black text-[10px] uppercase tracking-widest italic">Customer requested a custom proposal</p>
                    </div>

                    {/* Chat Bubbles */}
                    {messages.map((msg, idx) => {
                        const isMe = msg.sender_username === userName;
                        return (
                            <div key={idx} className={`flex items-end gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                {!isMe && (
                                    <div className="w-10 h-10 rounded-xl bg-zinc-200 overflow-hidden border-2 border-white shrink-0 shadow-sm">
                                        <img src={`https://ui-avatars.com/api/?name=${providerName}&background=132d1f&color=fff`} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className={`max-w-[70%] space-y-2`}>
                                    <div className={`p-6 rounded-[2rem] text-sm font-bold leading-relaxed shadow-sm ${
                                        isMe 
                                        ? 'bg-emerald-500 text-white rounded-br-none' 
                                        : 'bg-white text-zinc-600 border border-zinc-100 rounded-bl-none'
                                    }`}>
                                        {msg.content}
                                    </div>
                                    <div className={`flex items-center gap-2 px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest italic">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {isMe && <CheckCircle2 size={10} className="text-emerald-500" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Proposal Mock Item */}
                    <div className="flex items-end gap-4 flex-row">
                         <div className="w-10 h-10 rounded-xl bg-zinc-200 overflow-hidden border-2 border-white shrink-0 shadow-sm">
                            <img src={`https://ui-avatars.com/api/?name=${providerName}&background=132d1f&color=fff`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="max-w-[70%] bg-white p-8 rounded-[3rem] border-2 border-dashed border-zinc-100 shadow-xl overflow-hidden group">
                             <div className="flex items-center gap-5 mb-6">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-inner">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Proposal Sent</p>
                                    <h5 className="text-2xl font-black text-zinc-900 leading-none">$540.00 USD</h5>
                                </div>
                             </div>
                             <div className="space-y-3 mb-8">
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    <span className="text-xs font-bold">Logo + Social Media Kit</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-500">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                    <span className="text-xs font-bold">3 Revisions</span>
                                </div>
                             </div>
                             <div className="flex gap-3">
                                <button className="flex-1 h-12 bg-zinc-50 hover:bg-zinc-100 text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">View Details</button>
                                <button className="flex-1 h-12 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest">Awaiting Response</button>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Chat Footer / Input */}
                <footer className="p-8 bg-white border-t border-zinc-100">
                    <div className="max-w-4xl mx-auto flex items-center gap-4">
                        <button className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all shrink-0">
                            <Paperclip size={22} />
                        </button>
                        <div className="flex-1 relative group">
                            <input 
                                type="text" 
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your message..." 
                                className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-2xl px-8 pr-16 text-sm font-bold text-zinc-700 focus:outline-none focus:bg-white focus:border-emerald-500/30 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-inner"
                            />
                            <button 
                                onClick={handleSend}
                                className="absolute right-2 top-2 w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1rem] flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-all active:scale-95"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Right Sidebar - Order Summary */}
            <aside className="w-96 bg-[#fafafa]/50 flex flex-col p-10 overflow-y-auto hidden xl:flex">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-zinc-900 tracking-tight">Order Summary</h3>
                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Negotiating</span>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm mb-10">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Service</h4>
                    <p className="text-lg font-black text-zinc-900 leading-tight italic">Custom Logo & Brand Identity</p>
                </div>

                <div className="space-y-10">
                    <div>
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 px-2">Proposed Price</h4>
                        <div className="bg-white h-20 rounded-3xl border border-zinc-100 flex items-center px-8 justify-between shadow-sm">
                            <span className="text-2xl font-black text-zinc-900 tracking-tighter italic">₹54,000.00</span>
                            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest italic">INR</span>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 px-2">Scope & Deliverables</h4>
                        <div className="space-y-4">
                            <div className="bg-emerald-500/5 p-5 rounded-3xl border border-emerald-500/10 flex items-center gap-4 transition-all hover:bg-emerald-500/10">
                                <CheckCircle2 size={18} className="text-emerald-500" />
                                <span className="text-xs font-bold text-zinc-700">3 Custom Logo Concepts</span>
                            </div>
                            <div className="bg-emerald-500/5 p-5 rounded-3xl border border-emerald-500/10 flex items-center gap-4">
                                <CheckCircle2 size={18} className="text-emerald-500" />
                                <span className="text-xs font-bold text-zinc-700">Social Media Kit</span>
                            </div>
                            <div className="bg-emerald-500/5 p-5 rounded-3xl border border-emerald-500/10 flex items-center gap-4">
                                <CheckCircle2 size={18} className="text-emerald-500" />
                                <span className="text-xs font-bold text-zinc-700">Vector Source Files</span>
                            </div>
                            <button className="w-full h-14 bg-white border-2 border-dashed border-zinc-100 text-zinc-300 hover:text-emerald-500 hover:border-emerald-500/30 rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                                <Plus size={16} /> Add Item
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm relative group">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Delivery</span>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-black text-zinc-900">5 Days</span>
                                <ChevronDown size={14} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm relative group">
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Revisions</span>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-black text-zinc-900">Unlimited</span>
                                <ChevronDown size={14} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-10 border-t border-zinc-100">
                        <div className="flex justify-between items-center px-2">
                            <span className="text-xs font-bold text-zinc-400 italic">Service Fee (10%)</span>
                            <span className="text-xs font-black text-zinc-900 italic">₹5,400.00</span>
                        </div>
                        <div className="flex justify-between items-center bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                            <span className="text-sm font-black text-zinc-900 italic">Total Payable</span>
                            <span className="text-xl font-black text-emerald-600 italic tracking-tighter">₹59,400.00</span>
                        </div>
                    </div>

                    <button className="w-full h-20 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center gap-4 font-black transition-all active:scale-95 shadow-xl shadow-emerald-500/20 group">
                        <Briefcase size={22} className="group-hover:rotate-12 transition-transform" />
                        <span className="text-sm uppercase tracking-[0.2em] pt-1">Accept & Pay</span>
                    </button>
                </div>
            </aside>
        </div>
    );
}
