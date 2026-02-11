import { NextResponse } from "next/server";

const BACKEND_URL = "http://127.0.0.1:8000/api/providers/upload-images/";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        const response = await fetch(BACKEND_URL, {
            method: "POST",
            body: formData,
            // Boundary is automatically set by fetch for FormData
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
