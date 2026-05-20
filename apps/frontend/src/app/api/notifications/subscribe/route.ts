import { NextResponse } from "next/server";
import { firebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { token, topic } = await req.json();
    await firebaseAdmin.messaging().subscribeToTopic(token, topic);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Lỗi subscribe" }, { status: 500 });
  }
}