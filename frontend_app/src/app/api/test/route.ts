import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${apiUrl}/health`);
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      apiUrl,
      backendStatus: data,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      apiUrl,
      error: error.message,
      message: 'Backend server is not running or not accessible',
    }, { status: 500 });
  }
}

