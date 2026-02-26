"use client";
import { useCookies } from "next-client-cookies";
class SessionManager {
    isLoggedIn: boolean;
    authToken: string | null;
    cookie: any;
    setCookie: any;
    constructor() {
        const [cookie, setCookie] = useCookies();
        this.cookie = cookie;
        this.setCookie = setCookie;
        this.isLoggedIn = !!cookie.authToken;
        this.authToken = cookie.authToken || null;
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
        this.setCookie("authToken", token, {
            path: "/",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            httpOnly: true,
        });
    }

    // clear token from cookies
    clearToken(): void {
        this.authToken = null;
        this.setCookie("authToken", null, {
            path: "/",
            maxAge: -1,
            httpOnly: true,
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
