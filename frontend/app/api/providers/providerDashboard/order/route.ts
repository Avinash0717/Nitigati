import { NextResponse } from "next/server";

const BACKEND_URL = "http://127.0.0.1:8000/api/orders/create/";

export async function POST(request: Request) {
    const token = request.headers.get("authorization");
    const body = await request.json();

    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token || "",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const text = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(text);
            } catch {
                errorData = { raw: text };
            }
            return NextResponse.json(
                { message: "Failed to create order", ...errorData },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error("Order API POST error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}
