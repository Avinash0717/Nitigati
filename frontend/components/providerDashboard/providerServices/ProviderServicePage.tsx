"use client";

import {
    ChevronLeft,
    Star,
    MapPin,
    MessageSquare,
    Calendar,
    ShieldCheck,
    Award,
    CheckCircle,
    User,
    Share2,
    Heart,
    MoreHorizontal
} from "lucide-react";
import { ServiceDetail } from "@/app/providerDashboard/page";

interface ProviderServicePageProps {
    service: ServiceDetail;
    onBack: () => void;
}

export default function ProviderServicePage({ service, onBack }: ProviderServicePageProps) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-zinc-400 hover:text-emerald-500 transition-colors mb-10 group"
            >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Back to Listings</span>
            </button>

            <div className="grid lg:grid-cols-3 gap-10">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-10">
                    {/* Header Section */}
                    <div className="bg-white rounded-[3rem] p-10 lg:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50">
                        <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-emerald-50 shadow-sm">
                                        <img
                                            src="https://ui-avatars.com/api/?name=Alex+Rivera&background=00ff7f&color=fff"
                                            alt="Alex Rivera"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white border-4 border-white">
                                        <CheckCircle size={14} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">{service.title}</h1>
                                    </div>
                                    <div className="flex items-center gap-6 text-zinc-400 text-xs font-bold">
                                        <div className="flex items-center gap-1.5 text-orange-400">
                                            <Star size={14} fill="currentColor" />
                                            <span>4.9 (128 reviews)</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} />
                                            <span>Mumbai, India</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all border border-zinc-100/50">
                                    <Share2 size={20} />
                                </button>
                                <button className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all border border-zinc-100/50">
                                    <Heart size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 border-t border-zinc-50 pt-8 mt-8">
                            <div className="flex-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block mb-1">Status</span>
                                <span className="text-sm font-bold text-zinc-900 capitalize">{service.verification_status}</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-100"></div>
                            <div className="flex-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Published</span>
                                <span className="text-sm font-bold text-zinc-900">Jan 12, 2024</span>
                            </div>
                            <div className="w-px h-8 bg-zinc-100"></div>
                            <div className="flex-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Pricing</span>
                                <span className="text-sm font-bold text-zinc-900">{service.price_range}</span>
                            </div>
                        </div>
                    </div>

                    {/* Description Section - REPLACING Offered Services */}
                    <div className="bg-white rounded-[3rem] p-10 lg:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50">
                        <h3 className="text-2xl font-black text-zinc-900 mb-8 tracking-tight">Service Description</h3>
                        <p className="text-zinc-500 font-medium leading-relaxed whitespace-pre-line text-lg">
                            {service.description}
                        </p>
                    </div>

                    {/* Gallery Section */}
                    <div className="bg-white rounded-[3rem] p-10 lg:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Work Gallery</h3>
                            <button className="text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-600 transition-colors">
                                View Full Portfolio
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {service.images.map((img, idx) => (
                                <div key={idx} className="aspect-[4/3] rounded-[2rem] overflow-hidden border border-zinc-100 group shadow-sm transition-transform hover:-translate-y-1">
                                    <img src={img} alt="Gallery item" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="bg-white rounded-[3rem] p-10 lg:p-12 border border-zinc-100 shadow-xl shadow-zinc-200/50">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-zinc-900 tracking-tight mb-2">Customer Reviews</h3>
                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    <span>Based on 128 global reviews</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black text-zinc-900 leading-none mb-1">4.92</div>
                                <div className="flex gap-0.5 text-orange-400">
                                    {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
                                </div>
                            </div>
                        </div>

                        {/* Sample Review */}
                        <div className="space-y-8">
                            {[1, 2].map((i) => (
                                <div key={i} className="p-8 bg-zinc-50 rounded-[2rem] border border-zinc-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-zinc-300 font-black border border-zinc-100">A</div>
                                            <div>
                                                <h4 className="text-sm font-black text-zinc-900">Anjali Sharma</h4>
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">2 weeks ago</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5 text-orange-400">
                                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="currentColor" />)}
                                        </div>
                                    </div>
                                    <p className="text-zinc-500 font-medium leading-relaxed italic border-l-4 border-emerald-500/20 pl-4">
                                        "Professional and punctual. The quality of work was exceptional and beyond my expectations. Highly recommended for any custom woodworking needs!"
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Side Panel */}
                <div className="space-y-8">
                    {/* Pricing Card */}
                    <div className="bg-white rounded-[3rem] p-10 border border-zinc-100 shadow-xl shadow-zinc-200/50 sticky top-32">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-2">Pricing Starts From</span>
                        <div className="flex items-baseline gap-2 mb-10">
                            <h4 className="text-4xl font-black text-zinc-900 tracking-tight">₹599</h4>
                            <span className="text-zinc-400 font-bold text-sm">/ service</span>
                        </div>

                        <div className="space-y-4">
                            <button className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                                <MessageSquare size={20} />
                                Message Provider
                            </button>
                        </div>

                        {/* Verification List */}
                        <div className="mt-12 space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 px-2">Trust Verification</h5>
                            <div className="flex items-center gap-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-zinc-900 uppercase tracking-widest leading-none mb-1">ID Verified</p>
                                    <p className="text-[9px] font-bold text-zinc-400">Government ID confirmed</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                                    <Award size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-zinc-900 uppercase tracking-widest leading-none mb-1">Skill Badge</p>
                                    <p className="text-[9px] font-bold text-zinc-400">98% proficiency score</p>
                                </div>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="mt-12 flex items-center justify-around border-t border-zinc-50 pt-8 opacity-50">
                            <button className="text-zinc-400 hover:text-emerald-500 transition-colors">
                                <Share2 size={18} />
                            </button>
                            <button className="text-zinc-400 hover:text-emerald-500 transition-colors">
                                <Heart size={18} />
                            </button>
                            <button className="text-zinc-400 hover:text-emerald-500 transition-colors">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
