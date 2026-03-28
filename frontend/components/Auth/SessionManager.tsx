"use client";
import { useState } from "react";
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
    const [authToken, setAuthToken] = useState<string | null>(
        cookie.get("authToken") || null,
    );
    const isLoggedIn = authToken !== null;

    const getToken = (): string | null => {
        return authToken || cookie.get("authToken") || null;
    };

    const setToken = (token: string) => {
        cookie.set("authToken", token, {
            path: "/",
            expires: 7,
        });
        setAuthToken(token);
    };

    const clearToken = () => {
        cookie.remove("authToken", {
            path: "/",
        });
        setAuthToken(null);
    };

    const isAuthorized = (_resource: string): boolean => {
        return getToken() !== null;
    };

    return {
        isLoggedIn,
        authToken,
        getToken,
        setToken,
        clearToken,
        isAuthorized,
    };
}
