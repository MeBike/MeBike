import { NextResponse } from "next/server";
import { firebaseAdmin } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const db = firebaseAdmin.database();
    const snapshot = await db.ref("notifications").orderByChild("timestamp").limitToLast(20).once("value");
    const data = snapshot.val();
    let notifications: any[] = [];
    if (data) {
      notifications = Object.keys(data).map((key) => ({
        id: key,
        ...data[key],
        timestamp: new Date(data[key].timestamp).toISOString(),
      }));
      notifications.reverse(); // Mới nhất lên đầu
    }
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: "Lỗi lấy lịch sử" }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const db = firebaseAdmin.database();
    const notificationsRef = db.ref("notifications");
    const snapshot = await notificationsRef.orderByChild("read").equalTo(false).once("value");
    const updates: Record<string, any> = {};

    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        updates[`${child.key}/read`] = true;
      });
      await notificationsRef.update(updates);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}