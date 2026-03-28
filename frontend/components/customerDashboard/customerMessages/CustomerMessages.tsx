import React from "react";
import { MessageSquare, Plus } from "lucide-react";
import { CustomerMessage } from "@/app/customerDashboard/page";

interface CustomerMessagesProps {
    messages: CustomerMessage[];
}

export default function CustomerMessages({ messages }: CustomerMessagesProps) {
    if (messages.length === 0) {
        return (
            <div className="bg-white p-20 rounded-[3rem] border border-zinc-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <MessageSquare className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-4">No Messages</h3>
                <p className="text-zinc-400 font-bold max-w-sm mx-auto mb-10 text-lg leading-relaxed">
                    Start a conversation with one of our experts to discuss your project requirements.
                </p>
                <button className="h-14 bg-emerald-500 hover:bg-emerald-600 text-white px-10 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20 flex items-center gap-3 mx-auto">
                    <Plus size={18} />
                    <span>New Conversation</span>
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {messages.map((msg) => (
                <div key={msg.id} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex items-start gap-6 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer relative group">
                    <div className="w-16 h-16 bg-zinc-100 rounded-2xl overflow-hidden shrink-0 relative">
                        <img src={`https://ui-avatars.com/api/?name=${msg.sender_name}&background=random`} alt="" className="w-full h-full object-cover" />
                        {msg.unread_count > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-2">
                             <h4 className="font-black text-zinc-900 text-lg group-hover:text-emerald-500 transition-colors truncate pr-4">{msg.sender_name}</h4>
                             <span className="text-[10px] font-black text-zinc-300 uppercase shrink-0 pt-1 tracking-widest">{msg.time}</span>
                        </div>
                        <p className="text-zinc-500 font-bold text-sm leading-relaxed line-clamp-2">
                            {msg.last_message}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
