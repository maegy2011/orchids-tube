import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  channelId: text("channel_id").notNull(),
  channelTitle: text("channel_title").notNull(),
  channelThumbnail: text("channel_thumbnail"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const watchHistory = sqliteTable("watch_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  videoId: text("video_id").notNull(),
  videoTitle: text("video_title").notNull(),
  videoThumbnail: text("video_thumbnail"),
  watchedAt: integer("watched_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});
