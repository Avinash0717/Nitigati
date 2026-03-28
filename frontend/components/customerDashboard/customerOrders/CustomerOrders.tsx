import React from "react";
import { ShoppingBag } from "lucide-react";
import { CustomerOrder } from "@/app/customerDashboard/page";

interface CustomerOrdersProps {
    orders: CustomerOrder[];
}

export default function CustomerOrders({ orders }: CustomerOrdersProps) {
    if (orders.length === 0) {
        return (
            <div className="bg-white p-20 rounded-[3rem] border border-zinc-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <ShoppingBag className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-4">No Orders Found</h3>
                <p className="text-zinc-400 font-bold max-w-sm mx-auto mb-10 text-lg leading-relaxed">
                    You haven't placed any orders yet. Browse our selection of experts to get started on your next project.
                </p>
                <button className="h-14 bg-emerald-500 hover:bg-emerald-600 text-white px-10 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                    Find an Expert
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {orders.map((order) => (
                <div key={order.id} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex items-center justify-between group hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-zinc-100 rounded-2xl overflow-hidden">
                             <img src={order.image_url || `https://ui-avatars.com/api/?name=${order.service_title}&background=random`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h4 className="font-black text-zinc-900 text-xl mb-1 group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{order.service_title}</h4>
                            <p className="text-zinc-400 text-sm font-bold tracking-tight">Provider: <span className="text-zinc-600">{order.provider_name}</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-10">
                        <div className="text-right">
                            <p className="font-black text-zinc-900 text-lg mb-1 italic">₹{order.amount.toLocaleString()}</p>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">{order.status}</span>
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

import { ArrowRight } from "lucide-react";
