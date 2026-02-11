'use client';

import React from 'react';

export default function CustomerDashboardPlaceholder() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
            <div className="bg-white p-12 rounded-[32px] shadow-sm border border-gray-100 text-center max-w-md w-full">
                <div className="w-16 h-16 bg-[#00FF85]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <div className="w-8 h-8 bg-[#00FF85] rounded-lg" />
                </div>
                <h1 className="text-2xl font-bold text-[#1E293B] mb-3">
                    Customer Dashboard
                </h1>
                <p className="text-[#64748B] font-medium italic">
                    (Coming Soon)
                </p>
                <div className="mt-8 pt-8 border-t border-gray-50 flex justify-center gap-4">
                    <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden">
                        <div className="w-1/3 h-full bg-[#00FF85]/30 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
