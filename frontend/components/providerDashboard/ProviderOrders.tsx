import React from 'react';
import { ShoppingBag } from 'lucide-react';

export default function ProviderOrders() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400">
            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                <ShoppingBag size={32} />
            </div>
            <h3 className="text-xl font-black text-zinc-900 mb-2">Orders</h3>
            <p className="font-medium">Order tracking and management is coming soon.</p>
        </div>
    );
}
