import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const token = request.headers.get("authorization");
    const backendUrl = "http://127.0.0.1:8000/api/customer/orders/";

    try {
        const response = await fetch(backendUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token || "",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { message: "Failed to fetch orders" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Orders API route error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
