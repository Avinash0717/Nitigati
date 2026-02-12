"use client";

import Link from "next/link";
import { LogOut, User, LayoutDashboard, Settings, ShoppingBag, Bell } from "lucide-react";

export default function CustomerDashboard() {
    return (
        <div className="min-h-screen bg-[#f8fafb] font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
            {/* Sidebar (Desktop) / Bottom Nav (Mobile) placeholder logic would go here */}
            <div className="flex flex-1">
                {/* Sidebar */}
                <aside className="hidden lg:flex w-72 bg-white border-r border-zinc-100 flex-col p-6 fixed h-full">
                    <Link href="/" className="flex items-center gap-2 group mb-12">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-emerald-500/20">
                            <span className="text-white font-black text-xl italic pt-1">N</span>
                        </div>
                        <span className="text-2xl font-black tracking-tight pt-1">Nitigati</span>
                    </Link>

                    <nav className="space-y-2 flex-1">
                        <Link href="#" className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black transition-all">
                            <LayoutDashboard size={20} />
                            <span>Dashboard</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl font-bold transition-all">
                            <ShoppingBag size={20} />
                            <span>My Orders</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl font-bold transition-all">
                            <User size={20} />
                            <span>Profile</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-3 px-4 py-3 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 rounded-xl font-bold transition-all">
                            <Settings size={20} />
                            <span>Settings</span>
                        </Link>
                    </nav>

                    <button className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all mt-auto border border-transparent hover:border-red-100">
                        <LogOut size={20} />
                        <Link href="/login">Logout</Link>
                    </button>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 lg:ml-72 bg-[#f8fafb] min-h-screen">
                    {/* Top Bar */}
                    <header className="h-20 bg-white border-b border-zinc-100 px-8 flex items-center justify-between sticky top-0 z-10">
                        <h1 className="text-xl font-black text-zinc-900">Customer Dashboard</h1>

                        <div className="flex items-center gap-6">
                            <button className="relative w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white"></span>
                            </button>
                            <div className="flex items-center gap-3 border-l border-zinc-100 pl-6 cursor-pointer group">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-black text-zinc-900">John Doe</p>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Customer</p>
                                </div>
                                <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                                    <User size={20} className="text-zinc-400" />
                                </div>
                            </div>
                        </div>
                    </header>

                    <div className="p-8 max-w-7xl mx-auto">
                        <div className="bg-emerald-500 rounded-[2.5rem] p-8 lg:p-12 text-white relative overflow-hidden mb-12">
                            <div className="relative z-10">
                                <h2 className="text-3xl lg:text-4xl font-black mb-4">Welcome back, John! 👋</h2>
                                <p className="text-emerald-50 font-medium max-w-md mb-8">
                                    You have 3 active service requests today. Check your progress and updates here.
                                </p>
                                <button className="bg-white text-emerald-600 px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-black/5 hover:bg-emerald-50 transition-all active:scale-95">
                                    View Orders
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-full bg-white/10 blur-[80px] -rotate-45 translate-x-12"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
                                <h3 className="font-black text-zinc-900 mb-2">Total Orders</h3>
                                <p className="text-4xl font-black text-emerald-500">12</p>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-4">+2 from last month</p>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
                                <h3 className="font-black text-zinc-900 mb-2">Avg. Rating</h3>
                                <p className="text-4xl font-black text-emerald-500">4.9</p>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-4">Top 5% of customers</p>
                            </div>
                            <div className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm">
                                <h3 className="font-black text-zinc-900 mb-2">Credits</h3>
                                <p className="text-4xl font-black text-emerald-500">₹450</p>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-4">Next reward at ₹500</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
