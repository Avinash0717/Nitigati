import { NextResponse } from "next/server";

const BASE_URL = "http://127.0.0.1:8000/api/services/";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const targetUrl = id ? `${BASE_URL}${id}/` : BASE_URL;

    try {
        const response = await fetch(targetUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Backend error (${response.status}):`, errorText.slice(0, 200));
            return NextResponse.json(
                { error: `Backend returned ${response.status}`, details: errorText.slice(0, 500) },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error: any) {
        console.error("Proxy error:", error.message || error);
        return NextResponse.json(
            { error: `Proxy failure: ${error.message || "Unknown error"}` },
            { status: 500 }
        );
    }
}
