import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAccessToken } from "../utils/auth";
export function middleware(request:NextRequest){
    const token = getAccessToken();
    if(!token){
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }
    return NextResponse.next();
    
}