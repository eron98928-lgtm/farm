import { mysqlTable, varchar, text, timestamp, int, mysqlEnum, json, boolean, index } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  clerkId: varchar("clerkId", { length: 256 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  idx_clerkId: index("idx_clerk_id").on(table.clerkId),
  idx_email: index("idx_email").on(table.email),
}));

export const cpfVerifications = mysqlTable("cpf_verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  cpfHash: varchar("cpfHash", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["REGULAR", "PENDENTE", "CANCELADA", "NULA", "FALECIDO"]).notNull(),
  verifiedAt: timestamp("verifiedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  apiResponse: json("apiResponse"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  idx_userId: index("idx_cpf_user_id").on(table.userId),
  idx_status: index("idx_cpf_status").on(table.status),
}));

export const securityEvents = mysqlTable("security_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("eventType", ["RATE_LIMIT", "SUSPICIOUS_LOGIN", "SUSPICIOUS_SIGNUP", "BOT_DETECTED", "SCRAPING", "BRUTE_FORCE"]).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  userId: int("userId"),
  details: json("details"),
  blockedUntil: timestamp("blockedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  idx_ip: index("idx_security_ip").on(table.ipAddress),
  idx_user: index("idx_security_user").on(table.userId),
  idx_created: index("idx_security_created").on(table.createdAt),
}));

export const userRiskScores = mysqlTable("user_risk_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  riskScore: int("riskScore").default(0).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  blockedUntil: timestamp("blockedUntil"),
  reason: varchar("reason", { length: 255 }),
}, (table) => ({
  idx_risk: index("idx_risk_score").on(table.riskScore, table.blockedUntil),
}));

export const anomalyLogs = mysqlTable("anomaly_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  anomalyType: mysqlEnum("anomalyType", ["BRUTE_FORCE", "SCRAPING", "GEO_ANOMALY", "PROFILE_CHANGE", "SIGNUP_SPIKE"]).notNull(),
  riskPoints: int("riskPoints").notNull(),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  idx_anomaly_user: index("idx_anomaly_user").on(table.userId),
  idx_anomaly_ip: index("idx_anomaly_ip").on(table.ipAddress),
  idx_anomaly_created: index("idx_anomaly_created").on(table.createdAt),
}));

export const emailLogs = mysqlTable("email_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  emailType: mysqlEnum("emailType", ["SIGNUP_CONFIRMATION", "NEW_CHAPTER", "SECURITY_ALERT", "ACCOUNT_BLOCKED", "WEEKLY_DIGEST"]).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  status: mysqlEnum("status", ["SENT", "FAILED", "BOUNCED"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
}, (table) => ({
  idx_email_user: index("idx_email_user").on(table.userId, table.emailType, table.sentAt),
}));

export const userNotificationPreferences = mysqlTable("user_notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  newChapterNotifications: boolean("newChapterNotifications").default(true).notNull(),
  newChapterFrequency: mysqlEnum("newChapterFrequency", ["IMMEDIATE", "DAILY", "WEEKLY"]).default("DAILY").notNull(),
  securityAlerts: boolean("securityAlerts").default(true).notNull(),
  weeklyDigest: boolean("weeklyDigest").default(true).notNull(),
}, (table) => ({
  idx_prefs_user: index("idx_prefs_user").on(table.userId),
}));

export const recommendationClicks = mysqlTable("recommendation_clicks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mangaId: int("mangaId").notNull(),
  emailId: int("emailId"),
  recommendationType: mysqlEnum("recommendationType", ["WEEKLY_DIGEST", "NEW_CHAPTER", "PERSONALIZED"]).notNull(),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
}, (table) => ({
  idx_rec_user: index("idx_rec_user").on(table.userId, table.mangaId, table.recommendationType),
}));

export const adminActions = mysqlTable("admin_actions", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  actionType: mysqlEnum("actionType", ["CREATE_MANGA", "UPDATE_MANGA", "DELETE_MANGA", "BLOCK_USER", "UNBLOCK_USER", "VIEW_LOGS"]).notNull(),
  targetId: int("targetId"),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  idx_admin: index("idx_admin_action").on(table.adminId, table.createdAt),
}));

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 255 }).notNull(),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  idx_audit_user: index("idx_audit_user").on(table.userId),
  idx_audit_created: index("idx_audit_created").on(table.createdAt),
}));

export const mangas = mysqlTable("mangas", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  description: text("description"),
  coverImage: varchar("coverImage", { length: 1000 }),
  status: mysqlEnum("status", ["ongoing", "completed", "hiatus"]).default("ongoing").notNull(),
  rating: mysqlEnum("rating", ["L", "L10", "L12", "L14", "L16", "L18"]).default("L12").notNull(),
  genres: json("genres").$type<string[]>(),
  author: varchar("author", { length: 255 }),
  artist: varchar("artist", { length: 255 }),
  views: int("views").default(0).notNull(),
  isPremium: boolean("isPremium").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  idx_slug: index("idx_manga_slug").on(table.slug),
  idx_status: index("idx_manga_status").on(table.status),
  idx_rating: index("idx_manga_rating").on(table.rating),
}));

export const chapters = mysqlTable("chapters", {
  id: int("id").autoincrement().primaryKey(),
  mangaId: int("mangaId").notNull(),
  chapterNumber: varchar("chapterNumber", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }),
  pages: json("pages").$type<string[]>().notNull(),
  views: int("views").default(0).notNull(),
  isPremium: boolean("isPremium").default(false).notNull(),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  idx_manga_chapter: index("idx_chapter_manga").on(table.mangaId, table.chapterNumber),
}));

export const userHistory = mysqlTable("user_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mangaId: int("mangaId").notNull(),
  chapterId: int("chapterId"),
  lastReadPage: int("lastReadPage").default(0),
  readAt: timestamp("readAt").defaultNow().notNull(),
}, (table) => ({
  idx_history_user: index("idx_history_user").on(table.userId, table.readAt),
  idx_history_manga: index("idx_history_manga").on(table.mangaId),
}));

export const userFavorites = mysqlTable("user_favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mangaId: int("mangaId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  idx_fav_unique: index("idx_fav_unique").on(table.userId, table.mangaId).unique(),
}));
