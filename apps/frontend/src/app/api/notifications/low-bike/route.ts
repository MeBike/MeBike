import { NextResponse } from "next/server";
import { firebaseAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { stationId, stationName, availableBikes } = await req.json();
    const title = "🚨 Yêu cầu điều phối xe gấp!";
    const bodyText = `Trạm ${stationName} hiện chỉ còn ${availableBikes} xe sẵn sàng.`;

    // 1. Lưu vào RTDB
    const db = firebaseAdmin.database();
    await db.ref("notifications").push().set({
      title,
      body: bodyText,
      stationId: String(stationId),
      type: "REDISTRIBUTION_ALERT",
      read: false,
      timestamp: Date.now(),
    });

    // 2. Bắn Push Notification
    await firebaseAdmin.messaging().send({
      notification: { title, body: bodyText },
      data: { stationId: String(stationId), type: "REDISTRIBUTION_ALERT" },
      topic: "staff_alerts", 
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}