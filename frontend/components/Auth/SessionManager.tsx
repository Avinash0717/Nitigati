"use client";
import { useCookies } from "next-client-cookies";

type SessionManager = {
    isLoggedIn: boolean;
    authToken: string | null;
    getToken: () => string | null;
    setToken: (token: string) => void;
    clearToken: () => void;
    isAuthorized: (_resource: string) => boolean;
};

export function useSessionManager(): SessionManager {
    const cookie = useCookies();
    const authToken = cookie.get("authToken") || null;
    const isLoggedIn = !!authToken;

    return {
        isLoggedIn,
        authToken,
        getToken: () => authToken,
        setToken: (token: string) => {
            cookie.set("authToken", token, {
                path: "/",
                expires: 7,
            });
        },
        clearToken: () => {
            cookie.remove("authToken", {
                path: "/",
            });
        },
        isAuthorized: (_resource: string) => isLoggedIn,
    };
}
