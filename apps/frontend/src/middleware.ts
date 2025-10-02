import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
export function middleware(request:NextRequest){
    const token = request.cookies.get("access_token")?.value
}