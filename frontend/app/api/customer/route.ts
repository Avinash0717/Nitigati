import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy POST /api/customer to Django /api/customers/
 * Handles multipart/form-data with profile picture.
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Proxy request to Django backend
        const djangoResponse = await fetch('http://127.0.0.1:8000/api/customers/', {
            method: 'POST',
            body: formData,
            // No need to set Content-Type header manually for FormData, 
            // fetch will automatically set it with the correct boundary.
        });

        const data = await djangoResponse.json();

        return NextResponse.json(data, { status: djangoResponse.status });
    } catch (error: any) {
        console.error('Error in Customer API Route:', error);
        return NextResponse.json(
            { detail: 'Internal Server Error in Next.js API Proxy' },
            { status: 500 }
        );
    }
}
