import { NextResponse } from "next/server";

export async function GET() {
    try {
        const backendResponse = await fetch("http://localhost:8000/api/provider-dashboard/summary/", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!backendResponse.ok) {
            return NextResponse.json(
                { message: "Failed to fetch dashboard data" },
                { status: backendResponse.status }
            );
        }

        const data = await backendResponse.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Dashboard API route error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
