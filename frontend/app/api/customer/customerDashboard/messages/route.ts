import { NextResponse } from "next/server";

const BACKEND_URL = "http://127.0.0.1:8000/api/chat";

export async function GET(request: Request) {
    const token = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get("room");

    let url = `${BACKEND_URL}/rooms/`;
    if (roomName) {
        url = `${BACKEND_URL}/messages/?room=${roomName}`;
    }

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token || "",
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { message: "Failed to fetch chat data" },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Messages API GET error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const token = request.headers.get("authorization");
    const body = await request.json();

    // If it's initiating a chat with a provider
    if (body.provider_id) {
        const url = `${BACKEND_URL}/rooms/get_or_create_room/`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token || "",
                },
                body: JSON.stringify({ provider_id: body.provider_id }),
            });

            if (!response.ok) {
                return NextResponse.json(
                    { message: "Failed to initiate chat" },
                    { status: response.status }
                );
            }

            const data = await response.json();
            return NextResponse.json(data);
        } catch (error) {
            console.error("Messages API POST error:", error);
            return NextResponse.json(
                { message: "Internal server error" },
                { status: 500 }
            );
        }
    }

    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
}
