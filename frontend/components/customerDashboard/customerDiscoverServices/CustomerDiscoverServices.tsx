import React from "react";
import { Compass, Star, MapPin, MessageSquare, ShieldCheck } from "lucide-react";
import { DiscoverService } from "@/app/customerDashboard/page";

interface CustomerDiscoverServicesProps {
    services: DiscoverService[];
}

export default function CustomerDiscoverServices({ services }: CustomerDiscoverServicesProps) {
    if (services.length === 0) {
        return (
            <div className="bg-white p-20 rounded-[3rem] border border-zinc-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Compass className="w-10 h-10 text-emerald-500 underline" />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-4">No Services Available</h3>
                <p className="text-zinc-400 font-bold max-w-sm mx-auto mb-10 text-lg leading-relaxed">
                    We couldn't find any services matching your search. Please check back later.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => (
                <div key={service.uuid} className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/5 transition-all">
                    <div className="aspect-[16/9] bg-zinc-100 relative overflow-hidden">
                        <img 
                            src={service.images?.[0] || `https://ui-avatars.com/api/?name=${service.title}&background=132d1f&color=fff&size=512`} 
                            alt={service.title} 
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
                                <h4 className="text-xl font-black text-zinc-900 mb-1 group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{service.title}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                                        <Star className="w-3 h-3 fill-current" />
                                        <span>4.9 (120+)</span>
                                    </div>
                                    <div className="w-1 h-1 bg-zinc-200 rounded-full"></div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                        <MapPin className="w-3 h-3" />
                                        <span>{service.location || "Remote"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <p className="text-zinc-500 font-bold text-sm leading-relaxed line-clamp-2 mb-6">
                            {service.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-8">
                            {service.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="px-2 py-1 bg-zinc-50 text-[10px] font-black uppercase tracking-widest text-zinc-400 rounded-lg">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-zinc-50 mt-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] mb-1">Price Range</span>
                                <span className="text-xl font-black text-zinc-900 italic tracking-tight">{service.price_range}</span>
                            </div>
                            <button className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white px-8 rounded-2xl flex items-center gap-3 font-black text-xs transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                                <MessageSquare size={16} />
                                <span>Discuss Order</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
