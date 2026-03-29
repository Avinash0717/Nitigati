"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    Briefcase,
    ShoppingBag,
    Settings,
    Search,
    Bell,
    Plus,
    LogOut,
    ChevronRight,
    User,
    ArrowLeftRight,
} from "lucide-react";

// Components
import Dashboard from "@/components/providerDashboard/Dashboard";
import ProviderMessages from "@/components/providerDashboard/providerMessages/ProviderMessages";
import ProviderServices from "@/components/providerDashboard/providerServices/ProviderServicesLobby";
import ProviderServicePage from "@/components/providerDashboard/providerServices/ProviderServicePage";
import ProviderOrders from "@/components/providerDashboard/providerOrders/ProviderOrders";
import { useSessionManager } from "@/components/Auth/SessionManager";
// --- INTERFACES ---

export interface ProviderOrder {
    order_id: string;
    service_title: string;
    customer_name: string;
    price: string;
    delivery_date: string;
    status: string;
}

// Interfaces
interface RecentOrder {
    id: number;
    title: string;
    client: string;
    amount: number;
    status: string;
}

interface DashboardData {
    verification_status: string;
    trust_badge: string;
    trust_badge_detail: string;
    total_earnings: number;
    active_orders: number;
    provider_rating: number;
    job_success_rate: number;
    recent_orders: RecentOrder[];
    earnings_statistics: {
        this_month: number[];
        last_month: number[];
    };
    pending_payout: number;
    user_name: string;
}

export interface ServiceSummary {
    id: string;
    title: string;
    tags: string[];
    images: string[];
    verification_status: string;
    price_range: string;
}

export interface ServiceDetail {
    id: string;
    uuid: string;
    title: string;
    description: string;
    tags: string[];
    images: string[];
    credentials?: { name: string; url: string }[];
    verification_status: string;
    price_range: string;
    provider_id: string;
    location?: string;
    created_at: string;
}

type ViewType =
    | "dashboard"
    | "messages"
    | "services"
    | "orders"
    | "service detail"
    | "messages";

export interface ProviderMessage {
    id: string;
    name: string;
    participants_usernames: string[];
    last_message?: {
        content: string;
        timestamp: string;
        sender: string;
    } | null;
    unread_count?: number;
}

export interface ChatMessage {
    id: string;
    room: string;
    sender_username: string;
    content: string;
    timestamp: string;
}

export interface Order {
    order_id: string;
    customer: string;
    provider: string;
    service: string;
    price: string;
    discount: string;
    delivery_days: number;
    revisions: number;
    signature: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

export type ChatViewType = "lobby" | "room";

export default function ProviderDashboardPage() {
    const router = useRouter();
    const [activeView, setActiveView] = useState<ViewType>("dashboard");
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Services State
    const [services, setServices] = useState<ServiceSummary[]>([]);
    const [selectedService, setSelectedService] =
        useState<ServiceDetail | null>(null);
    const [servicesLoading, setServicesLoading] = useState(false);

    // Messaging State
    const [messages, setMessages] = useState<ProviderMessage[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<ProviderMessage | null>(null);
    const [chatView, setChatView] = useState<ChatViewType>("lobby");
    const [messagesLoading, setMessagesLoading] = useState(false);

    // Orders State
    const [orders, setOrders] = useState<ProviderOrder[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    useEffect(() => {
        async function fetchDashboardData() {
            const token = sessionManager.getToken();
            try {
                const response = await fetch(
                    "/api/providers/providerDashboard/dashboard",
                    {
                        headers: {
                            Authorization: `Token ${token}`,
                        },
                    }
                );
                if (!response.ok)
                    throw new Error("Failed to fetch dashboard data");
                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Failed to load dashboard data. Please try again.");
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    const fetchMessages = async () => {
        setActiveView("messages");
        setChatView("lobby");
        const token = sessionManager.getToken();
        if (!token) return;

        setMessagesLoading(true);
        try {
            const response = await fetch("/api/providers/providerDashboard/messages/", {
                headers: { Authorization: `Token ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                
                // Normalize message data for the UI
                const normalizedMessages = data.map((room: any) => ({
                    id: room.id,
                    name: room.name,
                    participants_usernames: room.participants_usernames,
                    last_message: room.last_message ? {
                        content: room.last_message.content,
                        timestamp: room.last_message.timestamp,
                        sender: room.last_message.sender
                    } : null,
                    unread_count: room.unread_count || 0
                }));

                setMessages(normalizedMessages);
            }
        } catch (err) {
            console.error("Error fetching provider messages:", err);
            setError("Failed to load messages.");
        } finally {
            setMessagesLoading(false);
        }
    };

    const fetchServices = async () => {
        setActiveView("services");
        const token = sessionManager.getToken();
        if (!token) return;

        setServicesLoading(true);
        try {
            const response = await fetch("/api/services", {
                method: "GET",
                headers: {
                    Authorization: `Token ${token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch services");
            const result = await response.json();
            console.log(result);
            const mappedServices = result.map((s: any) => ({
                id: s.uuid,
                title: s.title,
                tags: s.tags,
                images: s.images || [],
                verification_status: s.verification_status,
                price_range: s.price_range,
            }));

            setServices(mappedServices);

            setActiveView("services");
        } catch (err) {
            console.error("Error fetching services:", err);
            setError("Failed to load services.");
        } finally {
            setServicesLoading(false);
        }
    };

    const fetchServiceDetail = async (id: string) => {
        const token = sessionManager.getToken();
        if (!token) return;

        setServicesLoading(true);
        try {
            const response = await fetch(`/api/services?id=${id}`, {
                method: "GET",
                headers: {
                    Authorization: `Token ${token}`,
                },
            });
            if (!response.ok)
                throw new Error("Failed to fetch service details");
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
                created_at: result.created_at,
            };

            setSelectedService(mappedService);
            setActiveView("service detail");
        } catch (err) {
            console.error("Error fetching service detail:", err);
            setError("Failed to load service details.");
        } finally {
            setServicesLoading(false);
        }
    };

    const fetchOrders = async () => {
        setActiveView("orders");
        const token = sessionManager.getToken();
        if (!token) return;

        setOrdersLoading(true);
        try {
            const response = await fetch("/api/providers/providerDashboard/order", {
                headers: { Authorization: `Token ${token}` }
            });
            if (response.ok) {
                setOrders(await response.json());
            }
        } catch (err) {
            console.error("Error fetching provider orders:", err);
            setError("Failed to load orders.");
        } finally {
            setOrdersLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center min-h-100">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="bg-red-50 text-red-600 p-8 rounded-4xl border border-red-100 text-center max-w-md mx-auto mt-20">
                    <p className="font-black mb-4">
                        Oops! Something went wrong.
                    </p>
                    <p className="text-sm font-medium mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 text-white px-6 py-2 rounded-xl text-xs font-black transition-all active:scale-95"
                    >
                        Try Again
                    </button>
                </div>
            );
        }

        switch (activeView) {
            case "dashboard":
                return data ? <Dashboard data={data} /> : null;
            case "services":
                return (
                    <ProviderServices
                        services={services}
                        onServiceClick={fetchServiceDetail}
                        loading={servicesLoading}
                    />
                );
            case "service detail":
                return selectedService ? (
                    <ProviderServicePage
                        service={selectedService}
                        onBack={() => setActiveView("services")}
                        onMessageProvider={() => {}} // No-op as provider is looking at own service
                    />
                ) : null;
            case "messages":
                return (
                    <ProviderMessages 
                        messages={messages}
                        view={chatView}
                        selectedRoom={selectedRoom}
                        onBackToLobby={() => setChatView("lobby")}
                        onSelectRoom={(room: ProviderMessage) => {
                            setSelectedRoom(room);
                            setChatView("room");
                        }}
                        userName={data?.user_name || ""}
                        token={sessionManager.getToken() || ""}
                        loading={messagesLoading}
                    />
                );
            case "orders":
                return <ProviderOrders orders={orders} loading={ordersLoading} />;
            default:
                return null;
        }
    };

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "messages", label: "Messages", icon: MessageSquare },
        { id: "services", label: "Services", icon: Briefcase },
        { id: "orders", label: "Orders", icon: ShoppingBag },
    ];

    const sessionManager = useSessionManager();

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
                            Provider Portal
                        </span>
                    </div>
                </Link>

                <nav className="space-y-2 flex-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.id === "services") {
                                    fetchServices();
                                } else if (item.id === "messages") {
                                    fetchMessages();
                                } else if (item.id === "orders") {
                                    fetchOrders();
                                } else {
                                    setActiveView(item.id as ViewType);
                                }
                            }}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${
                                activeView === item.id ||
                                (item.id === "services" &&
                                    activeView === "service detail")
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
                                        Authorization: `Token ${token}`,
                                    },
                                    body: JSON.stringify({ role: "customer" }),
                                });
                                if (res.ok) {
                                    router.push("/customerDashboard");
                                } else if (res.status === 403) {
                                    // Provider profile doesn't exist, go to onboarding
                                    router.push("/customerOnboarding");
                                } else {
                                    console.error("Failed to switch role");
                                    // Fallback redirect anyway if backend fails but we want to allow movement?
                                    // Actually, better to just push if we are sure.
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
                        <span className="text-sm">Switch to Customer</span>
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
                    <Link
                        href="/login"
                        onClick={() => sessionManager.clearToken()}
                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-50 font-bold transition-all group mt-2"
                    >
                        <LogOut
                            size={22}
                            className="text-red-400 group-hover:text-red-600 transition-colors"
                        />
                        <span className="text-sm">Logout</span>
                    </Link>
                </div>

                {/* User Mini Profile */}
                <div className="mt-12 flex items-center gap-4 p-2 bg-zinc-50/50 rounded-2xl border border-zinc-100/50">
                    <div className="w-12 h-12 bg-zinc-200 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                        <img
                            src="https://ui-avatars.com/api/?name=Alex+Rivera&background=00ff7f&color=fff"
                            alt="Alex Rivera"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-black text-zinc-900 truncate">
                            Alex Rivera
                        </p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                            Pro Tier
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-72 flex flex-col">
                {/* Top Header */}
                <header className="h-24 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-10 flex items-center justify-between sticky top-0 z-10 transition-all">
                    <div className="max-w-xl w-full relative group">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search orders, clients, or services..."
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
                        <Link
                            href="/newServiceForm"
                            className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white px-8 rounded-2xl flex items-center gap-3 font-black text-xs transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                        >
                            <Plus size={18} />
                            <span>Create New Service</span>
                        </Link>
                    </div>
                </header>

                {/* Center Content Padding Area */}
                <div className={`mx-auto w-full ${activeView === "messages" && chatView === "room" ? "p-0 h-[calc(100vh-6rem)] overflow-hidden" : "p-10 max-w-7xl"}`}>
                    {(activeView !== "messages" || chatView !== "room") && (
                        <div className="mb-12">
                            <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
                                <span>Nitigati Partner</span>
                                <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                                <span>{activeView}</span>
                            </div>
                            <h2 className="text-4xl font-black text-zinc-900 tracking-tight capitalize">
                                {activeView}
                            </h2>
                        </div>
                    )}

                    {renderContent()}
                </div>
            </main>
        </div>
    );
}
