"use client";
import { useSessionManager } from "@/components/Auth/SessionManager";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export default function LogoutPage() {
    const router = useRouter();
    const sessionManager = useSessionManager();
    const hasProcessedLogout = useRef(false);

    useEffect(() => {
        if (hasProcessedLogout.current) {
            return;
        }

        hasProcessedLogout.current = true;
        sessionManager.clearToken();
        router.replace("/login");
    }, [sessionManager, router]);

    return (
        <div className="min-h-screen bg-[#f7faf8]">
            {/* ================= HEADER ================= */}
        </div>
    );
}
