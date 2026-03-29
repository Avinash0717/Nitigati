import { NextResponse } from "next/server";

const CREATE_URL = "http://127.0.0.1:8000/api/orders/create/";
const LIST_URL = "http://127.0.0.1:8000/api/provider/orders/";

export async function GET(request: Request) {
    const token = request.headers.get("authorization");

    try {
        const response = await fetch(LIST_URL, {
            method: "GET",
            headers: {
                "Authorization": token || "",
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!response.ok) {
            return NextResponse.json(
                { message: "Failed to fetch provider orders" },
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

export async function POST(request: Request) {
    const token = request.headers.get("authorization");
    const body = await request.json();

    try {
        const response = await fetch(CREATE_URL, {
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

