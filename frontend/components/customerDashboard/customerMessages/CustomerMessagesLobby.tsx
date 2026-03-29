import React from "react";
import { MessageSquare, Plus, Clock, ChevronRight } from "lucide-react";
import { CustomerMessage } from "@/app/customerDashboard/page";

interface CustomerMessagesLobbyProps {
    messages: CustomerMessage[];
    onSelectRoom: (room: CustomerMessage) => void;
    userName: string;
    onExploreServices: () => void;
}

export default function CustomerMessagesLobby({ 
    messages, 
    onSelectRoom, 
    userName,
    onExploreServices 
}: CustomerMessagesLobbyProps) {
    if (messages.length === 0) {
        return (
            <div className="bg-white p-20 rounded-[3rem] border border-zinc-100 shadow-sm text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <MessageSquare className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight">No Messages</h3>
                <p className="text-zinc-400 font-bold max-w-sm mx-auto mb-10 text-lg leading-relaxed">
                    Start a conversation with one of our experts to discuss your project requirements.
                </p>
                <button 
                    onClick={onExploreServices}
                    className="h-16 bg-emerald-500 hover:bg-emerald-600 text-white px-12 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center gap-3 mx-auto uppercase tracking-widest"
                >
                    <Plus size={20} />
                    <span>Explore Services</span>
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    onClick={() => onSelectRoom(msg)}
                    className="bg-white p-8 rounded-[3rem] border border-zinc-100 shadow-sm flex items-start gap-6 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all cursor-pointer relative group hover:-translate-y-1 duration-500"
                >
                    <div className="w-20 h-20 bg-zinc-50 rounded-[1.5rem] overflow-hidden shrink-0 relative border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                        <img 
                            src={`https://ui-avatars.com/api/?name=${msg.participants_usernames[1] || 'Provider'}&background=132d1f&color=fff&size=200`} 
                            alt="" 
                            className="w-full h-full object-cover" 
                        />
                        {msg.unread_count > 0 && (
                            <span className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm">
                                {msg.unread_count}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-3">
                             <div className="min-w-0">
                                <h4 className="font-black text-zinc-900 text-xl group-hover:text-emerald-500 transition-colors truncate pr-4">
                                    {msg.participants_usernames.find(u => u !== userName) || msg.participants_usernames[0]}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Online</span>
                                </div>
                             </div>
                             <div className="flex flex-col items-end gap-1 shrink-0 pt-1">
                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">
                                    {msg.last_message ? new Date(msg.last_message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                                </span>
                             </div>
                        </div>
                        <p className="text-zinc-500 font-bold text-sm leading-relaxed line-clamp-2 italic mb-6">
                            {msg.last_message?.content || "Start the conversation..."}
                        </p>
                        <div className="flex items-center justify-between pt-5 border-t border-zinc-50">
                            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em]">Service Discussion</span>
                            <div className="flex items-center gap-1.5 text-emerald-500">
                                <span className="text-[10px] font-black uppercase tracking-widest">View Chat</span>
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
