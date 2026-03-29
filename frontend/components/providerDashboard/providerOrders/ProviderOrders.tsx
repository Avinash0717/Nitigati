import React from "react";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { ProviderOrder } from "@/app/providerDashboard/page";

interface ProviderOrdersProps {
    orders?: ProviderOrder[];
    loading?: boolean;
}

export default function ProviderOrders({ orders = [], loading }: ProviderOrdersProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-100">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="bg-white p-20 rounded-[3rem] border border-zinc-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <ShoppingBag className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-4">No Active Orders</h3>
                <p className="text-zinc-400 font-bold max-w-sm mx-auto mb-10 text-lg leading-relaxed">
                    You don't have any orders at the moment. Keep your profile optimized to attract more clients.
                </p>
                <button className="h-14 bg-emerald-500 hover:bg-emerald-600 text-white px-10 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                    My Services
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8 px-4">
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Active Orders</h2>
                <div className="flex gap-2">
                    <span className="bg-zinc-100 text-zinc-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest">{orders.length} Total</span>
                </div>
            </div>

            {orders.map((order) => (
                <div key={order.order_id} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-zinc-100 rounded-2xl overflow-hidden flex items-center justify-center text-emerald-500 font-black">
                             <Briefcase />
                        </div>
                        <div>
                            <h4 className="font-black text-zinc-900 text-xl mb-1 group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{order.service_title}</h4>
                            <p className="text-zinc-400 text-sm font-bold tracking-tight">Customer: <span className="text-zinc-600 font-black uppercase tracking-widest">{order.customer_name}</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-10">
                        <div className="text-right">
                            <p className="font-black text-zinc-900 text-lg mb-1 italic">₹{order.price}</p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">{order.status}</span>
                            <p className="text-[10px] text-zinc-400 font-black mt-2 uppercase tracking-widest italic">Target: {order.delivery_date}</p>
                        </div>
                        <button className="h-12 w-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 hover:bg-emerald-500 hover:text-white transition-all">
                             <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

import { Briefcase } from "lucide-react";

