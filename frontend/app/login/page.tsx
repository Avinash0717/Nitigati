"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Eye, EyeOff, ArrowRight, User, Briefcase, HelpCircle } from "lucide-react";

interface LoginFormData {
    email: string;
    password: string;
    keep_me_logged_in: boolean;
}

interface LoginResponse {
    message: string;
    authenticated?: boolean;
}

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
        keep_me_logged_in: false,
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data: LoginResponse = await response.json();

            if (response.ok && data.authenticated) {
                router.push("/customerDashboard");
            } else {
                setError(data.message || "Invalid credentials");
            }
        } catch (err) {
            console.error("Login submission error:", err);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafb] font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
            {/* Header */}
            <header className="p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-10">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-emerald-500/20">
                        <span className="text-white font-black text-xl italic pt-1">N</span>
                    </div>
                    <span className="text-2xl font-black tracking-tight pt-1">Nitigati</span>
                </Link>
                <Link href="#" className="text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-2 font-medium">
                    <HelpCircle size={20} />
                    <span>Help</span>
                </Link>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 pt-24 pb-12">
                <div className="w-full max-w-[500px]">
                    <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-2xl shadow-emerald-500/5 p-8 lg:p-12">
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-black tracking-tight text-zinc-900 mb-3">
                                Welcome Back
                            </h1>
                            <p className="text-zinc-500 font-medium">
                                Log in to your Nitigati account
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 text-center">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-black text-zinc-900">
                                    Email Address
                                </label>
                                <div className="relative group">
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="name@company.com"
                                        required
                                        className="w-full h-14 pl-5 pr-12 rounded-2xl border border-zinc-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold placeholder:text-zinc-300 placeholder:font-medium text-zinc-700 bg-zinc-50/30"
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors">
                                        <Mail size={22} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label htmlFor="password" className="block text-sm font-black text-zinc-900">
                                        Password
                                    </label>
                                    <Link href="#" className="text-xs font-black text-emerald-500 hover:text-emerald-600 transition-colors">
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                        className="w-full h-14 pl-5 pr-12 rounded-2xl border border-zinc-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold placeholder:text-zinc-300 placeholder:font-medium text-zinc-700 bg-zinc-50/30"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-300 hover:text-emerald-500 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        id="keepMeLoggedIn"
                                        name="keep_me_logged_in"
                                        checked={formData.keep_me_logged_in}
                                        onChange={handleChange}
                                        className="w-5 h-5 rounded-lg border-2 border-zinc-200 appearance-none checked:bg-emerald-500 checked:border-emerald-500 cursor-pointer transition-all"
                                    />
                                    <div className="absolute pointer-events-none opacity-0 checked:opacity-100 left-[3px] text-white">
                                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    </div>
                                </div>
                                <label htmlFor="keepMeLoggedIn" className="text-sm font-bold text-zinc-500 cursor-pointer select-none">
                                    Keep me logged in
                                </label>
                                {/* CSS hack for checked state icon visibility - since tailwind 'checked:' modifier on parent is needed for absolute child */}
                                <style jsx>{`
                  input:checked + div {
                    opacity: 1;
                  }
                `}</style>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 bg-[#00ff7f] hover:bg-[#00ea74] disabled:bg-zinc-100 disabled:text-zinc-400 text-zinc-900 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-2 border-zinc-900/10 border-t-zinc-900 rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Log In</span>
                                        <ArrowRight size={24} />
                                    </>
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <p className="text-sm font-bold text-zinc-500">
                                    Don't have an account?{" "}
                                    <Link href="#" className="text-zinc-900 hover:text-emerald-500 transition-colors">
                                        Sign Up
                                    </Link>
                                </p>
                            </div>
                        </form>
                    </div>

                    <div className="mt-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="h-px bg-zinc-200 flex-1"></div>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">Or Join As</span>
                            <div className="h-px bg-zinc-200 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Link href="/customerOnboarding" className="h-14 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-50 transition-all font-black text-zinc-900 shadow-sm">
                                <User size={18} />
                                <span>Customer</span>
                            </Link>
                            <Link href="/providerOnboarding" className="h-14 bg-white border border-zinc-100 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-50 transition-all font-black text-zinc-900 shadow-sm">
                                <Briefcase size={18} />
                                <span>Provider</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-8 border-t border-zinc-100 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                            <span className="font-black text-sm italic">N</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                            © 2024 Nitigati Inc.
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-8">
                        <Link href="#" className="text-xs font-bold text-zinc-400 hover:text-emerald-500 uppercase tracking-widest transition-colors">Privacy Policy</Link>
                        <Link href="#" className="text-xs font-bold text-zinc-400 hover:text-emerald-500 uppercase tracking-widest transition-colors">Terms of Service</Link>
                        <Link href="#" className="text-xs font-bold text-zinc-400 hover:text-emerald-500 uppercase tracking-widest transition-colors">Support</Link>
                        <Link href="#" className="text-xs font-bold text-zinc-400 hover:text-emerald-500 uppercase tracking-widest transition-colors">Status</Link>
                    </div>

                    <div className="flex gap-4">
                        <Link href="#" className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all">
                            <span className="text-lg">𝕏</span>
                        </Link>
                        <Link href="#" className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all">
                            <span className="text-lg">in</span>
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
