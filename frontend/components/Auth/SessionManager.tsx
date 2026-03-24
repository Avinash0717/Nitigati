"use client";
import { useCookies } from "next-client-cookies";
class SessionManager {
    isLoggedIn: boolean;
    authToken: string | null;
    cookie: any;
    constructor() {
        const cookie = useCookies();
        this.cookie = cookie;
        this.isLoggedIn = !!cookie.get("authToken");
        this.authToken = cookie.get("authToken") || null;
        if (this.isLoggedIn) {
            console.log("SessionManager: Logged in");
        } else {
            // redirect to login page if not logged in
            console.log(
                "SessionManager: Not logged in, redirecting to login page",
            );
            window.location.href = "/login";
        }
    }

    // get token from cookies
    getToken(): string | null {
        return this.authToken;
    }

    // set token in cookies
    setToken(token: string): void {
        this.authToken = token;
        this.cookie.set("authToken", token, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            httpOnly: true,
        });
    }

    // clear token from cookies
    clearToken(): void {
        this.authToken = null;
        this.cookie.remove("authToken", {
            path: "/",
        });
    }

    // check if user is authorized to access a resource
    isAuthorized(resource: string): boolean {
        // For simplicity, we assume that if the user is logged in, they are authorized.
        // TODO: Implement actual authorization logic based on user roles and permissions.
        return this.isLoggedIn;
    }
}
export default SessionManager;
