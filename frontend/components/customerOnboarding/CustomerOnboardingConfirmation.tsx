'use client';

import React from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Home } from 'lucide-react';

export default function CustomerOnboardingConfirmation() {
    return (
        <div className="w-full max-w-[600px] bg-white rounded-[32px] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col items-center text-center">
            {/* Success Icon */}
            <div className="w-24 h-24 bg-[#00FF85] rounded-full flex items-center justify-center mb-8 shadow-lg shadow-[#00FF85]/20 animate-in zoom-in duration-500">
                <Check className="w-12 h-12 text-black stroke-[3px]" />
            </div>

            <h2 className="text-3xl font-bold text-[#1E293B] mb-4">
                Welcome to Nitigati!
            </h2>

            <p className="text-[#64748B] mb-10 max-w-[400px] leading-relaxed">
                Your account is all set and ready to go. Start exploring our premium financial services and personalized dashboard designed specifically for your needs.
            </p>

            <div className="w-full space-y-4">
                <Link
                    href="/customerDashboard"
                    className="w-full py-4 bg-[#00FF85] text-black rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-[#00FF85]/20 active:scale-[0.98]"
                >
                    Proceed to Dashboard
                    <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                    href="/"
                    className="w-full py-4 bg-white text-[#64748B] border border-gray-200 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-gray-50 active:scale-[0.98]"
                >
                    <Home className="w-5 h-5" />
                    Go to Home
                </Link>
            </div>
        </div>
    );
}
