import { NextRequest, NextResponse } from "next/server";
import { testConnection, getConnectionStatus } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    // Check connection status
    const status = getConnectionStatus();
    
    // Test actual connection
    const testResult = await testConnection();
    
    return NextResponse.json({
      success: true,
      status,
      testResult,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Database test failed",
        status: getConnectionStatus()
      },
      { status: 500 }
    );
  }
}
