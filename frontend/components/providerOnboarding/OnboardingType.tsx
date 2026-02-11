"use client";

import Link from "next/link";
import Image from "next/image";

interface OnboardingTypeProps {
    onSelect: (type: "manual" | "ai") => void;
}

export default function OnboardingType({ onSelect }: OnboardingTypeProps) {
    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-6 text-zinc-900 leading-tight">
                    How would you like to set up your profile?
                </h1>
                <p className="text-zinc-500 font-medium text-lg leading-relaxed max-w-2xl mx-auto">
                    Choose the way that works best for you. It usually takes about 5 minutes to get started.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
                {/* Manual Option */}
                <div className="bg-white rounded-[2rem] border border-zinc-100 p-8 lg:p-12 hover:shadow-2xl transition-all group flex flex-col justify-between">
                    <div>
                        <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-zinc-100 transition-colors">
                            <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-black mb-4">Register Manually</h2>
                        <p className="text-zinc-500 font-medium leading-relaxed mb-8">
                            Best for users who prefer traditional step-by-step forms. You have full control over every detail.
                        </p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            <span>📋</span> Traditional Form
                        </div>
                        <button
                            onClick={() => onSelect("manual")}
                            className="w-full bg-zinc-50 hover:bg-zinc-100 text-zinc-900 py-4 rounded-xl font-black transition-all active:scale-95 border border-zinc-100"
                        >
                            Select Manual
                        </button>
                    </div>
                </div>

                {/* AI Option */}
                <div className="bg-white rounded-[2rem] border-2 border-emerald-500 p-8 lg:p-12 hover:shadow-2xl transition-all group relative flex flex-col justify-between">
                    <div className="absolute -top-3 right-8 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Recommended
                    </div>

                    <div>
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-emerald-100 transition-colors">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl lg:text-3xl font-black mb-4">Register with AI</h2>
                        <p className="text-zinc-500 font-medium leading-relaxed mb-8">
                            Our AI assistant will guide you through a friendly chat. Quickest way to get your profile live.
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-emerald-500">
                            <span>⚡</span> Faster & Easier
                        </div>
                        {/* <Link href="/providerOnboarding/AI_Onboarding">
                            <button
                                className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black transition-all cursor-pointer opacity-100 shadow-xl shadow-emerald-500/20"
                            >
                                Start with AI
                            </button>
                        </Link> */}
                        <button
                            onClick={() => onSelect("ai")}
                            className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black transition-all cursor-pointer opacity-100 shadow-xl shadow-emerald-500/20"
                        >
                            Start with AI
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-center font-bold text-sm text-zinc-400">
                Need help choosing? <span className="text-emerald-500 cursor-pointer">Chat with an agent</span> or <span className="text-emerald-500 cursor-pointer">watch a 1-min demo.</span>
            </div>

            <div className="mt-16 bg-zinc-100 h-64 rounded-[2rem] overflow-hidden relative">
                <img
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop"
                    alt="Collaboration Illustration"
                    className="w-full h-full object-cover grayscale opacity-50"
                />
                <div className="absolute inset-0 bg-emerald-500/10 mix-blend-multiply"></div>
            </div>
        </div>
    );
}
