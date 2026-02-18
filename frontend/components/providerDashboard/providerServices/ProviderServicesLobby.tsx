"use client";

import { CheckCircle, MoreVertical, Edit2, BarChart2 } from "lucide-react";
import { ServiceSummary } from "@/app/providerDashboard/page";

interface ProviderServicesLobbyProps {
    services: ServiceSummary[];
    onServiceClick: (id: string) => void;
    loading: boolean;
}

export default function ProviderServicesLobby({ services, onServiceClick, loading }: ProviderServicesLobbyProps) {
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (services.length === 0) {
        return (
            <div className="bg-white rounded-[3rem] p-20 border border-zinc-100 text-center shadow-xl shadow-zinc-200/50">
                <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
                    <CheckCircle size={40} className="text-emerald-500 opacity-20" />
                </div>
                <h3 className="text-2xl font-black text-zinc-900 mb-4">No services yet</h3>
                <p className="text-zinc-500 font-medium mb-8 max-w-xs mx-auto">
                    You haven't created any services yet. Start by adding your first professional service.
                </p>
                <button className="bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                    Create Service
                </button>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>
                    <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest px-4 py-1.5">Drafts</span>
                    <span className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest px-4 py-1.5">Paused</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {services.map((service) => (
                    <div
                        key={service.id}
                        onClick={() => onServiceClick(service.id)}
                        className="group bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-emerald-500/5 transition-all cursor-pointer hover:-translate-y-2"
                    >
                        <div className="relative h-56 w-full bg-zinc-50 overflow-hidden">
                            <img src={service.image} alt={service.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute top-4 right-4 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-white">
                                <CheckCircle size={16} />
                            </div>
                        </div>
                        <div className="p-8">
                            <h3 className="text-xl font-black text-zinc-900 mb-4 truncate group-hover:text-emerald-600 transition-colors">{service.title}</h3>
                            <div className="flex flex-wrap gap-2">
                                {service.tags.map((tag) => (
                                    <span key={tag} className="bg-zinc-50 text-zinc-400 text-[9px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border border-zinc-100 group-hover:bg-emerald-50 group-hover:text-emerald-500 group-hover:border-emerald-100 transition-colors">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
