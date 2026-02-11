"use client";

import Link from "next/link";

export default function OnboardingConfirmation() {
    return (
        <div className="max-w-4xl mx-auto px-4">
            <div className="bg-white rounded-[3rem] border border-zinc-100 p-12 lg:p-24 shadow-2xl shadow-zinc-200/50 text-center relative overflow-hidden">
                {/* Decorative Circle */}
                <div className="absolute top-[-10%] left-[50%] -translate-x-1/2 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-10 shadow-xl shadow-emerald-500/30">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-8 text-zinc-900">
                        You&apos;re all set!
                    </h1>

                    <h2 className="text-xl lg:text-2xl font-black text-zinc-900 mb-6">
                        Your provider profile has been successfully created.
                    </h2>

                    <p className="text-zinc-500 font-medium leading-relaxed max-w-lg mx-auto mb-16 text-lg">
                        You can now access your dashboard and <span className="text-emerald-600 font-bold">start setting up your services</span>.
                    </p>

                    <div className="space-y-6">
                        <Link
                            href="/providerDashboard"
                            className="inline-block w-full max-w-md bg-emerald-500 hover:bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xl transition-all shadow-2xl shadow-emerald-500/30 active:scale-95 flex items-center justify-center gap-4 group"
                        >
                            Go to Dashboard
                            <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
                        </Link>

                        <div>
                            <button className="text-zinc-400 hover:text-emerald-500 font-black uppercase tracking-widest text-[11px] transition-colors border-b-2 border-transparent hover:border-emerald-500 pb-1">
                                View Profile Preview
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-20 flex justify-center opacity-30">
                <img
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=300&fit=crop"
                    alt="Success Illustration"
                    className="w-full h-40 object-cover rounded-full grayscale"
                />
            </div>
        </div>
    );
}
