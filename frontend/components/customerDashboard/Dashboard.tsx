import React from "react";
import {
    ShoppingBag,
    MessageSquare,
    Clock,
    CheckCircle2,
    ArrowUpRight,
    ChevronRight,
    TrendingUp,
    Star,
    ShieldCheck,
    Download,
    Zap,
} from "lucide-react";
import { CustomerDashboardData } from "@/app/customerDashboard/page";

interface DashboardProps {
    data: CustomerDashboardData;
}

export default function Dashboard({ data }: DashboardProps) {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-black text-zinc-900 tracking-tight mb-2">
                        Welcome back, {data.user_name}!
                    </h1>
                    <p className="text-zinc-500 font-bold text-lg">
                        {data.greeting}
                    </p>
                </div>
                <div className="flex gap-4">
                    <button className="h-14 bg-emerald-500 hover:bg-emerald-600 text-white px-8 rounded-2xl flex items-center gap-3 font-black text-sm transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                        <Compass className="w-5 h-5" />
                        <span>Browse Services</span>
                    </button>
                    <button className="h-14 bg-white border border-zinc-100 hover:bg-zinc-50 text-zinc-900 px-8 rounded-2xl flex items-center gap-3 font-black text-sm transition-all active:scale-95 shadow-sm">
                        <MessageSquare className="w-5 h-5 text-zinc-400" />
                        <span>Message Provider</span>
                    </button>
                </div>
            </div>

            {/* Active Orders Section */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-zinc-900">Active Orders</h3>
                    <button className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] hover:text-emerald-600 transition-colors flex items-center gap-2 group">
                        View All Orders <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {data.active_orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/5 transition-all hover:-translate-y-1">
                            <div className="aspect-[16/10] bg-zinc-100 relative overflow-hidden">
                                <img 
                                    src={order.image_url || `https://ui-avatars.com/api/?name=${order.service_title}&background=132d1f&color=fff&size=512`} 
                                    alt={order.service_title} 
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Verified</span>
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-xl font-black text-zinc-900 mb-1 group-hover:text-emerald-500 transition-colors">{order.service_title}</h4>
                                        <p className="text-zinc-400 text-xs font-bold">By <span className="text-zinc-600">{order.provider_name}</span></p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                        order.status_color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-500'
                                    }`}>
                                        {order.status}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-6 border-t border-zinc-50 mt-4">
                                    <span className="text-xl font-black text-zinc-900">₹{order.amount.toLocaleString()}</span>
                                    <button className="h-10 bg-zinc-50 hover:bg-emerald-50 hover:text-emerald-600 text-zinc-400 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                                        View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <h3 className="text-xl font-black text-zinc-900 mb-8">Recent Activity</h3>
                    <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="divide-y divide-zinc-50">
                            {data.recent_activity.map((activity) => (
                                <div key={activity.id} className="p-8 flex items-start gap-6 hover:bg-zinc-50/50 transition-colors group cursor-pointer">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                                        activity.icon_type === 'message' ? 'bg-emerald-50 text-emerald-500' :
                                        activity.icon_type === 'payment' ? 'bg-amber-50 text-amber-500' :
                                        'bg-emerald-500 text-white'
                                    }`}>
                                        {activity.icon_type === 'message' && <MessageSquare className="w-6 h-6" />}
                                        {activity.icon_type === 'payment' && <TrendingUp className="w-6 h-6" />}
                                        {activity.icon_type === 'check' && <CheckCircle2 className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="max-w-md text-zinc-600 font-bold leading-relaxed">
                                                {activity.content}
                                            </p>
                                            <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest shrink-0">
                                                {activity.time_ago}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="p-6 bg-zinc-50/50 hover:bg-zinc-50 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] transition-all border-t border-zinc-50">
                            Load More Activity
                        </button>
                    </div>
                </div>

                {/* Service Overview */}
                <div>
                    <h3 className="text-xl font-black text-zinc-900 mb-8">Service Overview</h3>
                    <div className="space-y-6">
                        <div className="bg-[#132d1f] p-10 rounded-[2.5rem] text-white relative overflow-hidden group">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/60 mb-2">Total Investment</h4>
                            <p className="text-5xl font-black tracking-tight mb-12 italic leading-none">
                                ₹{data.stats.total_investment.toLocaleString()}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/10">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Active Projects</p>
                                    <p className="text-3xl font-black leading-none">{data.stats.active_projects.toString().padStart(2, '0')}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Saved Experts</p>
                                    <p className="text-3xl font-black leading-none">{data.stats.saved_experts.toString().padStart(2, '0')}</p>
                                </div>
                            </div>

                            <button className="w-full mt-10 h-16 bg-emerald-500 hover:bg-emerald-400 text-white rounded-[1.5rem] font-black text-sm transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-emerald-900/40">
                                <Download size={20} />
                                <span>Download Statement</span>
                            </button>

                            <Zap className="absolute -top-10 -right-10 w-40 h-40 text-emerald-500/5 -rotate-12 group-hover:scale-110 transition-transform" />
                        </div>

                        {/* Quick Tip Card */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex gap-5 items-start">
                           <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shrink-0">
                               <Zap className="w-6 h-6 fill-current" />
                           </div>
                           <div>
                               <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Quick Tip</h5>
                               <p className="text-zinc-600 font-bold text-sm leading-relaxed">
                                   Verify your tax ID to unlock professional service tiers.
                               </p>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add missing icon import
import { Compass } from "lucide-react";
