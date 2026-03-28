"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    ShoppingBag,
    History,
    MessageSquare,
    Search,
    Settings,
    LogOut,
    Bell,
    ChevronRight,
    Compass,
    ArrowLeftRight,
} from "lucide-react";

// Components
import Dashboard from "@/components/customerDashboard/Dashboard";
import CustomerOrders from "@/components/customerDashboard/customerOrders/CustomerOrders";
import CustomerTransactions from "@/components/customerDashboard/customerTransactions/CustomerTransactions";
import CustomerMessages from "@/components/customerDashboard/customerMessages/CustomerMessages";
import CustomerDiscoverServices from "@/components/customerDashboard/customerDiscoverServices/CustomerDiscoverServices";
import ProviderServicePage from "@/components/providerDashboard/providerServices/ProviderServicePage";
import { useSessionManager } from "@/components/Auth/SessionManager";
import { ServiceDetail } from "@/app/providerDashboard/page";

// --- INTERFACES ---

export interface CustomerOrder {
    id: string;
    service_title: string;
    provider_name: string;
    status: string;
    amount: number;
    image_url?: string;
    status_color?: string;
}

export interface CustomerActivity {
    id: string;
    type: string;
    content: string;
    time_ago: string;
    icon_type: string;
}

export interface CustomerStats {
    total_investment: number;
    active_projects: number;
    saved_experts: number;
}

export interface CustomerDashboardData {
    user_name: string;
    greeting: string;
    active_orders: CustomerOrder[];
    recent_activity: CustomerActivity[];
    stats: CustomerStats;
}

export interface CustomerTransaction {
    id: string;
    amount: number;
    date: string;
    status: string;
    provider_name: string;
}

export interface CustomerMessage {
    id: string;
    sender_name: string;
    last_message: string;
    time: string;
    unread_count: number;
}

export interface DiscoverService {
    id: string;
    uuid: string;
    title: string;
    description: string;
    tags: string[];
    images: string[];
    price_range: string;
    provider_id: string;
    provider_name: string;
    provider_image?: string;
    location?: string;
    verification_status: string;
}

export interface DiscoverServicesData {
    featured: DiscoverService[];
    trending: DiscoverService[];
    recommended: DiscoverService[];
}

type ViewType =
    | "dashboard"
    | "orders"
    | "transactions"
    | "messages"
    | "discover services"
    | "service_detail";

export default function CustomerDashboardPage() {
    const router = useRouter();
    const sessionManager = useSessionManager();
    const [activeView, setActiveView] = useState<ViewType>("dashboard");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dynamic Data State
    const [dashboardData, setDashboardData] =
        useState<CustomerDashboardData | null>(null);
    const [orders, setOrders] = useState<CustomerOrder[]>([]);
    const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
    const [messages, setMessages] = useState<CustomerMessage[]>([]);
    const [discoverData, setDiscoverData] = useState<DiscoverServicesData | null>(null);
    const [selectedService, setSelectedService] = useState<ServiceDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Redirect if not logged in
    useEffect(() => {
        console.log("Checking login status:", sessionManager.isLoggedIn);
        if (!sessionManager.isLoggedIn) {
            router.push("/login");
        }
    }, [sessionManager.isLoggedIn, router]);

    // Fetch Dashboard Data
    useEffect(() => {
        if (!sessionManager.isLoggedIn) return;

        async function fetchInitialData() {
            setLoading(true);
            try {
                const token = sessionManager.getToken();
                const response = await fetch(
                    "/api/customer/customerDashboard/dashboard",
                    {
                        headers: {
                            Authorization: `Token ${token}`,
                        },
                    },
                );

                if (!response.ok)
                    throw new Error("Failed to fetch dashboard data");
                const result = await response.json();
                setDashboardData(result);
            } catch (err: any) {
                console.error("Dashboard Load Error:", err);
                setError(err.message || "Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        }

        fetchInitialData();
    }, []);

    // Fetch View-Specific Data
    const handleViewChange = async (view: ViewType) => {
        setActiveView(view);
        if (!sessionManager.isLoggedIn) return;
        const token = sessionManager.getToken();

        try {
            if (view === "orders") {
                const res = await fetch(
                    "/api/customer/customerDashboard/order",
                    {
                        headers: { Authorization: `Token ${token}` },
                    },
                );
                if (res.ok) setOrders(await res.json());
            } else if (view === "transactions") {
                const res = await fetch(
                    "/api/customer/customerDashboard/transaction",
                    {
                        headers: { Authorization: `Token ${token}` },
                    },
                );
                if (res.ok) setTransactions(await res.json());
            } else if (view === "messages") {
                const res = await fetch(
                    "/api/customer/customerDashboard/messages",
                    {
                        headers: { Authorization: `Token ${token}` },
                    },
                );
                if (res.ok) setMessages(await res.json());
            } else if (view === "discover services") {
                const res = await fetch(
                    "/api/customer/customerDashboard/discoverServices",
                    {
                        headers: { Authorization: `Token ${token}` },
                    },
                );
                if (res.ok) setDiscoverData(await res.json());
            }
        } catch (err) {
            console.error(`Error fetching ${view} data:`, err);
        }
    };

    const fetchServiceDetail = async (uuid: string) => {
        if (!sessionManager.isLoggedIn) return;
        const token = sessionManager.getToken();
        
        setDetailLoading(true);
        try {
            const response = await fetch(
                `/api/providers/providerDashboard/services?id=${uuid}`,
                {
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                },
            );
            if (!response.ok) throw new Error("Failed to fetch service details");
            const result = await response.json();

            // Mapping backend response to ServiceDetail interface
            const mappedService: ServiceDetail = {
                id: result.id || result.uuid,
                uuid: result.uuid,
                title: result.title,
                description: result.description,
                tags: result.tags,
                images: result.images || [],
                credentials: result.credentials || [],
                verification_status: result.verification_status,
                price_range: result.price_range,
                provider_id: result.provider_id,
                location: result.location || "Location not specified",
                created_at: result.created_at
            };

            setSelectedService(mappedService);
            setActiveView("service_detail");
        } catch (err) {
            console.error("Error fetching service detail:", err);
            setError("Failed to load service details.");
        } finally {
            setDetailLoading(false);
        }
    };

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "orders", label: "Orders", icon: ShoppingBag },
        { id: "transactions", label: "Transactions", icon: History },
        { id: "messages", label: "Messages", icon: MessageSquare },
        { id: "discover services", label: "Discover Services", icon: Compass },
    ];

    const renderContent = () => {
        if ((loading && activeView === "dashboard") || detailLoading) {
            return (
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 text-red-600 p-8 rounded-[2rem] border border-red-100 text-center max-w-md mx-auto mt-20">
                    <p className="font-black mb-4">Error loading data</p>
                    <p className="text-sm font-medium mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-6 py-2 rounded-xl text-xs font-black"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        switch (activeView) {
            case "dashboard":
                return dashboardData ? (
                    <Dashboard data={dashboardData} />
                ) : null;
            case "orders":
                return <CustomerOrders orders={orders} />;
            case "transactions":
                return <CustomerTransactions transactions={transactions} />;
            case "messages":
                return <CustomerMessages messages={messages} />;
            case "discover services":
                return <CustomerDiscoverServices data={discoverData} onServiceClick={fetchServiceDetail} />;
            case "service_detail":
                return selectedService ? (
                    <ProviderServicePage 
                        service={selectedService} 
                        onBack={() => setActiveView("discover services")} 
                    />
                ) : null;
            default:
                return null;
        }
    };

    if (!sessionManager.isLoggedIn) return null;

    return (
        <div className="min-h-screen bg-[#f8fafb] font-sans selection:bg-emerald-100 selection:text-emerald-900 flex">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-zinc-100 flex flex-col p-8 fixed h-full z-20">
                <Link href="/" className="flex items-center gap-3 group mb-16">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg shadow-emerald-500/20">
                        <span className="text-white font-black text-2xl italic pt-1">
                            N
                        </span>
                    </div>
                    <div>
                        <span className="text-2xl font-black tracking-tighter block leading-none">
                            Nitigati
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">
                            Customer Client
                        </span>
                    </div>
                </Link>

                <nav className="space-y-2 flex-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() =>
                                handleViewChange(item.id as ViewType)
                            }
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
                                activeView === item.id
                                    ? "bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20"
                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 font-bold"
                            }`}
                        >
                            <item.icon
                                size={22}
                                className={`${activeView === item.id ? "text-white" : "text-zinc-400 group-hover:text-emerald-500"} transition-colors`}
                            />
                            <span className="text-sm">{item.label}</span>
                            {activeView === item.id && (
                                <ChevronRight
                                    size={16}
                                    className="ml-auto opacity-50"
                                />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-8 space-y-2">
                    <button
                        onClick={async () => {
                            const token = sessionManager.getToken();
                            if (!token) {
                                router.push("/login");
                                return;
                            }
                            try {
                                const res = await fetch("/api/switch-role", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Authorization": `Token ${token}`,
                                    },
                                    body: JSON.stringify({ role: "provider" }),
                                });

                                if (res.ok) {
                                    router.push("/providerDashboard");
                                } else if (res.status === 403) {
                                    // Provider profile doesn't exist, go to onboarding
                                    router.push("/providerOnboarding");
                                } else {
                                    console.error("Failed to switch role");
                                    router.push("/providerDashboard");
                                }
                            } catch (err) {
                                console.error("Switch error:", err);
                                router.push("/providerDashboard");
                            }
                        }}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 font-bold transition-all group"
                    >
                        <ArrowLeftRight
                            size={22}
                            className="text-emerald-500 group-hover:rotate-12 transition-transform"
                        />
                        <span className="text-sm">Switch to Provider</span>
                    </button>
                </div>

                <div className="pt-8 mt-8 border-t border-zinc-50 space-y-2">
                    <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 font-bold transition-all group">
                        <Settings
                            size={22}
                            className="text-zinc-400 group-hover:text-emerald-500 transition-colors"
                        />
                        <span className="text-sm">Settings</span>
                    </button>
                    <button
                        onClick={() => {
                            sessionManager.clearToken();
                            router.push("/login");
                        }}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-50 font-bold transition-all group mt-2"
                    >
                        <LogOut
                            size={22}
                            className="text-red-400 group-hover:text-red-600 transition-colors"
                        />
                        <span className="text-sm">Logout</span>
                    </button>
                </div>

                {/* User Profile */}
                <div className="mt-12 flex items-center gap-4 p-2 bg-zinc-50/50 rounded-2xl border border-zinc-100/50">
                    <div className="w-12 h-12 bg-zinc-200 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                        <img
                            src={`https://ui-avatars.com/api/?name=${dashboardData?.user_name || "User"}&background=00ff7f&color=fff`}
                            alt="User Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-black text-zinc-900 truncate">
                            {dashboardData?.user_name || "Alex Rivera"}
                        </p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                            Premium Member
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-72 flex flex-col">
                <header className="h-24 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-10 flex items-center justify-between sticky top-0 z-10 transition-all">
                    <div className="max-w-xl w-full relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search, providers, or orders..."
                            className="w-full h-12 bg-zinc-50 rounded-2xl pl-14 pr-6 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all text-sm font-bold text-zinc-700 outline-none placeholder:text-zinc-300"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative w-12 h-12 bg-white rounded-2xl border border-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-emerald-50 hover:text-emerald-500 transition-all group shadow-sm">
                            <Bell
                                size={20}
                                className="group-hover:rotate-12 transition-transform"
                            />
                            <span className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        </button>
                        <div className="h-10 w-[1px] bg-zinc-100 mx-2"></div>
                        <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                            Zenith Portal
                        </span>
                    </div>
                </header>

                <div className="p-10 max-w-7xl mx-auto w-full">
                    <div className="mb-12">
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
                            <span>Nitigati Client</span>
                            <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                            <span>{activeView}</span>
                        </div>
                        <h2 className="text-4xl font-black text-zinc-900 tracking-tight capitalize">
                            {activeView}
                        </h2>
                    </div>

                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
