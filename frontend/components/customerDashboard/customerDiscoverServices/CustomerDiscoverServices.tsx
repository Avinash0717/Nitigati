import React from "react";
import { 
    Compass, 
    Star, 
    MapPin, 
    MessageSquare, 
    ShieldCheck, 
    TrendingUp, 
    Zap,
    ChevronRight,
    Clock,
    Award
} from "lucide-react";
import { DiscoverServicesData, DiscoverService } from "@/app/customerDashboard/page";

interface CustomerDiscoverServicesProps {
    data: DiscoverServicesData | null;
    onServiceClick: (uuid: string) => void;
}

export default function CustomerDiscoverServices({ data, onServiceClick }: CustomerDiscoverServicesProps) {
    if (!data || (data.featured.length === 0 && data.trending.length === 0 && data.recommended.length === 0)) {
        return (
            <div className="bg-white p-20 rounded-[3rem] border border-zinc-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Compass className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-4 tracking-tight">No Services Discovered</h3>
                <p className="text-zinc-400 font-bold max-w-sm mx-auto mb-10 text-lg leading-relaxed">
                    We're currently updating our artisan catalog. Please check back in a few moments.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-16 pb-20">
            {/* --- FEATURED SERVICES --- */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Featured Services</h3>
                        <p className="text-sm font-bold text-zinc-400 mt-1">Hand-picked premium selections for you</p>
                    </div>
                    <button className="text-xs font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-600 transition-colors flex items-center gap-2">
                        View All <ChevronRight size={14} />
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {data.featured.map((service) => (
                        <FeaturedCard key={service.uuid} service={service} onClick={() => onServiceClick(service.uuid)} />
                    ))}
                </div>
            </section>

            {/* --- TRENDING SERVICES --- */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Trending Services</h3>
                    <div className="px-3 py-1 bg-amber-50 rounded-full flex items-center gap-1.5">
                        <TrendingUp size={12} className="text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Rising Fast</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    {data.trending.map((service) => (
                        <TrendingCard key={service.uuid} service={service} onClick={() => onServiceClick(service.uuid)} />
                    ))}
                </div>
            </section>

            {/* --- RECOMMENDED SECTION --- */}
            <section>
                <div className="flex items-baseline justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Recommended for You</h3>
                        <p className="text-sm font-bold text-zinc-400 mt-1">Based on your recent interest in "Design & Strategy"</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {data.recommended.map((service) => (
                        <RecommendedRow key={service.uuid} service={service} onClick={() => onServiceClick(service.uuid)} />
                    ))}
                </div>
            </section>
        </div>
    );
}

// --- SUB-COMPONENTS ---

function FeaturedCard({ service, onClick }: { service: DiscoverService; onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/5 transition-all flex flex-col h-full cursor-pointer"
        >
            <div className="aspect-[4/3] bg-zinc-100 relative overflow-hidden">
                <img 
                    src={service.images?.[0] || `https://ui-avatars.com/api/?name=${service.title}&background=132d1f&color=fff&size=512`} 
                    alt={service.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                />
                <div className="absolute top-5 left-5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm border border-white/50">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Featured</span>
                </div>
            </div>
            
            <div className="p-8 flex-1 flex flex-col">
                <div className="mb-4">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2 block">{service.tags?.[0] || "General"}</span>
                    <h4 className="text-xl font-black text-zinc-900 leading-tight group-hover:text-emerald-500 transition-colors line-clamp-2 uppercase tracking-tighter">
                        {service.title}
                    </h4>
                </div>
                
                <p className="text-zinc-400 font-bold text-sm leading-relaxed line-clamp-2 mb-8 flex-1">
                    {service.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 overflow-hidden border-2 border-white shadow-sm ring-1 ring-zinc-100">
                             <img 
                                src={service.provider_image || `https://ui-avatars.com/api/?name=${service.provider_name}&background=f8fafb&color=132d1f`} 
                                alt={service.provider_name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">By {service.provider_name}</p>
                            <div className="flex items-center gap-1.5 font-black text-zinc-900 text-xs italic">
                                From <span className="text-emerald-500 not-italic">{service.price_range.split('-')[0].trim()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrendingCard({ service, onClick }: { service: DiscoverService; onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="bg-white rounded-[2rem] border border-zinc-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all cursor-pointer"
        >
            <div className="aspect-square bg-zinc-100 relative overflow-hidden">
                <img 
                    src={service.images?.[0] || `https://ui-avatars.com/api/?name=${service.title}&background=132d1f&color=fff&size=512`} 
                    alt={service.title} 
                    className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute bottom-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">{Math.floor(Math.random() * 15 + 5)}k Views</span>
                </div>
            </div>
            
            <div className="p-6">
                <h4 className="text-sm font-black text-zinc-800 mb-2 truncate group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{service.title}</h4>
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1 text-amber-500">
                        <Star size={10} fill="currentColor" />
                        <span className="text-[10px] font-black italic">4.9</span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-300">(124)</span>
                </div>
                
                <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.25em]">Trending</span>
                    <span className="text-sm font-black text-emerald-500 italic">{service.price_range.split('-')[0].trim()}</span>
                </div>
            </div>
        </div>
    );
}

function RecommendedRow({ service, onClick }: { service: DiscoverService; onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="bg-white p-6 rounded-[2rem] border border-zinc-50 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all flex items-center gap-6 group cursor-pointer"
        >
            <div className="w-20 h-20 rounded-2xl bg-zinc-100 overflow-hidden flex-shrink-0 ring-4 ring-zinc-50">
                <img 
                    src={service.images?.[0] || `https://ui-avatars.com/api/?name=${service.title}&background=132d1f&color=fff&size=128`} 
                    alt={service.title} 
                    className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all"
                />
            </div>
            
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <h4 className="font-black text-zinc-900 group-hover:text-emerald-500 transition-colors uppercase tracking-tight">{service.title}</h4>
                    <span className="font-black text-emerald-500 italic">{service.price_range.split('-')[0].trim()}</span>
                </div>
                <p className="text-xs font-bold text-zinc-400 line-clamp-1 max-w-xl mb-3">{service.description}</p>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                        <Clock size={12} className="text-zinc-200" />
                        <span>3 Days Delivery</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                        <Award size={12} className="text-zinc-200" />
                        <span>{service.tags?.[0] || "Artisan"}</span>
                    </div>
                </div>
            </div>
            
            <button className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-300 hover:bg-emerald-500 hover:text-white transition-all group-hover:scale-110 shadow-sm">
                <ChevronRight size={20} />
            </button>
        </div>
    );
}
