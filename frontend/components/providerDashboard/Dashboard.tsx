import React from 'react';
import {
    CheckCircle2,
    Clock,
    TrendingUp,
    Star,
    Users,
    ArrowUpRight,
    ChevronRight,
    Wallet,
    ShieldCheck,
    Award,
    ShoppingBag
} from 'lucide-react';

interface RecentOrder {
    id: number;
    title: string;
    client: string;
    amount: number;
    status: string;
}

interface DashboardProps {
    data: {
        verification_status: string;
        trust_badge: string;
        trust_badge_detail: string;
        total_earnings: number;
        active_orders: number;
        provider_rating: number;
        job_success_rate: number;
        recent_orders: RecentOrder[];
        earnings_statistics: {
            this_month: number[];
            last_month: number[];
        };
        pending_payout: number;
    };
}

export default function Dashboard({ data }: DashboardProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Verification Status Card */}
                <div className="flex-1 bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm flex items-start gap-6 relative overflow-hidden group">
                    <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shrink-0">
                        <ShieldCheck size={32} />
                    </div>
                    <div className="relative z-10 flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-1">Verification Status:</h3>
                                <p className="text-2xl font-black text-amber-500">In Progress</p>
                            </div>
                            <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                                Complete Profile
                            </button>
                        </div>
                        <p className="text-zinc-500 text-xs font-medium leading-relaxed max-w-sm mb-4">
                            Your identity and business documents are currently being reviewed. Most reviews are completed within 48 hours.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full text-emerald-600 text-[10px] font-bold">
                                <CheckCircle2 size={12} />
                                <span>ID Verified</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full text-emerald-600 text-[10px] font-bold">
                                <CheckCircle2 size={12} />
                                <span>Phone Verified</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-full text-zinc-400 text-[10px] font-bold">
                                <Clock size={12} />
                                <span>Background Check</span>
                            </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-colors"></div>
                </div>

                {/* Trust Badge Card */}
                <div className="lg:w-1/3 bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100/50 shadow-sm relative overflow-hidden group">
                    <h3 className="text-emerald-900/50 font-bold uppercase tracking-widest text-[10px] mb-2">Nitigati Trust Badge</h3>
                    <p className="text-2xl font-black text-emerald-950 mb-3">{data.trust_badge}</p>
                    <p className="text-emerald-900/60 text-xs font-medium leading-relaxed mb-6">
                        {data.trust_badge_detail}
                    </p>
                    <div className="flex gap-2">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                            <Star size={14} />
                        </div>
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                            <ShieldCheck size={14} />
                        </div>
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                            <Award size={14} />
                        </div>
                    </div>
                    <Award className="absolute -bottom-6 -right-6 w-32 h-32 text-emerald-500/10 -rotate-12 group-hover:scale-110 transition-transform" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Earnings", value: `₹${data.total_earnings.toLocaleString()}`, change: "+12.5%", icon: Wallet, trend: "up" },
                    { label: "Active Orders", value: data.active_orders, change: "8 New", icon: ShoppingBag, color: "blue" },
                    { label: "Provider Rating", value: data.provider_rating, change: "4.9 Avg", icon: Star, color: "amber" },
                    { label: "Job Success Rate", value: `${data.job_success_rate}%`, change: "Excellent", icon: TrendingUp, color: "emerald" }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5 cursor-default group">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                                stat.color === 'amber' ? 'bg-amber-50 text-amber-500' :
                                    stat.color === 'emerald' ? 'bg-emerald-50 text-emerald-500' :
                                        'bg-emerald-50 text-emerald-500'
                                }`}>
                                <stat.icon size={24} />
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${stat.trend === 'up' ? 'bg-emerald-50 text-emerald-500' : 'bg-zinc-50 text-zinc-500'
                                }`}>
                                {stat.change}
                            </span>
                        </div>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-zinc-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Orders List */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-zinc-50 flex justify-between items-center">
                        <h3 className="text-xl font-black text-zinc-900">Recent Orders</h3>
                        <button className="text-emerald-500 text-xs font-black uppercase tracking-widest hover:text-emerald-600 transition-colors flex items-center gap-1 group">
                            View All <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                    <div className="divide-y divide-zinc-50 flex-1">
                        {data.recent_orders.map((order) => (
                            <div key={order.id} className="p-6 hover:bg-zinc-50/50 transition-colors flex items-center gap-6 group cursor-pointer">
                                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-400 overflow-hidden relative">
                                    <img src={`https://ui-avatars.com/api/?name=${order.id}&background=random&color=fff`} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-zinc-900 mb-1">{order.title}</h4>
                                    <p className="text-zinc-400 text-xs font-bold">Client: <span className="text-zinc-900">{order.client}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-zinc-900 mb-1">₹{order.amount.toLocaleString()}</p>
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${order.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                                        order.status === 'In Progress' ? 'bg-blue-50 text-blue-600' :
                                            'bg-amber-50 text-amber-600'
                                        }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Earnings Statistics Chart Placeholder */}
                <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm p-8 flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 mb-1">Earnings Statistics</h3>
                            <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Monthly revenue trend</p>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] font-bold">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className="text-zinc-500">This Month</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-zinc-200"></div>
                                <span className="text-zinc-400">Last Month</span>
                            </div>
                        </div>
                    </div>

                    {/* Simple CSS-based bar chart placeholder */}
                    <div className="flex-1 flex items-end justify-between gap-3 h-48 mb-8">
                        {data.earnings_statistics.this_month.map((val, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                                <div className="w-full flex flex-col-reverse gap-1 h-32 relative">
                                    {/* Last Month Bar */}
                                    <div
                                        className="w-full bg-zinc-100 rounded-t-lg transition-all duration-1000"
                                        style={{ height: `${data.earnings_statistics.last_month[idx]}%` }}
                                    ></div>
                                    {/* This Month Bar */}
                                    <div
                                        className="w-full bg-emerald-500 rounded-t-lg transition-all duration-1000 absolute bottom-0 z-10 opacity-80 group-hover:opacity-100"
                                        style={{ height: `${val}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] font-black text-zinc-400 uppercase">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-8 border-t border-zinc-50 flex justify-between items-center mt-auto">
                        <div>
                            <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] mb-1">Pending Payout</p>
                            <p className="text-2xl font-black text-zinc-900">₹{data.pending_payout.toLocaleString()}</p>
                        </div>
                        <button className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-2xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-black/5">
                            Manage Wallet
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper components for stats grid mapping
