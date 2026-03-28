import React from "react";
import { History, CreditCard } from "lucide-react";
import { CustomerTransaction } from "@/app/customerDashboard/page";

interface CustomerTransactionsProps {
    transactions: CustomerTransaction[];
}

export default function CustomerTransactions({ transactions }: CustomerTransactionsProps) {
    if (transactions.length === 0) {
        return (
            <div className="bg-white p-20 rounded-[3rem] border border-zinc-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <CreditCard className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className="text-3xl font-black text-zinc-900 mb-4">No Transactions</h3>
                <p className="text-zinc-400 font-bold max-w-sm mx-auto mb-10 text-lg leading-relaxed">
                    You haven't made any payments yet. All your transaction history will appear here.
                </p>
                <button className="h-14 bg-zinc-900 hover:bg-zinc-800 text-white px-10 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-black/10">
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[3rem] border border-zinc-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">ID</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Date</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Provider</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Amount</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 text-right">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                    {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors group">
                            <td className="px-8 py-6">
                                <span className="font-black text-zinc-900 uppercase">#{tx.id}</span>
                            </td>
                            <td className="px-8 py-6">
                                <span className="text-zinc-500 font-bold text-sm tracking-tight">{tx.date}</span>
                            </td>
                            <td className="px-8 py-6">
                                <span className="text-zinc-700 font-black tracking-tight">{tx.provider_name}</span>
                            </td>
                            <td className="px-8 py-6">
                                <span className="text-zinc-900 font-black italic">₹{tx.amount.toLocaleString()}</span>
                            </td>
                            <td className="px-8 py-6 text-right">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">{tx.status}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
