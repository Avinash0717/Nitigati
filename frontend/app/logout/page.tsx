"use client";
import { MessageSquare, Star } from "lucide-react";
import { useSessionManager } from "@/components/Auth/SessionManager";
import { useRouter } from "next/navigation";
export default function ExpertsPage() {
    const router = useRouter();
    const sessionManager = useSessionManager();
    if (!sessionManager.isLoggedIn) {
        sessionManager.clearToken();
        return null;
    }
    router.push("/login");
    return (
        <div className="min-h-screen bg-[#f7faf8]">
            {/* ================= HEADER ================= */}
        </div>
    );
}
