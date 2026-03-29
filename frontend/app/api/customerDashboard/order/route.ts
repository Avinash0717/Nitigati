import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const token = request.headers.get("authorization");

    try {
        const response = await fetch("http://127.0.0.1:8000/api/customer/orders/", {
            method: "GET",
            headers: {
                "Authorization": token || "",
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json(
                { message: "Failed to fetch customer orders" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Fetch error:", error);
        return NextResponse.json(
            { message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
