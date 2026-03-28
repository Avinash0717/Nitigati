import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { role } = body;
        const authHeader = req.headers.get("Authorization");

        if (!authHeader) {
            return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
        }

        const backendUrl = process.env.DJANGO_API_URL || 'http://127.0.0.1:8000';
        const backendResponse = await fetch(`${backendUrl}/api/switch-role/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
            },
            body: JSON.stringify({ role }),
        });

        const data = await backendResponse.json();
        return NextResponse.json(data, { status: backendResponse.status });
    } catch (err) {
        console.error("Role switch proxy error:", err);
        return NextResponse.json({ detail: "Internal server error" }, { status: 500 });
    }
}
