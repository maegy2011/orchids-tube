import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchHistory, users } from "@/lib/db/schema";
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

    const data = await db.query.watchHistory.findMany({
      where: eq(watchHistory.userId, userId),
      orderBy: (watchHistory, { desc }) => [desc(watchHistory.watchedAt)],
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "فشل جلب سجل المشاهدة" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, videoId, videoTitle, videoThumbnail } = body;
    
    if (!userId || !videoId || !videoTitle) {
      return NextResponse.json({ error: "الحقول المطلوبة ناقصة" }, { status: 400 });
    }

    await ensureUser(userId);

    const existing = await db.query.watchHistory.findFirst({
      where: and(eq(watchHistory.userId, userId), eq(watchHistory.videoId, videoId)),
    });

    if (existing) {
      await db.update(watchHistory)
        .set({ watchedAt: new Date() })
        .where(eq(watchHistory.id, existing.id));
      return NextResponse.json({ success: true, updated: true });
    }

    await db.insert(watchHistory).values({
      userId,
      videoId,
      videoTitle,
      videoThumbnail,
      watchedAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording history:", error);
    return NextResponse.json(
      { error: "فشل تسجيل المشاهدة" },
      { status: 500 }
    );
  }
}
