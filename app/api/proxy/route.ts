// app/api/proxy/route.ts (or pages/api/proxy.ts if you are using Pages Router)
import { NextRequest, NextResponse } from "next/server";

// REPLACE THIS WITH YOUR DEPLOYED APPS SCRIPT WEB APP URL!
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyuK6jNptyIFBJcp_A0dkuMm8VRdQdhjk-cBvGkNbrK9VjFwzMbbR1iPpo45t-tHSMf/exec";

export async function GET(req: NextRequest) {
  const url = new URL(GOOGLE_APPS_SCRIPT_URL);
  // Forward all query parameters from the incoming request to the Apps Script URL
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  try {
    const res = await fetch(url.toString());
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Proxy GET failed:", err);
    return NextResponse.json({ error: "Proxy GET failed", details: err }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Get search parameters from the incoming request URL
  const { searchParams } = new URL(req.url);
  const url = new URL(GOOGLE_APPS_SCRIPT_URL);
  // Forward all search parameters to the Apps Script URL
  searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  try {
    const body = await req.json(); // Parse the request body as JSON
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body), // Stringify the JSON body for the Apps Script
    });
    const text = await res.text(); // Read the response as text

    // Try to parse as JSON, but handle cases where Apps Script returns plain text
    try {
      const jsonResponse = JSON.parse(text);
      return NextResponse.json(jsonResponse);
    } catch (e) {
      // If parsing fails, it's likely a plain text response (e.g., success message)
      return new NextResponse(text);
    }
  } catch (err) {
    console.error("Proxy POST failed:", err);
    return NextResponse.json({ error: "Proxy POST failed", details: err }, { status: 500 });
  }
}

