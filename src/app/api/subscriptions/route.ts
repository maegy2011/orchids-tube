import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function ensureUser(userId: string) {
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      await db.insert(users).values({ id: userId });
    }
  } catch (error) {
    console.error("Error ensuring user:", error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
    }

    const data = await db.query.subscriptions.findMany({
      where: eq(subscriptions.userId, userId),
      orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { error: "فشل جلب الاشتراكات" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, channelId, channelTitle, channelThumbnail } = body;
    
    if (!userId || !channelId || !channelTitle) {
      return NextResponse.json({ error: "الحقول المطلوبة ناقصة" }, { status: 400 });
    }

    await ensureUser(userId);

    const existing = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.userId, userId), eq(subscriptions.channelId, channelId)),
    });

    if (existing) {
      return NextResponse.json({ message: "مشترك بالفعل" });
    }

    await db.insert(subscriptions).values({
      userId,
      channelId,
      channelTitle,
      channelThumbnail,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: "فشل إنشاء الاشتراك" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, channelId } = body;
    
    if (!userId || !channelId) {
      return NextResponse.json({ error: "الحقول المطلوبة ناقصة" }, { status: 400 });
    }

    await db.delete(subscriptions).where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.channelId, channelId))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return NextResponse.json(
      { error: "فشل إلغاء الاشتراك" },
      { status: 500 }
    );
  }
}
