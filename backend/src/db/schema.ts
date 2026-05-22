import {
  pgTable, varchar, text, timestamp, integer, pgEnum,
  json, boolean, index, serial, uniqueIndex
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const cpfStatusEnum = pgEnum("cpf_status", ["REGULAR", "PENDENTE", "CANCELADA", "NULA", "FALECIDO"]);
export const securityEventEnum = pgEnum("security_event_type", ["RATE_LIMIT", "SUSPICIOUS_LOGIN", "SUSPICIOUS_SIGNUP", "BOT_DETECTED", "SCRAPING", "BRUTE_FORCE"]);
export const anomalyTypeEnum = pgEnum("anomaly_type", ["BRUTE_FORCE", "SCRAPING", "GEO_ANOMALY", "PROFILE_CHANGE", "SIGNUP_SPIKE"]);
export const emailTypeEnum = pgEnum("email_type", ["SIGNUP_CONFIRMATION", "NEW_CHAPTER", "SECURITY_ALERT", "ACCOUNT_BLOCKED", "WEEKLY_DIGEST"]);
export const emailStatusEnum = pgEnum("email_status", ["SENT", "FAILED", "BOUNCED"]);
export const chapterFrequencyEnum = pgEnum("chapter_frequency", ["IMMEDIATE", "DAILY", "WEEKLY"]);
export const recommendationTypeEnum = pgEnum("recommendation_type", ["WEEKLY_DIGEST", "NEW_CHAPTER", "PERSONALIZED"]);
export const adminActionEnum = pgEnum("admin_action_type", ["CREATE_MANGA", "UPDATE_MANGA", "DELETE_MANGA", "BLOCK_USER", "UNBLOCK_USER", "VIEW_LOGS"]);
export const mangaStatusEnum = pgEnum("manga_status", ["ongoing", "completed", "hiatus"]);
export const mangaRatingEnum = pgEnum("manga_rating", ["L", "L10", "L12", "L14", "L16", "L18"]);

// ─── Tabelas ──────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: varchar("clerk_id", { length: 256 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
}, (t) => ({
  idxClerk: index("idx_users_clerk_id").on(t.clerkId),
  idxEmail: index("idx_users_email").on(t.email),
}));

export const cpfVerifications = pgTable("cpf_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  cpfHash: varchar("cpf_hash", { length: 255 }).notNull(),
  status: cpfStatusEnum("status").notNull(),
  verifiedAt: timestamp("verified_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"),
  apiResponse: json("api_response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  eventType: securityEventEnum("event_type").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  userId: integer("user_id"),
  details: json("details"),
  blockedUntil: timestamp("blocked_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  idxIp: index("idx_sec_ip").on(t.ipAddress),
  idxUser: index("idx_sec_user").on(t.userId),
}));

export const userRiskScores = pgTable("user_risk_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  ipAddress: varchar("ip_address", { length: 45 }),
  riskScore: integer("risk_score").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  blockedUntil: timestamp("blocked_until"),
  reason: varchar("reason", { length: 255 }),
});

export const anomalyLogs = pgTable("anomaly_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  ipAddress: varchar("ip_address", { length: 45 }),
  anomalyType: anomalyTypeEnum("anomaly_type").notNull(),
  riskPoints: integer("risk_points").notNull(),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const emailLogs = pgTable("email_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  emailType: emailTypeEnum("email_type").notNull(),
  recipientEmail: varchar("recipient_email", { length: 320 }),
  status: emailStatusEnum("status").notNull(),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const userNotificationPreferences = pgTable("user_notification_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  newChapterNotifications: boolean("new_chapter_notifications").default(true).notNull(),
  newChapterFrequency: chapterFrequencyEnum("new_chapter_frequency").default("DAILY").notNull(),
  securityAlerts: boolean("security_alerts").default(true).notNull(),
  weeklyDigest: boolean("weekly_digest").default(true).notNull(),
});

export const recommendationClicks = pgTable("recommendation_clicks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mangaId: integer("manga_id").notNull(),
  emailId: integer("email_id"),
  recommendationType: recommendationTypeEnum("recommendation_type").notNull(),
  clickedAt: timestamp("clicked_at").defaultNow().notNull(),
});

export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  actionType: adminActionEnum("action_type").notNull(),
  targetId: integer("target_id"),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  action: varchar("action", { length: 255 }).notNull(),
  details: json("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mangas = pgTable("mangas", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  description: text("description"),
  coverImage: varchar("cover_image", { length: 1000 }),
  status: mangaStatusEnum("status").default("ongoing").notNull(),
  rating: mangaRatingEnum("rating").default("L12").notNull(),
  genres: json("genres").$type<string[]>(),
  author: varchar("author", { length: 255 }),
  artist: varchar("artist", { length: 255 }),
  views: integer("views").default(0).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  idxSlug: index("idx_manga_slug").on(t.slug),
  idxStatus: index("idx_manga_status").on(t.status),
}));

export const chapters = pgTable("chapters", {
  id: serial("id").primaryKey(),
  mangaId: integer("manga_id").notNull(),
  chapterNumber: varchar("chapter_number", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }),
  pages: json("pages").$type<string[]>().notNull(),
  views: integer("views").default(0).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  idxManga: index("idx_chapter_manga").on(t.mangaId, t.chapterNumber),
}));

export const userHistory = pgTable("user_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mangaId: integer("manga_id").notNull(),
  chapterId: integer("chapter_id"),
  lastReadPage: integer("last_read_page").default(0),
  readAt: timestamp("read_at").defaultNow().notNull(),
}, (t) => ({
  idxUser: index("idx_history_user").on(t.userId, t.readAt),
}));

export const userFavorites = pgTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  mangaId: integer("manga_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  idxUnique: uniqueIndex("idx_fav_unique").on(t.userId, t.mangaId),
}));
