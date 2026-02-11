import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy POST /api/providers/aiOnboarding to Django /api/providers/ai-onboarding/
 * Handles multipart/form-data for AI transcript and images.
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Proxy request to Django backend
        const djangoResponse = await fetch(
            "http://127.0.0.1:8000/api/providers/ai-onboarding/",
            {
                method: "POST",
                body: formData,
                // fetch will automatically set Content-Type with boundary for FormData
            },
        );

        const data = await djangoResponse.json();

        return NextResponse.json(data, { status: djangoResponse.status });
    } catch (error: any) {
        console.error("Error in AI Onboarding API Proxy:", error);
        return NextResponse.json(
            { error: "Internal Server Error in Next.js API Proxy" },
            { status: 500 },
        );
    }
}
