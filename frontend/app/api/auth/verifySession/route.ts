import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy GET /api/verifySession to Django /api/verify_token/
 * send token in Authorization header as "Token <token_value>" and await response
 *  to confirm session validity. Return directly if no token provided or if
 *  Django returns 401. Otherwise, return 200 with session details.
 * Get token from request auth header
 */
export async function GET(request: NextRequest) {
    try {
        // Proxy request to Django backend
        const djangoResponse = await fetch(
            "http://127.0.0.1:8000/api/verify_token/",
            {
                method: "GET",
                headers: {
                    Authorization: request.headers.get("Authorization") || "",
                },
            },
        );

        const data = await djangoResponse.json();

        return NextResponse.json(data, { status: djangoResponse.status });
    } catch (error: any) {
        console.error("Error in Verifying Session. API Route:", error);
        return NextResponse.json(
            { detail: "Internal Server Error in Next.js API Proxy" },
            { status: 500 },
        );
    }
}
